## 1. リポジトリルートの設定整備（asdf / Supabase / workspace）

- [x] 1.1 `pnpm-workspace.yaml` の `packages` 配列に `'packages/*'` を追加し、既存の `'apps/*'` と並べる
- [x] 1.2 `turbo.json` に `dev`（`cache: false`, `persistent: true`）、`build`（`dependsOn: ["^build"]`, `outputs: ["dist/**"]`）、`test`（`dependsOn: ["^build"]`）、`typecheck`（`dependsOn: ["^build"]`）の 4 タスクを追加し、既存の `lint` / `format` / `format:check` は維持する
- [x] 1.3 `.gitignore` に `.env.local` / `.env` / `.env.production` を追記する（機密ファイルのコミット防止）
- [x] 1.4 `.tool-versions` に `supabase <固定バージョン>` を追記し、Node / pnpm と並べる
- [x] 1.5 README または `docs/setup.md` に `asdf plugin add supabase https://github.com/lostmsu/asdf-supabase.git` → `asdf install` の手順を追記する
- [x] 1.6 リポジトリルートで `supabase init` を実行し、生成された `supabase/` ディレクトリ（`config.toml`、`.gitignore`、`migrations/`、`seed.sql` 等）をコミット対象に含める
- [x] 1.7 リポジトリルートに `.env.development` を作成し、`DATABASE_URL=postgres://postgres:postgres@127.0.0.1:54322/postgres` をコメント付きで記載する（Supabase ローカル既定値、機密ゼロ）
- [x] 1.8 README に「`.env.development` は機密を含まないコミット対象」「個人の機密上書きは `.env.local`（gitignore 済み）」「本番値は GitHub Secrets / 各ホスティングで注入し、リポジトリには置かない」という env 管理方針を明記する
- [ ] 1.9 `supabase start` を実行し、ローカル PostgreSQL が `54322` で立ち上がること、`supabase status` で URL が確認できることを手動検証する
- [x] 1.10 `pnpm install` を実行し、ワークスペース解決が壊れていないことを確認する（既存の apps/* がリンクされ続けること）

## 2. packages/contracts パッケージの雛形作成

- [x] 2.1 `packages/contracts/` を作成し、`package.json`（`name: '@pokedex/contracts'`, `private: true`, `type: 'module'`, `main: './src/index.ts'`, `types: './src/index.ts'`）を配置する
- [x] 2.2 `packages/contracts/package.json` の `scripts` に `test`, `typecheck`, `lint`, `format`, `format:check` を追加する（apps と同じ oxlint / oxfmt / vitest / tsc を呼ぶ）
- [x] 2.3 `packages/contracts/tsconfig.json` を `tsconfig.base.json` を `extends` する形で作成する
- [x] 2.4 `packages/contracts/src/index.ts` を空 export（`export {}`）で作成し、ビルド可能な状態にする
- [x] 2.5 `packages/contracts/package.json` の `devDependencies` に `vitest`, `valibot`, `oxlint`, `oxfmt` を追加する（catalog 経由 or 直書き、ルートと整合させる）
- [x] 2.6 `packages/contracts/vitest.config.ts` を追加する
- [x] 2.7 `pnpm install` でワークスペース解決と依存インストールが完走することを確認する

## 3. shared-contracts: ドメイン定数

- [x] 3.1 [Test] `packages/contracts/src/__tests__/constants.test.ts` を作成し、`PAGE_SIZE === 30`、`MAX_TYPES === 2`、`DEFAULT_POKEDEX_SLUG === 'national'` を検証するテストを書く（赤）
- [x] 3.2 [Test] 同テストファイルに `expectTypeOf<typeof PAGE_SIZE>().toEqualTypeOf<30>()` 相当の型テスト（vitest の `expectTypeOf` 使用、または `assertType`）を追加する（赤）
- [x] 3.3 [Impl] `packages/contracts/src/constants.ts` を作成し、`as const` 付きで 3 定数を export する
- [x] 3.4 [Impl] `packages/contracts/src/index.ts` から `constants.ts` を re-export する
- [x] 3.5 [Refactor] 命名・JSDoc・export 形式（個別 named export）を見直す

## 4. shared-contracts: エラーコード

- [x] 4.1 [Test] `packages/contracts/src/__tests__/errors.test.ts` を作成し、`ErrorCode.POKEDEX_NOT_FOUND === 'POKEDEX_NOT_FOUND'`、`ErrorCode.INVALID_QUERY === 'INVALID_QUERY'` を検証するテストを書く（赤）
- [x] 4.2 [Test] 同テストに `Object.values(ErrorCode)` に最低 2 値が含まれることを assert する
- [x] 4.3 [Test] 型レベルテストとして `const code: ErrorCode = 'NOT_AN_ERROR_CODE'` が `// @ts-expect-error` でエラーになることを示す
- [x] 4.4 [Impl] `packages/contracts/src/errors.ts` を作成し、`as const` オブジェクト + 型エイリアスで `ErrorCode` を export する
- [x] 4.5 [Impl] `packages/contracts/src/index.ts` から `errors.ts` を re-export する
- [x] 4.6 [Refactor] enum と as const オブジェクトの選択を design.md と整合する形に統一する

## 5. shared-contracts: レスポンスエンベロープ Valibot スキーマ

- [x] 5.1 [Test] `packages/contracts/src/__tests__/envelope.test.ts` を作成し、成功エンベロープ `{ success: true, data: 'hello' }` が `parse(envelopeSchema(string()), ...)` を通ることを検証する（赤）
- [x] 5.2 [Test] meta 付き成功エンベロープが通ることを検証する
- [x] 5.3 [Test] 失敗エンベロープ `{ success: false, error: { code: 'INVALID_QUERY', message: 'invalid' } }` が通ることを検証する
- [x] 5.4 [Test] `success: true` と `error` が両立する不正値で `parse` が例外を投げることを検証する
- [x] 5.5 [Test] `error.code` に未定義文字列が入った値で `parse` が例外を投げることを検証する
- [x] 5.6 [Impl] `packages/contracts/src/schemas/envelope.ts` を作成し、Valibot の `variant` で判別可能ユニオンとしてエンベロープスキーマを実装する。`error.code` は `picklist(Object.values(ErrorCode))` で制約する
- [x] 5.7 [Impl] `packages/contracts/src/index.ts` から `schemas/envelope.ts` を re-export する
- [x] 5.8 [Refactor] スキーマ関数のジェネリクス推論と型 export（`type Envelope<T>` など）の表現を整える

## 6. shared-contracts: 単一エントリポイント

- [x] 6.1 [Test] `packages/contracts/src/__tests__/index.test.ts` を作成し、`import { envelopeSchema, PAGE_SIZE, MAX_TYPES, DEFAULT_POKEDEX_SLUG, ErrorCode } from '@pokedex/contracts'`（または相対）が型エラーなく解決されることを smoke テストする
- [x] 6.2 [Impl] `packages/contracts/src/index.ts` の re-export 漏れを補完する
- [x] 6.3 [Refactor] 不要な再エクスポートの削除と export 順序の整理

## 7. apps/api パッケージの雛形作成

- [x] 7.1 `apps/api/package.json` に `dependencies` を追加（`hono`, `@hono/node-server`, `@hono/valibot-validator`, `drizzle-orm`, `postgres`, `valibot`, `@pokedex/contracts: workspace:*`）
- [x] 7.2 `apps/api/package.json` に `devDependencies` を追加（`drizzle-kit`, `vitest`, `tsx`, `@types/node`）
- [x] 7.3 `apps/api/package.json` の `scripts` に `dev`（`tsx watch --env-file=../../.env.development --env-file-if-exists=../../.env.local src/server.ts`）、`build`（`tsc -p tsconfig.json`）、`test`（`vitest run`）を追加し、既存の `lint` / `format` / `typecheck` / `format:check` は維持する
- [x] 7.4 `apps/api/tsconfig.json` を `tsconfig.base.json` を extends し、`module: "ESNext"`, `moduleResolution: "bundler"`, `verbatimModuleSyntax: true`, `outDir: "dist"` を設定する
- [x] 7.5 `apps/api/vitest.config.ts` を追加する
- [x] 7.6 `apps/api/drizzle.config.ts` の雛形を作成し、`schema: './src/db/schema.ts'`, `out: '../../supabase/migrations'`, `dialect: 'postgresql'` を記載する（実テーブル定義と SQL 生成は `add-domain-schema` で行う）
- [x] 7.7 `pnpm install` で全依存が解決することを確認する

## 8. api-foundation: DB クライアントの singleton

- [x] 8.1 [Test] `apps/api/src/db/__tests__/client.test.ts` を作成し、`DATABASE_URL` 未設定時に `import('./client')` がエラーメッセージ `DATABASE_URL is required` で例外を投げることを検証する（モジュールキャッシュをリセットして検証する `vi.resetModules()` を活用）
- [x] 8.2 [Test] `DATABASE_URL` 設定時に `import('./client')` が成功し `db` シンボルが取得できることを検証する
- [x] 8.3 [Test] 同一プロセス内で 2 回 `import('./client')` した結果の `db` が `===` で等価であることを検証する
- [x] 8.4 [Impl] `apps/api/src/db/client.ts` を実装する（fail-fast で env チェック、`drizzle(postgres(connectionString))` を `db` として export）
- [x] 8.5 [Refactor] エラーメッセージ・型エクスポート（`type DB = typeof db`）・命名を整える

## 9. api-foundation: エンベロープ生成ヘルパー

- [x] 9.1 [Test] `apps/api/src/lib/__tests__/envelope.test.ts` を作成し、`successEnvelope({ status: 'ok' })` が `{ success: true, data: { status: 'ok' } }` を返すことを検証する
- [x] 9.2 [Test] `successEnvelope([1, 2, 3], { total: 3, page: 1, limit: 30 })` が meta 付きで返ることを検証する
- [x] 9.3 [Test] `errorEnvelope('POKEDEX_NOT_FOUND', 'pokedex not found')` が `{ success: false, error: { code: 'POKEDEX_NOT_FOUND', message: 'pokedex not found' } }` を返すことを検証する
- [x] 9.4 [Test] 出力値が `@pokedex/contracts` の `envelopeSchema` を通過することを smoke テストする（contracts との結合確認）
- [x] 9.5 [Impl] `apps/api/src/lib/envelope.ts` を実装する（ジェネリクスで data の型を保持、`ErrorCode` を引数に強制）
- [x] 9.6 [Refactor] 関数シグネチャの整理（オーバーロード or オプショナル meta の表現）と JSDoc 追加

## 10. api-foundation: ヘルスチェックエンドポイント

- [x] 10.1 [Test] `apps/api/src/routes/__tests__/health.test.ts` を作成し、`app.request('/health')` の結果が 200 でボディが `{ success: true, data: { status: 'ok' } }` であることを検証する
- [x] 10.2 [Test] レスポンスヘッダ `Content-Type` に `application/json` が含まれることを検証する
- [x] 10.3 [Impl] `apps/api/src/routes/health.ts` を作成し、`successEnvelope({ status: 'ok' })` を返すルートを定義する
- [x] 10.4 [Impl] `apps/api/src/index.ts` で Hono app を構築し、`/health` ルートを登録する
- [x] 10.5 [Refactor] ルート定義の置き場所と命名（`createHealthRoute()` のような薄い関数化）を整える

## 11. api-foundation: AppType の export と HTTP リスナー

- [x] 11.1 [Test] `apps/api/src/__tests__/app-type.test.ts` を作成し、`import type { AppType } from '../index'` をした上で `hc<AppType>` 相当の型推論が成立することを `expectTypeOf` で検証する
- [x] 11.2 [Impl] `apps/api/src/index.ts` で `export type AppType = typeof app` を追加する（型のみ export）
- [x] 11.3 [Impl] `apps/api/src/server.ts` を作成し、`@hono/node-server` の `serve` で `process.env.PORT ?? 3000` を listen する
- [x] 11.4 [Test] サーバ起動 smoke テスト: `PORT=0` で `serve` を呼び、戻り値の `address().port` が 0 以外であることを検証する（任意ポートでバインドが成功することの確認）
- [x] 11.5 [Refactor] `index.ts` と `server.ts` の責務分離（前者は Hono app、後者は HTTP リスナー起動）を確認

## 12. monorepo-foundation の整合確認

- [x] 12.1 [Test] `pnpm-workspace.yaml` の YAML を読み込み `packages` 配列に `'apps/*'` と `'packages/*'` の両方が含まれることを CI 用ノードスクリプト or ルートの vitest テストで検証する（任意。手動確認でも可）
- [x] 12.2 [Test] `turbo.json` を JSON として読み込み、`tasks.dev`、`tasks.build`、`tasks.test`、`tasks.typecheck`、`tasks.lint`、`tasks.format`、`tasks.format:check` の 7 キーが存在することを検証する
- [x] 12.3 [Test] `turbo.json` の `tasks.dev.cache === false` かつ `tasks.dev.persistent === true` を検証する
- [x] 12.4 [Test] `turbo.json` の `tasks.build.dependsOn` に `'^build'` が含まれることを検証する
- [x] 12.5 [Test] `apps/api/package.json` と `packages/contracts/package.json` を読み、必須スクリプトキー（apps/api: dev/build/test/typecheck/lint/format/format:check, packages/contracts: test/typecheck/lint/format/format:check）が揃っていることを検証する
- [x] 12.6 [Test] `.gitignore` に `.env.local`、`.env`、`.env.production` の 3 行が含まれることを検証する
- [x] 12.7 [Test] `.env.development` が repository にコミットされており、`DATABASE_URL=` で始まる行を含むことを検証する
- [x] 12.8 [Test] `.env.development` の `DATABASE_URL` の host が `127.0.0.1` または `localhost`、port が `54322`、database が `postgres`、user が `postgres` であることを検証する（Supabase ローカル既定）
- [x] 12.9 [Test] `.env.development` がパスワード以外の機密パターン（`SECRET`、`KEY`、`TOKEN`、`PASSWORD` を含む行など）を含まないことを検証する（簡易チェック）
- [x] 12.10 [Test] `supabase/config.toml` が repository に含まれることを検証する
- [x] 12.11 [Test] `.tool-versions` に `supabase ` で始まる行が含まれ、特定バージョンが指定されていることを検証する
- [x] 12.12 [Test] `README.md` に「本番値は GitHub Secrets / 各ホスティングで注入する」旨の文字列が含まれることを検証する

## 13. lint / format / typecheck の全 package 適用確認

- [x] 13.1 [Verify] `pnpm --filter @pokedex/contracts lint` が exit code 0 で完走することを確認する
- [x] 13.2 [Verify] `pnpm --filter @pokedex/api lint` が exit code 0 で完走することを確認する
- [x] 13.3 [Verify] `pnpm lint`（ルート）で turbo が `apps/api`、`apps/web`、`apps/mobile`、`packages/contracts` の 4 パッケージで lint タスクを実行することを確認する
- [x] 13.4 [Verify] `pnpm format:check` が全パッケージで完走することを確認する
- [x] 13.5 [Verify] `pnpm typecheck` が全パッケージで完走することを確認する
- [x] 13.6 [Verify] `pnpm test` が `apps/api` と `packages/contracts` の vitest を実行し全て pass することを確認する

## 14. 動作確認とドキュメント

- [ ] 14.1 [Verify] `supabase start` で Supabase ローカルスタックを起動した後、`pnpm --filter @pokedex/api dev` で API が 3000 番ポートに立ち上がることを手動検証する
- [ ] 14.2 [Verify] `curl -i http://localhost:3000/health` が 200、`Content-Type: application/json`、ボディ `{"success":true,"data":{"status":"ok"}}` を返すことを手動検証する
- [ ] 14.3 [Verify] `supabase stop` でローカルスタックを停止できることを確認する
- [x] 14.4 README.md に開発手順（asdf install、Docker Desktop / Colima 要件、`supabase start`、依存インストール、API 起動、ヘルスチェック確認、テスト実行）を簡潔に追記する
- [x] 14.5 README に env 管理方針セクションを追加する（`.env.development` はコミット対象・機密ゼロ、`.env.local` は gitignore された個人の機密上書き、本番値は GitHub Secrets / 各ホスティングで注入）
- [x] 14.6 README に「`asdf-supabase` plugin が動かない場合のフォールバック」（例: `brew install supabase/tap/supabase`）を併記する
- [x] 14.7 `apps/web` と `apps/mobile` の package.json には今回手を加えないこと、後続 change で扱うことを README または別途メモに明記する
