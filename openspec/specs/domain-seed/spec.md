# domain-seed Specification

## Purpose

ドメイン初期データ (JSON ファイル) と JSON → DB へのシード投入スクリプト (`pnpm --filter @pokedex/api seed`)、不変条件を検証するテスト (`invariants.test.ts`) を規定する。`supabase db reset` でローカル DB が migration → seed → invariants 検証まで一連で動く状態を保証する。本 change のシードは「seed.ts と invariants が動く最小デモデータ」(数十件規模) に絞り、100+ フォーム本番網羅は後続 `add-pokedex-seed-data` change で投入する想定。

## Requirements
### Requirement: シード JSON ファイルの配置

シードデータは `apps/api/src/db/seed/data/` 配下に JSON ファイルとして配置されなければならない（MUST）。ファイル分割は最低 `locales.json` / `types.json` / `regions.json` / `pokedexes.json` / `species.json` / `forms.json` の 6 ファイルでなければならない（MUST）。各 JSON は `valibot` のスキーマでパース可能な構造を持たなければならない（MUST）。

#### Scenario: 6 つのシード JSON ファイルが存在する

- **WHEN** `apps/api/src/db/seed/data/` の直下を列挙する
- **THEN** `locales.json`、`types.json`、`regions.json`、`pokedexes.json`、`species.json`、`forms.json` の 6 ファイルが存在する

#### Scenario: locales.json が valibot スキーマでパースできる

- **WHEN** `locales.json` を読み込み、対応する valibot スキーマで `parse` する
- **THEN** 例外を投げずに同じ構造の値が返る

#### Scenario: types.json が valibot スキーマでパースできる

- **WHEN** `types.json` を読み込み、対応する valibot スキーマで `parse` する
- **THEN** 例外を投げずに同じ構造の値が返る

#### Scenario: species.json が valibot スキーマでパースできる

- **WHEN** `species.json` を読み込み、対応する valibot スキーマで `parse` する
- **THEN** 例外を投げずに同じ構造の値が返る

#### Scenario: forms.json が valibot スキーマでパースできる

- **WHEN** `forms.json` を読み込み、対応する valibot スキーマで `parse` する
- **THEN** 例外を投げずに同じ構造の値が返る

### Requirement: locales.json と contracts の Locale の整合

`locales.json` に含まれる `code` の集合は、`@pokedex/contracts` の `Locale` 値集合と一致しなければならない（MUST）。本 change のシード対象として `'ja'` / `'en'` の最低 2 行を含まなければならない（MUST）。

#### Scenario: locales.json に ja と en が含まれる

- **WHEN** `locales.json` を読み込み、各エントリの `code` を抽出する
- **THEN** `'ja'` と `'en'` の 2 値が最低含まれる

#### Scenario: locales.json の code 集合が contracts の Locale と一致する

- **WHEN** `locales.json` の `code` 集合と `Object.values(Locale)` を比較する
- **THEN** 両者が等価集合である

### Requirement: 最小デモシードの代表フォームカバレッジ

本 change のシードは **「seed.ts と invariants.test.ts を動かすための最小デモデータ」** とする。`forms.json` のエントリ数は強い下限を持たない（MAY）が、代表的なフォーム多様性パターンを最低限カバーしなければならない（MUST）:

- 1 つの species で複数フォームを持つケースが最低 1 種類（例: ロトムの複数形態 / オーガポンの複数仮面）
- `category` バリエーションが最低 2 種類（例: `normal` と `tera`、`normal` と `regional` など）

100+ フォームの本番網羅シードは後続 `add-pokedex-seed-data` change（仮称）で別途投入する想定（本 change のスコープ外）。

#### Scenario: forms.json に複数フォームを持つ species が最低 1 種含まれる

- **WHEN** `forms.json` を読み込み、`species_slug` ごとのエントリ数を集計する
- **THEN** エントリ数が 2 件以上の `species_slug` が最低 1 つ存在する

#### Scenario: forms.json に最低 2 種類の category バリエーションが含まれる

- **WHEN** `forms.json` を読み込み、`category` の一意集合を取得する
- **THEN** サイズが 2 以上である（例: `normal` + `tera`、`normal` + `regional` 等）

### Requirement: species.json の evolution_chain 表現

`species.json` の各エントリは `evolution_chain_key`（進化系統を識別する任意文字列キー、例: `'bulbasaur-line'`）を **任意フィールド** として持てなければならない（MUST）。同一進化系統に属する species は同じ `evolution_chain_key` を共有する（MUST）。`evolution_chain_key` が省略された species は「進化系統に属さない単独種族」として扱い、シード時に `species.evolution_chain_id` を NULL のまま投入する（MUST）。シードスクリプトは `evolution_chain_key` の一意集合から `evolution_chains` 行を自動生成し、各 species の `evolution_chain_id` を解決する（MUST）。

#### Scenario: 進化系統に属する species は evolution_chain_key を持つ

- **WHEN** `species.json` から `slug = 'bulbasaur'`、`'ivysaur'`、`'venusaur'` のエントリを抽出する
- **THEN** 3 エントリすべてが同じ `evolution_chain_key` を持つ

#### Scenario: 進化しない種族は evolution_chain_key を省略できる

- **WHEN** `species.json` から `slug = 'mew'`（または進化しない他種族）のエントリを抽出する
- **THEN** `evolution_chain_key` フィールドが存在しない、または `null` である

#### Scenario: seed 後に進化しない species の evolution_chain_id は NULL になる

- **WHEN** シード適用後の `species` テーブルから `slug = 'mew'` の行を取得する
- **THEN** `evolution_chain_id` が NULL である

#### Scenario: seed 後に同一進化系統の species は同じ evolution_chain_id を持つ

- **WHEN** シード適用後の `species` テーブルから `slug IN ('bulbasaur', 'ivysaur', 'venusaur')` の行を取得する
- **THEN** 3 行すべてが同じ非 NULL の `evolution_chain_id` を持つ

### Requirement: シードスクリプトのコマンド

`pnpm --filter @pokedex/api seed` で `apps/api/src/db/seed/seed.ts` が起動できなければならない（MUST）。スクリプトは `DATABASE_URL` を参照し、対象 DB に対して以下を **単一トランザクション内** で順に実行しなければならない（MUST）:

1. 既存データを全削除する `clearAll`
2. 親テーブル（`locales` / `types` / `regions` / `pokedexes` / `evolution_chains` / `species`）を insert
3. 子テーブル（`species_names` / `species_evolutions` / `forms` / `form_names` / `form_types` / `form_sprites` / `pokedex_entries` / `type_names` / `region_names` / `pokedex_names`）を insert
4. Invariant Tests（下記 Requirement）を実行

トランザクション内で例外が発生した場合は **全体がロールバックされ**、DB は seed 開始前の状態（直前の `clearAll` も含めて巻き戻る）か、本セッション開始時点の整合性ある状態のままでなければならない（MUST）。失敗時はプロセス終了コード `1` で終了しなければならない（MUST）。

#### Scenario: seed コマンドが pnpm スクリプトとして登録されている

- **WHEN** `apps/api/package.json` の `scripts.seed` を確認する
- **THEN** `tsx ./src/db/seed/seed.ts`（または equivalent）を呼ぶコマンドが定義されている

#### Scenario: seed コマンドが正常終了する

- **WHEN** ローカル Supabase 起動状態で `pnpm --filter @pokedex/api seed` を実行する
- **THEN** プロセスが終了コード `0` で終わる

#### Scenario: JSON の必須キー欠落で seed コマンドが終了コード 1 で終わる

- **WHEN** `forms.json` の 1 エントリから `category` キーを削除して `pnpm --filter @pokedex/api seed` を実行する
- **THEN** valibot パースエラーをログに出した上で、プロセスが終了コード `1` で終わる

#### Scenario: 途中で挿入が失敗するとトランザクション全体がロールバックされる

- **WHEN** seed 処理の途中（例: `forms` 挿入後、`pokedex_entries` 挿入時）で意図的に例外を発生させる
- **THEN** トランザクションがロールバックされ、`forms` テーブルに 1 行も残らない（=「成功した insert」も全部巻き戻る）

### Requirement: form_sprites.url は placeholder で投入できる

本 change ではスプライト画像の実アップロードを行わないため、`form_sprites.url` には **placeholder 文字列**（例: `'placeholder/<species_slug>/<form_slug>/<gender>/<kind>.png'`）を格納してよい（MAY）。`url` 列は NOT NULL であり空文字も拒否する（MUST）。実画像との整合性検証は後続 `add-sprite-assets` change で対応する。

#### Scenario: placeholder URL で form_sprites を insert できる

- **WHEN** `(form_id=X, gender='male', kind='default', url='placeholder/pikachu/normal/male/default.png')` を insert する
- **THEN** 成功する

#### Scenario: 空文字の url は拒否される

- **WHEN** `url = ''` の `form_sprites` 行を insert する
- **THEN** NOT NULL もしくはチェック制約違反、あるいは valibot パースエラーで失敗する

### Requirement: Invariant Tests による不変条件検証

`apps/api/src/db/seed/invariants.test.ts`（vitest）は、シード適用後の DB に対して以下の不変条件をすべて検証しなければならない（MUST）。

- `species.national_dex_number` の値と、`pokedex_entries` の `(pokedex_id = 'national' に対応する pokedex.id, pokedex_number)` の値が、各 `species_id` で一致すること
- 各 `forms.id` に対して、`form_types` が 1 行以上、`form_sprites` が 1 行以上、`form_names` が `locale = 'ja'` で 1 行以上存在すること
- `form_types` で `(form_id, slot)` が重複していないこと（DB 側 PK で保証されているが、テストでも `GROUP BY HAVING COUNT(*) > 1` で確認する）
- `form_types` で `(form_id, type_id)` が重複していないこと
- `pokedex_entries` で `(pokedex_id, pokedex_number)` および `(pokedex_id, species_id)` がそれぞれ重複していないこと
- `species_evolutions` で `from_species_id = to_species_id` の行が存在しないこと
- `species_evolutions` に登場する species は必ず非 NULL の `evolution_chain_id` を持ち、`from` と `to` が同じ `evolution_chain_id` を共有すること
- `pokedex_entries.form_id` が非 NULL の場合、その form の `species_id` が `pokedex_entries.species_id` と一致すること

#### Scenario: national_dex_number と national pokedex の番号が一致する

- **WHEN** `species` と `pokedexes.slug = 'national'` の `pokedex_entries` を結合し、`species.national_dex_number ≠ pokedex_entries.pokedex_number` の行を数える
- **THEN** 0 件である

#### Scenario: 全 forms に form_types が 1 行以上存在する

- **WHEN** `forms LEFT JOIN form_types ON forms.id = form_types.form_id` で `form_types.form_id IS NULL` の行を数える
- **THEN** 0 件である

#### Scenario: 全 forms に form_sprites が 1 行以上存在する

- **WHEN** `forms LEFT JOIN form_sprites ON forms.id = form_sprites.form_id` で右辺 NULL の行を数える
- **THEN** 0 件である

#### Scenario: 全 forms に form_names(locale='ja') が存在する

- **WHEN** `forms LEFT JOIN form_names ON forms.id = form_names.form_id AND form_names.locale = 'ja'` で右辺 NULL の行を数える
- **THEN** 0 件である

#### Scenario: pokedex_entries で (pokedex_id, pokedex_number) が重複していない

- **WHEN** `pokedex_entries GROUP BY pokedex_id, pokedex_number HAVING COUNT(*) > 1` を実行する
- **THEN** 0 行返る

#### Scenario: pokedex_entries で (pokedex_id, species_id) が重複していない

- **WHEN** `pokedex_entries GROUP BY pokedex_id, species_id HAVING COUNT(*) > 1` を実行する
- **THEN** 0 行返る

#### Scenario: species_evolutions に from = to の行が存在しない

- **WHEN** `species_evolutions WHERE from_species_id = to_species_id` を実行する
- **THEN** 0 行返る

#### Scenario: species_evolutions に登場する species は非 NULL の evolution_chain_id を持つ

- **WHEN** `species_evolutions e JOIN species fs ON e.from_species_id = fs.id JOIN species ts ON e.to_species_id = ts.id WHERE fs.evolution_chain_id IS NULL OR ts.evolution_chain_id IS NULL` を実行する
- **THEN** 0 行返る

#### Scenario: species_evolutions の両端が同じ evolution_chain_id を共有する

- **WHEN** `species_evolutions e JOIN species fs ON e.from_species_id = fs.id JOIN species ts ON e.to_species_id = ts.id WHERE fs.evolution_chain_id <> ts.evolution_chain_id` を実行する
- **THEN** 0 行返る

#### Scenario: pokedex_entries.form_id が指す form は同じ species に属する

- **WHEN** `pokedex_entries pe JOIN forms f ON pe.form_id = f.id WHERE pe.form_id IS NOT NULL AND pe.species_id <> f.species_id` を実行する
- **THEN** 0 行返る

### Requirement: db:reset スクリプト

`apps/api/package.json` に `db:reset` スクリプトを追加し、`supabase db reset` 実行後に `pnpm seed` を呼ぶ手順を 1 コマンドで実行できなければならない（MUST）。

#### Scenario: db:reset コマンドが定義されている

- **WHEN** `apps/api/package.json` の `scripts` を確認する
- **THEN** `db:reset` キーが存在し、`supabase db reset` と `seed` を順に呼ぶコマンドが記述されている

#### Scenario: db:reset コマンドが正常終了する

- **WHEN** ローカル Supabase 起動状態で `pnpm --filter @pokedex/api db:reset` を実行する
- **THEN** プロセスが終了コード `0` で終わる

