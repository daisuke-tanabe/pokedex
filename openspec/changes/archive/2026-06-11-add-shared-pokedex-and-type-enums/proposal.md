## Why

ポケモン図鑑の検索 UI (`add-web-search-ui`) では、検索フォームで pokedex slug (図鑑切替) と type slug (タイプ AND 絞り込み) の選択肢を提示する必要がある。これらは BE (`apps/api` の Valibot 検証 + DB lookup)、seed (`apps/api/src/db/seed/data/{pokedexes,types}.json`)、FE (検索フォームの選択肢) の **3 箇所で参照される** が、現状は contracts に master enum が無く、apps/api 側は DB 動的問合せに依存し、apps/web 側は hardcode する設計になっていた。

source of truth を `packages/contracts` に集約することで、(1) FE/BE/seed の乖離を invariants test で検知できる、(2) `apps/api` の Valibot 検証を `v.picklist()` で early reject 化できる、(3) 後続 `add-web-search-ui` で FE 側が contracts の enum を `import` するだけで済む、という 3 つの利点を得る。

## What Changes

- `packages/contracts/src/enums/pokedex.ts` 新規追加 (`POKEDEX_SLUG_VALUES` 非空タプル + `PokedexSlug` 定数 object + リテラルユニオン型)
  - 初期値: `national`, `paldea` (seed 現状値、後続 `add-pokedex-seed-data` で拡張)
- `packages/contracts/src/enums/type.ts` 新規追加 (同パターンで `TYPE_SLUG_VALUES` + `TypeSlug`)
  - 初期値: 18 値 (normal/fire/water/electric/grass/ice/fighting/poison/ground/flying/psychic/bug/rock/ghost/dragon/dark/steel/fairy)
- `packages/contracts/src/index.ts` の re-export に上記 2 ファイルを追加
- `apps/api/src/db/seed/invariants.ts` に整合性 test 追加 (locale の既存パターンを踏襲)
  - `pokedexes.json` の slug 集合 = `POKEDEX_SLUG_VALUES`
  - `types.json` の slug 集合 = `TYPE_SLUG_VALUES`
- `apps/api` の `pokemonListQuerySchema` を `v.picklist()` 制約に強化
  - `pokedex`: `v.picklist(POKEDEX_SLUG_VALUES)` を default 適用
  - `types`: 内部 string 要素を `v.picklist(TYPE_SLUG_VALUES)` に
- `apps/api/src/routes/pokemon.ts` の「unknown pokedex」null check 分岐を削除 (Valibot で早期失敗するため到達不能化)
  - `findPokedexIdBySlug` / `findTypeIdsBySlugs` の関数自体は ID 解決に必要なので維持
- `apps/api/src/routes/pokemon.test.ts` の「不正な pokedex/type で 400」テストを Valibot baseline に整合 (期待値 HTTP 400 + INVALID_QUERY は変わらず、生成経路だけ変わる)

## Capabilities

### New Capabilities

（なし）

### Modified Capabilities

- `shared-contracts`: ドメイン分類値 enum のラインナップに `PokedexSlug` / `TypeSlug` を追加し、Purpose と Requirement を延伸
- `domain-seed`: `locales.json` と Locale の整合 Scenario と同パターンで、`pokedexes.json` / `types.json` の slug 集合と `PokedexSlug` / `TypeSlug` の整合 Scenario を追加
- `pokemon-api`: Valibot picklist 制約への切替に伴い、route 層の「unknown pokedex」null check 分岐削除を反映した Scenario 調整

## Impact

- **コード**: `packages/contracts/src/enums/{pokedex,type}.ts` (新規)、`packages/contracts/src/index.ts` (re-export 追加)、`apps/api/src/db/seed/invariants.ts` (test 関数 +2)、`apps/api/src/...` Valibot schema (制約強化)、`apps/api/src/routes/pokemon.ts` (null check 削除)、`apps/api/src/routes/pokemon.test.ts` (期待値整合)
- **テスト**: contracts に新規 enum 2 つの test (form-category / locale / sprite と同じパターン)、apps/api の invariants test 2 件、pokemon.test.ts の Valibot picklist baseline 確認
- **依存**: 新規追加なし (valibot は既存)
- **後続 change**: `add-web-search-ui` で `import { POKEDEX_SLUG_VALUES, TYPE_SLUG_VALUES, type PokedexSlug, type TypeSlug } from '@pokedex/contracts'` を使う基盤が整う
- **Out of scope**: 100+ 図鑑/種族の本番網羅 seed (別 change `add-pokedex-seed-data`)、UI 実装 (別 change `add-web-search-ui`)、Kanto / Johto / Hoenn 等の追加図鑑投入 (将来 seed 拡張時)
