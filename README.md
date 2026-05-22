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

### 6. DB マイグレーションとシード

ドメインスキーマは Drizzle ORM で `apps/api/src/db/schema/` に定義し、生成 SQL は
`supabase/migrations/` にコミット対象として置く。

```bash
# マイグレーション SQL を再生成 (スキーマ変更時のみ)
cd apps/api && DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54322/postgres' \
  npx drizzle-kit generate --name <change-name>

# ローカル DB をマイグレーション + シードで再構築
pnpm --filter @pokedex/api db:reset
```

`pnpm --filter @pokedex/api seed` は `apps/api/src/db/seed/data/*.json` を読み込んで
DB に投入し、`apps/api/src/db/seed/invariants.ts` の不変条件を最後に検証する。

新しい言語を追加するときの手順:

1. `packages/contracts/src/enums/locale.ts` の `LOCALE_VALUES` と `Locale` に locale code を追加
2. `apps/api/src/db/seed/data/locales.json` に `{ "code": "...", "name": "..." }` を追加
3. 各 `*_names` 系の JSON (types / species / forms / regions / pokedexes) に新 locale の name を追記
4. `pnpm db:reset` で再構築

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

Renovate が作成した依存更新 PR は、`deps-reviewer` agent (Claude) が安全と判断した場合のみ
自動マージされる。安全性判定からマージまでを Claude に一本化し、人手介入を最小化する設計。

### パイプライン

1. **Renovate** が依存更新 PR を作成 (`.github/renovate.json`)。Renovate 側の `automerge` /
   `platformAutomerge` は意図的に `false` (マージ判断を Claude に集約するため)。
2. **`verify`** ジョブ (`verify.yml`: typecheck / lint / format) が全 PR で走る。生成される
   `verify / static-checks` チェックが `main` ブランチ ruleset の **唯一の必須ステータスチェック**。
3. `renovate[bot]` の PR で `verify` が成功すると **`deps-review`** ジョブ (`deps-review.yml`)
   が走る (`needs: verify` + `actor == 'renovate[bot]'`)。3 ステップ構成:
   - **Run deps-reviewer**: `deps-reviewer` agent が依存差分を監査し、**安全 (Merge /
     Verify) と判断した場合のみ** `gh pr review --approve` を実行 (`claude` bot 名義の
     approve として登録)。Investigate / Hold ならコメントで指摘し approve しない。
   - **Notify review unavailable**: `Run deps-reviewer` が失敗した場合のみ発火。PR が
     `.github/workflows/**` を変更していると claude-code-action の OIDC→App トークン
     交換が検証ゲートで 401 になり agent を起動できない。その旨を PR コメントで明示し、
     `deps-review` は意図的に失敗させる (手動レビュー・手動マージが必要)。
   - **Verify approval**: `claude` bot の APPROVED レビューが存在すれば pass (exit 0)、
     無ければ「手動レビューが必要」と出力して **fail (exit 1)**。
4. **`auto-merge.yml`** (独立ワークフロー、トリガ: `pull_request_review` submitted):
   `renovate[bot]` の PR に **`claude[bot]` の approve** が提出されると
   `gh pr merge --squash --delete-branch --auto` を実行する。

### 判定別の挙動

| deps-reviewer の判定 | agent の動作 | `deps-review` | 自動マージ (`auto-merge.yml`) |
|---|---|---|---|
| Merge / Verify (安全) | `gh pr review --approve` | Verify approval が approve 検出 → **pass** | `claude[bot]` approve を検出して **自動マージ** |
| Investigate / Hold | approve せずコメント | approve 無し → **fail** | 発火しない。人手レビュー & 手動マージ |
| 認証不可 (workflow 変更 PR 等) | agent 起動不可 | Notify がコメント → **fail** | 発火しない。手動マージ必須 |

`Verify approval` は `author.login == "claude"` の APPROVED レビューのみを承認とみなす。
第三者や他 bot の approve は無視される。

### 必須ゲートと escape hatch

`main` ブランチには GitHub ruleset (enforcement: active) が設定されている:

- 必須ステータスチェック: **`verify / static-checks` のみ** (`deps-review` は必須ではない)
- ブランチ削除禁止 / non-fast-forward (force push) 禁止

`deps-review` は必須チェックではないため、その失敗自体はマージをブロックしない。誤判定
(Investigate / Hold) や認証不可の workflow 変更 PR は、**人間が内容を確認のうえ手動で
マージ**できる (必須の `verify / static-checks` さえ通っていればよい)。「自動マージされない = 人手判断を
強制するゲート」という位置づけで、CI を強制 pass させる override 経路は持たない。

### 責務分担

| 役割 | 担当 | 設定ファイル |
|---|---|---|
| PR 作成 | Renovate | `.github/renovate.json` |
| 安全性判定 + approve | `deps-reviewer` agent (Claude) / `deps-review` ジョブ | `.claude/agents/deps-reviewer.md`, `.github/workflows/deps-review.yml` |
| 自動マージ | `auto-merge.yml` (`claude[bot]` approve 起点) | `.github/workflows/auto-merge.yml` |
| 認証不可 PR の通知 | `Notify review unavailable` ステップ | `.github/workflows/deps-review.yml` |
| 必須ゲート | GitHub ruleset (`verify / static-checks` 必須 / 削除・force push 禁止) | (GitHub ruleset / repo 設定) |
| 誤判定・認証不可時の対処 | 人手レビュー & 手動マージ | (手動操作) |

Renovate 側の `automerge` 設定は意図的に持たない (Claude マージと役割重複になるため)。
Renovate は「PR を作るだけ」で、マージ判断は Claude に集約されている。
