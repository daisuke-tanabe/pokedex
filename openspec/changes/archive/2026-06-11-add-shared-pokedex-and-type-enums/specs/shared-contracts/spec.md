## ADDED Requirements

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

## MODIFIED Requirements

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
