# shared-contracts Specification

## Purpose
TBD - created by archiving change add-monorepo-foundation. Update Purpose after archive.
## Requirements
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

### Requirement: ドメイン分類値の export（FormCategory）

`@pokedex/contracts` はフォームの分類値を `FormCategory` という `as const` オブジェクト + 型エイリアスとして export しなければならない（MUST）。許容値は `'normal' | 'regional' | 'mega' | 'mega-x' | 'mega-y' | 'gigantamax' | 'tera' | 'other'` の 8 値でなければならない（MUST）。

#### Scenario: FormCategory に 8 値が含まれる

- **WHEN** `import { FormCategory } from '@pokedex/contracts'` し、`Object.values(FormCategory)` を取得する
- **THEN** 8 値 `['normal', 'regional', 'mega', 'mega-x', 'mega-y', 'gigantamax', 'tera', 'other']` が含まれる

#### Scenario: FormCategory 型が未定義の値を拒否する

- **WHEN** TS で `const x: FormCategory = 'unknown-category'` のように代入を試みる
- **THEN** TypeScript の型エラーが発生する

#### Scenario: FormCategory が as const で凍結されている

- **WHEN** TS で `FormCategory.NORMAL` の型を取得する
- **THEN** リテラル型 `'normal'` として推論される

### Requirement: ドメイン分類値の export（Locale）

`@pokedex/contracts` は多言語名テーブルが扱う言語コードを `Locale` という `as const` オブジェクト + 型エイリアスとして export しなければならない（MUST）。本 change 時点での許容値は `'ja' | 'en'` の 2 値とし、将来 `'fr' | 'de' | 'it' | 'es' | 'ko' | 'zh-Hans' | 'zh-Hant'` を順次追加できる構造でなければならない（MUST）。

#### Scenario: Locale に最低 2 値（ja, en）が含まれる

- **WHEN** `import { Locale } from '@pokedex/contracts'` し、値を列挙する
- **THEN** `'ja'` と `'en'` の 2 つが最低含まれる

#### Scenario: Locale 型が未定義の値を拒否する

- **WHEN** TS で `const l: Locale = 'xx'` のように代入を試みる
- **THEN** TypeScript の型エラーが発生する

### Requirement: ドメイン分類値の export（SpriteGender / SpriteKind）

`@pokedex/contracts` はスプライトの性別・種別を、それぞれ `SpriteGender`（`'male' | 'female' | 'unknown'`）、`SpriteKind`（`'default' | 'shiny' | 'back' | 'back_shiny'`）として export しなければならない（MUST）。

#### Scenario: SpriteGender に 3 値が含まれる

- **WHEN** `import { SpriteGender } from '@pokedex/contracts'` し、`Object.values(SpriteGender)` を取得する
- **THEN** `'male'`、`'female'`、`'unknown'` の 3 値が含まれる

#### Scenario: SpriteKind に 4 値が含まれる

- **WHEN** `import { SpriteKind } from '@pokedex/contracts'` し、`Object.values(SpriteKind)` を取得する
- **THEN** `'default'`、`'shiny'`、`'back'`、`'back_shiny'` の 4 値が含まれる

#### Scenario: SpriteGender 型が未定義の値を拒否する

- **WHEN** TS で `const g: SpriteGender = 'other'` のように代入を試みる
- **THEN** TypeScript の型エラーが発生する

#### Scenario: SpriteKind 型が未定義の値を拒否する

- **WHEN** TS で `const k: SpriteKind = 'thumbnail'` のように代入を試みる
- **THEN** TypeScript の型エラーが発生する

### Requirement: 分類値の非空タプル export

`@pokedex/contracts` は各分類値の **非空 readonly タプル** を `FORM_CATEGORY_VALUES` / `LOCALE_VALUES` / `SPRITE_GENDER_VALUES` / `SPRITE_KIND_VALUES` として export しなければならない（MUST）。これらは drizzle-orm の `pgEnum` などが要求する non-empty readonly tuple 型を満たし、`no-unsafe-type-assertion` 違反なしに値配列を渡せる用途に使う。同名のオブジェクト export (`FormCategory` 等) との値集合は `satisfies` で型保証される（MUST）。

#### Scenario: FORM_CATEGORY_VALUES が FormCategory と同じ値集合を持つ

- **WHEN** `import { FORM_CATEGORY_VALUES, FormCategory } from '@pokedex/contracts'` し、両者の値集合を比較する
- **THEN** `[...FORM_CATEGORY_VALUES].sort()` と `Object.values(FormCategory).sort()` が等価

#### Scenario: FORM_CATEGORY_VALUES の型が readonly tuple として推論される

- **WHEN** TS で `typeof FORM_CATEGORY_VALUES` を取得する
- **THEN** `readonly ['normal', 'regional', ...]` のような non-empty readonly tuple 型として推論される

#### Scenario: LOCALE_VALUES / SPRITE_GENDER_VALUES / SPRITE_KIND_VALUES も同様に export される

- **WHEN** `import { LOCALE_VALUES, SPRITE_GENDER_VALUES, SPRITE_KIND_VALUES } from '@pokedex/contracts'`
- **THEN** いずれも型エラーなく解決され、対応するオブジェクト export と値集合が一致する

### Requirement: 単一エントリポイントからの追加 export

ドメイン分類値（`FormCategory` / `Locale` / `SpriteGender` / `SpriteKind`）はすべて `@pokedex/contracts` の単一エントリポイントから import 可能でなければならない（MUST）。サブパス import は提供してはならない（MUST NOT）。

#### Scenario: 4 分類値が単一 import で解決される

- **WHEN** `import { FormCategory, Locale, SpriteGender, SpriteKind } from '@pokedex/contracts'` する
- **THEN** すべて型エラーなく解決される

