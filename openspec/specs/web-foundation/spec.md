# web-foundation Specification

## Purpose

`apps/web` を Next.js 16 ベースの Web アプリケーションとして起動可能にし、UI 基盤 (Tailwind + shadcn/ui)、テスト基盤 (Vitest + React Testing Library + jsdom + MSW)、API クライアント (Hono RPC `hc<AppType>` ラッパ)、Route Handler ベースのヘルスチェックを提供する能力を規定する。後続の検索 UI / 詳細 UI / locale routing / Cache Components 本番適用の土台となる最小スコープを扱い、検索/詳細 UI、TanStack Query、locale routing、Cache Components の本番適用は別 change で扱う。

## Requirements
### Requirement: Next.js アプリケーションの起動

`apps/web` は Next.js 16.x ベースの Web アプリケーションとして起動可能でなければならない（MUST）。`pnpm --filter @pokedex/web dev` を実行することで開発モードでサーバが立ち上がり、サーバは既定で `3001` 番ポートでリッスンしなければならない（MUST）。`pnpm --filter @pokedex/web build` を実行することで本番ビルドが成功しなければならない（MUST）。

#### Scenario [integration]: 開発コマンドで Next.js dev サーバが起動する

- **WHEN** `pnpm --filter @pokedex/web dev` を実行する
- **THEN** プロセスが終了せず、Next.js dev サーバが `3001` 番ポートでリッスン状態になる

#### Scenario [integration]: 本番ビルドが成功する

- **WHEN** `pnpm --filter @pokedex/web build` を実行する
- **THEN** プロセスが終了コード `0` で終わり、`apps/web/.next/` ディレクトリにビルド成果物が生成される

### Requirement: App Router の最小構造

`apps/web` は Next.js 16 の App Router を採用し、`apps/web/src/app/` 配下に App Router の root を持たなければならない（MUST）。`src/app/layout.tsx`（root layout）、`src/app/page.tsx`（top page）、`src/app/globals.css`（Tailwind directives を含む）の 3 ファイルを持たなければならない（MUST）。`layout.tsx` と `page.tsx` は React Server Component として実装され、`"use client"` ディレクティブを持ってはならない（MUST NOT）。

#### Scenario [unit]: src/app/layout.tsx が存在する

- **WHEN** `apps/web/src/app/layout.tsx` をファイルシステムで確認する
- **THEN** ファイルが存在し、`html` / `body` 要素を返す React コンポーネントを default export している

#### Scenario [unit]: src/app/page.tsx が存在する

- **WHEN** `apps/web/src/app/page.tsx` をファイルシステムで確認する
- **THEN** ファイルが存在し、React コンポーネントを default export している

#### Scenario [unit]: layout.tsx と page.tsx が Server Component である

- **WHEN** `apps/web/src/app/layout.tsx` と `apps/web/src/app/page.tsx` のファイル先頭を読む
- **THEN** いずれも `"use client"` ディレクティブで始まっていない（Server Component として扱われる）

#### Scenario [unit]: globals.css に Tailwind directives が含まれる

- **WHEN** `apps/web/src/app/globals.css` を読む
- **THEN** Tailwind の `@tailwind base;` / `@tailwind components;` / `@tailwind utilities;`（または Tailwind v4 系の `@import "tailwindcss";` 等の同等表現）が含まれる

### Requirement: UI 基盤 (Tailwind + shadcn/ui)

`apps/web` は Tailwind CSS によるユーティリティクラスベースのスタイリングと、shadcn/ui の own code モデルによる UI コンポーネントを提供しなければならない（MUST）。`apps/web/components.json`（shadcn 設定）、`apps/web/tailwind.config.ts`（Tailwind 設定）、`apps/web/src/lib/utils.ts`（`cn()` ヘルパ）が存在しなければならない（MUST）。shadcn が出力する UI コンポーネントは `apps/web/src/components/ui/` 配下に配置されなければならない（MUST）。本 change の時点で最低 1 つの shadcn コンポーネント（例: `button.tsx`）が `src/components/ui/` 配下に存在しなければならない（MUST）。

#### Scenario [unit]: components.json が存在する

- **WHEN** `apps/web/components.json` を読む
- **THEN** JSON として valid であり、`tailwind` / `aliases` などの shadcn 設定キーを持つ

#### Scenario [unit]: tailwind.config.ts が存在し src/ を content に含む

- **WHEN** `apps/web/tailwind.config.ts` を読む
- **THEN** `content` 配列に `./src/**/*.{ts,tsx}` 相当のパターンが含まれている

#### Scenario [unit]: cn() ヘルパが lib/utils.ts から export される

- **WHEN** `apps/web/src/lib/utils.ts` を読む
- **THEN** `cn` という名前で関数が export されている（`clsx` + `tailwind-merge` を組み合わせた shadcn 規約の実装）

#### Scenario [unit]: src/components/ui/ に最低 1 つの shadcn コンポーネントが存在する

- **WHEN** `apps/web/src/components/ui/` ディレクトリを列挙する
- **THEN** 最低 1 つ以上の `.tsx` ファイルが存在する（例: `button.tsx`）

### Requirement: API クライアント (Hono RPC hc<AppType> ラッパ)

`apps/web/src/lib/api-client.ts` は `hc<AppType>(baseUrl)` を内部で呼ぶラッパを提供しなければならない（MUST）。具体的には `createApiClient(baseUrl: string)` という factory 関数と、`process.env.API_URL` を baseUrl として解決した `serverApiClient` 既定インスタンスを named export しなければならない（MUST）。`AppType` は `@pokedex/api` から `import type` で読み込まれ、型推論で `apps/api` のすべての route を解決できなければならない（MUST）。

#### Scenario [unit]: createApiClient factory が export される

- **WHEN** `apps/web/src/lib/api-client.ts` を読む
- **THEN** `createApiClient` という名前の関数が named export されており、引数として baseUrl 文字列を受け取る

#### Scenario [unit]: serverApiClient 既定インスタンスが export される

- **WHEN** `apps/web/src/lib/api-client.ts` を読む
- **THEN** `serverApiClient` という名前の named export が存在する

#### Scenario [unit]: AppType が import type で参照される

- **WHEN** `apps/web/src/lib/api-client.ts` を読む
- **THEN** `import type { AppType } from '@pokedex/api'` のような import 文（または同等のサブパス指定）が含まれており、`AppType` を値としては import していない

### Requirement: ヘルスチェック Route Handler

`apps/web` は `GET /api/health` を Route Handler として提供しなければならない（MUST）。実装ファイルは `apps/web/src/app/api/health/route.ts` でなければならない（MUST）。Route Handler は dynamic（cache 不可）として動作し、内部で `serverApiClient` 経由で `apps/api` の `/health` を呼び出さなければならない（MUST）。`apps/api` の `/health` から成功エンベロープが返れば HTTP 200 と `@pokedex/contracts` の `successEnvelope({ status: 'ok' })` 形式のレスポンスを返さなければならない（MUST）。`apps/api` への到達失敗（接続失敗 / タイムアウト / 5xx）の場合は HTTP 503 と `errorEnvelope('INTERNAL_ERROR', <message>)` 形式のレスポンスを返さなければならない（MUST）。

#### Scenario [unit]: route.ts ファイルが存在する

- **WHEN** `apps/web/src/app/api/health/route.ts` をファイルシステムで確認する
- **THEN** ファイルが存在し、`GET` という名前の関数を named export している

#### Scenario [integration]: apps/api 到達可能時に 200 + success envelope を返す

- **WHEN** MSW で `apps/api` の `/health` を「200 + `{ success: true, data: { status: 'ok' } }`」で応答するようにモックし、`apps/web` の `GET /api/health` ハンドラを呼び出す
- **THEN** ハンドラのレスポンスが HTTP 200 で、ボディが `{ success: true, data: { status: 'ok' } }` という形式である

#### Scenario [integration]: apps/api 到達不可時に 503 + error envelope を返す

- **WHEN** MSW で `apps/api` の `/health` を「ネットワークエラー」または「500 応答」でモックし、`apps/web` の `GET /api/health` ハンドラを呼び出す
- **THEN** ハンドラのレスポンスが HTTP 503 で、ボディが `{ success: false, error: { code: 'INTERNAL_ERROR', message: <string> } }` という形式である

#### Scenario [integration]: Content-Type が application/json

- **WHEN** MSW で apps/api の `/health` をモックし、`apps/web` の `GET /api/health` ハンドラを呼び出す
- **THEN** レスポンスヘッダ `Content-Type` に `application/json` が含まれる

### Requirement: Vitest テスト基盤

`apps/web` は Vitest を用いてユニットテストおよびインテグレーションテストが実行可能でなければならない（MUST）。`apps/web/vitest.config.ts` で `environment: 'jsdom'` が設定され（MUST）、`apps/web/vitest.setup.ts` で MSW の `setupServer` および `@testing-library/jest-dom` の matcher 拡張が初期化されなければならない（MUST）。`pnpm --filter @pokedex/web test` の実行で、本 change で書かれた全テストが pass しなければならない（MUST）。MSW のハンドラと server インスタンスはそれぞれ `apps/web/src/test/msw/handlers.ts` と `apps/web/src/test/msw/server.ts` に配置されなければならない（MUST）。

#### Scenario [unit]: vitest.config.ts に jsdom environment が設定されている

- **WHEN** `apps/web/vitest.config.ts` を読む
- **THEN** `environment: 'jsdom'` の設定が `test` セクションに含まれる

#### Scenario [unit]: vitest.setup.ts が MSW server を起動する

- **WHEN** `apps/web/vitest.setup.ts` を読む
- **THEN** `apps/web/src/test/msw/server.ts` からインポートした MSW server インスタンスに対し、`beforeAll`/`afterEach`/`afterAll` で `listen()`/`resetHandlers()`/`close()` を呼ぶ初期化処理が含まれる

#### Scenario [unit]: MSW handlers と server が指定ディレクトリに存在する

- **WHEN** `apps/web/src/test/msw/handlers.ts` と `apps/web/src/test/msw/server.ts` をファイルシステムで確認する
- **THEN** 両ファイルが存在し、`server.ts` は `setupServer` で server インスタンスを export している

#### Scenario [integration]: pnpm test が成功する

- **WHEN** `apps/web` ディレクトリで `pnpm test` を実行する
- **THEN** Vitest が起動し、本 change で書かれた全テストが pass し、プロセスが終了コード `0` で終わる

### Requirement: 環境変数 API_URL の管理

`apps/web` は `apps/api` の baseUrl を `API_URL` 環境変数から取得しなければならない（MUST）。`API_URL` は **非 public**（`NEXT_PUBLIC_` prefix を持たない）でなければならない（MUST NOT 持つ）。これにより `API_URL` の値が browser bundle に露出してはならない（MUST NOT）。ローカル開発用の既定値として `API_URL=http://localhost:3000` がリポジトリルートの `.env.development`（コミット対象）に記載されなければならない（MUST）。

#### Scenario [unit]: .env.development に API_URL が記載されている

- **WHEN** リポジトリルートの `.env.development` を読む
- **THEN** `API_URL=` で始まる行が 1 行以上存在する

#### Scenario [unit]: .env.development の API_URL は localhost:3000

- **WHEN** リポジトリルートの `.env.development` を読む
- **THEN** `API_URL` の値が `http://localhost:3000` で始まる

#### Scenario [unit]: NEXT_PUBLIC_API_URL は導入しない

- **WHEN** リポジトリルートの `.env.development` と `apps/web/` 配下のすべてのソースファイルを検索する
- **THEN** `NEXT_PUBLIC_API_URL` という識別子が一切現れない（本 change のスコープ外）

### Requirement: ディレクトリ構造と命名規約

`apps/web` のソースコードは `apps/web/src/` 配下に配置されなければならない（MUST）。`src/app/` を App Router の root とし、`src/components/ui/` を shadcn 出力先、`src/lib/` を純粋関数 / 設定の置き場、`src/test/` をテスト共通インフラの置き場とする（MUST）。TypeScript の path alias は `@/* → ./src/*` を `apps/web/tsconfig.json` で定義しなければならない（MUST、既存 tsconfig の paths をそのまま使用）。React コンポーネント（`.tsx`）および非コンポーネント TypeScript（`.ts`）のファイル名は **kebab-case** に統一しなければならない（MUST、shadcn 規約と整合）。ただし Next.js の特殊ファイル（`layout.tsx` / `page.tsx` / `route.ts` / `error.tsx` / `not-found.tsx` / `loading.tsx`）は Next の規約に従う（MUST）。

#### Scenario [unit]: src/app/ ディレクトリが App Router の root として存在する

- **WHEN** `apps/web/src/app/` ディレクトリをファイルシステムで確認する
- **THEN** ディレクトリが存在し、`layout.tsx` と `page.tsx` を直下に含む

#### Scenario [unit]: src/components/ui/ ディレクトリが存在する

- **WHEN** `apps/web/src/components/ui/` ディレクトリをファイルシステムで確認する
- **THEN** ディレクトリが存在する（shadcn 出力先として使用）

#### Scenario [unit]: src/lib/ ディレクトリが存在する

- **WHEN** `apps/web/src/lib/` ディレクトリをファイルシステムで確認する
- **THEN** ディレクトリが存在し、`api-client.ts` と `utils.ts` を直下に含む

#### Scenario [unit]: src/test/msw/ ディレクトリが存在する

- **WHEN** `apps/web/src/test/msw/` ディレクトリをファイルシステムで確認する
- **THEN** ディレクトリが存在し、`handlers.ts` と `server.ts` を直下に含む

#### Scenario [unit]: tsconfig.json に @/* alias が定義されている

- **WHEN** `apps/web/tsconfig.json` を読む
- **THEN** `compilerOptions.paths` に `"@/*": ["./src/*"]` が含まれる

#### Scenario [unit]: 非特殊ファイルのファイル名が kebab-case に従う

- **WHEN** `apps/web/src/**/*.{ts,tsx}` のうち Next.js 特殊ファイル（`layout.tsx` / `page.tsx` / `route.ts` / `error.tsx` / `not-found.tsx` / `loading.tsx` / `globals.css`）と `tsconfig.json` 等の root 直下設定ファイルを除いたファイル名を列挙する
- **THEN** すべてのファイル名（拡張子を除く basename）が kebab-case（`^[a-z][a-z0-9-]*$`）の正規表現に一致する
