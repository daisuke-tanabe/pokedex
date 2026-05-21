## Context

`add-monorepo-foundation` で API サーバ・DB クライアント（`drizzle(postgres(...))`）・共有契約・Supabase ローカルスタックは完成している。本 change では「ポケモンの多様性を網羅的に表現する」という本プロジェクトの目的に合わせ、種族 (`species`) と種族のフォーム (`forms`) を中心とした二段構造の DB スキーマを Drizzle ORM で定義する。

本プロジェクトは個人開発だが、Claude Code を利用する複数メンバーで運用される前提のリポジトリであり、命名規約・不変条件・シード手順はチーム全体で再現可能な形で固める必要がある。

事前の `/opsx:explore` と追加調査で次のドメイン境界が確定している:

- フォームは汎用 + 種特有を **混在** で `forms` に登録し、`category` 列で normal / regional / mega / mega-x / mega-y / gigantamax / tera / other を区別する
- フォーム行数は 100+ になるが許容範囲
- 進化チェーンは **二段構え**: `evolution_chains` テーブルで系統をグルーピング、`species_evolutions` テーブルで直接の対応関係を表現する。進化条件（レベル/道具/通信交換等）は今回持たず、後で拡張可能にしておく
- テラスタルは **特殊テラ種のみ** `forms` を作る（テラパゴス、オーガポンの仮面別テラなど）
- 性別差は `form_sprites.gender` の画像差分のみで表現する。タイプ・わざ・特性の性別差は本アプリのスコープ外
- 任意テラスタル / わざ / 特性 / 種族値 / 図鑑説明文 / 進化条件は **スコープ外**（後続 change で追加可能な余地は残す）

旧リポジトリ仕様の `TypeEntry` は FK が二重に振られていて、同じスロットに 2 タイプ・同じタイプを 2 重に持つ両方を許す地雷だった。本設計ではこれを **`form_types` の `(form_id, slot)` 複合主キー + `(form_id, type_id)` UNIQUE 制約** で潰す。

## Goals / Non-Goals

**Goals:**

- 種族 (`species`) と種族のフォーム (`forms`) を中心とした二段構造の DB スキーマを定義する
- 進化チェーンを `evolution_chains` + `species_evolutions` の二段構えで表現し、同系統取得を 1 クエリで完結させる
- パルデア / キタカミ / ブルーベリー のような独立番号体系を持つ図鑑は別 `pokedexes` 行として表現し、`region_id` で地方を区別する
- 命名規約（物理名 snake_case + 複数形 / TS シンボル camelCase / TS 型 PascalCase + 単数形）を全テーブルで徹底する
- 中間テーブルの命名ルール（属性持ち = ドメイン名 / 属性ゼロ = `<a>_<b>` 両方複数形・アルファベット順 / 自己参照 = 関係名）を design.md で明文化する
- 同一フォームに同一スロットが 2 行存在しない / 同一タイプが 2 行存在しない / 同一図鑑で同一番号が 2 行存在しない / 同一図鑑に同一 species が 2 行存在しない / 自己進化（from == to）がない / 進化両端が同一チェーンに属する という不変条件を DB 制約と vitest テストの両方で担保する
- `drizzle-kit generate` を初めて走らせ、`supabase/migrations/` 配下に Supabase CLI が認識する形式の SQL マイグレーションが 1 ファイル生成される
- `supabase db reset` を実行すると、マイグレーション → シード → 不変条件チェックまで一連で通る
- 最小シード（フォーム 100+ を含む代表データ）と JSON 投入スクリプトを整備する
- `packages/contracts` にドメイン分類値（`FormCategory` / `Locale` / `SpriteGender` / `SpriteKind`）を追加し、Drizzle スキーマ・シード JSON・API レスポンスで参照を一元化する

**Non-Goals:**

- 検索エンドポイント（`GET /pokemon` 等）の追加 → `add-search-api`
- マスタ取得エンドポイント → `add-search-api`
- Web / Mobile の実装 → `add-web-listing` / `add-mobile-listing`
- 任意テラスタル（通常ポケモンの任意 1 タイプテラ化）
- わざ・特性・種族値・図鑑説明文（Flavor text）
- 進化条件（レベル/道具/友好度/通信交換等のトリガー詳細）
- Storage クライアント（`@supabase/supabase-js`）の wiring と画像 URL 解決ロジック（Web 側の change）
- RLS / Auth ポリシー（本プロダクトで未使用）
- 本番デプロイ・CI 構成

## Decisions

### Decision 1: ドメイン名の選択 — `species` と `forms`

「ポケモンの種族」と「種族のフォーム」を明確に分離するため、種族エンティティを `species`、フォームエンティティを `forms` と命名する。

- `species` テーブル: `national_dex_number` を持つ単位（ピカチュウ、フシギダネ、ロトム など 1 種族 1 行）
- `forms` テーブル: 種族のフォーム実体（コスプレピカチュウ、ロトム-ヒート、アローラベトベター など複数行になり得る）

**理由**:

- 英語 "pokemon" は単複同形で `pokemons` は文法・意味の両面で違和感がある
- PokeAPI も `pokemon-species` と `pokemon-form` を分けるドメインモデルを採用しており、本アプリの「種族 + フォーム」の二段構造と素直に対応する
- 子テーブル `form_types` / `form_sprites` / `form_names` の "form_" prefix とも整合する
- API レイヤ（後続 change）では `pokemon` という語彙を使うが、DB スキーマでは意味で選ぶ。レスポンス組み立て層で species → pokemon にマップする

**代替案と却下理由**:

- **`pokemons` + `form_entries`**: アプリ語彙との連続性は取れるが、意味不明な複数形と冗長な "entries" が残る
- **`pokemon` + `pokemon_forms`** (単数形): 命名規約「snake_case + 複数形」を全テーブルに適用する規約を崩す

### Decision 2: 命名規約

物理名 / TS シンボル / TS 型の対応は以下に固定する:

| 種別      | DB 物理                  | TS スキーマ変数            | TS 型                        |
| --------- | ------------------------ | -------------------------- | ---------------------------- |
| テーブル  | snake_case + 複数形      | camelCase + 複数形         | PascalCase + 単数形          |
| カラム    | snake_case               | camelCase                  | -                            |

例:

```typescript
export const species = pgTable('species', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 64 }).notNull().unique(),
  nationalDexNumber: integer('national_dex_number').notNull().unique(),
  // 進化しない種族は NULL。進化系統に属する種族のみ非 NULL を持つ
  evolutionChainId: integer('evolution_chain_id').references(() => evolutionChains.id),
})

export type Species = typeof species.$inferSelect
export type NewSpecies = typeof species.$inferInsert
```

注: `species` は単複同形なので、TS シンボル名も `species`、TS 型名も `Species` で問題ない（`Specieses` のような無理な複数形にしない）。

**理由**: PG 慣習（snake_case + 複数形）と JS/TS 慣習（camelCase / PascalCase）の両方を尊重する Drizzle の典型パターン。物理名を文字列リテラルで明示することで、後から TS 側のシンボル名だけ変えても DB 物理名が破壊されない。

### Decision 3: 中間テーブルの命名ルール

1. **属性が 1 つでも乗るならドメイン名で命名**
   - `pokedex_entries`（× `pokedex_species`）: `pokedex_number` を持つ
   - `form_types`（× `forms_types`）: `slot` を持つ
   - `form_sprites`: `gender`, `kind`, `url` を持つ
   - `species_evolutions`: 自己参照、後で `trigger` 拡張余地
   - `species_names` / `form_names` / `type_names` / `region_names` / `pokedex_names`: `locale` を持つ多言語名
2. **純粋な多対多（属性ゼロ）は `<a>_<b>` 両方複数形・アルファベット順**
   - 本スコープでは未出現だが、フォールバック規約として固定する
3. **自己参照は関係名で命名 + FK は方向を持つ名前**
   - `species_evolutions`（× `species_species`）
   - FK: `from_species_id`, `to_species_id`

**理由**: 中間テーブルに属性が 1 つでも乗ると、それは「関係そのもの」ではなく「関係に付随するエンティティ」になる。エンティティならドメイン名を持つべき。後から属性が追加される際に名前変更のマイグレーションが必要にならない。

### Decision 4: テーブル一覧と関係

```
locales  ←─── (FK locale 経由で *_names が参照)
   │
   ▼
species_names    type_names    region_names    pokedex_names    form_names
   │                │              │                │              │
   ▼                ▼              ▼                ▼              ▼
species ───────────────────────────────────────────────────── forms
 │  │                                                          │  │
 │  ├─→ evolution_chains                                      │  ├─→ form_types ───→ types
 │  │                                                          │  │   (form_id, slot) PK
 │  └─→ species_evolutions (from_species_id, to_species_id)   │  │   (form_id, type_id) UNIQUE
 │      └──────────────── self ref                            │  └─→ form_sprites
 │                                                            │      (form_id, gender, kind) UNIQUE
 │                                                            │
 ▼                                                            │
pokedex_entries ──→ pokedexes ──→ regions                     │
 (pokedex_id, pokedex_number) UNIQUE                          │
 (pokedex_id, species_id) UNIQUE                              │
 form_id (FK to forms, NULL 許容) ──────────────────→ forms ──┘
```

- `species` の自然キー候補: `slug`（一意）。`national_dex_number` も独立カラムで保持し、`pokedex_entries` の national 図鑑行と一致することをシード時に検証する
- `species.evolution_chain_id` は `evolution_chains.id` を参照する FK。**NULL 許容** とし、進化しない単独種族はチェーン行を持たない（`NULL`）。進化系統に属する種族のみ、同じ `evolution_chain_id` を共有する
- `forms` は `(species_id, slug)` で一意。`category` 列で normal / regional / mega / mega-x / mega-y / gigantamax / tera / other を区別する
- `form_types` は `(form_id, slot)` を複合主キーにし、`(form_id, type_id)` を UNIQUE 制約にする。`slot` は `1` / `2` の整数（CHECK で制限）
- `form_sprites` は `(form_id, gender, kind)` を UNIQUE にする。`gender` は `'male'` / `'female'` / `'unknown'`、`kind` は `'default'` / `'shiny'` / `'back'` / `'back_shiny'`。`url` には Supabase Storage の相対パス文字列を格納するが、本 change では **placeholder（実在しない仮パス）** で構わない。実画像のアップロードと URL 整合は後続 `add-sprite-assets` change で行う
- `pokedexes.region_id` は `regions.id` を参照する FK（NULL 許容: `national` 図鑑など特定地方に属さない図鑑がある）
- `pokedex_entries` は `id`、`pokedex_id`（FK）、`species_id`（FK）、`pokedex_number`、`form_id`（FK to `forms.id`、NULL 許容）を持つ。`(pokedex_id, pokedex_number)` UNIQUE、`(pokedex_id, species_id)` UNIQUE。`form_id` は「その図鑑で表示するフォーム」を指定する（パルデア図鑑のオーガポンは「みどりのめんづら」など地方ごとの代表姿を表現）。NULL 時は UI 側で `category='normal'` を選ぶフォールバック

### Decision 5: 主要なドメイン制約と不変条件

DB 制約で表現する:

- `form_types`: PRIMARY KEY `(form_id, slot)`、UNIQUE `(form_id, type_id)`、`slot` は CHECK で 1 または 2 に制限
- `form_sprites`: UNIQUE `(form_id, gender, kind)`
- `pokedex_entries`: UNIQUE `(pokedex_id, pokedex_number)`、UNIQUE `(pokedex_id, species_id)`
- `species_evolutions`: CHECK `from_species_id <> to_species_id` で自己進化を禁止する。UNIQUE `(from_species_id, to_species_id)`
- `species.evolution_chain_id`: NULL 許容 FK to `evolution_chains.id`
- `pokedex_entries.form_id`: NULL 許容 FK to `forms.id`。シード時に「`form_id` が指す form が `species_id` の species に属している」ことを検証する
- `*_names`: UNIQUE `(<参照ID>, locale)` で同一 locale の重複を防ぐ。`locale` は `locales.code` への FK

vitest の Invariant Tests でも以下を検証する:

- ロード後のシード DB で、上記制約に違反する行が存在しないこと
- `species.national_dex_number` が `pokedexes.slug = 'national'` の `pokedex_entries.pokedex_number` と整合すること
- 各 `forms` に少なくとも 1 件の `form_types`、1 件の `form_sprites`、1 件の `form_names`（locale = `'ja'`）が存在すること
- `species_evolutions` に登場する species は必ず非 NULL の `evolution_chain_id` を持ち、`from_species_id` と `to_species_id` が同じ `evolution_chain_id` を指していること
- `pokedex_entries.form_id` が非 NULL の場合、その form の `species_id` が `pokedex_entries.species_id` と一致すること

**理由**: DB 制約だけでは表現できない横断的整合性（national_dex_number との突き合わせ、進化両端のチェーン一致、ロード結果の網羅性）は vitest で担保する。逆に DB 制約で表現可能なものは DB 側に寄せ、二重防御にする。

### Decision 6: Drizzle スキーマ実装の置き方

```
apps/api/src/db/
  client.ts            -- 既存 (drizzle + postgres singleton)
  schema/
    index.ts           -- 全テーブル/型/relations を re-export
    enums.ts           -- form_category / sprite_gender / sprite_kind の pgEnum 定義
    locales.ts         -- locales (lookup)
    types.ts           -- types, type_names
    regions.ts         -- regions, region_names
    pokedexes.ts       -- pokedexes, pokedex_names, pokedex_entries
    species.ts         -- species, species_names, evolution_chains, species_evolutions
    forms.ts           -- forms, form_names
    form-types.ts      -- form_types (関係テーブル)
    form-sprites.ts    -- form_sprites
  seed/
    data/              -- JSON ファイル群
      locales.json
      types.json
      regions.json
      pokedexes.json
      species.json
      forms.json
    schemas/           -- valibot スキーマ群
    invariants.ts      -- 不変条件チェック (関数)
    invariants.test.ts -- 不変条件チェック (vitest 経由)
    seed.ts            -- JSON を読んで insert
```

`apps/api/drizzle.config.ts` の `schema` は `./src/db/schema/index.ts` を指す。

**理由**:

- 1 ファイルに全テーブルを詰めると 800 行を超える可能性が高い。`coding-style.md` の「ファイル 200〜400 行、最大 800 行」「機能・ドメイン別に整理」に従いテーブルカテゴリごとに分割する
- 進化系は `species.ts` 内に `evolution_chains` / `species_evolutions` をまとめ、自己参照と FK が同じファイルで完結するようにする
- `index.ts` を単一エントリにすることで、`drizzle.config.ts` と他コードからの import を簡潔にする

### Decision 7: 分類値の DB 表現 — pgEnum と lookup テーブルの使い分け

| 分類値          | 表現      | 理由                                                                              |
| --------------- | --------- | --------------------------------------------------------------------------------- |
| `form_category` | pgEnum    | 値集合がほぼ固定。将来追加の可能性は低い                                          |
| `sprite_gender` | pgEnum    | 3 値で固定                                                                        |
| `sprite_kind`   | pgEnum    | 4 値で固定                                                                        |
| `locale`        | **lookup テーブル** (`locales`) | 将来 fr / de / it / es / ko / zh-Hans / zh-Hant 等を追加する想定。pgEnum の `ALTER TYPE ADD VALUE` よりも `INSERT` の方が運用が楽 |

pgEnum 定義例:

```typescript
export const formCategoryEnum = pgEnum('form_category', [
  'normal', 'regional', 'mega', 'mega-x', 'mega-y', 'gigantamax', 'tera', 'other',
])
```

`locales` テーブル:

```typescript
export const locales = pgTable('locales', {
  code: varchar('code', { length: 16 }).primaryKey(),  // 'ja' / 'en' / ...
  name: varchar('name', { length: 64 }),               // 任意の表示名（'日本語' / 'English'）
})
```

`*_names.locale` は `varchar('locale', { length: 16 }).notNull().references(() => locales.code)` として FK 参照する。

**理由**:

- pgEnum は SQL レベルで不正値を弾けるが、値追加が `ALTER TYPE` 必要で同一トランザクション内で使えない制約がある
- `locale` は将来確実に増える分類値なので、INSERT で済む lookup テーブルにしておくと運用が滑らか
- 一方 `form_category` / `sprite_gender` / `sprite_kind` は値集合がほぼ固定 + 多言語名を持つ必要がないので pgEnum で十分

**代替案と却下理由**:

- **全部 lookup テーブル**: 統一性は出るが、固定値集合に対しても JOIN が必要になり、SQL が読みづらくなる
- **全部 pgEnum**: locale の運用コストが上がる

### Decision 8: TS 側分類値は contracts に置く

TS 側の分類値（`FormCategory` / `Locale` / `SpriteGender` / `SpriteKind`）は `packages/contracts` に `as const` オブジェクト + 型エイリアスとして置き、Drizzle のスキーマ・シード JSON・後続 API レスポンスから共通参照する。

- pgEnum の値配列は contracts の `as const` から `satisfies` で派生させ、二重定義を一元的に守る
- `locales.json` シードファイルは contracts の `Locale` 値集合と整合することを seed 時に検証する

**理由**:

- 共通の分類値定義を contracts に置くことで、Web / Mobile からもプルダウン表示等で再利用できる
- DB スキーマ・シード JSON・API レスポンス・UI 表示が同じ列挙を見るので、追加・変更時の同期作業が contracts 1 箇所で完結する

### Decision 9: 多言語名テーブルの構造

`*_names` 系は全て `(参照ID, locale, name)` の 3 列構造に統一する。`locale` は `locales.code` を FK 参照する。本 change のシード対象は **`ja` と `en` の 2 言語のみ**。他言語は後続 change または手動追加。

**理由**:

- 種族・フォーム・タイプ・地方・図鑑カタログそれぞれが多言語名を持つので、一貫した 3 列構造で揃えるとシード処理・API レスポンス組み立てが揃う
- `locale` を `locales` テーブルへの FK にすることで、未定義 locale の混入を DB レベルで防ぐ
- 第一段階で `ja` / `en` だけに絞ることで JSON シードの編集量を抑えつつ、テーブル構造は将来言語追加に対応できる

### Decision 10: 進化チェーンの二段構え

`evolution_chains` テーブルと `species_evolutions` テーブルを併存させる:

- `evolution_chains`: `id` のみ（属性は将来追加）。**進化系統が存在する場合のみ** 1 行作り、同系統に属する species 全員に同じ `evolution_chain_id` を割り当てる
- `species.evolution_chain_id`: **NULL 許容** FK。進化しない単独種族は `NULL`。進化系統に属する種族のみ非 NULL
- `species_evolutions`: `(from_species_id, to_species_id)` で直接の対応関係を保持

これにより:

- 「フシギダネのチェーン全体を取得」: `WHERE evolution_chain_id = (species WHERE slug='bulbasaur').evolution_chain_id` の 1 クエリで完結
- 「フシギダネの次の進化」: `species_evolutions WHERE from_species_id = X` で 1 ホップ取得
- 「分岐進化（イーブイ系統）」: 1 つの `evolution_chain_id` 配下に複数の `species_evolutions` を持つことで自然に表現できる
- 「進化しない種族（ミュウ、ケッキング等）」: `evolution_chain_id = NULL` で表現。`species_evolutions` には登場しない

**理由**:

- 進化系統の一括取得を再帰 CTE に頼らなくて済む
- 進化条件を将来追加するときは `species_evolutions` に `trigger_id` を足すだけで済み、`evolution_chains` 側は無傷
- `evolution_chain_id` を NULL 許容にすることで、進化しない種族のためだけにダミーチェーンを作る運用負荷を回避する（シード JSON でも該当エントリの `evolution_chain_key` を省略できる）
- NULL ハンドリングはアプリ側で「`evolution_chain_id IS NULL` なら同系統一覧画面を出さない」のみで済む

**代替案と却下理由**:

- **`species_evolutions` だけで管理**: 同系統取得が再帰 CTE で複雑、UI 描画時のクエリが重くなる
- **`evolution_chains` だけで管理（対応関係を持たない）**: 「次の進化先」のような単方向ホップが取りづらくなる
- **NOT NULL + 単独チェーン**: シード時に進化しない全種族へチェーン割り当てが必要で、運用負荷が高い

### Decision 11: シード投入の方式

`apps/api/src/db/seed/seed.ts` を `pnpm --filter @pokedex/api seed` で起動する。引数なしで実行するとローカル Supabase に対して以下を実行:

1. `locales` / `types` / `regions` / `pokedexes` / `evolution_chains` / `species` の親テーブルを順に insert
2. `species_names` / `species_evolutions` / `forms` / `form_names` / `form_types` / `form_sprites` / `pokedex_entries` / `type_names` / `region_names` / `pokedex_names` の子テーブルを順に insert
3. 不変条件チェック（Decision 5）を実行し、違反があれば 1 を返して終了

JSON 構造は contracts の `FormCategory` / `Locale` などを参照して `valibot` でパースし、不正なデータをロード前に弾く。

`supabase/seed.sql` は使わず、代わりに `apps/api/package.json` の `scripts` に `"db:reset": "supabase db reset && pnpm seed"` を追加する。

**理由**:

- Drizzle スキーマと型を共有して seed したいので TS で書くのが自然
- 不変条件チェックを「シード後に必ず実行する一連の処理」として束ねたい
- `supabase/seed.sql` を別管理にすると JSON との同期コストが上がる

### Decision 12: マイグレーションの生成と適用

`drizzle.config.ts` の `out` は既に `'../../supabase/migrations'`（`add-monorepo-foundation` で設定済み）。本 change で初めて `pnpm --filter @pokedex/api drizzle-kit generate` を実行し、`supabase/migrations/<timestamp>_add_domain_schema.sql` が生成される。

開発者は次の順序で動作確認する:

1. `supabase start`（既にスタックが起動していればスキップ）
2. `supabase db reset`（マイグレーションを最初から適用）
3. `pnpm --filter @pokedex/api seed`（JSON シード投入 + 不変条件チェック）
4. `pnpm --filter @pokedex/api test`（vitest で Invariant Tests + テーブル定義テスト）

**理由**:

- マイグレーション SQL の見直しを CI でも実機でも回せるようにしておく
- Supabase CLI の `db reset` がマイグレーション全体を冪等に適用してくれる
- シード後の不変条件チェックを「テストではなくシードスクリプトの一部」として組み込むことで、`db reset` 失敗を早期検出する

### Decision 13: 型 export とリレーション API

Drizzle の `relations()` ヘルパーで関係を明示し、後続 change の `db.query.species.findMany({ with: { forms: { with: { types: true, sprites: true } } } })` のような階層クエリで使えるようにする。本 change ではテーブル定義 + `relations()` の export までを行い、実際のクエリ呼び出しは行わない（`add-search-api` で行う）。

各テーブルから `$inferSelect` / `$inferInsert` のペア（`Species` / `NewSpecies`、`Form` / `NewForm` など）を export し、シードと将来のリポジトリ層から型を再利用する。

## Risks / Trade-offs

- **[リスク] フォーム JSON のメンテコスト**: フォーム 100+ を JSON で持つと、誤入力に気づきにくい → Mitigation: `valibot` パース + シード時の不変条件チェック + vitest による Invariant Tests の三重防御で早期検出する
- **[リスク] `species.evolution_chain_id` を NULL 許容にすることで、クエリ時に NULL ハンドリングが必要になる**: 進化系統取得は `WHERE evolution_chain_id IS NOT NULL AND evolution_chain_id = X` のような書き方になる → Mitigation: アプリ層で「進化系統がない species は同系統画面を非表示」というシンプルな分岐で対処。NOT NULL にする場合の「進化しない種族にも独自チェーン」を作る運用負荷の方が大きい
- **[リスク] `pokedex_entries.form_id` の整合性**: `form_id` が指す form の `species_id` が `pokedex_entries.species_id` と一致しないケースが事故で混入し得る → Mitigation: DB レベルでは FK だけ張り、シード時の Invariant Tests で `(pokedex_entries.species_id == forms.species_id WHERE forms.id == pokedex_entries.form_id)` を検証する。CHECK 制約で表現することも可能だが、サブクエリ含むため Drizzle Kit の出力を確認してから判断
- **[リスク] `form_sprites.url` を placeholder で投入することで、後続 change まで UI で画像 404 になる**: 本 change の動作確認では絵が出ない → Mitigation: 本 change は DB スキーマと seed までがスコープ。URL の有効性は `add-sprite-assets` change（仮称）で対応。設計判断として明示し、`add-search-api` / `add-web-listing` を着手する前に `add-sprite-assets` を回す順序にする
- **[リスク] `locales` lookup テーブルで JOIN が増える**: `*_names` 検索時に常に JOIN になる → Mitigation: `locale` 列に値をそのまま格納している（FK だが値そのものなので `code='ja'` フィルタは JOIN なしで可能）。lookup を JOIN するのは UI で表示名 `'日本語'` を出したいケースだけ
- **[トレードオフ] スキーマファイルを複数に分けると全体像が掴みにくい**: `index.ts` の re-export と本 design の関係図で補う。各ファイル末尾に `relations()` を置き、内部関係はファイル内で完結させる
- **[トレードオフ] 多言語シードを `ja` / `en` のみに絞っていることが将来の負債になる**: 後で他言語を追加する際にデータソースを新たに調達する必要がある → Mitigation: 多言語テーブル構造は変えないので、`locales` への INSERT + 各 `*_names` テーブルへの追加で済む
- **[リスク] FK 列にインデックスが未定義**: PostgreSQL は FK 列に自動でインデックスを作らないため、`forms.species_id` / `species_evolutions.from_species_id` / `to_species_id` / `pokedex_entries.pokedex_id` / `species_id` / `form_id` / `form_names.form_id` / `form_sprites.form_id` などの JOIN・WHERE がフルスキャンになる → Mitigation: 本 change は **テーブル定義のみ** (実クエリは出ない) のため許容。後続 `add-search-api` で実 SQL を組む直前に必要なインデックスを追加する。本 change で全 FK にインデックスを張ると過剰最適化になり、実クエリの分布を見てから決める方が安全
- **[リスク] `species_evolutions` の A→B→A サイクル検出**: `from <> to` CHECK で自己ループ (`from = to`) は防げるが、A→B→A や A→B→C→A のような長いサイクルは DB 制約では検出できない → Mitigation: アプリ層 (`add-search-api` または検索画面の表示ロジック) でサイクル検出を行う設計。本 change のスコープ外
- **[設計判断] `pokedex_entries.form_id` の `ON DELETE SET NULL`**: `form_id` は NULL 許容で「NULL の場合は UI 側で `category='normal'` をデフォルト表示するフォールバック」という意味論を持つ。これと整合させるため、form 削除時には `pokedex_entries.form_id` を NULL に書き換える `SET NULL` を採用する。図鑑エントリ自体は残り、UI は自動的にデフォルトフォーム表示に切り替わる。`NO ACTION` で FK 違反ブロックする選択肢もあるが、運用時に手動で entry 側を先に削除する手間が生じ、設計意図 (NULL = fallback) と不整合になるため却下

## Migration Plan

本 change は新規テーブル追加のみで、既存テーブル変更・データ移行・後方互換性は不要。手順:

1. 開発者は `supabase start` でローカルスタックを起動
2. `pnpm --filter @pokedex/api drizzle-kit generate` でマイグレーション SQL を生成
3. 生成された SQL を目視レビューし、`supabase/migrations/` にコミット
4. `supabase db reset` でローカル DB を再構築
5. `pnpm --filter @pokedex/api seed` でシード投入 + 不変条件チェック
6. `pnpm --filter @pokedex/api test` でテストを実行

ロールバック: マイグレーション SQL は単一ファイルなので、削除して `supabase db reset` を再実行すれば前の状態に戻る。本番未デプロイなので運用ロールバック手順は不要。

## Open Questions

- `form_sprites.url` の格納形式: Supabase Storage のフルパス（`https://<project>.supabase.co/storage/v1/object/public/sprites/...`）か、相対パス（`sprites/normal/pikachu.png`）か。本 change では **相対パスを格納し、Web/Mobile 側で base URL を結合する** 方針を採用する（base URL は環境依存のため）。spec の Requirement に明記する
- 本 change の `form_sprites.url` は placeholder（例: `'placeholder/<species_slug>/<form_slug>/<gender>/<kind>.png'`）で構わない。実画像のアップロードと URL 整合は後続 **`add-sprite-assets`** change（仮称）で対応する
- `pokedex_entries.form_id` の整合性チェックを DB CHECK 制約で表現するか、シード時の Invariant Tests で担保するか → 本 change では **Invariant Tests のみ** で進める。Drizzle Kit の CHECK サブクエリサポートを実装途中で確認し、可能なら DB 側にも追加する
- `species_evolutions` の主キーを `id` serial にするか `(from_species_id, to_species_id)` 複合 PK にするか → 本 change では **`id` serial PK + `(from, to)` UNIQUE** の両方を採用する。`(from, to)` UNIQUE で重複を防ぎつつ、`id` を残すことで後続 change (進化条件 `trigger_id` を持つ別テーブル `evolution_triggers` を加えるなど) で species_evolutions を外部参照しやすくなる。現時点では `id` は外部から参照されていない (= レビュー指摘の通り未使用) が、後続 change での拡張余地を確保するための設計判断として意図的に保持する
