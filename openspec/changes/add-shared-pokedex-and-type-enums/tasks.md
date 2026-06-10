## 1. 事前準備とベースライン

- [ ] 1.1 `pnpm -r typecheck` / `lint` / `format:check` / `test` を実行し、ベースラインで全 package green を確認する
- [ ] 1.2 `apps/api/src/db/seed/data/pokedexes.json` / `types.json` の現状 slug を再確認し、enum 初期値と一致することを確認 (national / paldea / 18 type slug)

## 2. contracts に PokedexSlug enum を追加

各タスクは shared-contracts の ADDED Requirement「ドメイン分類値の export（PokedexSlug）」に対応する。

- [ ] 2.1 [Impl] `packages/contracts/src/enums/pokedex.ts` を新規作成する (form-category.ts のコピーをベースに `POKEDEX_SLUG_VALUES` / `PokedexSlug` を定義、初期値 `['national', 'paldea']`)
- [ ] 2.2 [Test] `packages/contracts/src/enums/pokedex.test.ts` を新規作成する (form-category.test.ts と同パターンで 3 つの Scenario を test 化: 2 値含む / 未定義値拒否 / as const 凍結)
- [ ] 2.3 [Verify] [Scenario [unit]: PokedexSlug に national と paldea が含まれる] test green を確認する

## 3. contracts に TypeSlug enum を追加

各タスクは shared-contracts の ADDED Requirement「ドメイン分類値の export（TypeSlug）」に対応する。

- [ ] 3.1 [Impl] `packages/contracts/src/enums/type.ts` を新規作成する (form-category.ts のコピーをベースに `TYPE_SLUG_VALUES` / `TypeSlug` を定義、初期値 18 タイプ)
- [ ] 3.2 [Test] `packages/contracts/src/enums/type.test.ts` を新規作成する (3 Scenario を test 化: 18 値含む / 未定義値拒否 / as const 凍結)
- [ ] 3.3 [Verify] [Scenario [unit]: TypeSlug に 18 値が含まれる] test green を確認する

## 4. contracts エントリポイントから export

各タスクは MODIFIED Requirement「単一エントリポイントからの追加 export」と「分類値の非空タプル export」に対応する。

- [ ] 4.1 [Impl] `packages/contracts/src/index.ts` に `export * from './enums/pokedex.js'` と `export * from './enums/type.js'` (もしくは同等の named export) を追加する
- [ ] 4.2 [Test] `packages/contracts/src/index.test.ts` で 6 分類値 (`FormCategory` / `Locale` / `SpriteGender` / `SpriteKind` / `PokedexSlug` / `TypeSlug`) が単一 import で解決されることを確認するテストを追加する
- [ ] 4.3 [Verify] [Scenario [unit]: POKEDEX_SLUG_VALUES が PokedexSlug と同じ値集合を持つ / TYPE_SLUG_VALUES が TypeSlug と同じ値集合を持つ] test を `*.test.ts` に追加し緑になることを確認する

## 5. seed/invariants 整合性テストの追加

各タスクは domain-seed の ADDED Requirements に対応する。

- [ ] 5.1 [Test] `apps/api/src/db/seed/invariants.test.ts` (もしくは新規 unit test ファイル) に「pokedexes.json の slug 集合 = `Object.values(PokedexSlug)`」を assert するテストを追加する (locales.json での既存パターン参照)
- [ ] 5.2 [Test] 同様に「types.json の slug 集合 = `Object.values(TypeSlug)`」を assert するテストを追加する
- [ ] 5.3 [Impl] 必要なら `invariants.ts` 側にも runtime check 関数を追加する (locale が runtime check していれば同パターンで)。test だけで足りるなら本タスクはスキップ
- [ ] 5.4 [Verify] `pnpm --filter @pokedex/api test` で上記 2 件が緑になることを確認する

## 6. apps/api の Valibot を v.picklist() に強化

各タスクは design.md Decision 4 と Decision 5 に対応する。

- [ ] 6.1 [Impl] `packages/contracts/src/schemas/pokemon-query.ts` の `slugSchema` を維持しつつ、`pokemonListQuerySchema.pokedex` を `v.optional(v.picklist(POKEDEX_SLUG_VALUES), DEFAULT_POKEDEX_SLUG)` に変更する
- [ ] 6.2 [Impl] 同じく `types` の内部 string 要素を `v.array(v.picklist(TYPE_SLUG_VALUES))` に変更する (空文字 → `[]` 変換ロジックは維持)
- [ ] 6.3 [Test] `packages/contracts/src/schemas/pokemon-query.test.ts` で「unknown pokedex は parse 失敗」「unknown type は parse 失敗」のテストを追加する (既存テストとパターン整合)
- [ ] 6.4 [Impl] `apps/api/src/routes/pokemon.ts` の「unknown pokedex」null check 分岐 (4 行) を削除し、`findPokedexIdBySlug` が null を返した場合の fail-fast (throw 等) に置き換える。`findPokedexIdBySlug` 関数自体は維持する
- [ ] 6.5 [Verify] [Scenario [integration]: 未知の pokedex / type スラッグで 400 を返す] `apps/api/src/routes/pokemon.test.ts` を実行し、既存 Scenario が pass することを確認する (Valibot が生成する 400 でも同 envelope であること)
- [ ] 6.6 [Verify] `pnpm --filter @pokedex/api typecheck` / `lint` / `format:check` / `test` 全 green

## 7. openspec validate と最終 GREEN

- [ ] 7.1 `openspec validate add-shared-pokedex-and-type-enums --strict` を実行し pass することを確認する
- [ ] 7.2 `pnpm -r typecheck` / `pnpm -r lint` / `pnpm -r format:check` をルートで実行し、全 package で green を確認する
- [ ] 7.3 `pnpm -r test` をルートで実行し、`apps/api` / `apps/web` / `packages/contracts` すべてのテストが緑であることを確認する

## 8. セルフレビュー

- [ ] 8.1 .ts ファイル変更がある (`packages/contracts/src/enums/*.ts` 新規 2 件 / `index.ts` 修正 / `pokemon-query.ts` 修正 / `apps/api/src/routes/pokemon.ts` 修正 / 各 test ファイル新規・修正) ため、CLAUDE.md ルールに従い `typescript-reviewer` agent を起動する (`.tsx` 変更は無いため `react-reviewer` は不要)。Critical / Major 指摘は妥当性確認のうえ修正、Minor / Info は情報共有のみ

## 9. リファクタ (任意)

- [ ] 9.1 実装中に発見した重複や命名の改善があれば、緑を保ったままリファクタする。**振る舞いを変える変更は本 change で行わず、別 change として切り出す** (例: `findPokedexIdBySlug` を `getPokedexIdBySlug` に rename して non-nullable 返却にする等は別 change の宿題候補)
