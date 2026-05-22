## ADDED Requirements

### Requirement: パッケージとしての公開

`packages/contracts` は `@pokedex/contracts` という名前の workspace パッケージとして公開されなければならない（MUST）。`apps/*` からは workspace dependency 経由で import できなければならない（MUST）。

#### Scenario: workspace dependency で解決される

- **WHEN** `apps/api/package.json` に `"@pokedex/contracts": "workspace:*"` を追加して `pnpm install` を実行する
- **THEN** `apps/api` から `import { ... } from '@pokedex/contracts'` で型・値の両方が解決できる

### Requirement: レスポンスエンベロープの Valibot スキーマ

`@pokedex/contracts` は API レスポンスのエンベロープ形式を Valibot スキーマとして提供しなければならない（MUST）。スキーマは「成功（`success: true` + `data` + `meta?`）」「失敗（`success: false` + `error.code` + `error.message`）」の判別可能ユニオンとして定義されなければならない（MUST）。

#### Scenario: 成功エンベロープのバリデーションが通る

- **WHEN** `parse(envelopeSchema(string()), { success: true, data: 'hello' })` を呼ぶ
- **THEN** 例外を投げずに同じ値が返る

#### Scenario: meta 付き成功エンベロープのバリデーションが通る

- **WHEN** `parse(envelopeSchema(array(number())), { success: true, data: [1, 2], meta: { total: 2, page: 1, limit: 30 } })` を呼ぶ
- **THEN** 例外を投げずに同じ値が返る

#### Scenario: 失敗エンベロープのバリデーションが通る

- **WHEN** `parse(envelopeSchema(string()), { success: false, error: { code: 'INVALID_QUERY', message: 'invalid' } })` を呼ぶ
- **THEN** 例外を投げずに同じ値が返る

#### Scenario: success と error/data が両立する不正値を弾く

- **WHEN** `parse(envelopeSchema(string()), { success: true, error: { code: 'X', message: 'y' } })` を呼ぶ
- **THEN** Valibot のバリデーション例外が投げられる

#### Scenario: error.code が未定義のエラーコードならバリデーションエラー

- **WHEN** `parse(envelopeSchema(string()), { success: false, error: { code: 'UNKNOWN_CODE', message: 'x' } })` を呼ぶ
- **THEN** Valibot のバリデーション例外が投げられる

### Requirement: ドメイン定数の export

`@pokedex/contracts` はプロダクト共通のドメイン定数を named export で提供しなければならない（MUST）。具体的には `PAGE_SIZE`、`MAX_TYPES`、`DEFAULT_POKEDEX_SLUG` の 3 つを最小セットとして export しなければならない（MUST）。

#### Scenario: PAGE_SIZE は 30 である

- **WHEN** `import { PAGE_SIZE } from '@pokedex/contracts'` する
- **THEN** `PAGE_SIZE` の値は数値の `30` である

#### Scenario: MAX_TYPES は 2 である

- **WHEN** `import { MAX_TYPES } from '@pokedex/contracts'` する
- **THEN** `MAX_TYPES` の値は数値の `2` である

#### Scenario: DEFAULT_POKEDEX_SLUG は 'national' である

- **WHEN** `import { DEFAULT_POKEDEX_SLUG } from '@pokedex/contracts'` する
- **THEN** `DEFAULT_POKEDEX_SLUG` の値は文字列の `'national'` である

#### Scenario: ドメイン定数は読み取り専用として宣言される

- **WHEN** TypeScript でドメイン定数の型を取得する
- **THEN** リテラル型（`30` / `2` / `'national'`）として推論される

### Requirement: エラーコード enum の export

`@pokedex/contracts` は API がレスポンスエンベロープの `error.code` に載せる識別子を、TypeScript の `as const` リテラルユニオンとして export しなければならない（MUST）。最小セットとして `POKEDEX_NOT_FOUND` と `INVALID_QUERY` を含まなければならない（MUST）。

#### Scenario: ErrorCode に POKEDEX_NOT_FOUND と INVALID_QUERY が含まれる

- **WHEN** `import { ErrorCode } from '@pokedex/contracts'` し、その値を列挙する
- **THEN** `'POKEDEX_NOT_FOUND'` と `'INVALID_QUERY'` の少なくとも 2 つが含まれる

#### Scenario: ErrorCode 型は未定義の文字列を拒否する

- **WHEN** TypeScript で `const code: ErrorCode = 'NOT_AN_ERROR_CODE'` のように代入を試みる
- **THEN** TypeScript の型エラーが発生する

### Requirement: 単一エントリポイント

`@pokedex/contracts` の利用者は `import { ... } from '@pokedex/contracts'` だけで全 export にアクセスできなければならない（MUST）。サブパス import（`@pokedex/contracts/schemas/envelope` 等）は提供してはならない（MUST NOT）。

#### Scenario: 単一 import で全シンボルが解決できる

- **WHEN** `import { envelopeSchema, PAGE_SIZE, MAX_TYPES, DEFAULT_POKEDEX_SLUG, ErrorCode } from '@pokedex/contracts'` する
- **THEN** すべてのシンボルが型エラーなく解決される
