## 1. invariants.test.ts を dynamic import + beforeAll パターンに書き換える

- [x] 1.1 [Test] `DATABASE_URL` 未設定で `pnpm --filter @pokedex/api test` を実行し、`apps/api/src/db/seed/invariants.test.ts` が **ロード失敗で 1 file failed になる** ことを現状確認する (= 修正前の "Red")
- [x] 1.2 [Impl] `apps/api/src/db/seed/invariants.test.ts` を以下のテンプレートで書き換える: 静的 `import { collectInvariantViolations } from './invariants.js'` を廃止、`describe.skipIf(SHOULD_SKIP)` 配下の `beforeAll` で `await import('./invariants.js')` する形式に揃える。型は `typeof import('./invariants.js').collectInvariantViolations` で取り出す
- [x] 1.3 [Test] `DATABASE_URL` 未設定で `pnpm --filter @pokedex/api test` を実行し、当該 describe が skip 扱いになり **テストファイルが failed にならない** ことを確認する (spec Scenario「DATABASE_URL 未設定で test ファイルがロードに失敗しない」)
- [x] 1.4 [Refactor] テンプレートに「`typeof import('...')` は型注釈であり実行時の値ロードは起きない」旨のコメントを追記し、`pokemon.real.test.ts` / `app-smoke.test.ts` と同パターンであることが読み取れる状態にする

## 2. DATABASE_URL 設定済み環境での振る舞い保持を確認する

- [x] 2.1 [Test] Supabase ローカル起動 + シード投入後に `DATABASE_URL='postgres://postgres:postgres@127.0.0.1:54322/postgres' pnpm --filter @pokedex/api test` を実行し、`invariants.test.ts` が緑になることを確認する (spec Scenario「DATABASE_URL 設定済みで invariant 検証が走る」)
- [x] 2.2 [Test] `pnpm -r test` が緑になることを確認する (= `DATABASE_URL` 未設定の代表ローカルケース)

## 3. 検証・品質チェック

- [x] 3.1 `pnpm --filter @pokedex/api typecheck` が緑になることを確認する
- [x] 3.2 `pnpm --filter @pokedex/api lint && pnpm --filter @pokedex/api format:check` が緑になることを確認する
- [x] 3.3 `openspec validate fix-invariants-test-db-guard --strict` で change の妥当性を確認する
- [x] 3.4 セルフレビュー (CLAUDE.md 規約: `.ts` 変更のため `typescript-reviewer` agent を起動) で指摘を判定する
