## Context

ポケモン図鑑のトップページは「図鑑 + タイプの AND 検索」と「全国図鑑番号昇順の無限スクロール一覧」を、詳細ページは「species + form + 進化チェーン + sprites + 多言語 names + types」を必要とする。前段の `add-form-default-flag` で `forms.is_default` 列が整備されたため、検索結果や一覧で「どの form を代表として返すか」を spec レベルで安定して規定可能になった。

API 層は既存の `api-foundation`（最小起動・health・DB client）と `shared-contracts`（envelope / domain enums / error codes）の上に構築する。route 層・repository 層・cursor ライブラリを新規追加し、`@pokedex/contracts` を拡張してフロントエンドが型安全に利用できるようにする。

## Goals / Non-Goals

**Goals:**

- 検索（pokedex slug + types カンマ区切り AND）と全国図鑑番号昇順の cursor ベース無限スクロールを単一エンドポイントで提供する
- ポケモン詳細を単一エンドポイントで提供し、レスポンス内に default form と全付随情報を含める
- route 層を repository interface に依存させ、テスト時に mock を注入可能にする（スタートポロジー）
- envelope を generic 化し、cursor ベース pagination の meta を型安全に表現する
- 検索ホットパスの FK インデックスを migration 0002 で追加する

**Non-Goals:**

- 地方（region）スラッグでの検索 → 将来 change
- タイプの OR 検索や図鑑番号「範囲」検索 → 本 change は AND のみ
- 書き込み系（POST / PUT / PATCH / DELETE）→ 本 change は read-only
- E2E テスト → 後続フェーズ
- レスポンスキャッシュ層 → 必要に応じて将来 change

## Decisions

### Decision 1: ルーティング構造（論点 A）

**選択**: `/api` prefix で 1 ファイル集約（`apps/api/src/routes/pokemon.ts`）。route 層は repository interface のみに依存し、`apps/api/src/index.ts` でコンポジションルートとして real repository を注入する。

**理由**: 検索・一覧・詳細の 3 エンドポイントは互いに関連が深く、1 ファイルにまとめた方が認知負荷が低い。スタートポロジーを徹底し route 同士・repository 同士の直接依存を禁止することで、N² 結合と連鎖破壊を防ぐ。

**代替案**: 検索／詳細を別ファイルに分ける案もあったが、現状エンドポイント数が少なく分割の利益より重複の害が上回ると判断。500 行を超えたら分割を再検討する。

### Decision 2: Cursor 仕様（論点 B）

**選択**: opaque な base64url トークンとして `{ pn: <pokedex_number>, fid: <form_id> }` を JSON シリアライズ → base64url エンコード。`version` フィールドは持たない。

**理由**:

- 同一 `pokedex_number` に複数 form がぶら下がるケース（例: メガ・リージョン）があるため、`pokedex_number` 単独では安定ソートにならない。`form_id` を組み合わせることで `(pokedex_number ASC, form_id ASC)` の決定的順序を保証する
- opaque 化することでクライアントが内部構造に依存しない（将来仕様変更の余地を残す）
- `version` フィールドは YAGNI。本当に必要になったらその時点で破壊的変更として導入する

**代替案**: offset/limit 方式は seek pagination より低速かつ「途中で挿入が起きるとズレる」問題があるため不採用。

### Decision 3: 入力 Validation とエラー分類（論点 C, F）

**選択**: Valibot schema を `@pokedex/contracts` に置き、`@hono/valibot-validator` で query / param をパースする。エラー分類は以下:

| ケース | HTTP | error.code |
|---|---|---|
| クエリ型不一致・最大長超過・不正 cursor | 400 | `INVALID_QUERY` |
| 未知の pokedex slug（クエリパラメータ） | 400 | `INVALID_QUERY` |
| 未知の type slug（クエリパラメータ） | 400 | `INVALID_QUERY` |
| 検索結果 0 件 | 200 | （空配列を返す） |
| 詳細エンドポイントの slug が存在しない | 404 | `POKEMON_NOT_FOUND`（新規） |
| 想定外例外 | 500 | `INTERNAL_ERROR` |

**理由**: クエリパラメータは「フィルター条件」であり、リソース URI ではない。リソース URI（`/api/pokemon/:slug`）に対する不在のみ 404 を返す REST 慣例に従う。検索結果 0 件は「成功して空集合」が正しい。

**代替案**: 未知の pokedex slug を 404（`POKEDEX_NOT_FOUND`）にする案もあったが、クエリパラメータ全体に対して「どのパラメータがどの理由で不正か」を統一的に 400 で返す方が呼び出し側の分岐が単純になる。

### Decision 4: SQL クエリ設計（論点 D）

**選択**: メインクエリ 1 本でフィルタ + ソート + cursor + limit+1 を取得し、バッチクエリ 4 本（types / sprites / form_names / species_names + evolutions）を `Promise.all` で並列実行する 2 段構成。

**メインクエリ骨子**:

```sql
SELECT f.id AS form_id, pe.pokedex_number, s.slug AS species_slug, f.slug AS form_slug, f.category, f.is_default
FROM pokedex_entries pe
  JOIN forms f ON f.id = pe.form_id  -- form_id NULL は別途 default form 解決
  JOIN species s ON s.id = pe.species_id
WHERE pe.pokedex_id = :pokedex_id
  AND (:type_count = 0 OR f.id IN (
    SELECT ft.form_id FROM form_types ft
      JOIN types ty ON ty.id = ft.type_id
      WHERE ty.slug = ANY(:type_slugs)
      GROUP BY ft.form_id HAVING COUNT(DISTINCT ty.slug) = :type_count
  ))
  AND (pe.pokedex_number, f.id) > (:cursor_pn, :cursor_fid)  -- cursor seek
ORDER BY pe.pokedex_number ASC, f.id ASC
LIMIT :limit + 1
```

- **AND 検索**: `GROUP BY form_id HAVING COUNT(DISTINCT type_slug) = N` で N 件すべてマッチを担保
- **seek pagination**: `(pokedex_number, form_id) > (cursor_pn, cursor_fid)` の複合比較
- **has_more 判定**: `limit + 1` 件取得し、`limit + 1` 件目があれば「次ページあり」

**理由**:

- バッチクエリ並列化により round-trip 数を抑える（メイン 1 本 + バッチ 4 本 = 5 query、Promise.all で実行時間は max(各 query)）
- `IN (subquery)` は PostgreSQL がよく最適化するためインライン化可能。CTE より見通しがよい

**代替案**: 単一 SQL に LATERAL JOIN で詰める案もあるが、N+1 防止のためバッチ JOIN は分離した方が型と責務がクリーン。

### Decision 5: Response schema と envelope generic 化（論点 E）

**選択**: `envelopeSchema` を `(dataSchema, metaSchema?)` の 2 引数化する。meta なしのケースでは既存の `envelopeSchema(dataSchema)` がそのまま動くよう、metaSchema を optional とする。

```typescript
// 旧
export const envelopeSchema = <T>(data: T) => v.union([
  v.object({ success: v.literal(true), data, meta: v.optional(v.unknown()) }),
  v.object({ success: v.literal(false), error: errorSchema }),
]);

// 新（後方互換）
export const envelopeSchema = <T, M = v.AnySchema>(data: T, meta?: M) => v.union([
  v.object({
    success: v.literal(true),
    data,
    meta: meta ?? v.optional(v.unknown()),
  }),
  v.object({ success: v.literal(false), error: errorSchema }),
]);
```

- `apps/api` の検索エンドポイントは `envelopeSchema(pokemonListSchema, cursorMetaSchema)` を返す
- `apps/api` の詳細エンドポイントは `envelopeSchema(pokemonDetailSchema)` を返す
- `cursorMetaSchema = v.object({ nextCursor: v.nullable(v.string()) })`

**理由**: 既存呼び出し（`envelopeSchema(dataSchema)`）が壊れない。新 meta シナリオも型安全。

### Decision 6: Repository 層（論点 A 補足）

**選択**: `apps/api/src/repositories/pokemon.ts` に interface と Drizzle 実装、`pokemon.mock.ts` に mock 実装。route 層は interface のみを import する。

```typescript
export interface PokemonRepository {
  searchByList(input: SearchInput): Promise<{ items: PokemonListItem[]; hasMore: boolean }>;
  findDetailBySlug(slug: string): Promise<PokemonDetail | null>;
}
```

`apps/api/src/index.ts`（コンポジションルート）で `pokemonRouter(realPokemonRepository)` のように構築する。

**理由**: route ↔ repository の依存方向を一方向に固定し、route 同士・repository 同士の N² 結合を防ぐ。テストでは mock を直接注入できる。

### Decision 7: テスト戦略（論点 G）

| レイヤ | テスト種別 | 環境 |
|---|---|---|
| route | mock repository 注入のユニットテスト | DATABASE_URL 不要 |
| repository | real DB 統合テスト | DATABASE_URL 必須（`describe.skipIf(SHOULD_SKIP)`） |
| cursor lib | 純粋なユニットテスト | DATABASE_URL 不要 |
| migration | SQL テキスト検査 | DATABASE_URL 不要 |

**理由**: 既存 `invariants.test.ts` と同じ `describe.skipIf` パターンを継承し、ローカル/CI での実行差を吸収する。

### Decision 8: FK インデックスの選定（論点 H）

**選択**: migration 0002 で以下 6 個の B-tree インデックスを追加する:

| インデックス対象 | 用途 |
|---|---|
| `pokedex_entries(pokedex_id)` | 図鑑スラッグから entries を取得する一覧クエリ |
| `pokedex_entries(form_id)` | form_id 経由で entries を逆引きする詳細クエリ |
| `form_types(form_id)` | 一覧で各 form の types をバッチ取得 |
| `form_types(type_id)` | type slug で form を絞り込む AND 検索 |
| `form_sprites(form_id)` | バッチで sprites 取得 |
| `form_names(form_id)` | バッチで多言語名取得 |

**理由**: 検索クエリの実行計画で Seq Scan が出る箇所を埋める。PostgreSQL は FK 列に自動でインデックスを張らないため、明示的に追加する必要がある。

**代替案**: 全 FK 列に網羅的にインデックスを張る案もあるが、書き込みコストが上がるため検索ホットパスに限定する。

### Decision 9: 詳細エンドポイントの default form 解決

**選択**: `GET /api/pokemon/:slug` は species slug を受け取り、`forms.is_default = true` の form を返す。

**理由**: 詳細ページではまず default form を表示する設計（フロントエンドの後続 change で確定済み）。spec で `is_default` を契約化したので、API レベルでも `is_default` を直接参照する。

`form_id` NULL の `pokedex_entries` は「UI 側で is_default の form をデフォルト表示する」と spec を更新する（`domain-schema` の MODIFIED Requirement）。

## Risks / Trade-offs

- **Cursor の opaque 化により URL を手で組み立てづらい** → デバッグ時は decode するユーティリティを `apps/api/src/lib/cursor.ts` に同梱する。E2E テストでは内部関数を直接呼ぶ
- **AND 検索の GROUP BY + HAVING はタイプ数が増えると遅くなりうる** → タイプは最大 2（`MAX_TYPES = 2`）に制限されているため実用上問題なし
- **詳細レスポンスのサイズが large になりうる** → 含めるのは 1 form 分の sprites / names / types + 進化チェーン（数件）。リスト系ではないので問題範囲内
- **envelope の generic 化は契約の意味的拡張** → spec 上は「meta が任意の構造を持てる」と既に規定されており、後方互換が保たれる。既存利用箇所のリグレッションは型エラーで検知可能

## Migration Plan

1. **migration 0002 を生成**: `pnpm --filter @pokedex/api db:generate --name add_search_indexes`
2. **DB 反映**: `pnpm --filter @pokedex/api db:push` でローカル DB に反映、`migrations.test.ts` で生成 SQL を検証
3. **デプロイ**: production では Supabase migrations の通常フロー（`supabase db push`）に乗せる
4. **ロールバック**: migration 0002 を revert する `DROP INDEX` SQL を `supabase/migrations/0002_add_search_indexes.down.sql` として用意（プロジェクト規約に倣う）

## Open Questions

- **`INVALID_QUERY` の責任範囲**: 既存エラーコード `INVALID_QUERY` を「クエリパラメータの不正全般」に流用するが、フロントエンドが「どの項目が不正か」を表示したい場合に粒度不足になる可能性。本 change ではメッセージで詳細を返し、コードは `INVALID_QUERY` で統一する。将来必要なら細分化（`INVALID_POKEDEX` 等）を別 change で
- **進化チェーンのレスポンス形状**: 「進化前 → 自身 → 進化後」の単純な配列で返すか、有向グラフ形式で返すか。本 change では「self を中心とした enclosing chain 全体」を species 配列で返し、UI 側で関係を組み立てる方針とする（詳細は specs に記述）
