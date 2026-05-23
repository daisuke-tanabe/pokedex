## Why

`add-domain-schema` で実装した `forms` テーブルは、各 species のデフォルトフォーム判定を **暗黙的に `category='normal'`** に依存している。現シードでは「全 species に `normal` カテゴリのフォームが 1 件存在する」状態でたまたま機能しているが、これは設計上の保証ではなく **偶然的整合性** である。

後続の `add-search-api` change で `GET /api/pokemon/:species_slug` (form 省略時) のデフォルトフォームを返す API を実装する際、この判定ロジックが脆い:

- `category='normal'` が 0 件の species が将来出現したら破綻
- `category='normal'` が複数件の species が誤って投入されたら曖昧
- 「ゲームのノーマル形態」と「API/UI のデフォルト表示」を将来別概念として扱いたくなる余地がない

加えて、後続 `add-search-api` で採用が決まった URL 設計 `GET /api/pokemon/:species_slug/:form_slug` では `forms.slug` を path segment として露出する。現在の slug 規約 (`charizard-mega-x`, `raichu-alola`) は **species 名を冗長に含む** ため、`/pokemon/charizard/charizard-mega-x` のように見栄えが悪い。URL 設計が乗りやすい状態に整える必要がある。

API 実装に着手する前に **forms スキーマと seed JSON の整備** を独立した小さな change として先行させることで、`add-search-api` を純粋に「API レイヤ」に集中させる。

## What Changes

- `forms` テーブルに **`is_default boolean NOT NULL DEFAULT false`** 列を追加する
  - 部分 UNIQUE 制約: `species_id` ごとに `is_default = true` の行は最大 1 件に制限する (PostgreSQL の部分インデックスを使用)
  - 「`category='normal'` カテゴリ」と「API/UI のデフォルト表示対象」を独立した概念として分離する
- **`forms.slug` を species 名を含まない短縮形に揃える** 規約を導入する
  - `'charizard-mega-x'` → `'mega-x'`
  - `'raichu-alola'` → `'alola'`
  - `'ogerpon-teal'` → `'teal'`
  - `'pikachu-cosplay'` → `'cosplay'`
  - 通常フォーム (species slug と同じ) は内部表現を判別しやすい統一規約に整える (例: `'normal'` or species slug と同一を維持して `isDefault` で判別)
- `apps/api/src/db/seed/data/forms.json` を新規スキーマと slug 規約に合わせて全面更新する (27 form エントリ)
  - 各 species の通常フォームに `"isDefault": true` を 1 件ずつ設定する
  - slug を短縮形に書き換える
- `apps/api/src/db/seed/data/pokedexes.json` の `formSlug` 参照を短縮形に追随する (`ogerpon-teal` → `teal` 等)
- `apps/api/src/db/seed/schemas/index.ts` の valibot スキーマに `isDefault: boolean` を `formRowSchema` に追加する
- `apps/api/src/db/seed/invariants.ts` に **「全 species に対し `is_default=true` のフォームが exactly 1 件存在する」** invariant を追加する
- `apps/api/src/db/seed/seed.ts` の `seedForms` に `isDefault` 列の投入を追加する
- `drizzle-kit generate` で `0001_add_form_default_flag.sql` (仮称) を生成し、`supabase/migrations/` にコミットする
- `apps/api/src/db/schema/__tests__/forms.test.ts` の smoke テストに `is_default` 列の存在検証を追加する
- `apps/api/src/db/__tests__/migrations.test.ts` の生成 SQL 検査に **「部分 UNIQUE インデックス `(species_id) WHERE is_default = true`」** が含まれることを追加する
- `apps/api/src/db/seed/invariants.test.ts` に default フォーム 1 件 exactly の検証を追加する

## Capabilities

### Modified Capabilities

- `domain-schema`: `forms` テーブルの Requirement に `is_default boolean NOT NULL` 列と部分 UNIQUE 制約を追加する。`(species_id, slug)` UNIQUE は維持。slug 規約として「species 名を含まない短縮形」を明示する
- `domain-seed`: `forms.json` の `isDefault` フィールド (必須)、slug 短縮形規約、不変条件 (全 species に default exactly 1 件) を追加する

## Impact

- 影響範囲:
  - `apps/api/src/db/schema/forms.ts` (列追加 + 部分 UNIQUE 定義)
  - `apps/api/src/db/seed/data/forms.json` (全面更新、27 エントリ)
  - `apps/api/src/db/seed/data/pokedexes.json` (`formSlug` 参照更新、1 件)
  - `apps/api/src/db/seed/schemas/index.ts` (valibot に `isDefault` 追加)
  - `apps/api/src/db/seed/seed.ts` (`seedForms` で `isDefault` 投入)
  - `apps/api/src/db/seed/invariants.ts` + テスト (新 invariant)
  - `supabase/migrations/0001_*.sql` (新規 1 ファイル)
  - `apps/api/src/db/schema/forms.test.ts` (smoke 拡張)
  - `apps/api/src/db/__tests__/migrations.test.ts` (SQL 検査追加)
- 新規依存: なし (既存 `drizzle-orm` / `drizzle-kit` / `postgres` / `valibot` で完結)
- 既存 API: `GET /health` は影響なし、`AppType` 型形状にも変更なし
- 後続 change への前提:
  - `add-search-api` は本 change の `forms.is_default` と短縮 slug を前提に URL 設計・SQL を組む
  - 本 change が先にマージされていないと `add-search-api` の実装が進められない
- 既存 archive change への影響: なし (archive は履歴として不変、現役 spec のみ更新)
