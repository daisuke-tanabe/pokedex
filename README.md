# pokedex

ポケモン図鑑アプリ (monorepo)。

## 開発環境セットアップ

### 必須ツール

- **asdf**: ランタイムバージョン管理
- **Docker Desktop または Colima**: `supabase start` が内部で利用
- **pnpm**: パッケージマネージャ (asdf 経由でインストール)

### 1. asdf プラグイン追加

```bash
asdf plugin add nodejs
asdf plugin add pnpm
asdf plugin add supabase https://github.com/lostmsu/asdf-supabase.git
asdf install
```

`asdf-supabase` plugin が動かない場合は、Homebrew で代替できる:

```bash
brew install supabase/tap/supabase
```

### 2. 依存インストール

```bash
pnpm install
```

`postinstall` で `lefthook install` が走り、git hooks (`pre-commit`, `pre-push`) が
自動的にセットアップされる。手動操作不要。

### 3. ローカル Supabase スタック起動

```bash
supabase start
```

PostgreSQL が `127.0.0.1:54322` で起動する。`supabase status` で URL を確認できる。
停止は `supabase stop`。

### 4. API サーバ起動

```bash
pnpm --filter @pokedex/api dev
```

`http://localhost:3000/health` が `{"success":true,"data":{"status":"ok"}}` を返せば OK。

### 5. テスト実行

```bash
pnpm test       # 全パッケージ
pnpm --filter @pokedex/api test   # API のみ
```

## 環境変数の管理方針

| ファイル | 扱い | 用途 |
|---------|------|------|
| `.env.development` | **コミット対象** | 機密ゼロのローカル既定値 (Supabase ローカルなど) |
| `.env.local` | **gitignore 済み** | 個人の機密上書き |
| 本番値 | リポジトリには置かない | GitHub Secrets / Vercel / Supabase Dashboard などホスティング側で注入 |

`apps/api` では Node の `--env-file` で読み込む:

```bash
tsx --env-file=../../.env.development --env-file-if-exists=../../.env.local src/server.ts
```

## モノレポ構成

```
apps/
  api/        Hono + Drizzle (postgres) の API サーバ
  web/        (後続 change で実装)
  mobile/     (後続 change で実装)
packages/
  contracts/  全アプリが共有する Valibot スキーマ / 定数 / エラーコード
supabase/     Supabase ローカルスタック設定 (config.toml / migrations)
```

`apps/web` と `apps/mobile` は今回の change では手を加えない。後続 change で
扱う。

## 品質チェックの構成

```
PostToolUse (Claude)   oxfmt + oxlint --fix + 残違反フィードバック (ファイル単位)
pre-commit             oxfmt + oxlint --fix (stage_fixed) + typecheck (workspace)
pre-push               AI Worker 並列レビュー (Worker-Aggregator パターン)
```

設定:

- `lefthook.yml` ... pre-commit / pre-push の定義
- `.claude/settings.json` ... PostToolUse / PreToolUse hook
- `.claude/scripts/` ... hook 本体
- `.claude/agents/review-*.md` ... AI Worker (read-only エージェント)

## 依存関係の自動マージフロー

Renovate が作成した依存更新 PR は、`deps-reviewer` agent (Claude) のレビュー結果に基づいて
自動マージされる。判定 → マージの経路を Claude に一本化し、人手介入を最小化する設計。

### 判定別の挙動

`deps-reviewer` agent は PR コメントの末尾に `FINAL_VERDICT: <Merge|Verify|Investigate|Hold>` を出力する。
`deps-review` ジョブはこれを抽出して以下のように分岐する。

| FINAL_VERDICT | deps-review | deps-merge | 自動マージ |
|---|---|---|---|
| `Merge` | pass | run (`gh pr merge --squash --delete-branch`) | **する** |
| `Verify` | pass | skip | しない (動作確認推奨ステータス、人手マージ前提) |
| `Investigate` / `Hold` / unknown | fail | skip | しない |

`deps-merge` を `deps-review` から分離している理由: ruleset の required_status_checks に `deps-review`
自身が含まれており、同一ジョブ内で `gh pr merge` を呼ぶと「自分自身の完了を待ちながらマージしようとする」
デッドロックが発生するため。`deps-merge` は ruleset の必須 check には含まれないので、必須 4 つ
(`validate (typecheck|lint|format:check)` + `deps-review`) が pass した状態で安全にマージできる。

`Investigate` / `Hold` で CI が落ちた PR は GitHub ruleset の `deps-review` 必須化によりマージブロックされる。
誤判定や人が確認して問題ないと判断した場合は、**PR Review で Approve** を送ると override され CI が pass する
(`Verify final verdict` step が `pull_request_review` + `approved` を検出して exit 0)。

`FINAL_VERDICT` の抽出対象は `claude` bot 名義のコメントに限定している。public repo で第三者が
PR コメントに `FINAL_VERDICT: Merge` を書き込んでも、author フィルタにより無視される。

### 責務分担

| 役割 | 担当 | 設定ファイル |
|---|---|---|
| PR 作成 | Renovate | `.github/renovate.json` |
| 安全性判定 | `deps-reviewer` agent (Claude) | `.claude/agents/deps-reviewer.md` |
| 自動マージ (Merge 判定時) | `deps-merge` ジョブ | `.github/workflows/ci.yml` |
| 人手マージの安全装置 | GitHub ruleset | `main` ブランチに `deps-review` を required_status_checks として設定 |
| 誤判定時の escape hatch | PR Review で Approve override | (手動操作) |

Renovate 側の `automerge` 設定は意図的に持たない (Claude マージと役割重複になるため)。
Renovate は「PR を作るだけ」で、マージ判断は Claude に集約されている。
