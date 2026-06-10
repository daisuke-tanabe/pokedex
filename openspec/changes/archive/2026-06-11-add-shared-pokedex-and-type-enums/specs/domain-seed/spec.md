## ADDED Requirements

### Requirement: pokedexes.json と contracts の PokedexSlug の整合

`pokedexes.json` に含まれる `slug` の集合は、`@pokedex/contracts` の `PokedexSlug` 値集合と必ず一致しなければならない（MUST）。本 change のシード対象として最低 `'national'` を含まなければならない（MUST、他に `'paldea'` も現状含む）。整合性は invariants test (`apps/api/src/db/seed/invariants.ts`) で機械的に検証されなければならない（MUST、`locales.json` の検証と同パターン）。

#### Scenario [unit]: pokedexes.json に national が含まれる

- **WHEN** `pokedexes.json` を読み込み、各エントリの `slug` を抽出する
- **THEN** `'national'` が最低含まれる

#### Scenario [unit]: pokedexes.json の slug 集合が contracts の PokedexSlug と一致する

- **WHEN** `pokedexes.json` の `slug` 集合と `Object.values(PokedexSlug)` を比較する
- **THEN** 両者が等価集合である

### Requirement: types.json と contracts の TypeSlug の整合

`types.json` に含まれる `slug` の集合は、`@pokedex/contracts` の `TypeSlug` 値集合と必ず一致しなければならない（MUST）。本 change のシード対象として標準 18 タイプ全て (`normal` / `fire` / `water` / `electric` / `grass` / `ice` / `fighting` / `poison` / `ground` / `flying` / `psychic` / `bug` / `rock` / `ghost` / `dragon` / `dark` / `steel` / `fairy`) を含まなければならない（MUST）。整合性は invariants test (`apps/api/src/db/seed/invariants.ts`) で機械的に検証されなければならない（MUST、`locales.json` の検証と同パターン）。

#### Scenario [unit]: types.json に 18 タイプすべてが含まれる

- **WHEN** `types.json` を読み込み、各エントリの `slug` を抽出する
- **THEN** 18 タイプの slug が全て含まれる

#### Scenario [unit]: types.json の slug 集合が contracts の TypeSlug と一致する

- **WHEN** `types.json` の `slug` 集合と `Object.values(TypeSlug)` を比較する
- **THEN** 両者が等価集合である
