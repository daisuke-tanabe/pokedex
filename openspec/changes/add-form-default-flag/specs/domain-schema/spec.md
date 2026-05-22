## MODIFIED Requirements

### Requirement: forms テーブルと FormCategory

`forms` テーブルは `id`（主キー）、`species_id`（NOT NULL、`species.id` を参照）、`slug`、`category`、**`is_default`（BOOLEAN、NOT NULL、DEFAULT false）** を持たなければならない（MUST）。`(species_id, slug)` は UNIQUE でなければならない（MUST）。`category` 列は pgEnum `form_category` 型で、許容値は `'normal' | 'regional' | 'mega' | 'mega-x' | 'mega-y' | 'gigantamax' | 'tera' | 'other'` に限定されなければならない（MUST）。**`is_default = true` の行は同一 `species_id` ごとに最大 1 件しか存在できない**よう、部分 UNIQUE インデックス（`WHERE is_default = true` ON (`species_id`)）が定義されなければならない（MUST）。`forms.slug` は **species 名を含まない短縮形**（例: `'mega-x'`, `'alola'`, `'teal'`, `'cosplay'`、通常フォームは species_slug と同じ短縮 slug を採用、複数の通常候補がある species は `'normal'` 等を採用）を規約とする（MUST）。

#### Scenario: forms テーブルの物理名

- **WHEN** `forms` Drizzle オブジェクトの物理名を検査する
- **THEN** 文字列 `'forms'` である

#### Scenario: forms.is_default 列が NOT NULL DEFAULT false で定義される

- **WHEN** `forms.isDefault` Drizzle 列オブジェクトの `notNull` と `default` 設定、および生成された SQL を検査する
- **THEN** `notNull` が `true`、`default` が `false`、SQL に `"is_default" boolean DEFAULT false NOT NULL` が含まれる

#### Scenario: 部分 UNIQUE インデックスが (species_id) WHERE is_default = true で定義される

- **WHEN** `drizzle-kit generate` で生成された SQL を読む
- **THEN** `CREATE UNIQUE INDEX ... ON "forms" ("species_id") WHERE "is_default" = true`（または等価な部分インデックス表現）が含まれる

#### Scenario: 同じ species で is_default = true の行を 2 回挿入できない

- **WHEN** 同じ `species_id` で `is_default = true` の行を 2 回 insert する
- **THEN** 2 回目で部分 UNIQUE 制約違反エラーになる

#### Scenario: 同じ species で is_default = false なら複数行 OK

- **WHEN** 同じ `species_id` で `is_default = false` の行を複数 insert する
- **THEN** すべて成功する（メガシンカ等の複数 variant フォームを表現できる）

#### Scenario: 異なる species なら is_default = true を複数 species 分挿入できる

- **WHEN** 異なる `species_id` でそれぞれ `is_default = true` の行を insert する
- **THEN** すべて成功する（species ごとに 1 件ずつ default を持てる）

#### Scenario: form_category enum が 8 値を持つ

- **WHEN** PostgreSQL で `SELECT enum_range(NULL::form_category)` を実行する
- **THEN** 8 値 `{normal, regional, mega, mega-x, mega-y, gigantamax, tera, other}` が返る

#### Scenario: 未定義 category の insert は失敗する

- **WHEN** `forms.category` に `'unknown-form'` を持つ行を insert する
- **THEN** pgEnum の値エラーで失敗する

#### Scenario: 同じ species の同じ slug は二重登録できない

- **WHEN** `(species_id, slug)` が同じ行を 2 回 insert する
- **THEN** 2 回目で UNIQUE 制約違反エラーになる

#### Scenario: forms.slug 規約が species 名を含まない短縮形である

- **WHEN** シード投入後の `forms` テーブルを走査し、各 row の `slug` を確認する
- **THEN** いずれの slug も対応する species_slug を `slug` の prefix として含まない（通常フォームを除く: 通常フォームは species_slug 自体 or `'normal'` を採用）

#### Scenario: form_names に同じ (form_id, locale) は 2 回入らない

- **WHEN** `(form_id=1, locale='ja', name='ピカチュウ')` の行を 2 回 insert する
- **THEN** 2 回目で UNIQUE 制約違反エラーになる
