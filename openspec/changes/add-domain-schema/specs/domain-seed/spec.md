## ADDED Requirements

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

### Requirement: シード対象の網羅性

`forms.json` には少なくとも 100 件のフォームエントリが含まれていなければならない（MUST）。以下の特殊フォームを最低限カバーしなければならない（MUST）:

- ロトムの 5 フォーム（heat / wash / frost / fan / mow）
- アルセウスの 18 プレート
- シルヴァディの 18 メモリー
- オーガポンの 4 仮面（teal / wellspring / hearthflame / cornerstone）
- アンノーンの 28 文字（A-Z + ! + ?）
- ジガルデの 3 形態
- ネクロズマの 4 形態
- ザシアン / ザマゼンタの剣の王 / 楯の王
- ゲンシグラードン / ゲンシカイオーガ
- コスプレピカチュウ / キャップピカチュウ
- テラパゴスのステラ形態

#### Scenario: forms.json に 100 件以上のフォームエントリが含まれる

- **WHEN** `forms.json` を読み込み、エントリ数を数える
- **THEN** 100 以上である

#### Scenario: オーガポンの 4 仮面が forms.json に含まれる

- **WHEN** `forms.json` から `species_slug = 'ogerpon'` のエントリを抽出する
- **THEN** 4 件以上のフォームエントリが含まれる

#### Scenario: アンノーンの 28 文字が forms.json に含まれる

- **WHEN** `forms.json` から `species_slug = 'unown'` のエントリを抽出する
- **THEN** 28 件のフォームエントリが含まれる

### Requirement: species.json の evolution_chain 表現

`species.json` の各エントリは `evolution_chain_id`（または進化系統を識別する別名キー、例: `evolution_chain_key`）を含み、シード時に `evolution_chains` テーブルへの insert と `species.evolution_chain_id` の解決ができなければならない（MUST）。進化しない種族にも独自の `evolution_chain_id` を割り当てなければならない（MUST）。

#### Scenario: species.json の全エントリに evolution_chain 識別子が含まれる

- **WHEN** `species.json` を読み込み、各エントリで evolution_chain 識別キーを検査する
- **THEN** すべてのエントリに非 null の値が設定されている

#### Scenario: 同一進化系統の species は同じ evolution_chain 識別子を持つ

- **WHEN** `species.json` から `slug = 'bulbasaur'`、`'ivysaur'`、`'venusaur'` のエントリを抽出する
- **THEN** 3 エントリすべてが同じ evolution_chain 識別子を持つ

#### Scenario: 進化しない種族にも独自の evolution_chain 識別子が割り当てられる

- **WHEN** `species.json` から `slug = 'mew'`（または進化しない他種族）のエントリを抽出する
- **THEN** 非 null の evolution_chain 識別子が設定されている

### Requirement: シードスクリプトのコマンド

`pnpm --filter @pokedex/api seed` で `apps/api/src/db/seed/seed.ts` が起動できなければならない（MUST）。スクリプトは `DATABASE_URL` を参照し、対象 DB に対して以下を順に実行しなければならない（MUST）:

1. 親テーブル（`locales` / `types` / `regions` / `pokedexes` / `evolution_chains` / `species`）を insert
2. 子テーブル（`species_names` / `species_evolutions` / `forms` / `form_names` / `form_types` / `form_sprites` / `pokedex_entries` / `type_names` / `region_names` / `pokedex_names`）を insert
3. Invariant Tests（下記 Requirement）を実行

失敗時はプロセス終了コード `1` で終了しなければならない（MUST）。

#### Scenario: seed コマンドが pnpm スクリプトとして登録されている

- **WHEN** `apps/api/package.json` の `scripts.seed` を確認する
- **THEN** `tsx ./src/db/seed/seed.ts`（または equivalent）を呼ぶコマンドが定義されている

#### Scenario: seed コマンドが正常終了する

- **WHEN** ローカル Supabase 起動状態で `pnpm --filter @pokedex/api seed` を実行する
- **THEN** プロセスが終了コード `0` で終わる

#### Scenario: JSON の必須キー欠落で seed コマンドが終了コード 1 で終わる

- **WHEN** `forms.json` の 1 エントリから `category` キーを削除して `pnpm --filter @pokedex/api seed` を実行する
- **THEN** valibot パースエラーをログに出した上で、プロセスが終了コード `1` で終わる

### Requirement: Invariant Tests による不変条件検証

`apps/api/src/db/seed/invariants.test.ts`（vitest）は、シード適用後の DB に対して以下の不変条件をすべて検証しなければならない（MUST）。

- `species.national_dex_number` の値と、`pokedex_entries` の `(pokedex_id = 'national' に対応する pokedex.id, pokedex_number)` の値が、各 `species_id` で一致すること
- 各 `forms.id` に対して、`form_types` が 1 行以上、`form_sprites` が 1 行以上、`form_names` が `locale = 'ja'` で 1 行以上存在すること
- `form_types` で `(form_id, slot)` が重複していないこと（DB 側 PK で保証されているが、テストでも `GROUP BY HAVING COUNT(*) > 1` で確認する）
- `form_types` で `(form_id, type_id)` が重複していないこと
- `pokedex_entries` で `(pokedex_id, pokedex_number)` および `(pokedex_id, species_id)` がそれぞれ重複していないこと
- `species_evolutions` で `from_species_id = to_species_id` の行が存在しないこと
- `species_evolutions` の `from_species_id` と `to_species_id` が同じ `evolution_chain_id` を指していること

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

#### Scenario: species_evolutions の両端が同じ evolution_chain_id を指す

- **WHEN** `species_evolutions e JOIN species fs ON e.from_species_id = fs.id JOIN species ts ON e.to_species_id = ts.id WHERE fs.evolution_chain_id <> ts.evolution_chain_id` を実行する
- **THEN** 0 行返る

### Requirement: db:reset スクリプト

`apps/api/package.json` に `db:reset` スクリプトを追加し、`supabase db reset` 実行後に `pnpm seed` を呼ぶ手順を 1 コマンドで実行できなければならない（MUST）。

#### Scenario: db:reset コマンドが定義されている

- **WHEN** `apps/api/package.json` の `scripts` を確認する
- **THEN** `db:reset` キーが存在し、`supabase db reset` と `seed` を順に呼ぶコマンドが記述されている

#### Scenario: db:reset コマンドが正常終了する

- **WHEN** ローカル Supabase 起動状態で `pnpm --filter @pokedex/api db:reset` を実行する
- **THEN** プロセスが終了コード `0` で終わる
