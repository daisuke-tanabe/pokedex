## MODIFIED Requirements

### Requirement: レスポンスエンベロープの Valibot スキーマ

`@pokedex/contracts` は API レスポンスのエンベロープ形式を Valibot スキーマとして提供しなければならない（MUST）。スキーマは「成功（`success: true` + `data` + `meta?`）」「失敗（`success: false` + `error.code` + `error.message`）」の判別可能ユニオンとして定義されなければならない（MUST）。`envelopeSchema` は data スキーマに加えて任意の meta スキーマを第二引数として受け取れなければならない（MUST）。meta スキーマを省略した場合は従来通り `meta?: unknown` として扱う（MUST）。

#### Scenario: 成功エンベロープのバリデーションが通る

- **WHEN** `parse(envelopeSchema(string()), { success: true, data: 'hello' })` を呼ぶ
- **THEN** 例外を投げずに同じ値が返る

#### Scenario: meta 付き成功エンベロープのバリデーションが通る

- **WHEN** `parse(envelopeSchema(array(number())), { success: true, data: [1, 2], meta: { total: 2, page: 1, limit: 30 } })` を呼ぶ
- **THEN** 例外を投げずに同じ値が返る

#### Scenario: cursor 形式の meta を持つエンベロープのバリデーションが通る

- **WHEN** `parse(envelopeSchema(array(string()), object({ nextCursor: nullable(string()) })), { success: true, data: ['a'], meta: { nextCursor: 'opaque-token' } })` を呼ぶ
- **THEN** 例外を投げずに同じ値が返る

#### Scenario: meta スキーマを渡したとき、スキーマに合わない meta は弾く

- **WHEN** `parse(envelopeSchema(array(string()), object({ nextCursor: nullable(string()) })), { success: true, data: ['a'], meta: { totally: 'wrong' } })` を呼ぶ
- **THEN** Valibot のバリデーション例外が投げられる

#### Scenario: 失敗エンベロープのバリデーションが通る

- **WHEN** `parse(envelopeSchema(string()), { success: false, error: { code: 'INVALID_QUERY', message: 'invalid' } })` を呼ぶ
- **THEN** 例外を投げずに同じ値が返る

#### Scenario: success と error/data が両立する不正値を弾く

- **WHEN** `parse(envelopeSchema(string()), { success: true, error: { code: 'X', message: 'y' } })` を呼ぶ
- **THEN** Valibot のバリデーション例外が投げられる

#### Scenario: error.code が未定義のエラーコードならバリデーションエラー

- **WHEN** `parse(envelopeSchema(string()), { success: false, error: { code: 'UNKNOWN_CODE', message: 'x' } })` を呼ぶ
- **THEN** Valibot のバリデーション例外が投げられる

### Requirement: エラーコード enum の export

`@pokedex/contracts` は API がレスポンスエンベロープの `error.code` に載せる識別子を、TypeScript の `as const` リテラルユニオンとして export しなければならない（MUST）。最小セットとして `POKEDEX_NOT_FOUND`、`POKEMON_NOT_FOUND`、`INVALID_QUERY` を含まなければならない（MUST）。

#### Scenario: ErrorCode に POKEDEX_NOT_FOUND と INVALID_QUERY が含まれる

- **WHEN** `import { ErrorCode } from '@pokedex/contracts'` し、その値を列挙する
- **THEN** `'POKEDEX_NOT_FOUND'` と `'INVALID_QUERY'` の少なくとも 2 つが含まれる

#### Scenario: ErrorCode に POKEMON_NOT_FOUND が含まれる

- **WHEN** `import { ErrorCode } from '@pokedex/contracts'` し、その値を列挙する
- **THEN** `'POKEMON_NOT_FOUND'` が含まれる

#### Scenario: ErrorCode 型は未定義の文字列を拒否する

- **WHEN** TypeScript で `const code: ErrorCode = 'NOT_AN_ERROR_CODE'` のように代入を試みる
- **THEN** TypeScript の型エラーが発生する

## ADDED Requirements

### Requirement: ポケモン API 用クエリスキーマの export

`@pokedex/contracts` は `GET /api/pokemon` 向けのクエリパラメータを表現する Valibot schema を `pokemonListQuerySchema` として export しなければならない（MUST）。許容するクエリは `pokedex`（optional、スラッグ文字列、デフォルト `DEFAULT_POKEDEX_SLUG`）、`types`（optional、カンマ区切り、最大 `MAX_TYPES` 件）、`cursor`（optional、base64url 文字列）、`limit`（optional、`1..100` の整数、デフォルト `PAGE_SIZE`）でなければならない（MUST）。

#### Scenario: 既定値で空のクエリをパースできる

- **WHEN** `parse(pokemonListQuerySchema, {})` を呼ぶ
- **THEN** 例外を投げずに `{ pokedex: 'national', types: [], cursor: undefined, limit: 30 }` 相当の値が返る

#### Scenario: types がカンマ区切りで配列にパースされる

- **WHEN** `parse(pokemonListQuerySchema, { types: 'fire,flying' })` を呼ぶ
- **THEN** `types` が `['fire', 'flying']` として返る

#### Scenario: types が MAX_TYPES を超えるとパースエラーになる

- **WHEN** `MAX_TYPES + 1` 個のタイプを含む文字列をパースする
- **THEN** Valibot のバリデーション例外が投げられる

#### Scenario: limit が範囲外だとパースエラーになる

- **WHEN** `parse(pokemonListQuerySchema, { limit: '0' })` または `{ limit: '101' }` を呼ぶ
- **THEN** Valibot のバリデーション例外が投げられる

### Requirement: ポケモン一覧レスポンスのスキーマ export

`@pokedex/contracts` は一覧 item のレスポンス schema を `pokemonListItemSchema` として、cursor meta を `pokemonListMetaSchema` として export しなければならない（MUST）。`pokemonListMetaSchema` は `{ nextCursor: string | null }` を持たなければならない（MUST）。

#### Scenario: 一覧 item は species と form の最小情報を含む

- **WHEN** `pokemonListItemSchema` の型を取得する
- **THEN** 最低 `speciesSlug`, `formSlug`, `pokedexNumber`, `nameJa`, `types`, `defaultSpriteUrl` を含む

#### Scenario: meta は nextCursor を nullable で持つ

- **WHEN** `parse(pokemonListMetaSchema, { nextCursor: null })` および `{ nextCursor: 'abc' }` を呼ぶ
- **THEN** どちらも例外なく値が返る

### Requirement: ポケモン詳細レスポンスのスキーマ export

`@pokedex/contracts` は詳細レスポンス schema を `pokemonDetailSchema` として export しなければならない（MUST）。`pokemonDetailSchema` は species 情報、default form 情報、多言語 names、sprites、types、進化チェーンを含まなければならない（MUST）。

#### Scenario: 詳細には species と form の双方が含まれる

- **WHEN** `pokemonDetailSchema` の型を取得する
- **THEN** `species`（`slug`, `nationalDexNumber` 等）と `form`（`slug`, `category`, `isDefault` 等）の双方をフィールドとして持つ

#### Scenario: 詳細には進化チェーンが含まれる

- **WHEN** `pokemonDetailSchema` の型を取得する
- **THEN** `evolutions` フィールドが species の配列として定義されている

#### Scenario: 詳細には多言語名と sprites が含まれる

- **WHEN** `pokemonDetailSchema` の型を取得する
- **THEN** `names`（locale 別エントリの配列）と `sprites`（gender × kind の配列）の双方をフィールドとして持つ

### Requirement: 検索 API 用シンボルの単一エントリポイント export

検索 API 関連の追加 schema（`pokemonListQuerySchema` / `pokemonListItemSchema` / `pokemonListMetaSchema` / `pokemonDetailSchema`）はすべて `@pokedex/contracts` の単一エントリポイントから import 可能でなければならない（MUST）。サブパス import は提供してはならない（MUST NOT）。

#### Scenario: 追加 schema が単一 import で解決される

- **WHEN** `import { pokemonListQuerySchema, pokemonListItemSchema, pokemonListMetaSchema, pokemonDetailSchema } from '@pokedex/contracts'` する
- **THEN** すべて型エラーなく解決される
