## Why

`apps/web` は現状 `package.json` と `tsconfig.json`、`src/index.ts` (空) のみで、ユーザに見せられる Web アプリケーションが存在しない。`apps/api` は既に Hono + Drizzle + Repository 層 + ポケモン検索/詳細 API が動作しており、後続の検索 UI / 詳細 UI を作るためには **Web 側の最小基盤 (Next.js 起動 + UI 基盤 + テスト基盤 + API クライアント) を最初に立ち上げる必要がある**。

加えて、初回表示の高速化と CWV を担保するため Next.js 16 (Cache Components) を選定するが、本 change では Cache Components 自体の本番適用は行わず、**「Next.js 16 アプリが起動し、API に到達できる」ことを証明する最小スコープ**に絞る。検索 UI / 詳細 UI / TanStack Query / locale routing / Cache Components の本番適用は後続 change で扱う。

本 change の事前 explore で技術選定 (接続方式 / Next.js バージョン / UI / テスト / TDD タグ / データ取得層 / バリデーション / i18n / ディレクトリ構造) は合意済み。詳細は `design.md` を参照。

## What Changes

- **Next.js 16.x の立ち上げ** (`apps/web`)
  - `app/` ディレクトリ + `layout.tsx` + `page.tsx` を作成 (page.tsx は簡素な top page)
  - `next.config.ts` を作成
  - `pnpm --filter @pokedex/web dev` で web dev サーバが `PORT 3001` で起動できる状態にする
- **UI 基盤の導入** (Tailwind + shadcn/ui)
  - `tailwind.config.ts` / `postcss.config.mjs` / `app/globals.css` を作成
  - `components.json` で shadcn CLI を初期化、`button.tsx` / `input.tsx` 等 2-3 個を `src/components/ui/` に追加
  - `cn()` ヘルパを `src/lib/utils.ts` に追加 (shadcn 規約)
- **テスト基盤の導入** (Vitest + React Testing Library + jsdom + MSW)
  - `vitest.config.ts` / `vitest.setup.ts` を作成
  - MSW v2 で API モックを `src/test/msw/handlers.ts` + `src/test/msw/server.ts` に集約
  - `pnpm --filter @pokedex/web test` でユニットテスト / インテグレーションテストが実行できる状態にする
- **API クライアント (Hono RPC)** の導入
  - `src/lib/api-client.ts` に `hc<AppType>(baseUrl)` ラッパ (`createApiClient` factory + `serverApiClient` 既定インスタンス) を実装
  - `apps/web` の workspace dependency に `@pokedex/api` (型のみ) と `@pokedex/contracts` を追加
- **Route Handler ベースのヘルスチェック**
  - `src/app/api/health/route.ts` を作成 (GET, dynamic)
  - 内部で `serverApiClient` 経由で Hono の `/health` を呼び、Hono に到達できれば 200 + success envelope、到達失敗なら 503 + error envelope を返す
  - レスポンスエンベロープは `@pokedex/contracts` の `envelopeSchema` 形式に従う
- **環境変数の追加**
  - `.env.development` に `API_URL=http://localhost:3000` を追記 (ローカル既定値、非 public、Server からのみ参照)
- **monorepo 設定の拡張**
  - `apps/web/package.json` の `scripts` に `dev` (port 3001) / `build` / `test` / `typecheck` / `lint` / `format` / `format:check` を追加
  - `apps/web/tsconfig.json` の paths (`@/* → ./src/*`) は既存のまま使用
  - `turbo run dev` で `apps/api` と `apps/web` が並走できる状態を確認
- **触らないもの (非ゴール)**
  - 検索 UI / 詳細 UI / 一覧 page (別 change `add-web-search-ui` / `add-web-detail-ui`)
  - Cache Components の本番適用 (`"use cache"` / `cacheLife` / `cacheTag`)。本 change では未使用
  - TanStack Query / `QueryClientProvider` (Client fetch の場面が無いため、別 change で導入)
  - locale routing (`[locale]/` ディレクトリ / `middleware.ts`)、`Locale` enum の web 側使用
  - CORS 対応 (`hono/cors` middleware)。本 change は RSC + Route Handler からの fetch のみで CORS 不要
  - Hono 本番 host の確定 (`API_URL` の本番値)。デプロイ用 change で別途
  - 認証 / エラーバウンダリ拡張 / 404 ページのデザイン拡張

## Capabilities

### New Capabilities

- `web-foundation`: Next.js 16 (Cache Components 対応可能) アプリとして `apps/web` を起動可能にし、UI 基盤 (Tailwind + shadcn/ui)、テスト基盤 (Vitest + RTL + MSW)、API クライアント (`hc<AppType>` ラッパ)、Route Handler ベースのヘルスチェックを提供する能力。後続の検索 UI / 詳細 UI / locale routing / Cache Components 本番適用の土台となる。

### Modified Capabilities

- `monorepo-foundation`: `apps/web` を「動作する Next.js 16 アプリ」として monorepo に加える。`apps/web/package.json` に `dev` / `build` / `test` / `typecheck` / `lint` / `format` / `format:check` の 7 スクリプトが揃うことを Requirement に追加。既存 Requirement (turbo タスク / Supabase / asdf 等) の振る舞いは変更しない。

## Impact

- **新規ディレクトリ / ファイル**
  - `apps/web/components.json` (shadcn 設定)
  - `apps/web/tailwind.config.ts`
  - `apps/web/postcss.config.mjs`
  - `apps/web/next.config.ts`
  - `apps/web/vitest.config.ts`
  - `apps/web/vitest.setup.ts`
  - `apps/web/src/app/layout.tsx`
  - `apps/web/src/app/page.tsx`
  - `apps/web/src/app/globals.css`
  - `apps/web/src/app/api/health/route.ts`
  - `apps/web/src/components/ui/*` (shadcn 出力, button.tsx 等)
  - `apps/web/src/lib/api-client.ts`
  - `apps/web/src/lib/utils.ts` (shadcn の `cn()` ヘルパ)
  - `apps/web/src/test/msw/handlers.ts`
  - `apps/web/src/test/msw/server.ts`
- **削除されるファイル**
  - `apps/web/src/index.ts` (空の placeholder、Next.js では不要)
- **既存ファイルの変更**
  - `apps/web/package.json`: 依存追加 (`next` / `react` / `react-dom` / `@tanstack/...` は除く / `tailwindcss` / `postcss` / `autoprefixer` / `@hono/client` 相当 / `hono` (peer) / `valibot` / `vitest` / `@vitest/coverage-v8` / `@testing-library/react` / `@testing-library/jest-dom` / `jsdom` / `msw` / `@pokedex/api` workspace dep / `@pokedex/contracts` workspace dep / `class-variance-authority` / `clsx` / `tailwind-merge` / `lucide-react`), scripts 追加 (`dev` / `build` / `test` 既存の `typecheck` / `lint` / `format` / `format:check` も維持)
  - `.env.development`: `API_URL=http://localhost:3000` を追記
  - `turbo.json`: 既存の `dev` / `build` / `test` タスクをそのまま流用 (apps/web の追加スクリプトが自動で対象に入る)
- **既存仕様の更新**
  - `openspec/specs/monorepo-foundation/spec.md`: ADDED Requirement「apps/web に必要なスクリプトが揃っている」(Scenario 数件)、ADDED Requirement「apps/web の vitest テスト基盤」(Scenario 数件)。既存 Requirement は変更しない
- **依存パッケージ (新規追加)**
  - **Next.js / React**: `next@^16` / `react@^19` / `react-dom@^19` / `@types/react` / `@types/react-dom`
  - **Tailwind**: `tailwindcss@^4` (or 3 系) / `postcss` / `autoprefixer` (Tailwind 4 では postcss 不要かもしれない、design で確定)
  - **shadcn 依存**: `class-variance-authority` / `clsx` / `tailwind-merge` / `lucide-react` / `tailwindcss-animate` (shadcn 規約)
  - **テスト**: `vitest` (catalog 経由) / `@vitest/coverage-v8` / `@testing-library/react` / `@testing-library/jest-dom` / `@testing-library/user-event` / `jsdom` / `msw@^2`
  - **API クライアント**: `hono` (peer / RPC client 用) / `valibot` (shared-contracts と同じバージョン)
- **後続 change への影響**
  - `add-web-search-ui` (検索 page) はこの foundation を前提に着手できる
  - `add-web-detail-ui` (詳細 page) 同上
  - `add-e2e-foundation` (Playwright) を起票する際は web が動作する状態が前提
- **非ゴール (Non-Goals)**
  - 検索 UI / 詳細 UI / 一覧 page の実装
  - Cache Components (`"use cache"` / `cacheLife` / `cacheTag`) の本番適用
  - TanStack Query / `QueryClientProvider` の導入
  - locale routing / `middleware.ts` / `[locale]/` ディレクトリ
  - CORS middleware (`hono/cors`) の Hono 側追加
  - 認証 / セッション / Cookie 設計
  - 404 / error.tsx のデザイン拡張 (Next.js デフォルトのまま)
  - 本番 host (Vercel 等) のデプロイ設定 / 環境変数の本番値
- **テスト戦略**
  - Unit ([unit]): 純粋関数 (`createApiClient` の baseUrl 解決 / `cn()`) や個別コンポーネント (`button.tsx` 等の Snapshot 相当)
  - Integration ([integration]): MSW で Hono `/health` をモックし、`app/api/health/route.ts` の Route Handler 振る舞いを検証 (200/503 の応答とエンベロープ整合)
  - E2E ([e2e]): 本 change では扱わない (別 change で Playwright 導入)
