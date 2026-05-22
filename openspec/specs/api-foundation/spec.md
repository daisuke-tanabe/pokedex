# api-foundation Specification

## Purpose
TBD - created by archiving change add-monorepo-foundation. Update Purpose after archive.
## Requirements
### Requirement: API サーバの起動

`apps/api` は Hono ベースの HTTP サーバとして起動可能でなければならない（MUST）。`pnpm --filter @pokedex/api dev` を実行することで開発モードでサーバが立ち上がり、サーバは `PORT` 環境変数（未指定時は 3000）でリッスンしなければならない（MUST）。

#### Scenario: 開発コマンドで API サーバが起動する

- **WHEN** `pnpm --filter @pokedex/api dev` を実行する
- **THEN** プロセスが終了せず、Hono サーバが `process.env.PORT ?? 3000` でリッスン状態になる

#### Scenario: ポート番号は環境変数で上書きできる

- **WHEN** `PORT=4000 pnpm --filter @pokedex/api dev` を実行する
- **THEN** Hono サーバは `4000` 番ポートでリッスンする

### Requirement: ヘルスチェックエンドポイント

`GET /health` は常に成功エンベロープ形式で 200 を返さなければならない（MUST）。レスポンスボディは `{ success: true, data: { status: 'ok' } }` という形式でなければならない（MUST）。

#### Scenario: ヘルスチェックが成功エンベロープを返す

- **WHEN** `GET /health` を呼び出す
- **THEN** HTTP ステータス 200 と JSON ボディ `{ "success": true, "data": { "status": "ok" } }` が返る

#### Scenario: ヘルスチェックは Content-Type が application/json

- **WHEN** `GET /health` を呼び出す
- **THEN** レスポンスヘッダ `Content-Type` に `application/json` が含まれる

### Requirement: DB クライアントのモジュールレベル singleton

`apps/api/src/db/client.ts` は Drizzle と postgres ドライバを使った DB クライアントを単一の `db` シンボルとして export しなければならない（MUST）。同モジュールが複数回 import されても DB 接続は 1 つに収束しなければならない（MUST）。

#### Scenario: db シンボルは複数 import で同一インスタンス

- **WHEN** `apps/api/src/db/client.ts` を異なる箇所から 2 回 import する
- **THEN** 取得される `db` オブジェクトは厳密等価（`===`）で同一インスタンスである

### Requirement: DATABASE_URL が必須

API サーバは起動時に環境変数 `DATABASE_URL` の存在を検査しなければならない（MUST）。未設定の場合は明示的なエラーを投げて起動を中止しなければならない（MUST）。

#### Scenario: DATABASE_URL 未設定時は起動失敗

- **WHEN** `DATABASE_URL` 環境変数を設定せずに API のエントリを読み込む
- **THEN** エラーメッセージ `DATABASE_URL is required` を含む例外が投げられる

#### Scenario: DATABASE_URL 設定時は接続クライアントが構築される

- **WHEN** `DATABASE_URL=postgres://pokedex:pokedex@localhost:5432/pokedex` を設定して `db/client.ts` を読み込む
- **THEN** 例外を投げずに `db` シンボルが取得できる

### Requirement: AppType の export

`apps/api/src/index.ts` は Hono アプリインスタンスの型を `AppType` として export しなければならない（MUST）。これは後続 change の Web/Mobile から `import type { AppType }` で参照されることを意図する。

#### Scenario: AppType がパッケージ外から参照可能

- **WHEN** 別 workspace パッケージから `import type { AppType } from '@pokedex/api'` を行う
- **THEN** 型エラーなしで AppType が解決され、`hc<AppType>` の引数として渡せる

### Requirement: エンベロープ生成ヘルパー

`apps/api` は成功・失敗のエンベロープを生成するヘルパー関数（`successEnvelope` / `errorEnvelope`）を提供しなければならない（MUST）。ハンドラはレスポンス組み立てにこのヘルパーを使用しなければならない（MUST）。

#### Scenario: 成功エンベロープが正しい形を返す

- **WHEN** `successEnvelope({ status: 'ok' })` を呼び出す
- **THEN** `{ success: true, data: { status: 'ok' } }` が返る

#### Scenario: 失敗エンベロープが正しい形を返す

- **WHEN** `errorEnvelope('POKEDEX_NOT_FOUND', 'pokedex not found')` を呼び出す
- **THEN** `{ success: false, error: { code: 'POKEDEX_NOT_FOUND', message: 'pokedex not found' } }` が返る

#### Scenario: 成功エンベロープに meta を付与できる

- **WHEN** `successEnvelope([1, 2, 3], { total: 3, page: 1, limit: 30 })` を呼び出す
- **THEN** `{ success: true, data: [1, 2, 3], meta: { total: 3, page: 1, limit: 30 } }` が返る

