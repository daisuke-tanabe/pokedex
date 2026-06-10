## Context

ポケモン図鑑の検索 UI (`add-web-search-ui`) は pokedex slug と type slug を選択肢として提示する必要がある。これらは現状:

- **BE (`apps/api`)**: `pokemonListQuerySchema` で `v.string()` だけ受け取り、route 層で `repo.findPokedexIdBySlug(pokedex)` を叩いて null check (動的検証)
- **seed**: `apps/api/src/db/seed/data/pokedexes.json` / `types.json` で master data を JSON で持つ
- **FE (`apps/web`)**: 未実装、これから検索フォームで使う

の 3 箇所で参照されるが、`packages/contracts` には master enum がない。FE が hardcode すると BE/seed と乖離するリスクが大きく、bulletproof-react の「契約は contracts に集約」原則とも整合しない。

既存 contracts には `FormCategory` / `Locale` / `SpriteGender` / `SpriteKind` の 4 つの enum が同パターン (`*_VALUES` 非空タプル + 定数 object + リテラルユニオン型 + `satisfies` 型保証) で揃っており、`PokedexSlug` / `TypeSlug` も同パターンで追加できる。seed/invariants で「JSON の slug 集合 = enum 値集合」を検証する既存パターン (`locales.json` ↔ `Locale`) もそのまま流用可能。

`apps/api` 側は Valibot の `v.picklist()` で early reject 化することで、route 層の null check を 1 つ削除でき、エラーメッセージも具体化できる (Valibot が「invalid pokedex」と詳細を返す)。

## Goals / Non-Goals

**Goals:**

- `packages/contracts` を pokedex slug / type slug の **source of truth** にする
- 既存 4 つの enum と同じパターンで `PokedexSlug` / `TypeSlug` を追加する
- seed / contracts / Valibot validation の 3 箇所で必ず同じ値集合が使われることを invariants test で機械的に保証する
- `apps/api` の Valibot 検証を `v.picklist()` に強化し、route 層の冗長な null check を 1 件削減する
- 既存テストすべて green 維持
- 後続 `add-web-search-ui` で FE が `import { POKEDEX_SLUG_VALUES, TYPE_SLUG_VALUES } from '@pokedex/contracts'` をそのまま使える状態にする

**Non-Goals:**

- 100+ 図鑑 (Kanto / Johto / Hoenn / Sinnoh / ...) の seed 拡張 → `add-pokedex-seed-data` (別 change)
- 100+ 種族 / 1000+ form の seed 拡張 → 同上
- `apps/web` での UI 実装 → `add-web-search-ui` (別 change)
- `pokemon-api` spec の Requirement 修正 → 期待結果 (HTTP 400 + INVALID_QUERY) は不変、生成経路の変化は spec レベルで規定しない方針
- `pokedex` / `type` 以外の slug 系 (form slug / species slug / region slug) の enum 化 → form / species は数百〜数千件で enum 化不適切、region は seed が増えたら検討

## Decisions

### Decision 1: enum 初期値は seed の現状値に揃える

**Why**: contracts と seed が乖離すると invariants test が必ず落ちる。先に seed を拡張するのではなく、現状の seed (national / paldea の 2 値、18 type) に合わせて contracts を作る。後で seed が拡張されるたびに contracts も同期する運用にする (invariants test が gatekeeper)。

**Outcome**:

- `POKEDEX_SLUG_VALUES = ['national', 'paldea'] as const`
- `TYPE_SLUG_VALUES = ['normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'] as const`

### Decision 2: 既存 enum パターン (`form-category.ts` 等) を完全踏襲

**Why**: 既存 4 つの enum がプロジェクト規約として確立済。新規パターン導入はメンテコストが純増。

**Outcome**: ファイル構造・export 形式・test ファイル構造をすべて `packages/contracts/src/enums/form-category.ts` と `form-category.test.ts` のコピペベースで作る:

```ts
// packages/contracts/src/enums/pokedex.ts
export const POKEDEX_SLUG_VALUES = ['national', 'paldea'] as const;

export const PokedexSlug = {
  NATIONAL: 'national',
  PALDEA: 'paldea',
} as const satisfies Readonly<Record<string, (typeof POKEDEX_SLUG_VALUES)[number]>>;

export type PokedexSlug = (typeof POKEDEX_SLUG_VALUES)[number];
```

### Decision 3: invariants test は locale パターンを踏襲

**Why**: 既存の `locales.json ↔ Locale` 整合性 test が確立されたパターン。同じ実装手法を pokedex/type 用に 2 つ追加するだけ。

**Outcome**: `apps/api/src/db/seed/invariants.ts` に整合性確認関数を 2 つ追加。

```ts
// pokedexes.json の slug 集合 = POKEDEX_SLUG_VALUES
const checkPokedexSlugAlignment = async (): Promise<readonly string[]> => {
  const seedSlugs = new Set(pokedexesJson.map((p) => p.slug));
  const enumSlugs = new Set(POKEDEX_SLUG_VALUES);
  return seedSlugs.symmetricDifference(enumSlugs).size === 0
    ? []
    : [`pokedexes.json の slug 集合と POKEDEX_SLUG_VALUES が一致しない`];
};
```

(types 用も同パターン)

### Decision 4: Valibot は `v.picklist()` で early reject 化

**Why**: 現状は `slugSchema = v.pipe(v.string(), v.minLength(1))` で形式だけ検証し、許容集合は DB 動的検証。`v.picklist()` で contracts の `POKEDEX_SLUG_VALUES` / `TYPE_SLUG_VALUES` を制約に使うことで、DB を叩く前に reject できる。エラーメッセージも Valibot が具体的に出す。

**Outcome**:

```ts
// 変更前
const slugSchema = v.pipe(v.string(), v.minLength(1));
const typesSchema = v.pipe(v.string(), v.transform(...), v.array(slugSchema), v.maxLength(MAX_TYPES));

export const pokemonListQuerySchema = v.object({
  pokedex: v.optional(slugSchema, DEFAULT_POKEDEX_SLUG),
  types: v.optional(typesSchema, ''),
  // ...
});

// 変更後
const typesSchema = v.pipe(v.string(), v.transform(...), v.array(v.picklist(TYPE_SLUG_VALUES)), v.maxLength(MAX_TYPES));

export const pokemonListQuerySchema = v.object({
  pokedex: v.optional(v.picklist(POKEDEX_SLUG_VALUES), DEFAULT_POKEDEX_SLUG),
  types: v.optional(typesSchema, ''),
  // ...
});
```

### Decision 5: route 層の「unknown pokedex」null check 分岐は削除する

**Why**: Valibot picklist で早期失敗するため、`repo.findPokedexIdBySlug(pokedex)` が null を返す状況は (DB と enum が乖離していない限り) 起こらない。invariants test が DB ↔ enum 乖離を検知するので、route 層での防御コードは冗長。

**Outcome**: `apps/api/src/routes/pokemon.ts` の以下 4 行を削除:

```ts
const pokedexId = await repo.findPokedexIdBySlug(pokedex);
if (pokedexId === null) {
  return c.json(errorEnvelope(ErrorCode.INVALID_QUERY, `unknown pokedex: ${pokedex}`), 400);
}
```

を

```ts
const pokedexId = await repo.findPokedexIdBySlug(pokedex);
// Valibot picklist で early reject 済のため null は起こり得ない
// (DB と enum が同期している前提、invariants test が gatekeeper)
```

として、null check 分岐だけ削除。`findPokedexIdBySlug` 自体は ID 解決に必要なので維持。null 返却を asssert で潰すか、`getPokedexIdBySlug` (non-nullable) に rename するかは実装時に判断。

**Alternatives considered**:

- A) null check を残す (防御プログラミング) → invariants test がカバーする領域を route 層でも重ねる二重防御。 YAGNI 違反
- B) `findPokedexIdBySlug` を `getPokedexIdBySlug` に rename + null 返却時に throw → repository interface 変更で影響範囲拡大、本 change のスコープを超える

**Outcome**: 削除のみ。rename は別 change で扱う宿題候補。

### Decision 6: types の null/不在 ID は throw する (現状維持)

**Why**: `findTypeIdsBySlugs` は valid な type slug が DB に存在しないケース (現状の整合性が崩れた状態) で throw か empty 返却か。現状は… 実装を確認する必要があるが、本 change のスコープ外。Valibot picklist で picklist にある値のみ来る前提なので、DB との乖離は invariants が検知する。

**Outcome**: `findTypeIdsBySlugs` は触らない。

### Decision 7: pokemon-api spec の Scenario は触らない

**Why**: Scenario「未知の pokedex/type スラッグで 400 を返す」は HTTP 400 + INVALID_QUERY を期待しており、これは Valibot picklist でも維持される (`@hono/valibot-validator` が `INVALID_QUERY` 系のエラーを返す)。Scenario 自体は不変。

**Outcome**: `pokemon-api` spec には delta なし。`apps/api/src/routes/pokemon.test.ts` の期待値も不変 (期待形式は同じ、エラー message の文字列は実装詳細なので test では検証していない想定)。要実装時確認。

## Risks / Trade-offs

- **[Risk] seed と enum が乖離した状態でデプロイされる** → Mitigation: invariants test を CI で必ず実行する (既存パターン同様)。PR で必ず通過する
- **[Risk] `v.picklist` 制約の error message が現状と異なる** → Mitigation: `@hono/valibot-validator` の hook で形式は同じ `INVALID_QUERY` envelope に整える (既存実装の延長)
- **[Risk] route 層の null check 削除で `findPokedexIdBySlug` が null を返した場合のクラッシュ** → Mitigation: 実装時に non-null assertion `!` か `if (id === null) throw new Error(...)` で fail-fast、invariants 違反として検知できる形にする
- **[Trade-off] 100+ 図鑑 / 18 type 以外への将来拡張** → seed と enum を同期更新する必要。invariants test が gatekeeper になる
- **[Trade-off] 1 つの change で contracts + apps/api + spec delta 3 件触る** → スコープは小さく保てる (各ファイル数行レベル)、関連性も強いため切り出し不要

## Migration Plan

1. feature ブランチ (`feat/add-shared-pokedex-and-type-enums`) で作業 (済)
2. ベースライン: `pnpm -r typecheck` / `lint` / `format:check` / `test` 全 green
3. contracts: `pokedex.ts` / `type.ts` を新規追加 + `index.ts` re-export + test 追加
4. seed/invariants: 整合性 test 関数を 2 件追加
5. apps/api: Valibot を `v.picklist()` に切替 + route の null check 削除
6. `pnpm -r typecheck` / `lint` / `format:check` / `test` で全 green を再確認
7. `openspec validate add-shared-pokedex-and-type-enums --strict`
8. セルフレビュー (typescript-reviewer 並列起動)
9. PR 作成

Rollback: 本 change が原因で問題発生時は PR を revert。すべてのファイル変更はテストで担保、副作用なし。

## Open Questions

なし。実装時に「`findPokedexIdBySlug` が null 返却時の処理 (Decision 5 の Outcome)」だけ判断する (assert / throw / rename)。
