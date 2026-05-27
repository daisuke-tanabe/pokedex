# domain-schema Specification

## Purpose

ポケモン図鑑ドメインのテーブル定義・Drizzle スキーマ・マイグレーション SQL・命名規約・主キー / 外部キー制約・ドメイン不変条件を規定する。種族 (`species`) と種族のフォーム (`forms`) を中心とした二段構造で、進化チェーン (`evolution_chains` + `species_evolutions`)、図鑑エントリ (`pokedexes` + `pokedex_entries`)、タイプ・スプライト・多言語名を表現する。`form_types` の三重防御 ((form_id, slot) 複合 PK + (form_id, type_id) UNIQUE + slot CHECK)、`species_evolutions` の自己進化禁止 CHECK、`locales` lookup テーブル化などのドメイン制約を含む。
## Requirements
### Requirement: テーブル定義のファイル分割とエントリポイント

`apps/api/src/db/schema/` 配下に、ドメインカテゴリごとの Drizzle スキーマファイルを置かなければならない（MUST）。`apps/api/src/db/schema/index.ts` は全テーブル・全 `relations()` を re-export し、`apps/api/drizzle.config.ts` の `schema` から参照されなければならない（MUST）。

#### Scenario [unit]: schema/index.ts から全テーブルが import できる

- **WHEN** `apps/api` 内の別モジュールから `import { locales, types, regions, pokedexes, evolutionChains, species, speciesEvolutions, forms, formTypes, formSprites, pokedexEntries } from './db/schema'` を行う
- **THEN** 型エラーなく全シンボルが解決される

#### Scenario [unit]: drizzle.config.ts の schema 設定が schema/index.ts を指す

- **WHEN** `apps/api/drizzle.config.ts` を読み込む
- **THEN** `schema` プロパティが `'./src/db/schema/index.ts'` を指している

### Requirement: locales lookup テーブル

`locales` テーブルは `code`（VARCHAR(16)、主キー）と `name`（VARCHAR(64)、**NOT NULL**）の 2 列を持たなければならない（MUST）。`*_names` 系テーブルの `locale` 列はすべて `locales.code` を FK 参照しなければならない（MUST）。`name` を NOT NULL とすることで、seed JSON 側のバリデーション (`v.nonEmpty()`) と DB 側の型整合性を一致させる。

#### Scenario [unit]: locales テーブルが物理名 'locales' で定義される

- **WHEN** `locales` Drizzle テーブルオブジェクトの物理名を検査する
- **THEN** 文字列 `'locales'` である

#### Scenario [unit]: locales.code が主キーである

- **WHEN** 生成されたマイグレーション SQL を読む
- **THEN** `locales` テーブルで `code` が PRIMARY KEY として定義されている

#### Scenario [unit]: locales.name が NOT NULL である

- **WHEN** `locales.name` 列の `notNull` を検査する
- **THEN** `true` である

#### Scenario [integration]: 未定義 locale を *_names に insert すると FK 違反になる

- **WHEN** `locales` に存在しない `'xx'` を `species_names.locale` 等に insert する
- **THEN** FK 制約違反エラーになる

### Requirement: types テーブルと type_names

`types` テーブルは PostgreSQL 上で `types` という物理名で作成され、TS シンボル `types`・TS 型 `Type` を提供しなければならない（MUST）。`id` を主キー、`slug` を UNIQUE で持たなければならない（MUST）。`type_names` は `(type_id, locale)` UNIQUE を持たなければならない（MUST）。

#### Scenario [unit]: types テーブルが物理名 'types' で定義される

- **WHEN** `types` Drizzle テーブルオブジェクトの物理名を検査する
- **THEN** 文字列 `'types'` である

#### Scenario [unit]: types.slug が UNIQUE 制約を持つ

- **WHEN** マイグレーション SQL を生成して読み込む
- **THEN** `types` テーブル定義に `slug` 列の UNIQUE 制約が含まれる

#### Scenario [unit]: Type 型が $inferSelect で取得できる

- **WHEN** TS で `type Type = typeof types.$inferSelect` を宣言する
- **THEN** `id` / `slug` を含むレコード型として推論される

#### Scenario [integration]: type_names に同じ (type_id, locale) は 2 回入らない

- **WHEN** `(type_id=1, locale='ja', name='ノーマル')` の行を 2 回 insert する
- **THEN** 2 回目で UNIQUE 制約違反エラーになる

### Requirement: regions テーブルと region_names

`regions` テーブルは `id`（主キー）、`slug`（UNIQUE）を持たなければならない（MUST）。`region_names` は `(region_id, locale)` UNIQUE を持たなければならない（MUST）。

#### Scenario [unit]: regions の物理名と slug UNIQUE 制約

- **WHEN** `regions` Drizzle オブジェクトの物理名と生成 SQL を検査する
- **THEN** 物理名が `'regions'` であり、`slug` 列に UNIQUE 制約が含まれる

#### Scenario [integration]: region_names に同じ (region_id, locale) は 2 回入らない

- **WHEN** `(region_id=1, locale='ja')` の行を 2 回 insert する
- **THEN** 2 回目で UNIQUE 制約違反エラーになる

### Requirement: pokedexes テーブルと pokedex_names

`pokedexes` テーブルは `id`（主キー）、`slug`（UNIQUE）、`region_id`（`regions.id` への FK、NULL 許容）を持たなければならない（MUST）。`pokedex_names` は `(pokedex_id, locale)` UNIQUE を持たなければならない（MUST）。パルデア / キタカミ / ブルーベリーのような独立番号体系を持つ図鑑は **別の `pokedexes` 行** として表現されなければならない（MUST）。

#### Scenario [unit]: pokedexes.region_id が NULL 許容で regions を参照する

- **WHEN** 生成された SQL を読む
- **THEN** `pokedexes.region_id` 列が `regions(id)` を REFERENCES し、NOT NULL 制約が **付いていない**（NULL 許容）

#### Scenario [integration]: national 図鑑は region_id=null で登録できる

- **WHEN** `(slug='national', region_id=null)` の行を insert する
- **THEN** 成功する

#### Scenario [integration]: パルデア地方の 3 図鑑が別行として登録できる

- **WHEN** `(slug='paldea', region_id=paldea_id)`、`(slug='kitakami', region_id=paldea_id)`、`(slug='blueberry', region_id=paldea_id)` の 3 行を insert する
- **THEN** すべて成功する（`slug` がそれぞれ異なるため UNIQUE 違反にならない）

### Requirement: evolution_chains テーブル

`evolution_chains` テーブルは `id`（主キー）の 1 列のみで定義されなければならない（MUST）。属性カラムは持たず、将来の拡張余地として残す（MAY、本 change では追加しない）。

#### Scenario [unit]: evolution_chains が id のみのテーブルとして定義される

- **WHEN** 生成された SQL を読む
- **THEN** `evolution_chains` テーブルの列が `id` のみである（PRIMARY KEY）

### Requirement: species テーブルと species_names

`species` テーブルは `id`（主キー）、`slug`（UNIQUE）、`national_dex_number`（INTEGER、NOT NULL、UNIQUE）、`evolution_chain_id`（`evolution_chains.id` への FK、**NULL 許容**）を持たなければならない（MUST）。進化しない単独種族は `evolution_chain_id` を NULL にしてもよい（MAY）。TS 側のシンボルは `species`、型は `Species` / `NewSpecies` として export されなければならない（MUST）。`species_names` は `(species_id, locale)` UNIQUE を持たなければならない（MUST）。

#### Scenario [unit]: species テーブルの物理名と複数形表現

- **WHEN** `species` Drizzle オブジェクトの物理名を検査する
- **THEN** 文字列 `'species'` である（単複同形のため複数形扱いで OK）

#### Scenario [unit]: species.slug と national_dex_number に UNIQUE 制約が付く

- **WHEN** 生成されたマイグレーション SQL を読む
- **THEN** `species` テーブルで `slug` と `national_dex_number` がそれぞれ UNIQUE 制約を持つ

#### Scenario [unit]: species.evolution_chain_id が NULL 許容 FK である

- **WHEN** 生成された SQL を読む
- **THEN** `species.evolution_chain_id` が `evolution_chains(id)` を REFERENCES し、NOT NULL 制約が **付いていない**

#### Scenario [integration]: 進化しない species は evolution_chain_id を NULL で insert できる

- **WHEN** `(slug='mew', national_dex_number=151, evolution_chain_id=null)` の行を insert する
- **THEN** 成功する

#### Scenario [unit]: Species / NewSpecies 型がペアで export される

- **WHEN** TS で `import type { Species, NewSpecies } from './db/schema'` する
- **THEN** 両型が型エラーなく解決される

#### Scenario [integration]: species_names に同じ (species_id, locale) は 2 回入らない

- **WHEN** `(species_id=25, locale='ja', name='ピカチュウ')` の行を 2 回 insert する
- **THEN** 2 回目で UNIQUE 制約違反エラーになる

### Requirement: species_evolutions テーブル（自己参照と自己進化禁止）

`species_evolutions` テーブルは `id`（主キー）、`from_species_id`、`to_species_id` を持ち、両 FK は `species.id` を参照しなければならない（MUST）。`from_species_id` と `to_species_id` が等しい行は CHECK 制約で禁止されなければならない（MUST NOT 受け入れる）。`(from_species_id, to_species_id)` は UNIQUE でなければならない（MUST）。

#### Scenario [integration]: 自己進化を CHECK 制約が拒否する

- **WHEN** Drizzle 経由で `species_evolutions` に `from_species_id = to_species_id` の行を insert する
- **THEN** PostgreSQL の CHECK 制約違反でエラーになる

#### Scenario [integration]: 同じ進化対応関係を 2 回 insert すると UNIQUE 違反になる

- **WHEN** `(from_species_id, to_species_id)` が同一の行を 2 回 insert する
- **THEN** 2 回目で UNIQUE 制約違反エラーになる

#### Scenario [integration]: 通常の進化対応関係は insert できる

- **WHEN** `from_species_id = 1`（フシギダネ）、`to_species_id = 2`（フシギソウ）の行を insert する
- **THEN** 成功する

### Requirement: forms テーブルと FormCategory

`forms` テーブルは `id`（主キー）、`species_id`（NOT NULL、`species.id` を参照）、`slug`、`category`、**`is_default`（BOOLEAN、NOT NULL、DEFAULT false）** を持たなければならない（MUST）。`(species_id, slug)` は UNIQUE でなければならない（MUST）。`category` 列は pgEnum `form_category` 型で、許容値は `'normal' | 'regional' | 'mega' | 'mega-x' | 'mega-y' | 'gigantamax' | 'tera' | 'other'` に限定されなければならない（MUST）。**`is_default = true` の行は同一 `species_id` ごとに最大 1 件しか存在できない**よう、部分 UNIQUE インデックス（`WHERE is_default = true` ON (`species_id`)）が定義されなければならない（MUST）。`forms.slug` は **species 名を含まない短縮形**（例: `'mega-x'`, `'alola'`, `'teal'`, `'cosplay'`、通常フォームは species_slug と同じ短縮 slug を採用、複数の通常候補がある species は `'normal'` 等を採用）を規約とする（MUST）。

#### Scenario [unit]: forms テーブルの物理名

- **WHEN** `forms` Drizzle オブジェクトの物理名を検査する
- **THEN** 文字列 `'forms'` である

#### Scenario [unit]: forms.is_default 列が NOT NULL DEFAULT false で定義される

- **WHEN** `forms.isDefault` Drizzle 列オブジェクトの `notNull` と `default` 設定、および生成された SQL を検査する
- **THEN** `notNull` が `true`、`default` が `false`、SQL に `"is_default" boolean DEFAULT false NOT NULL` が含まれる

#### Scenario [unit]: 部分 UNIQUE インデックスが (species_id) WHERE is_default = true で定義される

- **WHEN** `drizzle-kit generate` で生成された SQL を読む
- **THEN** `CREATE UNIQUE INDEX ... ON "forms" ("species_id") WHERE "is_default" = true`（または等価な部分インデックス表現）が含まれる

#### Scenario [integration]: 同じ species で is_default = true の行を 2 回挿入できない

- **WHEN** 同じ `species_id` で `is_default = true` の行を 2 回 insert する
- **THEN** 2 回目で部分 UNIQUE 制約違反エラーになる

#### Scenario [integration]: 同じ species で is_default = false なら複数行 OK

- **WHEN** 同じ `species_id` で `is_default = false` の行を複数 insert する
- **THEN** すべて成功する（メガシンカ等の複数 variant フォームを表現できる）

#### Scenario [integration]: 異なる species なら is_default = true を複数 species 分挿入できる

- **WHEN** 異なる `species_id` でそれぞれ `is_default = true` の行を insert する
- **THEN** すべて成功する（species ごとに 1 件ずつ default を持てる）

#### Scenario [integration]: form_category enum が 8 値を持つ

- **WHEN** PostgreSQL で `SELECT enum_range(NULL::form_category)` を実行する
- **THEN** 8 値 `{normal, regional, mega, mega-x, mega-y, gigantamax, tera, other}` が返る

#### Scenario [integration]: 未定義 category の insert は失敗する

- **WHEN** `forms.category` に `'unknown-form'` を持つ行を insert する
- **THEN** pgEnum の値エラーで失敗する

#### Scenario [integration]: 同じ species の同じ slug は二重登録できない

- **WHEN** `(species_id, slug)` が同じ行を 2 回 insert する
- **THEN** 2 回目で UNIQUE 制約違反エラーになる

#### Scenario [integration]: forms.slug 規約が species 名を含まない短縮形である

- **WHEN** シード投入後の `forms` テーブルを走査し、各 row の `slug` を確認する
- **THEN** いずれの slug も対応する species_slug を `slug` の prefix として含まない（通常フォームを除く: 通常フォームは species_slug 自体 or `'normal'` を採用）

#### Scenario [integration]: form_names に同じ (form_id, locale) は 2 回入らない

- **WHEN** `(form_id=1, locale='ja', name='ピカチュウ')` の行を 2 回 insert する
- **THEN** 2 回目で UNIQUE 制約違反エラーになる

### Requirement: form_types テーブル（複合主キーとタイプ重複禁止）

`form_types` テーブルは `form_id`（`forms.id` を参照）、`slot`（CHECK で `1` または `2`）、`type_id`（`types.id` を参照）の 3 列を持たなければならない（MUST）。主キーは複合キー `(form_id, slot)` でなければならない（MUST）。`(form_id, type_id)` は UNIQUE でなければならない（MUST）。

#### Scenario [integration]: 同じスロットに 2 行登録できない

- **WHEN** ある `form_id` に対して `slot = 1` の行を 2 回 insert する
- **THEN** 2 回目で主キー制約違反エラーになる

#### Scenario [integration]: 同じフォームに同じタイプを 2 回登録できない

- **WHEN** `form_id = X`、`type_id = Y` で `slot = 1` と `slot = 2` の行を順に insert する
- **THEN** 2 回目で `(form_id, type_id)` UNIQUE 違反エラーになる

#### Scenario [integration]: slot に 3 を入れると CHECK 違反になる

- **WHEN** `slot = 3` の行を insert する
- **THEN** CHECK 制約違反エラーになる

#### Scenario [integration]: 正常な単タイプフォームを登録できる

- **WHEN** `(form_id, slot=1, type_id=electric)` の 1 行のみを insert する
- **THEN** 成功する

#### Scenario [integration]: 正常な複合タイプフォームを登録できる

- **WHEN** `(form_id, slot=1, type_id=fire)` と `(form_id, slot=2, type_id=flying)` を insert する
- **THEN** 両方成功する

### Requirement: form_sprites テーブル

`form_sprites` テーブルは `id`、`form_id`、`gender`（pgEnum `sprite_gender`、許容値 `'male' | 'female' | 'unknown'`）、`kind`（pgEnum `sprite_kind`、許容値 `'default' | 'shiny' | 'back' | 'back_shiny'`）、`url`（TEXT、NOT NULL）を持たなければならない（MUST）。`(form_id, gender, kind)` は UNIQUE でなければならない（MUST）。`url` には Supabase Storage の **相対パス**（例: `'sprites/normal/pikachu.png'`）が格納され、絶対 URL は格納してはならない（MUST NOT）。

#### Scenario [integration]: 同じ (form_id, gender, kind) の組み合わせを 2 回登録できない

- **WHEN** `(form_id=X, gender='male', kind='default')` の行を 2 回 insert する
- **THEN** 2 回目で UNIQUE 制約違反エラーになる

#### Scenario [integration]: 異なる gender なら同じ form_id, kind で登録できる

- **WHEN** `(form_id=X, gender='male', kind='default')` と `(form_id=X, gender='female', kind='default')` を順に insert する
- **THEN** 両方成功する

#### Scenario [integration]: 未定義の gender 値を拒否する

- **WHEN** `gender = 'nonexistent'` の行を insert する
- **THEN** pgEnum の値エラーで失敗する

#### Scenario [integration]: 未定義の kind 値を拒否する

- **WHEN** `kind = 'icon'` の行を insert する
- **THEN** pgEnum の値エラーで失敗する

### Requirement: pokedex_entries テーブル（図鑑番号と species の一意性、表示フォーム指定）

`pokedex_entries` テーブルは `id`、`pokedex_id`（`pokedexes.id` を参照）、`species_id`（`species.id` を参照）、`pokedex_number`（INTEGER、NOT NULL）、`form_id`（`forms.id` を参照、**NULL 許容**）を持たなければならない（MUST）。`(pokedex_id, pokedex_number)` は UNIQUE でなければならない（MUST）。`(pokedex_id, species_id)` は UNIQUE でなければならない（MUST、同一図鑑に同一 species が二重登録されることを防ぐ）。`form_id` はその図鑑エントリで表示するフォームを指定する。NULL の場合は UI / API 側で当該 species の `forms.is_default = true` の form をデフォルト表示しなければならない（MUST）。

#### Scenario [integration]: 同じ図鑑で同じ番号を 2 回登録できない

- **WHEN** `(pokedex_id=national_id, pokedex_number=1)` の行を 2 回 insert する
- **THEN** 2 回目で UNIQUE 制約違反エラーになる

#### Scenario [integration]: 同じ図鑑で同じ species を 2 回登録できない

- **WHEN** `(pokedex_id=paldea_id, species_id=25)` の行を 2 回 insert する
- **THEN** 2 回目で UNIQUE 制約違反エラーになる

#### Scenario [integration]: 別の図鑑なら同じ species を登録できる

- **WHEN** `(pokedex_id=national_id, species_id=25)` と `(pokedex_id=paldea_id, species_id=25)` を順に insert する
- **THEN** 両方成功する

#### Scenario [unit]: form_id が NULL 許容で forms を参照する

- **WHEN** 生成された SQL を読む
- **THEN** `pokedex_entries.form_id` 列が `forms(id)` を REFERENCES し、NOT NULL 制約が **付いていない**

#### Scenario [integration]: form_id を NULL で登録できる

- **WHEN** `(pokedex_id=national_id, species_id=25, pokedex_number=25, form_id=null)` を insert する
- **THEN** 成功する

#### Scenario [integration]: form_id にパルデア用のオーガポン形態を指定して登録できる

- **WHEN** Paldea 図鑑の Ogerpon エントリで `form_id=ogerpon_teal_form_id` を指定して insert する
- **THEN** 成功し、当該エントリの form_id が teal 形態を指している

#### Scenario [integration]: form_id が NULL の entry は is_default form をデフォルト表示する

- **WHEN** API / UI が `pokedex_entries.form_id` が NULL の entry を表示する
- **THEN** 当該 species の `forms.is_default = true` の form 情報を取得して表示に使う

### Requirement: マイグレーション SQL の生成

`pnpm --filter @pokedex/api drizzle-kit generate` を実行したとき、`supabase/migrations/` 配下に Drizzle Kit デフォルトの `<NNNN>_<name>.sql` 連番形式 (例: `0000_add_domain_schema.sql`) のファイルが少なくとも 1 つ生成されなければならない（MUST）。Supabase CLI は連番形式とタイムスタンプ形式の両方を認識して順序通りに適用する。生成された SQL は本 change で定義した全テーブル・全制約を含まなければならない（MUST）。

#### Scenario [integration]: マイグレーションファイルが連番命名で生成される

- **WHEN** `pnpm --filter @pokedex/api drizzle-kit generate` を実行する
- **THEN** `supabase/migrations/` 配下に `<NNNN>_<name>.sql` パターン (Drizzle Kit デフォルトの連番形式、例: `0000_add_domain_schema.sql`) のファイルが少なくとも 1 つ存在する

#### Scenario [unit]: 生成 SQL に form_types の複合 PK 定義が含まれる

- **WHEN** 生成された SQL をテキスト検索する
- **THEN** `form_types` の主キーが `(form_id, slot)` の複合キーとして定義されている

#### Scenario [unit]: 生成 SQL に species_evolutions の CHECK 制約が含まれる

- **WHEN** 生成された SQL をテキスト検索する
- **THEN** `from_species_id <> to_species_id` の CHECK 制約が含まれる

#### Scenario [unit]: 生成 SQL に species.evolution_chain_id の NULL 許容 FK が含まれる

- **WHEN** 生成された SQL をテキスト検索する
- **THEN** `species.evolution_chain_id` が `evolution_chains(id)` を REFERENCES し、NOT NULL 制約が付いていない

#### Scenario [unit]: 生成 SQL に pokedex_entries.form_id の NULL 許容 FK が含まれる

- **WHEN** 生成された SQL をテキスト検索する
- **THEN** `pokedex_entries.form_id` が `forms(id)` を REFERENCES し、NOT NULL 制約が付いていない

### Requirement: relations() による関連定義

各スキーマファイルは Drizzle の `relations()` ヘルパーを使い、対応する関連を export しなければならない（MUST）。`species` ⇔ `forms` ⇔ `form_types`/`form_sprites` ⇔ `types` の階層関連、`species` ⇔ `evolution_chains` の関連、および `species` ⇔ `species_evolutions`（自己参照）の関連が、`db.query.<table>.findMany({ with: ... })` で参照できる状態でなければならない（MUST）。

#### Scenario [unit]: species の relations に forms と evolutionChain が含まれる

- **WHEN** `speciesRelations` を取得し、その内部キーを列挙する
- **THEN** `forms`（`forms` テーブルへの 1:N）と `evolutionChain`（`evolution_chains` への N:1）が含まれる

#### Scenario [unit]: forms の relations に types, sprites が含まれる

- **WHEN** `formsRelations` を取得する
- **THEN** `types`（`form_types` 経由）と `sprites`（`form_sprites` への 1:N）の両方が含まれる

#### Scenario [unit]: species_evolutions が自己参照 relations を持つ

- **WHEN** `speciesEvolutionsRelations` を取得する
- **THEN** `from`（`species` への参照）と `to`（`species` への参照）の 2 関連が含まれる

#### Scenario [unit]: evolution_chains の relations に species が含まれる

- **WHEN** `evolutionChainsRelations` を取得する
- **THEN** `species`（`species` テーブルへの 1:N）のキーが含まれる

