## Context

`add-domain-schema` で確定した `forms` テーブルは、各 species が複数の form を持ち得る (`(species_id, slug)` UNIQUE) 構造になっている。本リポジトリでは「ある species を URL や API でデフォルト表示するときにどのフォームを返すか」を **暗黙的に `category='normal'`** で判定してきた。現シードでは 13 species 全てに `normal` カテゴリのフォームが exactly 1 件存在しており、この暗黙ルールはたまたま機能している。

次に着手する `add-search-api` change では、`GET /api/pokemon/:species_slug` (form 省略時) の挙動として「デフォルトフォーム詳細を返す」設計を採用する。この時点で「デフォルトフォーム」の定義が **DB レベルで一意決定可能** である必要が出てくる。

同時に、`add-search-api` の URL 設計は `GET /api/pokemon/:species_slug/:form_slug` のように `forms.slug` を path に出すため、現在の slug 規約 (`charizard-mega-x` のように species 名を冗長に含む) は path に出すと `/pokemon/charizard/charizard-mega-x` となり見栄えが悪い。`forms.slug` の値を species 名を含まない短縮形 (`mega-x`, `alola`, `teal`) に揃える規約を確立する。

これら 2 つの変更 (フラグ列追加 + slug 短縮形化) はいずれも `forms` スキーマと seed JSON にしか影響しない小さな関心事だが、`add-search-api` を純粋に「API レイヤ」に集中させるために独立した change として先行させる。

## Goals / Non-Goals

**Goals:**

- `forms.is_default boolean NOT NULL DEFAULT false` 列を追加し、「API/UI のデフォルト表示対象」を `category` から独立した概念として明示する
- 部分 UNIQUE 制約 `WHERE is_default = true ON (species_id)` で 1 species につき default は最大 1 件を DB レベルで保証する
- 「全 species に default が exactly 1 件存在する」ことを vitest の Invariant Test で担保する (DB で「最低 1 件」を表現するのは難しいため)
- `forms.slug` 規約を「species 名を含まない短縮形」に揃え、`forms.json` シードを書き換える
- `pokedexes.json` の `formSlug` 参照を短縮形に追随する
- migration SQL を `drizzle-kit generate` で新規 1 ファイル (`0001_*.sql`) として生成し、`supabase db reset` でクリーンに適用できる状態にする
- 既存の `pnpm db:reset` パイプライン (migration → seed → invariants) が exit 0 で完走する

**Non-Goals:**

- API レイヤの実装 (`GET /api/pokemon/...` 等) → `add-search-api`
- `category='normal'` カテゴリ自体の撤廃 (`'normal'` は「ゲーム内の通常形態」のラベルとして継続)
- 「default が複数存在する species」「default が NULL の species」の許容 (本 change では exactly 1 件固定)
- `species.default_form_id` のような species 側に default を持たせる代替設計
- `forms.slug` のグローバル一意化 (`(species_id, slug)` UNIQUE は維持)
- 後続 `add-search-api` で必要になる relations 追加 / FK インデックス追加 (別 change の責務)

## Decisions

### Decision 1: `forms.is_default boolean NOT NULL DEFAULT false`

**選定**: `forms` テーブルに `is_default boolean NOT NULL DEFAULT false` 列を追加する。

**理由**:

- 「`category='normal'`」と「API/UI のデフォルト表示対象」は **異なる概念** として将来分離できる柔軟性を持つ
- 例えば将来「リージョナルフォームをデフォルト表示にしたい species」が出てきた場合、`category` は `'regional'` のまま `is_default=true` に設定できる
- NOT NULL + DEFAULT false により、新規 form 挿入時の挙動が安全 (明示的に true をセットしない限り false)
- bool 列なので migration の `ALTER TABLE` が軽量

**代替案と却下理由**:

- **`species.default_form_id` (species 側に持つ)**: FK 双方向 (`species → forms → species`) で循環依存が発生する。シード処理が 2 段階 (species 作成 → forms 作成 → species を UPDATE) になり複雑化する。本案の方が直線的
- **暗黙ルール継続 (`category='normal'`)**: 「normal が 0 件 / 複数件」の species が将来出てきた場合に破綻する。スキーマレベルで保証できる本案の方が堅牢
- **`forms.role enum('default', 'variant', 'mega', ...)`** のような列挙型: 既存の `category` と意味的に重複する。情報を分離する設計の方が clean

### Decision 2: 部分 UNIQUE 制約で「1 species につき default は最大 1 件」を保証

**選定**: PostgreSQL の部分インデックス (`CREATE UNIQUE INDEX ... WHERE is_default = true ON (species_id)`) を Drizzle の `uniqueIndex().on(...).where(...)` で定義する。

**理由**:

- DB レベルで「最大 1 件」が保証されることで、シードのバグや手動 UPDATE での違反を即座に弾ける
- 部分 UNIQUE は PostgreSQL 標準機能であり、Drizzle ORM 0.45 系でもサポート済み
- 全 species への "exactly 1 件" 制約は SQL の宣言的制約では表現しづらいため、vitest の Invariant Test で担保する (既存パターンに沿う)

**代替案と却下理由**:

- **アプリ層のみで保証 (`invariants` のみ)**: DB レベルの安全網が無くなる。手動 UPDATE や別経路の挿入で違反が混入し得る
- **DB CHECK 制約**: PostgreSQL の CHECK はサブクエリを許容しないため、「同一 species_id で is_default=true が複数あるか」を CHECK 単独で表現できない

### Decision 3: `forms.slug` 規約を species 名を含まない短縮形に変更

**選定**: 以下の対応表で `forms.slug` を全件書き換える。

| 旧 slug | 新 slug | category |
|---|---|---|
| `bulbasaur` | `bulbasaur` (= species_slug、通常フォーム) | normal |
| `ivysaur` | `ivysaur` | normal |
| `charizard` | `charizard` | normal |
| `charizard-mega-x` | `mega-x` | mega-x |
| `charizard-mega-y` | `mega-y` | mega-y |
| `pikachu` | `pikachu` | normal |
| `pikachu-cosplay` | `cosplay` | other |
| `raichu` | `raichu` | normal |
| `raichu-alola` | `alola` | regional |
| `muk` | `muk` | normal |
| `muk-alola` | `alola` | regional |
| `mew` | `mew` | normal |
| `rotom` | `rotom` | normal |
| `rotom-heat` | `heat` | other |
| `rotom-wash` | `wash` | other |
| `rotom-frost` | `frost` | other |
| `rotom-fan` | `fan` | other |
| `rotom-mow` | `mow` | other |
| `ogerpon-teal` | `teal` | normal |
| `ogerpon-wellspring` | `wellspring` | tera |
| `ogerpon-hearthflame` | `hearthflame` | tera |
| `ogerpon-cornerstone` | `cornerstone` | tera |
| `terapagos-normal` | `normal` | normal |
| `terapagos-stellar` | `stellar` | tera |

**理由**:

- 後続 `add-search-api` で `GET /api/pokemon/:species_slug/:form_slug` の path に slug を出すため、`/pokemon/charizard/mega-x` のように省略形が見栄えと使い勝手で優れる
- `(species_id, slug)` UNIQUE はそのまま維持 (短縮形でも species 内一意は担保される)
- 通常フォーム (species 1 つに 1 つあるもの) は、種族と form の対応関係が明確になるよう **species_slug と同じ短縮 slug** を採用する (`bulbasaur` species の通常 form は `bulbasaur` slug)。テラパゴスのみ通常フォームの slug を `normal` にする (`terapagos-normal` → `normal`) ことで「複数 normal 候補がない species」と区別しないルールに統一する → ★ **Open Question として再検討余地あり** (後述)

**代替案と却下理由**:

- **slug をグローバル一意化** (`(species_id, slug)` UNIQUE → `slug` UNIQUE): スキーマ変更が大きく、`species` と `forms` の名前空間が混ざる。本案の方が変更範囲が小さい
- **現状維持**: URL に出したときの見栄えが悪い (`/pokemon/charizard/charizard-mega-x`)。`add-search-api` で URL 設計が決まった以上、本 change のタイミングで揃えるのが効率的

### Decision 4: 通常フォームの slug 命名規約

**選定**: 通常フォーム (`category='normal'` かつ species ごとに 1 件のみ存在するもの) の slug は **species_slug と同じ短縮 slug を採用** する。例外として、テラパゴスのように「`normal` 形態」と「`stellar` 形態」の両方が存在する場合は通常側を `normal` とする。

**理由**:

- ほとんどの species は通常フォーム 1 つしか持たないため、slug を species_slug と一致させると JSON の見た目が分かりやすい (`speciesSlug: 'pikachu', slug: 'pikachu'`)
- 「`category='normal'` だが `is_default=true` ではない form」「`category='normal'` が複数」のような将来ケースが出てきたら、その時点で個別 slug を当てる
- URL では `:form_slug` が省略可能 (default フォームが帰る) なので、通常フォームの slug が冗長でも実用上影響は少ない

**代替案と却下理由**:

- **常に `normal` を使う**: 全 species の通常フォームを `slug='normal'` にする案。`(species_id, slug)` UNIQUE は保てるが、`/pokemon/pikachu/normal` のような URL が冗長に出る (省略時のフォールバックがあるので実用上は OK だが、URL を直書きしたユーザーが見たときに `normal` を毎回タイプする手間がある)
- **`base` / `default` 等の固定キーワード**: 「normal」の意味とずれる、英語表現として一意性に欠ける

### Decision 5: migration ファイルの構成

**選定**: drizzle-kit に `--name add_form_default_flag` を渡し、`supabase/migrations/0001_add_form_default_flag.sql` (実際の数値は drizzle-kit が割り振る) として生成する。既存の `0000_add_domain_schema.sql` には触れず、追加の 1 ファイルで `ALTER TABLE forms ADD COLUMN ...` と `CREATE UNIQUE INDEX ... WHERE ...` を含める。

**理由**:

- マイグレーションファイルは **追加のみ** (既存ファイルの変更は historical fact を壊すため避ける)
- `supabase db reset` で 0000 → 0001 の順に適用され、状態が再現できる
- 既存の `0000_add_domain_schema.sql` のテストはそのまま通る (test 側は `supabase/migrations/` 全体を読む `readGeneratedSql()` で連結検査するため、本 change で追加された制約も自動的に検証範囲に入る)

**注意**:

- `drizzle.config.ts` の `out: '../../supabase/migrations'` は変更なし
- `add-domain-schema` で `migrations.test.ts` を `find` → `filter + sort + join` で全ファイル検査に変更済み (Round 6 対応)

### Decision 6: slug 短縮形変更時の seed JSON 更新フロー

**選定**: `forms.json` と `pokedexes.json` を本 change の commit 範囲で書き換える。`drizzle-kit generate` で SQL マイグレーションを生成した後、`pnpm db:reset` で実 DB に対する整合性を実機検証する。

**理由**:

- DB 列の型・制約は変わらない (varchar(64) のまま) ので、データの値変更のみ
- 既存の archive 内 seed JSON (もし将来 schema dump 等で参照されるなら) は履歴として保持
- `pokedexes.json` の `formSlug` 参照は 1 箇所のみ (`ogerpon-teal` → `teal`) なので影響は小さい

### Decision 7: Invariant Test の責務分担

**選定**: 「default が exactly 1 件」の検証を `apps/api/src/db/seed/invariants.ts` に追加する。DB の部分 UNIQUE で「最大 1 件」が保証され、Invariant Test が「最低 1 件」(=合わせて exactly 1 件) を担保する役割分担。

```typescript
// invariants.ts に追加
const checkAllSpeciesHaveDefaultForm = async (runner: Runner): Promise<readonly string[]> => {
  // species LEFT JOIN forms ON species.id = forms.species_id AND forms.is_default = true
  // WHERE forms.id IS NULL → 違反
  // また COUNT(*) ... HAVING COUNT(*) > 1 → 違反 (DB UNIQUE が先に検出するため通常は不要、念のため)
};
```

**理由**:

- 既存パターン (national_dex 整合性チェック、`form_types` 必須など) と同じ責務分担
- migration / seed パイプラインで失敗を早期検出
- `add-search-api` の API ハンドラ側で `is_default=true LIMIT 1` を信頼して書ける

## Risks / Trade-offs

- **[リスク] slug 短縮形変更による既存の URL/外部参照との互換性破壊**: 現状の URL は本 PR でまだ存在しない (API レイヤ未実装) ため、外部から直接参照されている URL はゼロ。**実害なし**だが、本 change が先行することで `add-search-api` で初めて公開する URL が短縮形になる前提を確立する → Mitigation: 本 PR を `add-search-api` の前にマージすることで、外部公開前に slug 規約を完成させる
- **[リスク] migration を再生成し直すと既存の `0000_*.sql` が変わるリスク**: drizzle-kit の挙動次第で 0000 が書き換わると差分が出る → Mitigation: `drizzle-kit generate --name add_form_default_flag` は新規 migration を 0001 として生成する想定。実機検証で 0000 が変わらないことを確認、変わるなら commit に含めず手動で 0001 のみ採用する
- **[リスク] Invariant Test の判定が遅延する**: 「default が無い species」を seed JSON で書き忘れた場合、開発者がローカルで `pnpm db:reset` を実行して初めて気付く → Mitigation: `add-search-api` 着手前に CI でも `pnpm db:reset` を回す cron / GitHub Actions を追加する案もあるが、本 change のスコープ外。`add-pokedex-seed-data` で本番データ投入する前に検討
- **[リスク] テラパゴスの slug 命名 (`terapagos-normal` → `normal`) が将来の他 species と衝突する**: 別の species で同じ slug `normal` を使うと違和感の元 → Mitigation: `(species_id, slug)` UNIQUE は同 species 内一意のため衝突なし、複数 species で `slug='normal'` を使うことは規約上問題ない。`add-pokedex-seed-data` で大量シードを投入する際もこの命名規約を継続する
- **[トレードオフ] forms.json の編集量**: 27 form 全件の slug 書き換え + `isDefault` 追加で diff が大きく見える → Mitigation: diff は機械的な変換が大半。PR レビューでは Decision 3 の対応表を参照して整合性を確認する

## Migration Plan

本 change は既存テーブルへの列追加 + 既存データの slug 値変更を含むが、本番未デプロイのため運用ロールバック手順は不要。

1. `feat/add-form-default-flag` ブランチを切る (既に main 最新で切り替え済み)
2. `forms` schema に `is_default` 列と部分 UNIQUE 定義を追加する
3. `forms.json` と `pokedexes.json` の slug + `isDefault` を全件更新する
4. `apps/api/src/db/seed/schemas/index.ts` の valibot に `isDefault` を追加する
5. `apps/api/src/db/seed/seed.ts` の `seedForms` で `isDefault` を投入する
6. `apps/api/src/db/seed/invariants.ts` に default 1 件 invariant を追加する
7. `drizzle-kit generate --name add_form_default_flag` で migration を生成する (`0001_*.sql`)
8. `pnpm --filter @pokedex/api db:reset` で migration → seed → invariants の動作確認
9. 各テストファイルに smoke / migration SQL 検査を追加する
10. `pnpm typecheck` / `pnpm lint` / `pnpm test` / `pnpm format:check` をクリアする
11. セルフレビュー (`typescript-reviewer` Agent) を実行する
12. コミット → push → PR 作成

ロールバック: 本 change のマージを revert すれば `forms.is_default` 列も migration ファイルもブランチから消える。本番未稼働のため DB を巻き戻す必要はなく、`pnpm db:reset` で 0000 のみの状態に戻る。

## Open Questions

- **Decision 4 の通常フォーム slug 命名は妥当か?**: 「species_slug と同じ短縮 slug」を採用したが、テラパゴスのみ「normal」を採用する例外がある。これは「ある species 内で `normal` カテゴリのフォームが複数 (例: terapagos-normal + terapagos-stellar の場合は stellar が tera だが、もし両方 normal なら別 slug が必要)」のケースに対する一貫したルールが必要。本 change では現シードに合わせて手動で対応するが、`add-pokedex-seed-data` で大量シードを入れる前に slug 命名規約をドキュメント化する余地がある
- **Drizzle Kit が部分 UNIQUE インデックスを `CREATE UNIQUE INDEX ... WHERE ...` で生成するか実機検証が必要**: 0.45 系で部分インデックスサポート済みだが、`.uniqueIndex().on(...).where(...)` の生成 SQL を `drizzle-kit generate` 後にテキストで確認する。万が一 `CREATE UNIQUE INDEX` 形式にならない場合は別途 raw SQL 注入が必要 (drizzle-kit の `custom-migrations` 機能)
