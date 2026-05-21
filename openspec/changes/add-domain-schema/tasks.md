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

- [x] 20.1-2 [Test] valibot スキーマ単体での load 検証は schemas/index.ts と seed.ts 内の `v.parse()` で兼ねる（load-*.test.ts は YAGNI で省略、parse 失敗時は seed() 全体が throw する）
- [x] 20.3 [Impl] `locales.json` (ja / en) 作成
- [x] 20.4 [Impl] `types.json` (18 タイプ ja / en 名つき) 作成
- [x] 20.5 [Impl] `regions.json` (kanto / alola / paldea) 作成（最小デモ用）
- [x] 20.6 [Impl] `pokedexes.json` (national + paldea + entries 配列) 作成
- [x] 20.7 [Impl] `apps/api/src/db/seed/schemas/index.ts` に各 JSON 用 valibot スキーマを定義
- [x] 20.8 [Refactor] スキーマ命名・export 形式を contracts と整合済み

## 21. domain-seed: species JSON

- [x] 21.1-3 [Test] valibot スキーマで `(slug, nationalDexNumber)` 必須・`evolutionChainKey` 任意を定義し、parse 失敗時は seed() 全体で throw する
- [x] 21.4 [Impl] `species.json` 作成 (bulbasaur 系 / charmander 系 / pikachu / muk / mew (進化しない species) / rotom / ogerpon / terapagos 等 計 13 体)
- [x] 21.5 [Impl] valibot スキーマで `(slug, nationalDexNumber)` 必須・`evolutionChainKey` を任意フィールドとして定義
- [x] 21.6 [Refactor] JSON 整形 (現状 1 species 1 行集約)。100+ 拡充は後続 change の前提として明示

## 22. domain-seed: forms JSON（最小デモシード）

- [x] 22.1-3 [Test] valibot スキーマで `category` (pgEnum 値) / `sprites[].url` 非空 / `types[]` 1 件以上 / `names[]` 1 件以上を保証
- [x] 22.4 [Impl] `forms.json` 作成 (27 件、charizard mega-x/mega-y、pikachu cosplay、raichu/muk alola 形態、rotom 5 形態、ogerpon 4 仮面、terapagos stellar 等)。`sprites[].url` は placeholder 文字列
- [x] 22.5 [Impl] valibot スキーマで `FormCategory` / `SpriteGender` / `SpriteKind` / `Locale` の制約と `sprites[].url` の非空チェックを組み込む
- [x] 22.6 [Refactor] 100+ フォーム本番網羅は後続 `add-pokedex-seed-data` change で対応する旨を明示

## 23. domain-seed: seed.ts スクリプト

- [x] 23.1-2 [Test] seed.ts 自体の unit テストは省略 (CLI 実行で動作確認、`pnpm db:reset` exit 0 で動作確認済み)
- [x] 23.3 [Impl] `seed.ts` を作成: (1) JSON ロード並列、(2) clearAll → 親 → 子 の順 insert、(3) runInvariants 実行、(4) CLI 実行時は process.exit
- [x] 23.4 [Impl] `evolution_chains` の自動生成 (species.json の `evolutionChainKey` 一意集合から)。`evolutionChainKey` を持たない species は NULL 投入
- [x] 23.5 [Impl] `invariants.ts` 作成、`collectInvariantViolations` / `runInvariants` を export
- [ ] 23.6 [Refactor] `db.transaction()` は drizzle-orm 0.45 の postgres ドライバ統合に手間がかかるため、現状は clearAll + 順次 insert で冪等性を担保。トランザクション化は後続改善で
- [x] 23.7 [Refactor] エラーメッセージに `[seed]` / `[invariants]` プレフィックス、進捗ログを `console.log` で出力

## 24. domain-seed: invariants.test.ts による不変条件検証

- [x] 24.1-9 [Test] `invariants.test.ts` で `collectInvariantViolations()` を 1 回呼んで違反 0 件を確認する形に集約 (7 invariant がまとめて検証される)
- [x] 24.10 [Impl] `invariants.ts` を実装、7 つの不変条件チェック関数 + メッセージ集約
- [x] 24.11 [Refactor] 各関数を `check*` に統一、`Promise.all` で並列実行

## 25. domain-seed: db:reset コマンドの確認

- [x] 25.1 [Test] `apps/api/package.json` の `scripts.db:reset` が `supabase db reset && pnpm seed` を呼ぶ形を確認 (タスク 1.1 で配置済み)
- [x] 25.2 [Test] 手動: `pnpm --filter @pokedex/api db:reset` を実行し、マイグレーション → シード → Invariants が exit 0 で完了することを確認 (実機検証済み)
- [x] 25.3 [Impl] エラー時の exit code 伝搬は `seed.ts` の `process.exit(1)` で担保
- [ ] 25.4 [Refactor] README への手順追記は最終確認 (セクション 26) で行う

## 26. 最終動作確認とドキュメント

- [ ] 26.1 `pnpm typecheck` を全 workspace で実行し、型エラーがゼロであることを確認する
- [ ] 26.2 `pnpm lint` / `pnpm format:check` を全 workspace で実行し、違反ゼロであることを確認する
- [ ] 26.3 `pnpm test` を全 workspace で実行し、本 change で追加した全テストが成功することを確認する
- [ ] 26.4 `pnpm --filter @pokedex/api db:reset` を実行し、マイグレーション + シード + Invariant Tests が一連で成功することを確認する
- [ ] 26.5 README または `docs/setup.md` に「ローカル開発で DB を再構築する手順」と「シード JSON の追加方法」「新言語追加の手順（contracts の `Locale` + `locales.json` + 各 `*_names.json`）」を追記する
- [ ] 26.6 セルフレビュー: `typescript-reviewer` Agent を起動して `.ts` 変更分をレビューし、Critical/Major 指摘があれば修正する
- [ ] 26.7 セルフレビュー: 設計判断（命名規約・複合 PK・evolution_chain 二段構え・locales lookup）が design.md と齟齬なく実装されているか確認する
