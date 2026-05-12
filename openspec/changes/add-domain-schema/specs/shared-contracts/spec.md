## ADDED Requirements

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

### Requirement: 単一エントリポイントからの追加 export

ドメイン分類値（`FormCategory` / `Locale` / `SpriteGender` / `SpriteKind`）はすべて `@pokedex/contracts` の単一エントリポイントから import 可能でなければならない（MUST）。サブパス import は提供してはならない（MUST NOT）。

#### Scenario: 4 分類値が単一 import で解決される

- **WHEN** `import { FormCategory, Locale, SpriteGender, SpriteKind } from '@pokedex/contracts'` する
- **THEN** すべて型エラーなく解決される
