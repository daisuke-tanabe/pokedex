## Why

ポケモン図鑑アプリを `apps/api` / `apps/web` / `apps/mobile` の monorepo として段階的に構築するにあたり、最初に **動く API サーバの最小基盤** と **全アプリが共有する契約パッケージ** を整備する必要がある。これがないと後続の change（DB スキーマ、検索 API、Web/Mobile 一覧画面）はどれも着手できない。今のリポジトリは pnpm + turbo の monorepo 雛形と各 app の空 `src/` だけがある状態で、実際に起動可能なアプリは存在しない。最初の change で「DB に接続できる Hono サーバが起動し、ヘルスチェックがエンベロープ形式で 200 を返す」状態まで一気に持っていくことで、以降の機能追加は全て垂直スライスで進められるようになる。

## What Changes

- `apps/api` を Hono サーバとして起動可能にする
  - `pnpm --filter @pokedex/api dev` で起動できる
  - `GET /health` がエンベロープ形式（`{ success: true, data: { status: 'ok' } }`）の 200 を返す
  - `AppType` を export し、後続 change で Web/Mobile から型のみ import できる土台を作る
- `apps/api` で Drizzle ORM と `postgres` ドライバを wiring し、DB クライアントをモジュールレベルで singleton 化する
- `packages/contracts` を新規作成
  - レスポンスエンベロープの Valibot スキーマ
  - ドメイン定数（`PAGE_SIZE`, `MAX_TYPES`, `DEFAULT_POKEDEX_SLUG`）
  - エラーコード enum（`POKEDEX_NOT_FOUND`, `INVALID_QUERY` の最低 2 つ）
- monorepo 設定を整備
  - `pnpm-workspace.yaml` に `packages/*` を追加
  - `apps/api` から `@pokedex/contracts` を workspace dependency として参照
  - `turbo.json` に `dev` / `build` / `test` タスクを追加（既存の `lint` / `format` / `typecheck` に並べる）
- 開発環境の DB セットアップ
  - `docker-compose.yml` でローカル PostgreSQL を起動できる
  - `.env.example` に `DATABASE_URL` を定義
- `apps/api` にユニットテスト基盤（vitest）をセットアップ
- 旧仕様の「実装中立」方針を捨て、本リポジトリでは Hono / Drizzle / PostgreSQL / Valibot を採用することを明示

## Capabilities

### New Capabilities

- `api-foundation`: API サーバとしての最小起動・DB 接続・エンベロープレスポンスを提供する能力。`GET /health` が動くこと、DB 接続が初期化されること、レスポンスが定型エンベロープに従うことを規定する。
- `shared-contracts`: 全アプリ（API / Web / Mobile）が共有する契約を 1 箇所に集約するパッケージ能力。レスポンスエンベロープのスキーマ、ドメイン定数、エラーコードを提供する。
- `monorepo-foundation`: pnpm workspace と turbo で API/Web/Mobile/contracts を束ねる開発基盤。dev / build / typecheck / lint / format / test の各タスクが各 package で実行できる状態を保証する。

### Modified Capabilities

（既存 spec なし。全て新規作成）

## Impact

- **新規ディレクトリ / ファイル**:
  - `apps/api/src/`（Hono アプリ本体、`AppType` の export、DB クライアント、ヘルスチェック）
  - `apps/api/vitest.config.ts`、`apps/api/src/**/__tests__/`
  - `packages/contracts/`（新規パッケージ）
  - `docker-compose.yml`（リポジトリルート）
  - `.env.example`（リポジトリルート）
- **既存ファイルの変更**:
  - `pnpm-workspace.yaml` … `packages/*` を追加
  - `turbo.json` … `dev` / `build` / `test` タスクを追加
  - `apps/api/package.json` … 依存追加（`hono`, `@hono/node-server`, `@hono/valibot-validator`, `drizzle-orm`, `postgres`, `valibot`, `vitest`, `@pokedex/contracts`）
  - `apps/api/tsconfig.json` … 必要に応じて `composite` / `paths` を整備
- **依存関係**:
  - 新規 npm 依存: `hono`, `@hono/node-server`, `@hono/valibot-validator`, `drizzle-orm`, `drizzle-kit`, `postgres`, `valibot`, `vitest`
- **後続 change への影響**:
  - `add-domain-schema` 以降は本 change で wiring した DB クライアントと `AppType` を前提にする
  - Web / Mobile は `@pokedex/contracts` と `@pokedex/api`（型のみ）を依存にする
- **アウトオブスコープ**: ドメインモデルのテーブル定義、シードデータ、検索 API、Web/Mobile 実装、CORS 設定、認証
