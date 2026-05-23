# pokemon-api Specification

## Purpose

`apps/api` におけるポケモン検索・一覧・詳細エンドポイント (`GET /api/pokemon`, `GET /api/pokemon/:slug`) を提供する能力を規定する。図鑑スラッグおよびタイプ AND による絞り込み、`(pokedex_number, form_id)` 複合キーに基づく cursor ベースの無限スクロール、`forms.is_default = true` を尊重した詳細レスポンスを含む。route 層は Repository interface のみに依存し、本番では Drizzle 実装・テストでは mock 実装を注入できる構造とする。エラーレスポンスは `INVALID_QUERY` / `POKEMON_NOT_FOUND` / `INTERNAL_ERROR` を規約通り使い分け、検索ホットパスの FK 列には B-tree インデックスを付与する。

## Requirements
### Requirement: ポケモン検索・一覧エンドポイント

`GET /api/pokemon` は図鑑スラッグおよびタイプ AND 検索条件を受け取り、ポケモン一覧を全国図鑑番号昇順かつ cursor ベースの無限スクロール形式で返さなければならない（MUST）。レスポンスは成功エンベロープに `data: items[]` と `meta.nextCursor` を含めなければならない（MUST）。

#### Scenario: 既定パラメータで全国図鑑昇順 1 ページを返す

- **WHEN** `GET /api/pokemon` を呼び出す
- **THEN** HTTP 200 と `{ success: true, data: items, meta: { nextCursor } }` を返し、`items` は `PAGE_SIZE` 件以下で `pokedex_number` 昇順に並んでいる

#### Scenario: pokedex クエリで図鑑を切り替える

- **WHEN** `GET /api/pokemon?pokedex=paldea` を呼び出す
- **THEN** HTTP 200 と Paldea 図鑑に属する form のみが含まれた items が返る

#### Scenario: types で単一タイプを検索する

- **WHEN** `GET /api/pokemon?types=fire` を呼び出す
- **THEN** HTTP 200 と `fire` タイプを持つ form のみが含まれた items が返る

#### Scenario: types で複数タイプを AND 検索する

- **WHEN** `GET /api/pokemon?types=fire,flying` を呼び出す
- **THEN** HTTP 200 と `fire` と `flying` の両方を持つ form のみが含まれた items が返る

#### Scenario: cursor を渡すと続きから取得する

- **WHEN** 直前の応答で受け取った `meta.nextCursor` を `cursor` クエリに付けて再度呼び出す
- **THEN** 直前の応答の最終 item よりも `(pokedex_number, form_id)` が大きい items のみが返る

#### Scenario: 検索条件に該当が 0 件のとき空配列で 200 を返す

- **WHEN** ヒットしない検索条件（例: 存在する型だがその組み合わせが 0 件）で呼び出す
- **THEN** HTTP 200 と `{ success: true, data: [], meta: { nextCursor: null } }` を返す

#### Scenario: 取得可能な末尾ページでは nextCursor が null になる

- **WHEN** 末尾ページに到達するまで cursor を辿る
- **THEN** 最終ページのレスポンスは `meta.nextCursor === null` となる

#### Scenario: limit クエリで取得件数を変更する

- **WHEN** `GET /api/pokemon?limit=5` を呼び出す
- **THEN** HTTP 200 と最大 5 件の items が返る

#### Scenario: 不正な cursor 文字列で 400 を返す

- **WHEN** `GET /api/pokemon?cursor=not-base64url-payload` を呼び出す
- **THEN** HTTP 400 と `{ success: false, error: { code: 'INVALID_QUERY' } }` を返す

#### Scenario: 未知の pokedex スラッグで 400 を返す

- **WHEN** `GET /api/pokemon?pokedex=non-existent` を呼び出す
- **THEN** HTTP 400 と `{ success: false, error: { code: 'INVALID_QUERY' } }` を返す

#### Scenario: 未知の type スラッグで 400 を返す

- **WHEN** `GET /api/pokemon?types=fire,nonexistent` を呼び出す
- **THEN** HTTP 400 と `{ success: false, error: { code: 'INVALID_QUERY' } }` を返す

#### Scenario: types の件数が MAX_TYPES を超えると 400 を返す

- **WHEN** `MAX_TYPES + 1` 個のタイプを `types` クエリに含めて呼び出す
- **THEN** HTTP 400 と `{ success: false, error: { code: 'INVALID_QUERY' } }` を返す

#### Scenario: 一覧 item は default form 情報を返す

- **WHEN** `pokedex_entries.form_id` が NULL の species を含む一覧を取得する
- **THEN** 当該 species に対する item の form 情報は `forms.is_default = true` の form から取得されている

### Requirement: ポケモン詳細エンドポイント

`GET /api/pokemon/:slug` は species スラッグを受け取り、対応する species と default form、進化チェーン、sprites、多言語 names、types を含む詳細レスポンスを返さなければならない（MUST）。未知の slug に対しては HTTP 404 と `POKEMON_NOT_FOUND` を返さなければならない（MUST）。

#### Scenario: 既存スラッグで詳細を返す

- **WHEN** `GET /api/pokemon/pikachu` を呼び出す
- **THEN** HTTP 200 と `{ success: true, data: { species, form, sprites, names, types, evolutions } }` を返す

#### Scenario: 返す form は is_default = true のもの

- **WHEN** 複数 form を持つ species（例: charizard）の詳細を取得する
- **THEN** レスポンスの `form` は `is_default = true` の form である

#### Scenario: 多言語名が含まれる

- **WHEN** 既存スラッグの詳細を取得する
- **THEN** `names` は最低 `ja` と `en` の 2 ロケール分のエントリを含む

#### Scenario: 進化チェーンが含まれる

- **WHEN** 進化を持つ species（例: charmander）の詳細を取得する
- **THEN** `evolutions` は当該 species を含む進化チェーン全体の species 配列を含む

#### Scenario: 未知スラッグで 404 + POKEMON_NOT_FOUND を返す

- **WHEN** `GET /api/pokemon/non-existent-slug` を呼び出す
- **THEN** HTTP 404 と `{ success: false, error: { code: 'POKEMON_NOT_FOUND' } }` を返す

### Requirement: Cursor の opaque エンコーディング

ポケモン一覧 API は cursor を `(pokedex_number, form_id)` 複合キーから生成し、base64url エンコードされた opaque トークンとして返さなければならない（MUST）。クライアントは cursor の内部構造に依存してはならない（MUST NOT）。

#### Scenario: encode された cursor は base64url 形式の文字列である

- **WHEN** ある `(pokedex_number, form_id)` ペアを cursor として encode する
- **THEN** 得られる文字列は `/^[A-Za-z0-9_-]+$/` の base64url 文字集合のみで構成される

#### Scenario: encode/decode はラウンドトリップする

- **WHEN** 任意の `(pokedex_number, form_id)` を encode し、即座に decode する
- **THEN** 元の `(pokedex_number, form_id)` が完全に復元される

#### Scenario: 不正な base64url 文字列を decode すると失敗する

- **WHEN** 不正な文字を含む cursor 文字列を decode する
- **THEN** 例外がスローされる、もしくは null/エラーが返る

#### Scenario: 必須キーが欠ける payload を decode すると失敗する

- **WHEN** `{ pn: 1 }` のみ（`fid` 欠落）を base64url 化して decode する
- **THEN** 例外がスローされる、もしくは null/エラーが返る

### Requirement: Repository 層によるデータアクセス抽象化

`apps/api/src/repositories/pokemon.ts` はポケモン取得のための interface を定義し、route 層は interface のみに依存しなければならない（MUST）。本番では Drizzle 実装、テストでは mock 実装を注入可能でなければならない（MUST）。

#### Scenario: route 層は repository interface に依存する

- **WHEN** route のソースコードを静的に解析する
- **THEN** route は具体的な `db` シンボルや Drizzle helper を直接 import せず、`PokemonRepository` interface 型のみに依存している

#### Scenario: テストで mock repository を注入できる

- **WHEN** route のテストで mock repository を渡してリクエストを発行する
- **THEN** DB に接続することなくレスポンスが組み立てられる

#### Scenario: 本番では real repository が注入される

- **WHEN** `apps/api/src/index.ts` を起動する
- **THEN** route には Drizzle 実装の repository が渡される

### Requirement: エラーレスポンスのコード使い分け

ポケモン API のエラーレスポンスは `INVALID_QUERY` / `POKEMON_NOT_FOUND` / `INTERNAL_ERROR` を以下の規則で使い分けなければならない（MUST）:

- クエリパラメータの構造・値不正（cursor、limit、pokedex slug、type slug）→ `INVALID_QUERY`（HTTP 400）
- 詳細エンドポイントで `:slug` が存在しない → `POKEMON_NOT_FOUND`（HTTP 404）
- 想定外例外（DB 接続失敗、SQL エラー等）→ `INTERNAL_ERROR`（HTTP 500）
- 検索結果が 0 件 → エラーではなく成功レスポンスに空配列を返す

#### Scenario: 検索結果 0 件はエラーではない

- **WHEN** マッチが 0 件になる検索条件で `GET /api/pokemon` を呼び出す
- **THEN** HTTP 200 と `{ success: true, data: [], meta: { nextCursor: null } }` を返す（404 ではない）

#### Scenario: cursor 不正は INVALID_QUERY

- **WHEN** decode できない cursor で呼び出す
- **THEN** HTTP 400 と `error.code === 'INVALID_QUERY'` を返す

#### Scenario: 詳細 slug 不在は POKEMON_NOT_FOUND

- **WHEN** 未知の species slug で詳細を取得する
- **THEN** HTTP 404 と `error.code === 'POKEMON_NOT_FOUND'` を返す

#### Scenario: 想定外例外は INTERNAL_ERROR

- **WHEN** repository が想定外例外をスローした状況をシミュレートする
- **THEN** HTTP 500 と `error.code === 'INTERNAL_ERROR'` を返す

### Requirement: 検索ホットパスの FK インデックス

`supabase/migrations/0002_add_search_indexes.sql` は検索クエリのホットパスで利用される FK 列に対して B-tree インデックスを追加しなければならない（MUST）。

#### Scenario: pokedex_entries(pokedex_id) インデックスが存在する

- **WHEN** migration 0002 の生成 SQL を読む
- **THEN** `CREATE INDEX` 文に `pokedex_entries` テーブルの `pokedex_id` 列のみを対象とした宣言が含まれる

#### Scenario: pokedex_entries(form_id) インデックスが存在する

- **WHEN** migration 0002 の生成 SQL を読む
- **THEN** `CREATE INDEX` 文に `pokedex_entries` テーブルの `form_id` 列のみを対象とした宣言が含まれる

#### Scenario: form_types(form_id) インデックスが存在する

- **WHEN** migration 0002 の生成 SQL を読む
- **THEN** `CREATE INDEX` 文に `form_types` テーブルの `form_id` 列のみを対象とした宣言が含まれる

#### Scenario: form_types(type_id) インデックスが存在する

- **WHEN** migration 0002 の生成 SQL を読む
- **THEN** `CREATE INDEX` 文に `form_types` テーブルの `type_id` 列のみを対象とした宣言が含まれる

#### Scenario: form_sprites(form_id) インデックスが存在する

- **WHEN** migration 0002 の生成 SQL を読む
- **THEN** `CREATE INDEX` 文に `form_sprites` テーブルの `form_id` 列のみを対象とした宣言が含まれる

#### Scenario: form_names(form_id) インデックスが存在する

- **WHEN** migration 0002 の生成 SQL を読む
- **THEN** `CREATE INDEX` 文に `form_names` テーブルの `form_id` 列のみを対象とした宣言が含まれる
