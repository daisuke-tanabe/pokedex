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
