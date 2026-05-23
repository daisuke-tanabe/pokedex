## ADDED Requirements

### Requirement: forms シードの isDefault フィールド

`apps/api/src/db/seed/data/forms.json` の各エントリは **`isDefault: boolean`** フィールドを持たなければならない（MUST）。各 `speciesSlug` に対し `isDefault: true` のエントリが **exactly 1 件** 存在しなければならない（MUST）。`apps/api/src/db/seed/schemas/index.ts` の valibot 側でも `formRowSchema` に `isDefault: v.boolean()` を必須フィールドとして追加しなければならない（MUST）。

#### Scenario: forms.json の全エントリに isDefault フィールドが存在する

- **WHEN** `forms.json` を読み込み、`formsFileSchema` で valibot パースする
- **THEN** 全エントリで `isDefault` フィールドが boolean として解決される

#### Scenario: 各 species に isDefault = true のエントリが 1 件だけ存在する

- **WHEN** `forms.json` の全エントリを `speciesSlug` でグルーピングし、各グループの `isDefault: true` のエントリ数を集計する
- **THEN** すべてのグループで `isDefault: true` のエントリ数が exactly 1 件である

### Requirement: forms シードの slug 短縮形規約

`apps/api/src/db/seed/data/forms.json` の `slug` 値は **species 名を含まない短縮形** で記述されなければならない（MUST）。具体的には以下の規約に従う:

- 通常フォーム（`isDefault = true` の form）の slug は対応する species_slug と同じ短縮 slug を採用する（例: bulbasaur の通常 form は `slug: 'bulbasaur'`）。ただし通常形態に複数の候補がある species（例: terapagos の `normal` と `stellar`）では `slug: 'normal'` を採用する
- 非通常フォームの slug は species 名を含まない属性名のみで表現する（例: `'mega-x'`, `'mega-y'`, `'alola'`, `'teal'`, `'wellspring'`, `'cosplay'`, `'heat'`, `'wash'` 等）

`apps/api/src/db/seed/data/pokedexes.json` の `formSlug` 参照も同じ短縮形に追随しなければならない（MUST）。

#### Scenario: forms.json の slug が species_slug を prefix として含まない（通常フォームを除く）

- **WHEN** `forms.json` の全エントリで `speciesSlug` と `slug` を比較する
- **THEN** 非通常フォーム (`isDefault = false`) の slug は対応する species_slug を prefix として含まない

#### Scenario: pokedexes.json の formSlug が forms.json と一致する短縮形である

- **WHEN** `pokedexes.json` の `entries[].formSlug` を全件抽出する
- **THEN** いずれも `forms.json` 内で `(speciesSlug, slug)` 組として存在する

### Requirement: 不変条件 - 全 species に default フォームが exactly 1 件存在する

`apps/api/src/db/seed/invariants.ts` および `invariants.test.ts` は、シード適用後の DB に対して **「全 `species` 行に対し `forms` テーブルで `is_default = true` の行が exactly 1 件存在する」** を検証しなければならない（MUST）。違反があれば違反 species 数を含むエラーメッセージを返し、`seed()` のトランザクション内で例外を投げてロールバックさせる。

#### Scenario: 全 species にデフォルトフォームが存在する

- **WHEN** `species LEFT JOIN forms ON forms.species_id = species.id AND forms.is_default = true` で `forms.id IS NULL` の行を数える
- **THEN** 0 件である

#### Scenario: default フォームが複数ある species は DB 制約で先に弾かれる

- **WHEN** invariants 実行前に同 species に対し `is_default = true` を 2 件 insert しようと試みる
- **THEN** DB の部分 UNIQUE 制約違反で先にエラーになる（invariants まで到達しない）

## MODIFIED Requirements

### Requirement: シードスクリプトのコマンド

`pnpm --filter @pokedex/api seed` で `apps/api/src/db/seed/seed.ts` が起動できなければならない（MUST）。スクリプトは `DATABASE_URL` を参照し、対象 DB に対して以下を **単一トランザクション内** で順に実行しなければならない（MUST）:

1. 既存データを全削除する `clearAll`
2. 親テーブル（`locales` / `types` / `regions` / `pokedexes` / `evolution_chains` / `species`）を insert
3. 子テーブル（`species_names` / `species_evolutions` / `forms`（**`is_default` 列を含む**）/ `form_names` / `form_types` / `form_sprites` / `pokedex_entries` / `type_names` / `region_names` / `pokedex_names`）を insert
4. Invariant Tests（既存 7 件 + 本 change で追加する「全 species に default 1 件」を含む 8 件）を実行

トランザクション内で例外が発生した場合は **全体がロールバックされ**、DB は seed 開始前の状態（直前の `clearAll` も含めて巻き戻る）か、本セッション開始時点の整合性ある状態のままでなければならない（MUST）。失敗時はプロセス終了コード `1` で終了しなければならない（MUST）。

#### Scenario: seed コマンドが pnpm スクリプトとして登録されている

- **WHEN** `apps/api/package.json` の `scripts.seed` を確認する
- **THEN** `tsx ./src/db/seed/seed.ts`（または equivalent）を呼ぶコマンドが定義されている

#### Scenario: seed コマンドが正常終了する

- **WHEN** ローカル Supabase 起動状態で `pnpm --filter @pokedex/api seed` を実行する
- **THEN** プロセスが終了コード `0` で終わる

#### Scenario: JSON の必須キー欠落で seed コマンドが終了コード 1 で終わる

- **WHEN** `forms.json` の 1 エントリから `category` キーまたは `isDefault` キーを削除して `pnpm --filter @pokedex/api seed` を実行する
- **THEN** valibot パースエラーをログに出した上で、プロセスが終了コード `1` で終わる

#### Scenario: 途中で挿入が失敗するとトランザクション全体がロールバックされる

- **WHEN** seed 処理の途中（例: `forms` 挿入後、`pokedex_entries` 挿入時）で意図的に例外を発生させる
- **THEN** トランザクションがロールバックされ、`forms` テーブルに 1 行も残らない（=「成功した insert」も全部巻き戻る）
