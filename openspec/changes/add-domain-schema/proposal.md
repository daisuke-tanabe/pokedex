## Why

`add-monorepo-foundation` で API サーバ・DB クライアント・共有契約・Supabase ローカルスタックの土台は揃ったが、ドメインのデータモデルがまだ存在しないため、検索 API も Web/Mobile 一覧画面も着手できない。本 change で **「ポケモンの多様性を網羅的に表現する」** という本プロジェクトの目的に合わせた DB スキーマを Drizzle ORM で定義し、マイグレーションと最小のシードデータ投入機構までを一気に整える。ここまでやれば、以降の `add-search-api` / `add-web-listing` / `add-mobile-listing` は全て垂直スライスで進められる。

## What Changes

- `apps/api/src/db/schema/` にドメインテーブルを Drizzle ORM で定義する
  - `locales`（多言語名で参照される言語コード lookup。`code` PK + `name`）
  - `types` / `type_names`（タイプとその多言語名）
  - `regions` / `region_names`（地方とその多言語名）
  - `pokedexes` / `pokedex_names`（図鑑カタログとその多言語名。`region_id` で「どの地方の図鑑か」を表現し、パルデア・キタカミ・ブルーベリーは独立した行として持つ）
  - `evolution_chains`（進化系統のグルーピング単位。属性は将来追加できるよう `id` のみで開始。**進化系統が存在する species だけがチェーン行を持つ**）
  - `species` / `species_names`（ポケモン種族とその多言語名。`national_dex_number` を保持し、`evolution_chain_id` で同系統をグルーピング。`evolution_chain_id` は **NULL 許容** で進化しない単独種族は NULL）
  - `species_evolutions`（進化前後の species 間の自己参照。進化条件は持たず、後で拡張可能にしておく）
  - `forms` / `form_names`（フォーム実体と多言語名。`category` で normal / regional / mega / mega-x / mega-y / gigantamax / tera / other を区別）
  - `form_types`（フォーム × タイプの中間テーブル。`(form_id, slot)` を複合主キーにして、同一スロット重複と同一フォームでのタイプ重複を防ぐ）
  - `form_sprites`（フォーム × 性別 × 種別 × URL。`(form_id, gender, kind)` で一意。`url` は Supabase Storage の相対パスを格納。**本 change では placeholder 文字列**で構わない。実画像投入は後続 `add-sprite-assets` change で対応）
  - `pokedex_entries`（図鑑ごとの図鑑番号。`(pokedex_id, pokedex_number)` で一意、`(pokedex_id, species_id)` で同一図鑑への species 重複登録を防ぐ。`form_id`（NULL 許容、`forms.id` FK）で「その図鑑で表示するフォーム」を指定できる）
- 命名規約として **物理名は snake_case + 複数形、TS シンボルは camelCase、TS 型は PascalCase + 単数形** を全テーブルで徹底する
- ドメイン名の選択は「種族 = `species`」「フォーム = `forms`」とし、API レイヤで pokemon という語彙を使うときはレスポンス組み立て層でマップする
- 中間テーブルは **属性が 1 つでも乗るならドメイン名で命名** する規約（`pokedex_entries`、`form_types`、`form_sprites`、`species_evolutions`、`*_names`）を採用し、design.md に明文化する
- `drizzle-kit generate` を初めて走らせ、`supabase/migrations/` に SQL マイグレーションを 1 ファイル生成する。命名は Supabase CLI が認識するタイムスタンプ + name 形式に揃える
- `supabase db reset` でローカル DB がマイグレーション + シードまで一通り構築できる状態にする
- 最小シードデータ（JSON ファイル）と、JSON を読み込んで DB にインサートする `pnpm --filter @pokedex/api seed` スクリプトを追加する
  - 本 change は **「seed.ts と invariants が動く最小デモデータ」** に絞る（数十件規模）。フォーム多様性の代表パターン（多形態種・複数カテゴリ）を含めることで設計の妥当性を実証する
  - 100+ フォームの本番網羅シードは後続 `add-pokedex-seed-data` change（仮称）で別途投入する想定
  - 性別差は `form_sprites.gender` で表現する
- ドメイン不変条件チェック（**Invariant Tests**）を vitest で実装する
  - `form_types` に同一フォーム × 同一スロットが 2 行以上存在しないこと
  - `form_types` に同一フォーム × 同一タイプが 2 行以上存在しないこと
  - `pokedex_entries` の `(pokedex_id, pokedex_number)` および `(pokedex_id, species_id)` がそれぞれ一意であること
  - `species_evolutions` の `from_species_id` と `to_species_id` が同一でないこと
  - `species_evolutions` に登場する species は必ず非 NULL の `evolution_chain_id` を持ち、`from` と `to` が同じ `evolution_chain_id` を共有すること
  - `pokedex_entries.form_id` が非 NULL の場合、その form の `species_id` が `pokedex_entries.species_id` と一致すること
  - 全 `*_names` テーブルで `(参照ID, locale)` が一意で、`locale` が `locales.code` に存在する値であること
- `apps/api/drizzle.config.ts` の `schema` を実ファイル（`./src/db/schema/index.ts`）に向け、`out: '../../supabase/migrations'` の生成パスが Supabase CLI と整合することを実機で確認する
- `packages/contracts` に **ドメインの公開型**（`FormCategory` / `Locale` / `SpriteGender` / `SpriteKind` の分類値）を追加し、API レスポンスや後続 Web/Mobile からの参照を一元化する。`Locale` は contracts と DB の `locales` テーブルの両方で同じ値集合を維持する

## Capabilities

### New Capabilities

- `domain-schema`: ポケモン図鑑ドメインのテーブル定義・Drizzle スキーマ・マイグレーション生成・命名規約・主キー/外部キー制約・ドメイン不変条件を提供する能力。`add-search-api` 以降が依存する全テーブルとその整合性をここで規定する。
- `domain-seed`: ドメイン初期データ（JSON ファイル）と、JSON → DB へのシード投入スクリプト、および不変条件を検証するテストを提供する能力。`supabase db reset` でローカル DB が即座に検証可能な状態になることを保証する。

### Modified Capabilities

- `shared-contracts`: ドメイン分類値（`FormCategory` / `Locale` / `SpriteGender` / `SpriteKind`）の `as const` オブジェクト + 型エイリアスを追加する。既存のレスポンスエンベロープ・エラーコード・ドメイン定数は変更しない。

## Impact

- 影響範囲: `apps/api/src/db/`、`apps/api/drizzle.config.ts`、`supabase/migrations/`、`packages/contracts/src/`
- 新規依存: なし（既存の `drizzle-orm` / `drizzle-kit` / `postgres` / `valibot` のみで完結）
- 既存 API: `GET /health` は影響を受けない。`AppType` の型形状にも変更なし
- 後続 change への前提: `add-search-api` は本 change のテーブル定義に直接依存する。テーブル名・カラム名・主キー・外部キーを後から変えると検索 API の再書き換えが必要になるため、本 change で命名と制約を確定させる
