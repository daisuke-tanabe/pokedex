# shared-contracts Specification

## Purpose

全アプリ (`apps/api` / `apps/web` / `apps/mobile`) が共有する契約を 1 つの workspace パッケージ (`@pokedex/contracts`) に集約する能力を規定する。レスポンスエンベロープの Valibot スキーマ、ドメイン定数 (`PAGE_SIZE` / `MAX_TYPES` / `DEFAULT_POKEDEX_SLUG`)、エラーコード (`ErrorCode`)、ドメイン分類値 enum (`FormCategory` / `Locale` / `SpriteGender` / `SpriteKind` / `PokedexSlug` / `TypeSlug`) と対応する非空タプル (`*_VALUES`) を、単一エントリポイントから提供する。

## Requirements
### Requirement: パッケージとしての公開

`packages/contracts` は `@pokedex/contracts` という名前の workspace パッケージとして公開されなければならない（MUST）。`apps/*` からは workspace dependency 経由で import できなければならない（MUST）。

#### Scenario [integration]: workspace dependency で解決される

- **WHEN** `apps/api/package.json` に `"@pokedex/contracts": "workspace:*"` を追加して `pnpm install` を実行する
- **THEN** `apps/api` から `import { ... } from '@pokedex/contracts'` で型・値の両方が解決できる

### Requirement: レスポンスエンベロープの Valibot スキーマ

`@pokedex/contracts` は API レスポンスのエンベロープ形式を Valibot スキーマとして提供しなければならない（MUST）。スキーマは「成功（`success: true` + `data` + `meta?`）」「失敗（`success: false` + `error.code` + `error.message`）」の判別可能ユニオンとして定義されなければならない（MUST）。`envelopeSchema` は data スキーマに加えて任意の meta スキーマを第二引数として受け取れなければならない（MUST）。meta スキーマを省略した場合は従来通り `meta?: unknown` として扱う（MUST）。

#### Scenario [unit]: 成功エンベロープのバリデーションが通る

- **WHEN** `parse(envelopeSchema(string()), { success: true, data: 'hello' })` を呼ぶ
- **THEN** 例外を投げずに同じ値が返る

#### Scenario [unit]: meta 付き成功エンベロープのバリデーションが通る

- **WHEN** `parse(envelopeSchema(array(number())), { success: true, data: [1, 2], meta: { total: 2, page: 1, limit: 30 } })` を呼ぶ
- **THEN** 例外を投げずに同じ値が返る

#### Scenario [unit]: cursor 形式の meta を持つエンベロープのバリデーションが通る

- **WHEN** `parse(envelopeSchema(array(string()), object({ nextCursor: nullable(string()) })), { success: true, data: ['a'], meta: { nextCursor: 'opaque-token' } })` を呼ぶ
- **THEN** 例外を投げずに同じ値が返る

#### Scenario [unit]: meta スキーマを渡したとき、スキーマに合わない meta は弾く

- **WHEN** `parse(envelopeSchema(array(string()), object({ nextCursor: nullable(string()) })), { success: true, data: ['a'], meta: { totally: 'wrong' } })` を呼ぶ
- **THEN** Valibot のバリデーション例外が投げられる

#### Scenario [unit]: 失敗エンベロープのバリデーションが通る

- **WHEN** `parse(envelopeSchema(string()), { success: false, error: { code: 'INVALID_QUERY', message: 'invalid' } })` を呼ぶ
- **THEN** 例外を投げずに同じ値が返る

#### Scenario [unit]: success と error/data が両立する不正値を弾く

- **WHEN** `parse(envelopeSchema(string()), { success: true, error: { code: 'X', message: 'y' } })` を呼ぶ
- **THEN** Valibot のバリデーション例外が投げられる

#### Scenario [unit]: error.code が未定義のエラーコードならバリデーションエラー

- **WHEN** `parse(envelopeSchema(string()), { success: false, error: { code: 'UNKNOWN_CODE', message: 'x' } })` を呼ぶ
- **THEN** Valibot のバリデーション例外が投げられる

### Requirement: ドメイン定数の export

`@pokedex/contracts` はプロダクト共通のドメイン定数を named export で提供しなければならない（MUST）。具体的には `PAGE_SIZE`、`MAX_TYPES`、`DEFAULT_POKEDEX_SLUG` の 3 つを最小セットとして export しなければならない（MUST）。

#### Scenario [unit]: PAGE_SIZE は 30 である

- **WHEN** `import { PAGE_SIZE } from '@pokedex/contracts'` する
- **THEN** `PAGE_SIZE` の値は数値の `30` である

#### Scenario [unit]: MAX_TYPES は 2 である

- **WHEN** `import { MAX_TYPES } from '@pokedex/contracts'` する
- **THEN** `MAX_TYPES` の値は数値の `2` である

#### Scenario [unit]: DEFAULT_POKEDEX_SLUG は 'national' である

- **WHEN** `import { DEFAULT_POKEDEX_SLUG } from '@pokedex/contracts'` する
- **THEN** `DEFAULT_POKEDEX_SLUG` の値は文字列の `'national'` である

#### Scenario [unit]: ドメイン定数は読み取り専用として宣言される

- **WHEN** TypeScript でドメイン定数の型を取得する
- **THEN** リテラル型（`30` / `2` / `'national'`）として推論される

### Requirement: エラーコード enum の export

`@pokedex/contracts` は API がレスポンスエンベロープの `error.code` に載せる識別子を、TypeScript の `as const` リテラルユニオンとして export しなければならない（MUST）。最小セットとして `POKEDEX_NOT_FOUND`、`POKEMON_NOT_FOUND`、`INVALID_QUERY` を含まなければならない（MUST）。

#### Scenario [unit]: ErrorCode に POKEDEX_NOT_FOUND と INVALID_QUERY が含まれる

- **WHEN** `import { ErrorCode } from '@pokedex/contracts'` し、その値を列挙する
- **THEN** `'POKEDEX_NOT_FOUND'` と `'INVALID_QUERY'` の少なくとも 2 つが含まれる

#### Scenario [unit]: ErrorCode に POKEMON_NOT_FOUND が含まれる

- **WHEN** `import { ErrorCode } from '@pokedex/contracts'` し、その値を列挙する
- **THEN** `'POKEMON_NOT_FOUND'` が含まれる

#### Scenario [unit]: ErrorCode 型は未定義の文字列を拒否する

- **WHEN** TypeScript で `const code: ErrorCode = 'NOT_AN_ERROR_CODE'` のように代入を試みる
- **THEN** TypeScript の型エラーが発生する

### Requirement: 単一エントリポイント

`@pokedex/contracts` の利用者は `import { ... } from '@pokedex/contracts'` だけで全 export にアクセスできなければならない（MUST）。サブパス import（`@pokedex/contracts/schemas/envelope` 等）は提供してはならない（MUST NOT）。

#### Scenario [unit]: 単一 import で全シンボルが解決できる

- **WHEN** `import { envelopeSchema, PAGE_SIZE, MAX_TYPES, DEFAULT_POKEDEX_SLUG, ErrorCode } from '@pokedex/contracts'` する
- **THEN** すべてのシンボルが型エラーなく解決される

### Requirement: ドメイン分類値の export（FormCategory）

`@pokedex/contracts` はフォームの分類値を `FormCategory` という `as const` オブジェクト + 型エイリアスとして export しなければならない（MUST）。許容値は `'normal' | 'regional' | 'mega' | 'mega-x' | 'mega-y' | 'gigantamax' | 'tera' | 'other'` の 8 値でなければならない（MUST）。

#### Scenario [unit]: FormCategory に 8 値が含まれる

- **WHEN** `import { FormCategory } from '@pokedex/contracts'` し、`Object.values(FormCategory)` を取得する
- **THEN** 8 値 `['normal', 'regional', 'mega', 'mega-x', 'mega-y', 'gigantamax', 'tera', 'other']` が含まれる

#### Scenario [unit]: FormCategory 型が未定義の値を拒否する

- **WHEN** TS で `const x: FormCategory = 'unknown-category'` のように代入を試みる
- **THEN** TypeScript の型エラーが発生する

#### Scenario [unit]: FormCategory が as const で凍結されている

- **WHEN** TS で `FormCategory.NORMAL` の型を取得する
- **THEN** リテラル型 `'normal'` として推論される

### Requirement: ドメイン分類値の export（Locale）

`@pokedex/contracts` は多言語名テーブルが扱う言語コードを `Locale` という `as const` オブジェクト + 型エイリアスとして export しなければならない（MUST）。本 change 時点での許容値は `'ja' | 'en'` の 2 値とし、将来 `'fr' | 'de' | 'it' | 'es' | 'ko' | 'zh-Hans' | 'zh-Hant'` を順次追加できる構造でなければならない（MUST）。

#### Scenario [unit]: Locale に最低 2 値（ja, en）が含まれる

- **WHEN** `import { Locale } from '@pokedex/contracts'` し、値を列挙する
- **THEN** `'ja'` と `'en'` の 2 つが最低含まれる

#### Scenario [unit]: Locale 型が未定義の値を拒否する

- **WHEN** TS で `const l: Locale = 'xx'` のように代入を試みる
- **THEN** TypeScript の型エラーが発生する

### Requirement: ドメイン分類値の export（SpriteGender / SpriteKind）

`@pokedex/contracts` はスプライトの性別・種別を、それぞれ `SpriteGender`（`'male' | 'female' | 'unknown'`）、`SpriteKind`（`'default' | 'shiny' | 'back' | 'back_shiny'`）として export しなければならない（MUST）。

#### Scenario [unit]: SpriteGender に 3 値が含まれる

- **WHEN** `import { SpriteGender } from '@pokedex/contracts'` し、`Object.values(SpriteGender)` を取得する
- **THEN** `'male'`、`'female'`、`'unknown'` の 3 値が含まれる

#### Scenario [unit]: SpriteKind に 4 値が含まれる

- **WHEN** `import { SpriteKind } from '@pokedex/contracts'` し、`Object.values(SpriteKind)` を取得する
- **THEN** `'default'`、`'shiny'`、`'back'`、`'back_shiny'` の 4 値が含まれる

#### Scenario [unit]: SpriteGender 型が未定義の値を拒否する

- **WHEN** TS で `const g: SpriteGender = 'other'` のように代入を試みる
- **THEN** TypeScript の型エラーが発生する

#### Scenario [unit]: SpriteKind 型が未定義の値を拒否する

- **WHEN** TS で `const k: SpriteKind = 'thumbnail'` のように代入を試みる
- **THEN** TypeScript の型エラーが発生する

### Requirement: ドメイン分類値の export（PokedexSlug）

`@pokedex/contracts` は pokedex（図鑑）のスラッグ値を `PokedexSlug` という `as const` オブジェクト + 型エイリアスとして export しなければならない（MUST）。本 change 時点での許容値は `'national' | 'paldea'` の 2 値とし、後続 change での seed 拡張に応じて値を追加できる構造でなければならない（MUST）。許容値の集合は `apps/api/src/db/seed/data/pokedexes.json` の slug 集合と必ず一致しなければならない（MUST、整合性は `domain-seed` の invariants test で機械的に保証される）。

#### Scenario [unit]: PokedexSlug に national と paldea が含まれる

- **WHEN** `import { PokedexSlug } from '@pokedex/contracts'` し、`Object.values(PokedexSlug)` を取得する
- **THEN** `'national'` と `'paldea'` の 2 値が最低含まれる

#### Scenario [unit]: PokedexSlug 型が未定義の値を拒否する

- **WHEN** TS で `const p: PokedexSlug = 'unknown-dex'` のように代入を試みる
- **THEN** TypeScript の型エラーが発生する

#### Scenario [unit]: PokedexSlug が as const で凍結されている

- **WHEN** TS で `PokedexSlug.NATIONAL` の型を取得する
- **THEN** リテラル型 `'national'` として推論される

### Requirement: ドメイン分類値の export（TypeSlug）

`@pokedex/contracts` はポケモンのタイプ slug を `TypeSlug` という `as const` オブジェクト + 型エイリアスとして export しなければならない（MUST）。許容値は標準 18 タイプ `'normal' | 'fire' | 'water' | 'electric' | 'grass' | 'ice' | 'fighting' | 'poison' | 'ground' | 'flying' | 'psychic' | 'bug' | 'rock' | 'ghost' | 'dragon' | 'dark' | 'steel' | 'fairy'` でなければならない（MUST）。許容値の集合は `apps/api/src/db/seed/data/types.json` の slug 集合と必ず一致しなければならない（MUST、整合性は `domain-seed` の invariants test で機械的に保証される）。

#### Scenario [unit]: TypeSlug に 18 値が含まれる

- **WHEN** `import { TypeSlug } from '@pokedex/contracts'` し、`Object.values(TypeSlug)` を取得する
- **THEN** 18 値 `['normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy']` が含まれる

#### Scenario [unit]: TypeSlug 型が未定義の値を拒否する

- **WHEN** TS で `const t: TypeSlug = 'cosmic'` のように代入を試みる
- **THEN** TypeScript の型エラーが発生する

#### Scenario [unit]: TypeSlug が as const で凍結されている

- **WHEN** TS で `TypeSlug.FIRE` の型を取得する
- **THEN** リテラル型 `'fire'` として推論される

### Requirement: 分類値の非空タプル export

`@pokedex/contracts` は各分類値の **非空 readonly タプル** を `FORM_CATEGORY_VALUES` / `LOCALE_VALUES` / `SPRITE_GENDER_VALUES` / `SPRITE_KIND_VALUES` / `POKEDEX_SLUG_VALUES` / `TYPE_SLUG_VALUES` として export しなければならない（MUST）。これらは drizzle-orm の `pgEnum` や Valibot の `v.picklist()` などが要求する non-empty readonly tuple 型を満たし、`no-unsafe-type-assertion` 違反なしに値配列を渡せる用途に使う。同名のオブジェクト export (`FormCategory` / `Locale` / `SpriteGender` / `SpriteKind` / `PokedexSlug` / `TypeSlug`) との値集合は `satisfies` で型保証される（MUST）。

#### Scenario [unit]: FORM_CATEGORY_VALUES が FormCategory と同じ値集合を持つ

- **WHEN** `import { FORM_CATEGORY_VALUES, FormCategory } from '@pokedex/contracts'` し、両者の値集合を比較する
- **THEN** `[...FORM_CATEGORY_VALUES].sort()` と `Object.values(FormCategory).sort()` が等価

#### Scenario [unit]: FORM_CATEGORY_VALUES の型が readonly tuple として推論される

- **WHEN** TS で `typeof FORM_CATEGORY_VALUES` を取得する
- **THEN** `readonly ['normal', 'regional', ...]` のような non-empty readonly tuple 型として推論される

#### Scenario [unit]: LOCALE_VALUES / SPRITE_GENDER_VALUES / SPRITE_KIND_VALUES も同様に export される

- **WHEN** `import { LOCALE_VALUES, SPRITE_GENDER_VALUES, SPRITE_KIND_VALUES } from '@pokedex/contracts'`
- **THEN** いずれも型エラーなく解決され、対応するオブジェクト export と値集合が一致する

#### Scenario [unit]: POKEDEX_SLUG_VALUES が PokedexSlug と同じ値集合を持つ

- **WHEN** `import { POKEDEX_SLUG_VALUES, PokedexSlug } from '@pokedex/contracts'` し、両者の値集合を比較する
- **THEN** `[...POKEDEX_SLUG_VALUES].sort()` と `Object.values(PokedexSlug).sort()` が等価

#### Scenario [unit]: TYPE_SLUG_VALUES が TypeSlug と同じ値集合を持つ

- **WHEN** `import { TYPE_SLUG_VALUES, TypeSlug } from '@pokedex/contracts'` し、両者の値集合を比較する
- **THEN** `[...TYPE_SLUG_VALUES].sort()` と `Object.values(TypeSlug).sort()` が等価

### Requirement: 単一エントリポイントからの追加 export

ドメイン分類値（`FormCategory` / `Locale` / `SpriteGender` / `SpriteKind` / `PokedexSlug` / `TypeSlug`）はすべて `@pokedex/contracts` の単一エントリポイントから import 可能でなければならない（MUST）。サブパス import は提供してはならない（MUST NOT）。

#### Scenario [unit]: 6 分類値が単一 import で解決される

- **WHEN** `import { FormCategory, Locale, SpriteGender, SpriteKind, PokedexSlug, TypeSlug } from '@pokedex/contracts'` する
- **THEN** すべて型エラーなく解決される

### Requirement: ポケモン API 用クエリスキーマの export

`@pokedex/contracts` は `GET /api/pokemon` 向けのクエリパラメータを表現する Valibot schema を `pokemonListQuerySchema` として export しなければならない（MUST）。許容するクエリは `pokedex`（optional、スラッグ文字列、デフォルト `DEFAULT_POKEDEX_SLUG`）、`types`（optional、カンマ区切り、最大 `MAX_TYPES` 件）、`cursor`（optional、base64url 文字列）、`limit`（optional、`1..100` の整数、デフォルト `PAGE_SIZE`）でなければならない（MUST）。

#### Scenario [unit]: 既定値で空のクエリをパースできる

- **WHEN** `parse(pokemonListQuerySchema, {})` を呼ぶ
- **THEN** 例外を投げずに `{ pokedex: 'national', types: [], cursor: undefined, limit: 30 }` 相当の値が返る

#### Scenario [unit]: types がカンマ区切りで配列にパースされる

- **WHEN** `parse(pokemonListQuerySchema, { types: 'fire,flying' })` を呼ぶ
- **THEN** `types` が `['fire', 'flying']` として返る

#### Scenario [unit]: types が MAX_TYPES を超えるとパースエラーになる

- **WHEN** `MAX_TYPES + 1` 個のタイプを含む文字列をパースする
- **THEN** Valibot のバリデーション例外が投げられる

#### Scenario [unit]: limit が範囲外だとパースエラーになる

- **WHEN** `parse(pokemonListQuerySchema, { limit: '0' })` または `{ limit: '101' }` を呼ぶ
- **THEN** Valibot のバリデーション例外が投げられる

### Requirement: ポケモン一覧レスポンスのスキーマ export

`@pokedex/contracts` は一覧 item のレスポンス schema を `pokemonListItemSchema` として、cursor meta を `pokemonListMetaSchema` として export しなければならない（MUST）。`pokemonListMetaSchema` は `{ nextCursor: string | null }` を持たなければならない（MUST）。

#### Scenario [unit]: 一覧 item は species と form の最小情報を含む

- **WHEN** `pokemonListItemSchema` の型を取得する
- **THEN** 最低 `speciesSlug`, `formSlug`, `pokedexNumber`, `nameJa`, `types`, `defaultSpriteUrl` を含む

#### Scenario [unit]: meta は nextCursor を nullable で持つ

- **WHEN** `parse(pokemonListMetaSchema, { nextCursor: null })` および `{ nextCursor: 'abc' }` を呼ぶ
- **THEN** どちらも例外なく値が返る

### Requirement: ポケモン詳細レスポンスのスキーマ export

`@pokedex/contracts` は詳細レスポンス schema を `pokemonDetailSchema` として export しなければならない（MUST）。`pokemonDetailSchema` は species 情報、default form 情報、多言語 names、sprites、types、進化チェーンを含まなければならない（MUST）。

#### Scenario [unit]: 詳細には species と form の双方が含まれる

- **WHEN** `pokemonDetailSchema` の型を取得する
- **THEN** `species`（`slug`, `nationalDexNumber` 等）と `form`（`slug`, `category`, `isDefault` 等）の双方をフィールドとして持つ

#### Scenario [unit]: 詳細には進化チェーンが含まれる

- **WHEN** `pokemonDetailSchema` の型を取得する
- **THEN** `evolutions` フィールドが species の配列として定義されている

#### Scenario [unit]: 詳細には多言語名と sprites が含まれる

- **WHEN** `pokemonDetailSchema` の型を取得する
- **THEN** `names`（locale 別エントリの配列）と `sprites`（gender × kind の配列）の双方をフィールドとして持つ

### Requirement: 検索 API 用シンボルの単一エントリポイント export

検索 API 関連の追加 schema（`pokemonListQuerySchema` / `pokemonListItemSchema` / `pokemonListMetaSchema` / `pokemonDetailSchema`）はすべて `@pokedex/contracts` の単一エントリポイントから import 可能でなければならない（MUST）。サブパス import は提供してはならない（MUST NOT）。

#### Scenario [unit]: 追加 schema が単一 import で解決される

- **WHEN** `import { pokemonListQuerySchema, pokemonListItemSchema, pokemonListMetaSchema, pokemonDetailSchema } from '@pokedex/contracts'` する
- **THEN** すべて型エラーなく解決される
