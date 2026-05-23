## MODIFIED Requirements

### Requirement: pokedex_entries テーブル（図鑑番号と species の一意性、表示フォーム指定）

`pokedex_entries` テーブルは `id`、`pokedex_id`（`pokedexes.id` を参照）、`species_id`（`species.id` を参照）、`pokedex_number`（INTEGER、NOT NULL）、`form_id`（`forms.id` を参照、**NULL 許容**）を持たなければならない（MUST）。`(pokedex_id, pokedex_number)` は UNIQUE でなければならない（MUST）。`(pokedex_id, species_id)` は UNIQUE でなければならない（MUST、同一図鑑に同一 species が二重登録されることを防ぐ）。`form_id` はその図鑑エントリで表示するフォームを指定する。NULL の場合は UI / API 側で当該 species の `forms.is_default = true` の form をデフォルト表示しなければならない（MUST）。

#### Scenario: 同じ図鑑で同じ番号を 2 回登録できない

- **WHEN** `(pokedex_id=national_id, pokedex_number=1)` の行を 2 回 insert する
- **THEN** 2 回目で UNIQUE 制約違反エラーになる

#### Scenario: 同じ図鑑で同じ species を 2 回登録できない

- **WHEN** `(pokedex_id=paldea_id, species_id=25)` の行を 2 回 insert する
- **THEN** 2 回目で UNIQUE 制約違反エラーになる

#### Scenario: 別の図鑑なら同じ species を登録できる

- **WHEN** `(pokedex_id=national_id, species_id=25)` と `(pokedex_id=paldea_id, species_id=25)` を順に insert する
- **THEN** 両方成功する

#### Scenario: form_id が NULL 許容で forms を参照する

- **WHEN** 生成された SQL を読む
- **THEN** `pokedex_entries.form_id` 列が `forms(id)` を REFERENCES し、NOT NULL 制約が **付いていない**

#### Scenario: form_id を NULL で登録できる

- **WHEN** `(pokedex_id=national_id, species_id=25, pokedex_number=25, form_id=null)` を insert する
- **THEN** 成功する

#### Scenario: form_id にパルデア用のオーガポン形態を指定して登録できる

- **WHEN** Paldea 図鑑の Ogerpon エントリで `form_id=ogerpon_teal_form_id` を指定して insert する
- **THEN** 成功し、当該エントリの form_id が teal 形態を指している

#### Scenario: form_id が NULL の entry は is_default form をデフォルト表示する

- **WHEN** API / UI が `pokedex_entries.form_id` が NULL の entry を表示する
- **THEN** 当該 species の `forms.is_default = true` の form 情報を取得して表示に使う
