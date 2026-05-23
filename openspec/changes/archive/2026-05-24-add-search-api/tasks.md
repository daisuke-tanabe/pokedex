## 1. @pokedex/contracts: Envelope の generic 化

- [x] 1.1 既存 `envelopeSchema` のテストを「meta schema 第二引数を渡せる / 省略時は従来動作」シナリオで拡張する（spec の MODIFIED Scenario に対応）
- [x] 1.2 `envelopeSchema(dataSchema, metaSchema?)` の実装を generic 化し、両ケースで型が正しく推論されることを確認する
- [x] 1.3 既存利用箇所（`apps/api`）の呼び出しが破壊されていないか型チェックで確認する

## 2. @pokedex/contracts: ErrorCode 追加

- [x] 2.1 `ErrorCode` enum に `POKEMON_NOT_FOUND` が含まれることを検証するテストを追加する
- [x] 2.2 `ErrorCode` および対応する values tuple に `POKEMON_NOT_FOUND` を追加する

## 3. @pokedex/contracts: ポケモン API 用スキーマ追加

- [x] 3.1 `pokemonListQuerySchema` の Scenario 群（既定値・カンマ区切り・MAX_TYPES 超過・limit 範囲外）に対応するテストを追加する
- [x] 3.2 `pokemonListQuerySchema` を実装し、テストを通す
- [x] 3.3 `pokemonListItemSchema` / `pokemonListMetaSchema` のテスト（最低フィールド・nextCursor nullable）を追加する
- [x] 3.4 `pokemonListItemSchema` / `pokemonListMetaSchema` を実装する
- [x] 3.5 `pokemonDetailSchema` のテスト（species + form + names + sprites + types + evolutions）を追加する
- [x] 3.6 `pokemonDetailSchema` を実装する
- [x] 3.7 単一エントリポイントから新規 schema 群が import 可能なことを確認するテストを追加する
- [x] 3.8 `packages/contracts/src/index.ts` から新規 schema を re-export する

## 4. apps/api: Cursor ライブラリ

- [x] 4.1 `apps/api/src/lib/cursor.test.ts` を作成し、ラウンドトリップ・不正 base64url・必須キー欠落の Scenario をテスト化する
- [x] 4.2 `apps/api/src/lib/cursor.ts` に `encodeCursor({ pn, fid }) / decodeCursor(token)` を実装し、テストを通す

## 5. apps/api: Repository 層

- [x] 5.1 `apps/api/src/repositories/pokemon.ts` に `PokemonRepository` interface と関連型（SearchInput / PokemonListItem / PokemonDetail）を定義する
- [x] 5.2 `apps/api/src/repositories/pokemon.mock.ts` にテスト用 mock 実装を追加する
- [x] 5.3 mock repository の挙動を確認する単体テストを追加する（固定データから input に応じた出力を返す）

## 6. apps/api: Migration 0002（検索ホットパスのインデックス）

- [x] 6.1 `migrations.test.ts` に「migration 0002 の生成 SQL に各インデックス（pokedex_entries(pokedex_id) / (form_id), form_types(form_id) / (type_id), form_sprites(form_id), form_names(form_id)）が含まれる」Scenario をテスト化する
- [x] 6.2 `apps/api/src/db/schema/*.ts` に `index('...').on(...)` を追加する
- [x] 6.3 `pnpm --filter @pokedex/api db:generate --name add_search_indexes` で migration 0002 を生成する
- [x] 6.4 `migrations.test.ts` の Scenario が緑になることを確認する

## 7. apps/api: Repository の Drizzle 実装

- [x] 7.1 `apps/api/src/repositories/pokemon.real.test.ts`（`describe.skipIf(SHOULD_SKIP)`）に検索クエリの統合テストを追加する（pokedex 絞り込み / type 単一 / type AND / cursor seek / 結果 0 件 / limit 境界）
- [x] 7.2 `apps/api/src/repositories/pokemon.real.test.ts` に詳細クエリの統合テストを追加する（既存 slug / 未知 slug → null / default form 返却 / 進化チェーン）
- [x] 7.3 `searchByList` メソッドを Drizzle で実装する（メインクエリ + バッチ 4 本の Promise.all 並列）
- [x] 7.4 `findDetailBySlug` メソッドを Drizzle で実装する（species lookup → default form 解決 → バッチ取得）
- [x] 7.5 統合テストが緑になることを確認する

## 8. apps/api: Route 層（検索・一覧）

- [x] 8.1 `apps/api/src/routes/pokemon.test.ts` に mock repository を注入した route テストを追加する（既定パラメータ・pokedex 切替・types 単一・types AND・cursor 続き・0 件・limit・末尾 nextCursor=null）
- [x] 8.2 同 test に異常系（不正 cursor / 未知 pokedex / 未知 type / MAX_TYPES 超過）の Scenario を追加する
- [x] 8.3 `apps/api/src/routes/pokemon.ts` の `GET /api/pokemon` を実装する（`@hono/valibot-validator` で `pokemonListQuerySchema` を適用）
- [x] 8.4 INVALID_QUERY の使い分けロジック（不正クエリ・unknown pokedex slug・unknown type slug）を route 層に実装する

## 9. apps/api: Route 層（詳細）

- [x] 9.1 `apps/api/src/routes/pokemon.test.ts` に詳細 route のテストを追加する（既存 slug / is_default form 返却 / 多言語名 / 進化チェーン / 未知 slug → 404 POKEMON_NOT_FOUND）
- [x] 9.2 `apps/api/src/routes/pokemon.ts` の `GET /api/pokemon/:slug` を実装する
- [x] 9.3 想定外例外で 500 + INTERNAL_ERROR が返ることを確認するテストと実装を追加する

## 10. apps/api: コンポジションルート（route 登録）

- [x] 10.1 `apps/api/src/index.ts` で real repository を route に注入し `/api` 配下に mount する
- [x] 10.2 起動経路で `/health` が引き続き動作することを確認する smoke テスト or 既存テストの保全

## 11. spec 更新（domain-schema）

- [x] 11.1 `openspec/specs/domain-schema/spec.md` の `pokedex_entries` Requirement について、archive 時に「form_id NULL 時は is_default form をデフォルト表示する」へ更新されることを確認する（`openspec archive` 時の自動反映）

## 12. 検証・品質チェック

- [x] 12.1 `pnpm --filter @pokedex/api typecheck && pnpm --filter @pokedex/contracts typecheck` が緑になることを確認する
- [x] 12.2 `pnpm --filter @pokedex/api test && pnpm --filter @pokedex/contracts test` が緑になることを確認する（DATABASE_URL あり/なしの両ケース）
- [x] 12.3 `pnpm lint && pnpm format:check` が緑になることを確認する
- [x] 12.4 `openspec validate add-search-api --strict` で change の妥当性を確認する
- [x] 12.5 セルフレビュー（CLAUDE.md 規約に従い `typescript-reviewer` agent を起動）して指摘を判定する
