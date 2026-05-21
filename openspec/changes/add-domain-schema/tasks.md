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

- [x] 6.1 [Test] `apps/api/src/db/schema/enums.test.ts` を作成し、`formCategoryEnum.enumValues` が contracts の `FormCategory` と一致することを検証する（colocate 規約に従い `__tests__/` ではなく同階層）
- [x] 6.2 [Test] 同テストに `spriteGenderEnum` / `spriteKindEnum` の値配列も contracts と整合することを検証する
- [x] 6.3 [Impl] `apps/api/src/db/schema/enums.ts` を作成し、`formCategoryEnum` / `spriteGenderEnum` / `spriteKindEnum` の 3 pgEnum を contracts の `FORM_CATEGORY_VALUES` / `SPRITE_GENDER_VALUES` / `SPRITE_KIND_VALUES` 非空タプルから定義して export する。contracts 側に値配列 export を追加して `no-unsafe-type-assertion` 違反を避ける
- [x] 6.4 [Impl] `apps/api/src/db/schema/index.ts` を新規作成し、`enums.js` を re-export する（schema フォルダ初回のエントリポイント。`unicorn/no-empty-file` を回避するため実 export を含む形で生成）
- [x] 6.5 [Refactor] pgEnum 名と TS シンボル名の対応を整え、JSDoc を追記する

## 7. domain-schema: locales lookup テーブル

- [x] 7.1 [Test] `apps/api/src/db/schema/locales.test.ts` を作成し、`getTableName(locales)` で物理名 'locales' を、`locales.code.primary` で PK を、`locales.name.notNull` で NULL 許容を検証する（colocate 規約）
- [x] 7.2 [Test] テスト追加（基本 smoke のみ。contracts の `Locale` 値集合は seed 工程で検証する）
- [x] 7.3 [Impl] `apps/api/src/db/schema/locales.ts` を作成し、`locales`（`code` VARCHAR(16) PK、`name` VARCHAR(64) NULL 許容）を定義する。`LocaleRow` / `NewLocaleRow` を export（contracts の `Locale` ユニオン型と名前衝突を避ける）
- [x] 7.4 [Impl] `apps/api/src/db/schema/index.ts` から `locales.js` を re-export する
- [x] 7.5 [Refactor] 列順序・JSDoc を整える

## 8. domain-schema: types と type_names

- [x] 8.1 [Test] `apps/api/src/db/schema/types.test.ts` を作成し、`types` の物理名・`slug` UNIQUE・型推論を検証する（colocate）
- [x] 8.2 [Test] `type_names` の `(type_id, locale)` UNIQUE を含む列存在検証を追加する
- [ ] 8.3 [Test] `type_names` の `locale` FK 違反 integration テストはセクション 19 後にまとめて実行する（実 DB 接続が必要）
- [x] 8.4 [Impl] `apps/api/src/db/schema/types.ts` を作成し、`types`（`id` PK、`slug` UNIQUE）と `type_names`（`type_id` FK、`locale` FK to `locales.code`、`name` TEXT、`(type_id, locale)` UNIQUE）を定義する。`Type` / `NewType` / `TypeName` 型を export
- [x] 8.5 [Impl] `apps/api/src/db/schema/index.ts` から re-export する
- [x] 8.6 [Refactor] 列順序・JSDoc・型 export を整える

## 9. domain-schema: regions と region_names

- [x] 9.1 [Test] `apps/api/src/db/schema/regions.test.ts` を作成し、`regions` の物理名・`slug` UNIQUE・型推論を検証する
- [x] 9.2 [Test] `region_names` の列存在と FK を期待値として追記する
- [x] 9.3 [Impl] `apps/api/src/db/schema/regions.ts` を作成し、`regions` と `region_names` を定義する
- [x] 9.4 [Impl] `apps/api/src/db/schema/index.ts` から re-export する
- [x] 9.5 [Refactor] 命名・JSDoc を整える

## 10. domain-schema: pokedexes と pokedex_names

- [x] 10.1 [Test] `apps/api/src/db/schema/pokedexes.test.ts` を作成し、`pokedexes` の物理名・`slug` UNIQUE・`region_id` が NULL 許容で `regions(id)` を参照することを検証する
- [ ] 10.2 [Test] integration テスト（national/paldea/kitakami/blueberry の独立性）はセクション 19 後にまとめて実行する
- [x] 10.3 [Test] `pokedex_names` の列存在検証を追記
- [x] 10.4 [Impl] `apps/api/src/db/schema/pokedexes.ts` を作成し、`pokedexes`（`id` PK、`slug` UNIQUE、`region_id` FK NULL 許容）と `pokedex_names`（`(pokedex_id, locale)` UNIQUE）を定義する
- [x] 10.5 [Impl] `apps/api/src/db/schema/index.ts` から re-export する
- [x] 10.6 [Refactor] 命名・JSDoc を整える

## 11. domain-schema: evolution_chains

- [x] 11.1 [Test] `apps/api/src/db/schema/evolution-chains.test.ts` を作成し、`evolution_chains` テーブルが `id` のみの列で定義されることを `getTableColumns()` で検証する
- [x] 11.2 [Impl] `apps/api/src/db/schema/evolution-chains.ts` として分離して `evolutionChains` を定義する
- [x] 11.3 [Impl] `apps/api/src/db/schema/index.ts` から re-export する
- [x] 11.4 [Refactor] JSDoc を整える

## 12. domain-schema: species と species_names

- [x] 12.1 [Test] `apps/api/src/db/schema/species.test.ts` を作成し、`species` の物理名が `'species'` であることを検証する
- [x] 12.2 [Test] 同テストに `species.slug` と `species.national_dex_number` の NOT NULL UNIQUE を `notNull` / `isUnique` で検証する
- [x] 12.3 [Test] 同テストに `species.evolution_chain_id` が NULL 許容 (`.notNull === false`) であることを検証する
- [ ] 12.4 [Test] integration テスト (mew が evolution_chain_id=null で insert 成功) はセクション 19 後にまとめて実行する
- [x] 12.5 [Test] テストファイル内で `species_names` の列存在も検証する
- [x] 12.6 [Test] 同ファイルで `species_evolutions` の物理名・両 FK NOT NULL も検証する
- [x] 12.7 [Impl] `apps/api/src/db/schema/species.ts` を作成し、`species`（`id` PK、`slug` UNIQUE、`national_dex_number` NOT NULL UNIQUE、`evolution_chain_id` **NULL 許容** FK）と `species_names`（`(species_id, locale)` UNIQUE）を定義する。`Species` / `NewSpecies` を export する
- [x] 12.8 [Impl] `apps/api/src/db/schema/index.ts` から re-export する
- [x] 12.9 [Refactor] 列順序・JSDoc・型 export を整える

## 13. domain-schema: species_evolutions

- [x] 13.1 [Test] `species.test.ts` 内で `species_evolutions` の物理名・両 FK NOT NULL を検証する（実装は `species.ts` に同居）
- [x] 13.2 [Test] CHECK 制約 (from <> to) と (from, to) UNIQUE の存在は sql タグから組み立てた expression を smoke で確認
- [ ] 13.3 [Test] CHECK 違反 / UNIQUE 違反の integration テストはセクション 19 後にまとめて実行する
- [x] 13.5 [Impl] `species.ts` 内に `species_evolutions`（`id` PK、`from_species_id` / `to_species_id` FK、`(from, to)` UNIQUE、CHECK `from <> to`）を定義する
- [x] 13.6 [Impl] `apps/api/src/db/schema/index.ts` から re-export する（`species.js` ワイルドカード経由）
- [x] 13.7 [Refactor] 命名・JSDoc・relations() の前準備を整える

## 14. domain-schema: forms と form_names

- [x] 14.1 [Test] `apps/api/src/db/schema/forms.test.ts` を作成し、`forms` の物理名・`(species_id, slug)` UNIQUE・`category` が pgEnum `form_category` 型であることを検証する
- [ ] 14.2 [Test] 未定義 category / `(species_id, slug)` 2 度 insert の integration テストはセクション 19 後に実行
- [x] 14.4 [Test] `form_names` の列存在検証を含める
- [x] 14.5 [Impl] `apps/api/src/db/schema/forms.ts` を作成し、`forms`（`id` PK、`species_id` FK、`slug`、`category` pgEnum）と `form_names`（`(form_id, locale)` UNIQUE）を定義する
- [x] 14.6 [Impl] `apps/api/src/db/schema/index.ts` から re-export する
- [x] 14.7 [Refactor] 列順序・型 export を整える

## 15. domain-schema: form_types（複合 PK と重複禁止）

- [x] 15.1 [Test] `apps/api/src/db/schema/form-types.test.ts` を作成し、物理名と列の NOT NULL を smoke で確認
- [ ] 15.2 [Test] 主キー / UNIQUE / CHECK の振る舞いは生成 SQL 検査と integration テストで（セクション 19 後）
- [x] 15.5 [Impl] `apps/api/src/db/schema/form-types.ts` を作成し、`form_types` を定義する。`primaryKey([form_id, slot])`、`unique(form_id, type_id)`、`check(slot IN (1, 2))` を組み込む
- [x] 15.6 [Impl] `apps/api/src/db/schema/index.ts` から re-export する
- [x] 15.7 [Refactor] 制約定義の置き場所・JSDoc・relations() の前準備を整える

## 16. domain-schema: form_sprites

- [x] 16.1 [Test] `apps/api/src/db/schema/form-sprites.test.ts` を作成し、物理名と列の NOT NULL を smoke で確認
- [ ] 16.2 [Test] (form_id, gender, kind) UNIQUE と pgEnum 違反の振る舞いはセクション 19 後の integration テストで
- [x] 16.4 [Impl] `apps/api/src/db/schema/form-sprites.ts` を作成し、`form_sprites`（`id` PK、`form_id` FK、`gender` pgEnum、`kind` pgEnum、`url` TEXT NOT NULL、`(form_id, gender, kind)` UNIQUE）を定義する
- [x] 16.5 [Impl] `apps/api/src/db/schema/index.ts` から re-export する
- [x] 16.6 [Refactor] 列順序・JSDoc を整える

## 17. domain-schema: pokedex_entries

- [x] 17.1 [Test] `apps/api/src/db/schema/pokedex-entries.test.ts` を作成し、物理名と列の NOT NULL を smoke で確認
- [x] 17.2 [Test] 同テストに `pokedex_entries.form_id` が NULL 許容で `forms(id)` を REFERENCES することを検証する
- [ ] 17.3 [Test] (pokedex_id, pokedex_number) / (pokedex_id, species_id) UNIQUE と form_id 関連の振る舞いはセクション 19 後の integration テストで
- [x] 17.4 [Impl] `apps/api/src/db/schema/pokedex-entries.ts` として分離し、`pokedex_entries`（`id` PK、`pokedex_id` FK、`species_id` FK、`pokedex_number` INTEGER NOT NULL、`form_id` FK to `forms.id` NULL 許容、`(pokedex_id, pokedex_number)` UNIQUE、`(pokedex_id, species_id)` UNIQUE）を定義する
- [x] 17.5 [Impl] `apps/api/src/db/schema/index.ts` から re-export する
- [x] 17.6 [Refactor] 列順序・JSDoc を整える

## 18. domain-schema: relations() と schema/index.ts の最終形

- [x] 18.1 [Test] `apps/api/src/db/schema/relations.test.ts` を作成し、tasks.md セクション 18 で要求される 4 relations の定義 smoke を確認する（drizzle の relations 内部 API は引数依存のため smoke 確認に留め、実利用は後続 change の integration テストで担保する）
- [x] 18.6 [Impl] `evolutionChains` / `species` / `speciesEvolutions` / `forms` に `relations()` 定義を追加し、`*Relations` という名前で export する。残りのテーブルは検索 API change で必要になった時点で追加（YAGNI）
- [x] 18.7 [Impl] `apps/api/src/db/schema/index.ts` から `*Relations` も named export する
- [x] 18.8 [Refactor] export の順序を「enums → lookup → マスタ → 進化 → species → forms → pokedex_entries」に揃える

## 19. domain-schema: マイグレーション SQL の生成と検証

- [x] 19.1 [Test] `apps/api/src/db/__tests__/migrations.test.ts` を作成し、`supabase/migrations/` 配下に SQL ファイルが少なくとも 1 つ存在することを検証する
- [x] 19.2 [Test] 同テストに「生成 SQL に `form_types` の `(form_id, slot)` 複合 PK」「`from_species_id <> to_species_id` CHECK」「`slot IN (1, 2)` CHECK」「`species.evolution_chain_id` が NULL 許容 FK」「`pokedex_entries.form_id` が NULL 許容 FK」「pgEnum form_category / sprite_gender / sprite_kind」のシナリオを追記する
- [x] 19.3 [Impl] `DATABASE_URL=...` 付きで `npx drizzle-kit generate --name add_domain_schema` を実行し、生成 SQL を目視レビューする（16 テーブル / 144 行、意図通り）
- [x] 19.4 [Impl] 生成された `supabase/migrations/0000_add_domain_schema.sql` をコミット対象に追加する（Drizzle Kit 出力を尊重、手書き修正なし）
- [x] 19.5 [Refactor] `supabase db reset` で 16 テーブル全部が適用されることを確認した（Supabase CLI の命名形式と一致）

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
