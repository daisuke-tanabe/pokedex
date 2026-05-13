## 1. リポジトリ設定の準備

- [x] 1.1 `apps/api/package.json` の `scripts` に `seed`（`tsx --env-file=../../.env.development --env-file-if-exists=../../.env.local ./src/db/seed/seed.ts`）と `db:reset`（`supabase db reset && pnpm seed`）を追加する
- [x] 1.2 `apps/api/drizzle.config.ts` の `schema` を `./src/db/schema/index.ts` に更新する（既存の `out: '../../supabase/migrations'` はそのまま維持）
- [x] 1.3 `apps/api/src/db/schema/` ディレクトリを作成する（`index.ts` は最初のスキーマファイル `enums.ts` を作るセクション 6 で内容付きで生成する。lint の `unicorn/no-empty-file` を踏むため、ここでは空ファイルを置かない）
- [x] 1.4 `apps/api/src/db/seed/` と `apps/api/src/db/seed/data/`、`apps/api/src/db/seed/schemas/` ディレクトリを作成する
- [x] 1.5 `pnpm install` を実行し、ワークスペース解決が壊れていないことを確認する

## 2. shared-contracts: FormCategory

- [x] 2.1 [Test] `packages/contracts/src/enums/form-category.test.ts` を作成し、`Object.values(FormCategory)` が 8 値 `['normal', 'regional', 'mega', 'mega-x', 'mega-y', 'gigantamax', 'tera', 'other']` を含むことを検証する（既存 colocate 規約に合わせ `__tests__/` ではなく同階層に置く）
- [x] 2.2 [Test] 同テストに `FormCategory.NORMAL` がリテラル `'normal'` であること、`MEGA_X` がハイフン入りの `'mega-x'` を表すことを検証する
- [x] 2.3 [Test] 同テストに `// @ts-expect-error` で `const x: FormCategory = 'unknown-category'` がエラーになることを示す
- [x] 2.4 [Impl] `packages/contracts/src/enums/form-category.ts` を作成し、`as const` オブジェクト + 型エイリアスで `FormCategory` を export する
- [x] 2.5 [Impl] `packages/contracts/src/index.ts` から `enums/form-category.js` を re-export する
- [x] 2.6 [Refactor] 命名・JSDoc・export 形式の整合を見直す

## 3. shared-contracts: Locale

- [x] 3.1 [Test] `packages/contracts/src/enums/locale.test.ts` を作成し、`Object.values(Locale)` に `'ja'` と `'en'` の 2 値が最低含まれることを検証する
- [x] 3.2 [Test] 同テストに `// @ts-expect-error` で `const l: Locale = 'xx'` がエラーになることを示す
- [x] 3.3 [Impl] `packages/contracts/src/enums/locale.ts` を作成し、`as const` オブジェクト + 型エイリアスで `Locale` を export する。将来 `fr / de / it / es / ko / zh-Hans / zh-Hant` を追加可能な構造にする
- [x] 3.4 [Impl] `packages/contracts/src/index.ts` から `enums/locale.js` を re-export する
- [x] 3.5 [Refactor] 命名・JSDoc を整える

## 4. shared-contracts: SpriteGender / SpriteKind

- [x] 4.1 [Test] `packages/contracts/src/enums/sprite.test.ts` を作成し、`SpriteGender` の値に `'male'` / `'female'` / `'unknown'` の 3 値が含まれることを検証する
- [x] 4.2 [Test] 同テストに `SpriteKind` の値に `'default'` / `'shiny'` / `'back'` / `'back_shiny'` の 4 値が含まれることを検証する
- [x] 4.3 [Test] 同テストに `// @ts-expect-error` で `const g: SpriteGender = 'other'` と `const k: SpriteKind = 'thumbnail'` がそれぞれエラーになることを示す
- [x] 4.4 [Impl] `packages/contracts/src/enums/sprite.ts` を作成し、`SpriteGender` と `SpriteKind` を `as const` オブジェクト + 型エイリアスで export する
- [x] 4.5 [Impl] `packages/contracts/src/index.ts` から `enums/sprite.js` を re-export する
- [x] 4.6 [Refactor] 命名・JSDoc・export 形式を整える

## 5. shared-contracts: 単一エントリポイントからの追加 export

- [x] 5.1 [Test] `packages/contracts/src/index.test.ts` に「`FormCategory` / `Locale` / `SpriteGender` / `SpriteKind` の 4 シンボルが `@pokedex/contracts` から型エラーなく import できる」smoke テストを追記する
- [x] 5.2 [Impl] `packages/contracts/src/index.ts` の re-export 漏れを補完する
- [x] 5.3 [Refactor] export 順序の整理（既存の `envelopeSchema` / 定数 / `ErrorCode` の並びに新 enums を追加）

## 6. domain-schema: pgEnum 定義

- [ ] 6.1 [Test] `apps/api/src/db/schema/__tests__/enums.test.ts` を作成し、Drizzle の `pgEnum` から生成される `form_category` の値配列が contracts の `FormCategory` 値配列と等価になることを検証する（赤、`satisfies` でコンパイル時にも検証）
- [ ] 6.2 [Test] 同テストに `sprite_gender` / `sprite_kind` の値配列も contracts と整合することを検証する（赤）
- [ ] 6.3 [Impl] `apps/api/src/db/schema/enums.ts` を作成し、`formCategoryEnum`、`spriteGenderEnum`、`spriteKindEnum` の 3 pgEnum を contracts の値配列から定義して export する
- [ ] 6.4 [Impl] `apps/api/src/db/schema/index.ts` を新規作成し、`enums.ts` を re-export する（schema フォルダ初回のエントリポイント。空ファイルではなく実 export を含む形で生成して `unicorn/no-empty-file` を回避する）
- [ ] 6.5 [Refactor] pgEnum 名と TS シンボル名の対応を整え、JSDoc を追記する

## 7. domain-schema: locales lookup テーブル

- [ ] 7.1 [Test] `apps/api/src/db/schema/__tests__/locales.test.ts` を作成し、`locales` 物理名・`code` PK・`name` 列定義を検証する（赤）
- [ ] 7.2 [Test] 同テストに「contracts の `Locale` 値集合が `locales` への seed で参照できる前提が満たされる」型チェックを追加する（赤）
- [ ] 7.3 [Impl] `apps/api/src/db/schema/locales.ts` を作成し、`locales`（`code` VARCHAR(16) PK、`name` VARCHAR(64) NULL 許容）を定義する
- [ ] 7.4 [Impl] `apps/api/src/db/schema/index.ts` から `locales.ts` を re-export する
- [ ] 7.5 [Refactor] 列順序・JSDoc を整える

## 8. domain-schema: types と type_names

- [ ] 8.1 [Test] `apps/api/src/db/schema/__tests__/types.test.ts` を作成し、`types` の物理名・`slug` UNIQUE・`Type` 型推論を検証する（赤）
- [ ] 8.2 [Test] `type_names` の `(type_id, locale)` UNIQUE、`locale` の `locales.code` FK を期待値として追記する（赤）
- [ ] 8.3 [Test] `apps/api/src/db/__tests__/type-names.integration.test.ts` を作成し、`locales` に存在しない `locale='xx'` での insert が FK 違反になることを検証する（赤）
- [ ] 8.4 [Impl] `apps/api/src/db/schema/types.ts` を作成し、`types`（`id` PK、`slug` UNIQUE）と `type_names`（`type_id` FK、`locale` FK to `locales.code`、`name` TEXT、`(type_id, locale)` UNIQUE）を定義する。`Type` / `NewType` / `TypeName` 型を export する
- [ ] 8.5 [Impl] `apps/api/src/db/schema/index.ts` から re-export する
- [ ] 8.6 [Refactor] 列順序・JSDoc・型 export を整える

## 9. domain-schema: regions と region_names

- [ ] 9.1 [Test] `apps/api/src/db/schema/__tests__/regions.test.ts` を作成し、`regions` の物理名・`slug` UNIQUE・`Region` 型推論を検証する（赤）
- [ ] 9.2 [Test] `region_names` の `(region_id, locale)` UNIQUE と `locale` の FK を期待値として追記する（赤）
- [ ] 9.3 [Impl] `apps/api/src/db/schema/regions.ts` を作成し、`regions` と `region_names` を定義する
- [ ] 9.4 [Impl] `apps/api/src/db/schema/index.ts` から re-export する
- [ ] 9.5 [Refactor] 命名・JSDoc を整える

## 10. domain-schema: pokedexes と pokedex_names

- [ ] 10.1 [Test] `apps/api/src/db/schema/__tests__/pokedexes.test.ts` を作成し、`pokedexes` の物理名・`slug` UNIQUE・`region_id` が NULL 許容で `regions(id)` を参照することを検証する（赤）
- [ ] 10.2 [Test] `apps/api/src/db/__tests__/pokedexes.integration.test.ts` を作成し、「`(slug='national', region_id=null)` が insert 成功」「`(slug='paldea')`, `(slug='kitakami')`, `(slug='blueberry')` の 3 行が同じ `region_id` でも `slug` が違うため全て insert 成功」のシナリオを書く（赤）
- [ ] 10.3 [Test] `pokedex_names` の `(pokedex_id, locale)` UNIQUE と `locale` FK を期待値として追記する（赤）
- [ ] 10.4 [Impl] `apps/api/src/db/schema/pokedexes.ts` を作成し、`pokedexes`（`id` PK、`slug` UNIQUE、`region_id` FK NULL 許容）と `pokedex_names`（`(pokedex_id, locale)` UNIQUE）を定義する
- [ ] 10.5 [Impl] `apps/api/src/db/schema/index.ts` から re-export する
- [ ] 10.6 [Refactor] 命名・JSDoc を整える

## 11. domain-schema: evolution_chains

- [ ] 11.1 [Test] `apps/api/src/db/schema/__tests__/evolution-chains.test.ts` を作成し、`evolution_chains` テーブルが `id` のみの列で定義されることを検証する（赤）
- [ ] 11.2 [Impl] `apps/api/src/db/schema/species.ts`（次セクションで作成）内に `evolutionChains = pgTable('evolution_chains', { id: serial('id').primaryKey() })` を定義する。または `apps/api/src/db/schema/evolution-chains.ts` として分離（design Decision 6 と整合させる）
- [ ] 11.3 [Impl] `apps/api/src/db/schema/index.ts` から `evolution_chains` を re-export する
- [ ] 11.4 [Refactor] テーブル位置・JSDoc を整える

## 12. domain-schema: species と species_names

- [ ] 12.1 [Test] `apps/api/src/db/schema/__tests__/species.test.ts` を作成し、`species` の物理名が `'species'` であることを検証する（赤）
- [ ] 12.2 [Test] 同テストに `species.slug` と `species.national_dex_number` がそれぞれ UNIQUE 制約を持つことを生成 SQL から検証する（赤）
- [ ] 12.3 [Test] 同テストに `species.evolution_chain_id` が NULL 許容かつ `evolution_chains(id)` を REFERENCES することを検証する（赤）
- [ ] 12.4 [Test] `apps/api/src/db/__tests__/species.integration.test.ts` を作成し、ローカル Supabase に対して `(slug='mew', national_dex_number=151, evolution_chain_id=null)` の行が insert 成功するシナリオを書く（赤）
- [ ] 12.5 [Test] 同テストに `Species` / `NewSpecies` 両型が型エラーなく import できることを `expectTypeOf` で検証する（赤）
- [ ] 12.6 [Test] `species_names` の `(species_id, locale)` UNIQUE と `locale` FK を期待値として追記する（赤）
- [ ] 12.7 [Impl] `apps/api/src/db/schema/species.ts` を作成し、`species`（`id` PK、`slug` UNIQUE、`national_dex_number` NOT NULL UNIQUE、`evolution_chain_id` **NULL 許容** FK）と `species_names`（`(species_id, locale)` UNIQUE）を定義する。`Species` / `NewSpecies` を export する
- [ ] 12.8 [Impl] `apps/api/src/db/schema/index.ts` から re-export する
- [ ] 12.9 [Refactor] 列順序・JSDoc・型 export を整える

## 13. domain-schema: species_evolutions

- [ ] 13.1 [Test] `apps/api/src/db/schema/__tests__/species-evolutions.test.ts` を作成し、生成 SQL 中に `species_evolutions` の `from_species_id <> to_species_id` CHECK 制約が含まれることを検証する（赤）
- [ ] 13.2 [Test] 同テストに `(from_species_id, to_species_id)` UNIQUE 制約が含まれることを検証する（赤）
- [ ] 13.3 [Test] `apps/api/src/db/__tests__/species-evolutions.integration.test.ts` を作成し、ローカル Supabase に対して self 進化行（`from = to`）を insert すると CHECK 違反エラーになることを検証する（赤）
- [ ] 13.4 [Test] 同統合テストに「同一 `(from, to)` の 2 度 insert で UNIQUE 違反になる」「通常進化（フシギダネ→フシギソウ）は成功する」シナリオを追記する（赤）
- [ ] 13.5 [Impl] `species.ts`（または `species-evolutions.ts` に分離）に `species_evolutions`（`id` PK、`from_species_id` / `to_species_id` FK、`(from, to)` UNIQUE、CHECK `from <> to`）を定義する
- [ ] 13.6 [Impl] `apps/api/src/db/schema/index.ts` から re-export する
- [ ] 13.7 [Refactor] 命名・JSDoc・relations() の前準備を整える

## 14. domain-schema: forms と form_names

- [ ] 14.1 [Test] `apps/api/src/db/schema/__tests__/forms.test.ts` を作成し、`forms` の物理名・`(species_id, slug)` UNIQUE・`category` が pgEnum `form_category` 型であることを検証する（赤）
- [ ] 14.2 [Test] `apps/api/src/db/__tests__/forms.integration.test.ts` を作成し、ローカル Supabase に対して未定義 category（`'unknown-form'`）を insert すると pgEnum エラーになることを検証する（赤）
- [ ] 14.3 [Test] 同統合テストに「`(species_id, slug)` の 2 度 insert で UNIQUE 違反になる」「8 つの正常な category 値はすべて insert できる」シナリオを追記する（赤）
- [ ] 14.4 [Test] `form_names` の `(form_id, locale)` UNIQUE と `locale` FK を期待値として追記する（赤）
- [ ] 14.5 [Impl] `apps/api/src/db/schema/forms.ts` を作成し、`forms`（`id` PK、`species_id` FK、`slug`、`category` pgEnum）と `form_names`（`(form_id, locale)` UNIQUE）を定義する
- [ ] 14.6 [Impl] `apps/api/src/db/schema/index.ts` から re-export する
- [ ] 14.7 [Refactor] 列順序・型 export を整える

## 15. domain-schema: form_types（複合 PK と重複禁止）

- [ ] 15.1 [Test] `apps/api/src/db/schema/__tests__/form-types.test.ts` を作成し、`form_types` の主キーが `(form_id, slot)` の複合キーであることを生成 SQL から検証する（赤）
- [ ] 15.2 [Test] 同テストに `(form_id, type_id)` UNIQUE 制約が含まれることを検証する（赤）
- [ ] 15.3 [Test] 同テストに `slot` の CHECK 制約（`1` または `2`）が含まれることを検証する（赤）
- [ ] 15.4 [Test] `apps/api/src/db/__tests__/form-types.integration.test.ts` を作成し、「同じ `(form_id, slot)` を 2 度 insert で PK 違反」「同じ `(form_id, type_id)` を異なる slot で 2 行 insert で UNIQUE 違反」「`slot=3` の insert で CHECK 違反」「単タイプ（slot=1 のみ）で成功」「複合タイプ（slot=1, slot=2）で両方成功」のシナリオを書く（赤）
- [ ] 15.5 [Impl] `apps/api/src/db/schema/form-types.ts` を作成し、`form_types` を定義する。`primaryKey: [form_id, slot]`、`unique: (form_id, type_id)`、`check: slot IN (1, 2)` を組み込む
- [ ] 15.6 [Impl] `apps/api/src/db/schema/index.ts` から re-export する
- [ ] 15.7 [Refactor] 制約定義の置き場所・JSDoc・relations() の前準備を整える

## 16. domain-schema: form_sprites

- [ ] 16.1 [Test] `apps/api/src/db/schema/__tests__/form-sprites.test.ts` を作成し、`form_sprites` の `(form_id, gender, kind)` UNIQUE 制約が生成 SQL に含まれることを検証する（赤）
- [ ] 16.2 [Test] 同テストに `gender` が pgEnum `sprite_gender`、`kind` が pgEnum `sprite_kind` であることを検証する（赤）
- [ ] 16.3 [Test] `apps/api/src/db/__tests__/form-sprites.integration.test.ts` を作成し、「同じ `(form_id, gender, kind)` の 2 度 insert で UNIQUE 違反」「異なる gender なら同じ form_id, kind で両方 insert できる」「未定義 gender / kind 値で pgEnum エラー」のシナリオを書く（赤）
- [ ] 16.4 [Impl] `apps/api/src/db/schema/form-sprites.ts` を作成し、`form_sprites`（`id` PK、`form_id` FK、`gender` pgEnum、`kind` pgEnum、`url` TEXT NOT NULL、`(form_id, gender, kind)` UNIQUE）を定義する
- [ ] 16.5 [Impl] `apps/api/src/db/schema/index.ts` から re-export する
- [ ] 16.6 [Refactor] 列順序・JSDoc を整える

## 17. domain-schema: pokedex_entries

- [ ] 17.1 [Test] `apps/api/src/db/schema/__tests__/pokedex-entries.test.ts` を作成し、`(pokedex_id, pokedex_number)` UNIQUE と `(pokedex_id, species_id)` UNIQUE が生成 SQL に含まれることを検証する（赤）
- [ ] 17.2 [Test] 同テストに `pokedex_entries.form_id` が NULL 許容で `forms(id)` を REFERENCES することを検証する（赤）
- [ ] 17.3 [Test] `apps/api/src/db/__tests__/pokedex-entries.integration.test.ts` を作成し、「同じ `(pokedex_id, pokedex_number)` の 2 度 insert で UNIQUE 違反」「同じ `(pokedex_id, species_id)` の 2 度 insert で UNIQUE 違反」「別 `pokedex_id` なら同じ `species_id` で両方成功」「`form_id=null` で insert 成功」「`form_id=ogerpon_teal_id` のような form 指定 insert 成功」のシナリオを書く（赤）
- [ ] 17.4 [Impl] `apps/api/src/db/schema/pokedexes.ts` の同ファイル内、あるいは `pokedex-entries.ts` として分離し、`pokedex_entries`（`id` PK、`pokedex_id` FK、`species_id` FK、`pokedex_number` INTEGER NOT NULL、`form_id` FK to `forms.id` NULL 許容、`(pokedex_id, pokedex_number)` UNIQUE、`(pokedex_id, species_id)` UNIQUE）を定義する
- [ ] 17.5 [Impl] `apps/api/src/db/schema/index.ts` から re-export する
- [ ] 17.6 [Refactor] 列順序・JSDoc を整える

## 18. domain-schema: relations() と schema/index.ts の最終形

- [ ] 18.1 [Test] `apps/api/src/db/schema/__tests__/relations.test.ts` を作成し、`speciesRelations` に `forms`（`forms` への 1:N）と `evolutionChain`（`evolution_chains` への N:1）のキーが含まれることを検証する（赤）
- [ ] 18.2 [Test] 同テストに `formsRelations` に `types`（`form_types` 経由）と `sprites`（`form_sprites` への 1:N）の両方が含まれることを検証する（赤）
- [ ] 18.3 [Test] 同テストに `speciesEvolutionsRelations` に `from` と `to` の 2 関連が含まれることを検証する（赤）
- [ ] 18.4 [Test] 同テストに `evolutionChainsRelations` に `species`（`species` への 1:N）のキーが含まれることを検証する（赤）
- [ ] 18.5 [Test] `apps/api/src/db/schema/__tests__/index.test.ts` を作成し、`import { locales, types, regions, pokedexes, evolutionChains, species, speciesEvolutions, forms, formTypes, formSprites, pokedexEntries } from './db/schema'` が型エラーなく解決されることを smoke テストする（赤）
- [ ] 18.6 [Impl] 各スキーマファイルに `relations()` 定義を追加し、`*Relations` という名前で export する
- [ ] 18.7 [Impl] `apps/api/src/db/schema/index.ts` から全テーブル・全 `*Relations`・全型を re-export する
- [ ] 18.8 [Refactor] export の順序を「enums → locales → 親テーブル → 子テーブル → relations」に揃え、JSDoc を追記する

## 19. domain-schema: マイグレーション SQL の生成と検証

- [ ] 19.1 [Test] `apps/api/src/db/__tests__/migrations.test.ts` を作成し、`supabase/migrations/` 配下に `YYYYMMDDHHMMSS_*.sql` パターンの SQL ファイルが少なくとも 1 つ存在することを検証する（赤、まだ実行前）
- [ ] 19.2 [Test] 同テストに「生成 SQL に `form_types` の主キーが `(form_id, slot)` の複合キーで定義されている」「`from_species_id <> to_species_id` の CHECK 制約が含まれる」「`species.evolution_chain_id` が NULL 許容 FK である」「`pokedex_entries.form_id` が NULL 許容 FK である」シナリオを追記する（赤）
- [ ] 19.3 [Impl] `pnpm --filter @pokedex/api drizzle-kit generate --name add_domain_schema` を実行し、生成 SQL を目視レビューする
- [ ] 19.4 [Impl] 生成された SQL をコミット対象に追加する（手書き修正は最小限、Drizzle Kit 出力を尊重）
- [ ] 19.5 [Refactor] ファイル名・タイムスタンプが Supabase CLI の期待形式と一致するか `supabase db reset` で確認する

## 20. domain-seed: locales / types / regions / pokedexes JSON

- [ ] 20.1 [Test] `apps/api/src/db/seed/__tests__/load-locales.test.ts` を作成し、`locales.json` を valibot スキーマでパースでき、`code` 集合が contracts の `Locale` と一致することを検証する（赤）
- [ ] 20.2 [Test] `load-types.test.ts` / `load-regions.test.ts` / `load-pokedexes.test.ts` を作成し、それぞれのパース可能性テストを追加する（赤）
- [ ] 20.3 [Impl] `apps/api/src/db/seed/data/locales.json` を作成し、最低 `{ "code": "ja", "name": "日本語" }`, `{ "code": "en", "name": "English" }` の 2 行を記述する
- [ ] 20.4 [Impl] `apps/api/src/db/seed/data/types.json` を作成し、18 タイプ（normal / fire / water / electric / ... / fairy）の `slug` + `names`（ja / en）を記述する
- [ ] 20.5 [Impl] `apps/api/src/db/seed/data/regions.json` を作成し、地方（kanto / johto / ... / paldea / kitakami / blueberry）を記述する
- [ ] 20.6 [Impl] `apps/api/src/db/seed/data/pokedexes.json` を作成し、`national`（region_id=null）/ `paldea` / `kitakami` / `blueberry` 等を別行で記述する
- [ ] 20.7 [Impl] `apps/api/src/db/seed/schemas/` 配下に各 JSON 用の valibot スキーマを定義する
- [ ] 20.8 [Refactor] スキーマ命名・export 形式を contracts と整合させる

## 21. domain-seed: species JSON

- [ ] 21.1 [Test] `apps/api/src/db/seed/__tests__/load-species.test.ts` を作成し、`species.json` を valibot スキーマでパースできることを検証する（赤）
- [ ] 21.2 [Test] 同テストに `national_dex_number` が 1 始まりの連番（重複なし）であることを検証する（赤）
- [ ] 21.3 [Test] 同テストに「進化系統に属する species は `evolution_chain_key` を持つ」「同一進化系統の species は同じ `evolution_chain_key` を共有する」「進化しない種族は `evolution_chain_key` を省略できる（任意フィールド）」シナリオを追加する（赤）
- [ ] 21.4 [Impl] `apps/api/src/db/seed/data/species.json` を作成し、最低限第 1 〜 第 9 世代の代表 species を含む配列を記述する（カントー御三家 + ピカチュウ + ロトム + アルセウス + シルヴァディ + アンノーン + ジガルデ + ネクロズマ + ザシアン + ザマゼンタ + グラードン + カイオーガ + テラパゴス + オーガポン + ミュウ（進化しない species 代表）を最低カバー）。各エントリは `slug` / `national_dex_number` / `names` を持ち、進化系統に属する species のみ `evolution_chain_key` を持つ
- [ ] 21.5 [Impl] valibot スキーマで `(slug, national_dex_number)` を必須・`evolution_chain_key` を任意フィールドとして定義する
- [ ] 21.6 [Refactor] JSON の整形・ソート規約を README に追記する

## 22. domain-seed: forms JSON（100+ フォーム）

- [ ] 22.1 [Test] `apps/api/src/db/seed/__tests__/load-forms.test.ts` を作成し、`forms.json` を valibot スキーマでパースできることを検証する（赤）
- [ ] 22.2 [Test] 同テストに「`forms.json` のエントリ数が 100 以上である」「`species_slug = 'ogerpon'` で 4 件以上のエントリが含まれる」「`species_slug = 'unown'` で 28 件のエントリが含まれる」シナリオを追記する（赤）
- [ ] 22.3 [Test] 同テストに「`sprites[].url` が空文字でない（placeholder 文字列を許容）」シナリオを追記する（赤）
- [ ] 22.4 [Impl] `apps/api/src/db/seed/data/forms.json` を作成し、Decision で挙げた特殊フォームを全部含む 100+ エントリを記述する。各エントリは `species_slug` / `slug` / `category` / `types[]` / `sprites[]` / `names[]` を持つ。`sprites[].url` は placeholder 文字列（`'placeholder/<species_slug>/<form_slug>/<gender>/<kind>.png'` パターン）で構わない
- [ ] 22.5 [Impl] valibot スキーマで `FormCategory` / `SpriteGender` / `SpriteKind` / `Locale` の制約と `sprites[].url` の非空チェックを組み込む
- [ ] 22.6 [Refactor] JSON の整形ルール・ソート（species_slug → slug の順）を README に追記する。スプライト画像の実投入は後続 `add-sprite-assets` change で扱う旨も追記する

## 23. domain-seed: seed.ts スクリプト

- [ ] 23.1 [Test] `apps/api/src/db/seed/__tests__/seed.test.ts` を作成し、テスト用に空 DB に対して `seed()` 関数を呼ぶと終了コード `0` 相当で完了することを検証する（赤）
- [ ] 23.2 [Test] 同テストに「`forms.json` の 1 エントリから `category` キーを削除した状態で `seed()` を呼ぶと例外を投げる」シナリオを追記する（赤、モックされた JSON 入力で）
- [ ] 23.3 [Impl] `apps/api/src/db/seed/seed.ts` を作成し、以下の手順を実装する: (1) JSON ファイル群を valibot パース、(2) `locales` → `types` → `regions` → `pokedexes` → `evolution_chains` → `species` を順に insert、(3) `species_names` → `species_evolutions` → `forms` → `form_*` → `pokedex_entries` → `type_names` → `region_names` → `pokedex_names` を順に insert、(4) Invariant Tests を呼ぶ、(5) 失敗時は終了コード `1`
- [ ] 23.4 [Impl] `evolution_chains` の insert は `species.json` 内に **存在する** `evolution_chain_key` の一意集合から自動生成する（`evolution_chain_key` を持たない species は NULL のまま投入）
- [ ] 23.5 [Impl] `apps/api/src/db/seed/invariants.ts` を作成し、Invariant Tests から呼ばれる検証関数を export する（テストロジックの本体）
- [ ] 23.6 [Refactor] insert を `db.transaction()` で囲み、途中失敗時にロールバックする
- [ ] 23.7 [Refactor] エラーメッセージ・進捗ログを「ja 開発者が読みやすい」形に整える

## 24. domain-seed: invariants.test.ts による不変条件検証

- [ ] 24.1 [Test] `apps/api/src/db/seed/invariants.test.ts` を作成し、シード適用後の DB に対して「`species.national_dex_number` が `pokedexes.slug = 'national'` の `pokedex_entries.pokedex_number` と一致する」シナリオを書く（赤）
- [ ] 24.2 [Test] 同テストに「全 `forms` に `form_types` が 1 行以上存在する」シナリオを追記する（赤）
- [ ] 24.3 [Test] 同テストに「全 `forms` に `form_sprites` が 1 行以上存在する」シナリオを追記する（赤）
- [ ] 24.4 [Test] 同テストに「全 `forms` に `form_names(locale='ja')` が存在する」シナリオを追記する（赤）
- [ ] 24.5 [Test] 同テストに「`pokedex_entries` で `(pokedex_id, pokedex_number)` および `(pokedex_id, species_id)` がいずれも重複していない」シナリオを追記する（赤）
- [ ] 24.6 [Test] 同テストに「`species_evolutions` に `from_species_id = to_species_id` の行が存在しない」シナリオを追記する（赤）
- [ ] 24.7 [Test] 同テストに「`species_evolutions` に登場する species は非 NULL の `evolution_chain_id` を持つ」「`species_evolutions` の両端が同じ `evolution_chain_id` を共有する」シナリオを追記する（赤）
- [ ] 24.8 [Test] 同テストに「`form_types` で `(form_id, slot)` および `(form_id, type_id)` がいずれも重複していない」シナリオを追記する（赤）
- [ ] 24.9 [Test] 同テストに「`pokedex_entries.form_id` が非 NULL の場合、その form の `species_id` が `pokedex_entries.species_id` と一致する」シナリオを追記する（赤）
- [ ] 24.10 [Impl] 23.5 の `invariants.ts` を上記シナリオを満たす形に実装する。各検証関数は違反行のサンプルを含むエラーメッセージを返す
- [ ] 24.11 [Refactor] 検証ロジックの並べ替え（親テーブル → 子テーブル順）と共通ヘルパー（`countByGroup` 等）の抽出

## 25. domain-seed: db:reset コマンドの確認

- [ ] 25.1 [Test] `apps/api/package.json` の `scripts.db:reset` が `supabase db reset && pnpm seed` を呼ぶ形になっていることを smoke テスト or 手動検証する（タスク 1.1 で配置済み）
- [ ] 25.2 [Test] 手動: `pnpm --filter @pokedex/api db:reset` を実行し、マイグレーション → シード → Invariant Tests がすべて成功して終了コード `0` で終わることを確認する
- [ ] 25.3 [Impl] 失敗時のエラーメッセージや exit code 伝搬を改善する（必要に応じて `set -e` 相当の挙動を保証する）
- [ ] 25.4 [Refactor] README または `docs/setup.md` に `db:reset` 手順と前提（`supabase start` 起動済み）を追記する

## 26. 最終動作確認とドキュメント

- [ ] 26.1 `pnpm typecheck` を全 workspace で実行し、型エラーがゼロであることを確認する
- [ ] 26.2 `pnpm lint` / `pnpm format:check` を全 workspace で実行し、違反ゼロであることを確認する
- [ ] 26.3 `pnpm test` を全 workspace で実行し、本 change で追加した全テストが成功することを確認する
- [ ] 26.4 `pnpm --filter @pokedex/api db:reset` を実行し、マイグレーション + シード + Invariant Tests が一連で成功することを確認する
- [ ] 26.5 README または `docs/setup.md` に「ローカル開発で DB を再構築する手順」と「シード JSON の追加方法」「新言語追加の手順（contracts の `Locale` + `locales.json` + 各 `*_names.json`）」を追記する
- [ ] 26.6 セルフレビュー: `typescript-reviewer` Agent を起動して `.ts` 変更分をレビューし、Critical/Major 指摘があれば修正する
- [ ] 26.7 セルフレビュー: 設計判断（命名規約・複合 PK・evolution_chain 二段構え・locales lookup）が design.md と齟齬なく実装されているか確認する
