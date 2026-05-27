## 1. 依存追加

- [x] 1.1 `apps/web/package.json` の `dependencies` に Next.js / React 系を追加する
  - `next@^16` / `react@^19` / `react-dom@^19` / `valibot` (shared-contracts と同 ver) / `hono` (RPC client 用 peer 相当)
  - `@pokedex/api`: `workspace:*` (型のみ参照)
  - `@pokedex/contracts`: `workspace:*`
  - shadcn 依存: `class-variance-authority` / `clsx` / `tailwind-merge` / `lucide-react` / `tailwindcss-animate`
- [x] 1.2 `apps/web/package.json` の `devDependencies` に開発ツールを追加する
  - `tailwindcss@^3` / `postcss` / `autoprefixer`
  - `vitest`: `catalog:` (workspace catalog 経由) / `@vitest/coverage-v8`
  - `@testing-library/react` / `@testing-library/jest-dom` / `@testing-library/user-event`
  - `jsdom`
  - `msw@^2`
  - `@types/react` / `@types/react-dom` / `@types/node`
- [x] 1.3 `pnpm install` を実行し、`pnpm-lock.yaml` を再生成する。`pnpm-workspace.yaml` の `minimumReleaseAge: 4320` ゲートで弾かれる依存が無いことを確認する

## 2. 既存 placeholder の削除

- [x] 2.1 `apps/web/src/index.ts`（空の placeholder）を削除する。他から import されていないことを `grep` で確認する

## 3. App Router の最小構造

各タスクは web-foundation の Requirement「App Router の最小構造」の Scenarios（[unit] 4 件）に対応する。

- [x] 3.1 [Scenario [unit]: layout.tsx と page.tsx が Server Component である] [Test] `apps/web/src/app/layout.tsx` の存在と `"use client"` 不在を確認する grep スクリプトを準備する
- [x] 3.2 [Impl] `apps/web/src/app/layout.tsx` を作成する。`html` / `body` 要素を返し、`./globals.css` を import する。`children` を受け取る最小実装
- [x] 3.3 [Impl] `apps/web/src/app/page.tsx` を作成する。簡素な「Hello, pokedex」相当の Server Component
- [x] 3.4 [Scenario [unit]: globals.css に Tailwind directives が含まれる] [Impl] `apps/web/src/app/globals.css` を作成し、Tailwind directives（`@tailwind base; @tailwind components; @tailwind utilities;`）を含める
- [x] 3.5 [Test/Verify] 上記 3.1-3.4 のファイルを確認: `layout.tsx` / `page.tsx` / `globals.css` の 3 ファイルが存在し、`"use client"` ディレクティブが両 page で不在

## 4. UI 基盤 (Tailwind + shadcn)

各タスクは web-foundation の Requirement「UI 基盤」の Scenarios（[unit] 4 件）に対応する。

- [x] 4.1 `apps/web/tailwind.config.ts` を作成する。`content` 配列に `'./src/**/*.{ts,tsx}'` を含める。Tailwind 3 系の設定 (`theme.extend` 等は最小限)
- [x] 4.2 `apps/web/postcss.config.mjs` を作成し、`tailwindcss` と `autoprefixer` プラグインを設定する
- [x] 4.3 [Scenario [unit]: src/components/ui/ に最低 1 つの shadcn コンポーネントが存在する] shadcn CLI を初期化する: `pnpm dlx shadcn@latest init` を `apps/web` で実行（または手動で `components.json` を作成）。生成された `components.json` / `src/lib/utils.ts`（`cn()`）を確認する
- [x] 4.4 [Scenario [unit]: src/components/ui/ に最低 1 つの shadcn コンポーネントが存在する] shadcn の `button` コンポーネントを追加: `pnpm dlx shadcn@latest add button` を実行。`src/components/ui/button.tsx` が生成されることを確認する
- [x] 4.5 [Test/Verify] `components.json` / `tailwind.config.ts` / `src/lib/utils.ts` / `src/components/ui/button.tsx` の 4 ファイルが存在し、`utils.ts` が `cn` を named export していることを確認する

## 5. API クライアント (hc<AppType> ラッパ)

各タスクは web-foundation の Requirement「API クライアント」の Scenarios（[unit] 3 件）に対応する。

- [x] 5.1 [Test] `apps/web/src/lib/api-client.test.ts` を新規作成し、以下のユニットテストを書く（赤）:
  - [Scenario [unit]: createApiClient factory が export される]: `createApiClient` が named export として存在し、関数であること
  - [Scenario [unit]: serverApiClient 既定インスタンスが export される]: `serverApiClient` が named export として存在すること
- [x] 5.2 [Impl] `apps/web/src/lib/api-client.ts` を実装する:
  - `import { hc } from 'hono/client'`
  - `import type { AppType } from '@pokedex/api'`
  - `export function createApiClient(baseUrl: string) { return hc<AppType>(baseUrl); }`
  - `export const serverApiClient = createApiClient(process.env.API_URL ?? 'http://localhost:3000');`
- [x] 5.3 [Verify] `pnpm --filter @pokedex/web test` で 5.1 のテストが緑になることを確認する
- [x] 5.4 [Verify] [Scenario [unit]: AppType が import type で参照される] `api-client.ts` を grep し、`import type { AppType } from '@pokedex/api'` の行が存在することを確認する

## 6. 環境変数の追加

各タスクは web-foundation の Requirement「環境変数 API_URL の管理」の Scenarios（[unit] 3 件）に対応する。

- [x] 6.1 [Scenario [unit]: .env.development に API_URL が記載されている / .env.development の API_URL は localhost:3000] リポジトリルートの `.env.development` に `API_URL=http://localhost:3000` を追記する
- [x] 6.2 [Verify] [Scenario [unit]: NEXT_PUBLIC_API_URL は導入しない] `grep -r "NEXT_PUBLIC_API_URL" .env.development apps/web/` が 0 件であることを確認する

## 7. テスト基盤 (Vitest + MSW)

各タスクは web-foundation の Requirement「Vitest テスト基盤」の Scenarios（[unit] 3 件 + [integration] 1 件）に対応する。

- [x] 7.1 [Scenario [unit]: vitest.config.ts に jsdom environment が設定されている] `apps/web/vitest.config.ts` を作成する。`test.environment: 'jsdom'`、`test.globals: false`、`test.setupFiles: ['./vitest.setup.ts']` を設定する
- [x] 7.2 [Scenario [unit]: MSW handlers と server が指定ディレクトリに存在する] `apps/web/src/test/msw/server.ts` を作成し、`setupServer()` で server インスタンスを export する
- [x] 7.3 [Scenario [unit]: MSW handlers と server が指定ディレクトリに存在する] `apps/web/src/test/msw/handlers.ts` を作成する。`apps/api` の `/health` 用に「200 + success envelope」「500 + error」「ネットワークエラー」の 3 種類のテンプレ handler を export する（次セクションの Route Handler テストで使う）
- [x] 7.4 [Scenario [unit]: vitest.setup.ts が MSW server を起動する] `apps/web/vitest.setup.ts` を作成し、以下を含める:
  - `beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))`
  - `afterEach(() => server.resetHandlers())`
  - `afterAll(() => server.close())`
  - `import '@testing-library/jest-dom/vitest'` で matcher 拡張
- [x] 7.5 [Verify] [Scenario [integration]: pnpm test が成功する] `pnpm --filter @pokedex/web test` を実行し、（テストファイルが 0 件なら）「No test files found」で exit 0 になることを確認する（次セクションでテスト追加）

## 8. ヘルスチェック Route Handler (TDD)

各タスクは web-foundation の Requirement「ヘルスチェック Route Handler」の Scenarios（[unit] 1 件 + [integration] 3 件）に対応する。

- [x] 8.1 [Test] [Scenario [integration]: apps/api 到達可能時に 200 + success envelope を返す] `apps/web/src/app/api/health/route.test.ts` を作成し、以下のテストを書く（赤）:
  - MSW で `apps/api` の `/health` を 200 + `{ success: true, data: { status: 'ok' } }` でモック
  - `GET` Handler を呼び、`Response.status` が `200`、ボディ JSON が `{ success: true, data: { status: 'ok' } }` であることを assert
- [x] 8.2 [Test] [Scenario [integration]: apps/api 到達不可時に 503 + error envelope を返す] 同テストファイルに以下を追加（赤）:
  - MSW で `apps/api` の `/health` を 500 応答 or `HttpResponse.error()` でモック
  - `GET` Handler を呼び、`Response.status` が `503`、ボディが `{ success: false, error: { code: 'INTERNAL_ERROR', message: <string> } }` であることを assert
- [x] 8.3 [Test] [Scenario [integration]: Content-Type が application/json] 同テストファイルに以下を追加（赤）:
  - `GET` Handler のレスポンス Content-Type に `application/json` が含まれることを assert
- [x] 8.4 [Impl] [Scenario [unit]: route.ts ファイルが存在する] `apps/web/src/app/api/health/route.ts` を実装する:
  - `export const dynamic = 'force-dynamic';`（cache 不可を明示）
  - `export async function GET()` を実装
  - `serverApiClient` で Hono の `/health` を呼び出す
  - 成功時: `Response.json(successEnvelope({ status: 'ok' }), { status: 200 })`
  - 失敗時 (catch): `Response.json(errorEnvelope('INTERNAL_ERROR', String(error)), { status: 503 })`
  - 利用する envelope helpers は `@pokedex/contracts` から import するか、`@pokedex/api` の helpers を再利用するかを実装時に判断
- [x] 8.5 [Verify] `pnpm --filter @pokedex/web test` で 8.1-8.3 のテストが緑になることを確認する
- [x] 8.6 [Refactor] Route Handler のエラーメッセージ整形 / レスポンス組み立て関数を helper として切り出すか判断する。緑を保ったまま品質改善

## 9. package.json scripts の整備

各タスクは monorepo-foundation delta の Requirement「apps/web に必要なスクリプトが揃っている」の Scenarios（[unit] 4 件）に対応する。

- [x] 9.1 [Scenario [unit]: apps/web に 7 スクリプトすべてが揃っている] `apps/web/package.json` の `scripts` を以下に更新:
  - `dev`: `next dev -p 3001`
  - `build`: `next build`
  - `test`: `vitest run`
  - `typecheck`: `tsc --noEmit`（既存）
  - `lint`: `oxlint --type-aware .`（既存）
  - `format`: `oxfmt .`（既存）
  - `format:check`: `oxfmt --check .`（既存）

## 10. next.config.ts の作成

- [x] 10.1 `apps/web/next.config.ts` を作成する。最低限の設定（`reactStrictMode: true` 等）のみ。Cache Components は本 change では使わないため experimental 設定不要

## 11. tsconfig.json の確認 / 微調整

各タスクは web-foundation の Requirement「ディレクトリ構造と命名規約」の Scenario [unit]: tsconfig.json に @/* alias が定義されている に対応する。

- [x] 11.1 `apps/web/tsconfig.json` の `compilerOptions.paths` に `"@/*": ["./src/*"]`（既存のまま）が含まれていることを確認する
- [x] 11.2 Next.js 推奨の `compilerOptions` を必要に応じて追加する（`plugins: [{ name: 'next' }]` 等）。型エラーで困らない最低限の調整

## 12. monorepo-foundation の動作確認 (apps/web 追加後)

- [x] 12.1 [Scenario [integration]: 開発コマンドで Next.js dev サーバが起動する] `pnpm --filter @pokedex/web dev` を実行し、Next.js が `3001` で listen することを確認する（手動 / curl）
- [x] 12.2 [Scenario [integration]: 本番ビルドが成功する] `pnpm --filter @pokedex/web build` を実行し、`apps/web/.next/` が生成されることを確認する
- [x] 12.3 [動作確認] `apps/api` を起動した状態で `curl http://localhost:3001/api/health` を叩き、200 + `{ success: true, data: { status: 'ok' } }` が返ることを確認する
- [x] 12.4 [動作確認] `apps/api` を停止した状態で `curl http://localhost:3001/api/health` を叩き、503 + `{ success: false, error: { code: 'INTERNAL_ERROR', ... } }` が返ることを確認する
- [x] 12.5 [Scenario [integration]: turbo run dev で apps/api と apps/web が並走する] `turbo run dev` をルートで実行し、`apps/api` と `apps/web` が並走することを確認する（手動 / プロセス確認）

## 13. ディレクトリ・命名規約の機械検証

各タスクは web-foundation の Requirement「ディレクトリ構造と命名規約」の Scenarios（[unit] 6 件）に対応する。

- [x] 13.1 [Scenario [unit]: src/app/ ディレクトリが App Router の root として存在する 〜 src/test/msw/ ディレクトリが存在する] `apps/web/src/{app,components/ui,lib,test/msw}` の 4 ディレクトリが存在することを `ls` で確認する
- [x] 13.2 [Scenario [unit]: 非特殊ファイルのファイル名が kebab-case に従う] `find apps/web/src -type f \( -name "*.ts" -o -name "*.tsx" \)` で全ファイル名を抽出し、Next.js 特殊ファイル（`layout.tsx` / `page.tsx` / `route.ts` / `error.tsx` / `not-found.tsx` / `loading.tsx` / `globals.css`）を除いた basename がすべて `^[a-z][a-z0-9-]*$` の正規表現に一致することを確認する

## 14. monorepo-foundation spec の delta 反映確認

本 change の `specs/monorepo-foundation/spec.md`（ADDED 2 Requirement）は archive 時に `openspec archive` が自動で main spec に sync する。手動操作は不要。本 change 中は delta spec として `openspec/changes/add-web-foundation/specs/monorepo-foundation/spec.md` に存在するだけで OK。

- [x] 14.1 [確認のみ] `openspec validate add-web-foundation` が pass することを確認する

## 15. 最終 GREEN 検証

- [x] 15.1 [全テスト pass] `pnpm -r test` を実行し、`apps/api` / `apps/web` / `packages/contracts` すべてのテストが緑になることを確認する
- [x] 15.2 [型チェック] `pnpm -r typecheck` を実行し、エラーが無いことを確認する
- [x] 15.3 [lint] `pnpm -r lint` を実行し、エラーが無いことを確認する
- [x] 15.4 [format] `pnpm -r format:check` を実行し、フォーマット崩れが無いことを確認する
- [x] 15.5 [openspec validate] `openspec validate --all --strict` を実行し、全 items が pass することを確認する

## 16. リファクタ (任意)

- [x] 16.1 実装中に発見した重複や命名の改善があれば、緑を保ったままリファクタする。**振る舞いを変える変更は本 change で行わず、別 change として切り出す**
