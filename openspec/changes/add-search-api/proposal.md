## Why

ポケモン図鑑のトップページ（検索フォーム + ポケモン一覧の無限スクロール）と詳細ページを実装するには、検索・一覧・詳細を返す REST API が必要になる。前段の `add-form-default-flag` で `forms.is_default` 列を整備したことにより、検索結果や一覧で「どの form を代表として返すか」のロジックが安定的に表現できるようになった。本 change で API レイヤを立ち上げ、UI 実装フェーズへ橋渡しする。

## What Changes

- **新規 REST エンドポイント** (`apps/api`)
  - `GET /api/pokemon`: 図鑑（pokedex）スラッグおよびタイプ（types、カンマ区切り複数）の AND 検索と、全国図鑑番号昇順の cursor ベース無限スクロール一覧
  - `GET /api/pokemon/:slug`: ポケモン詳細（species + form + 進化チェーン + sprites + 多言語 names + types）
- **Repository 層の導入** (`apps/api/src/repositories/`)
  - Drizzle 実装と mock 実装の差し替え可能な interface（スタートポロジー準拠）
  - route 層は repository interface のみに依存
- **共通契約の拡張** (`@pokedex/contracts`)
  - Envelope schema を generic 化し、cursor を含む meta 型を返せるようにする
  - 検索／一覧／詳細の request / response Valibot schemas を追加
  - エラーコードに `POKEMON_NOT_FOUND` を追加
- **Cursor 仕様** (`apps/api/src/lib/cursor.ts`)
  - `(pokedex_number, form_id)` の複合キーを base64url エンコードした opaque token
  - 同一 `pokedex_number` に複数 form がぶら下がるケースで安定ソートを保証
- **DB スキーマ補助**
  - 検索クエリ用の FK インデックス追加（`supabase/migrations/0002_add_search_indexes.sql`）
- **既存仕様の修正**
  - `domain-schema`: `pokedex_entries.form_id` が NULL の場合のデフォルト表示ロジック記述を `category='normal'` 参照から `is_default = true` 参照に更新

## Capabilities

### New Capabilities

- `pokemon-api`: ポケモンの検索・一覧・詳細を提供する REST API。Hono routes、Repository 層、Valibot 入力検証、cursor ベース pagination、エラーエンベロープ準拠を含む

### Modified Capabilities

- `shared-contracts`: Envelope を generic 化し meta 型を表現可能にする、`pokemon-api` 用 request/response schemas を追加、エラーコードに `POKEMON_NOT_FOUND` を追加
- `domain-schema`: `pokedex_entries.form_id` NULL 時のデフォルト表示ロジック記述を `is_default = true` 参照に変更

## Impact

- **追加されるコード**
  - `apps/api/src/routes/pokemon.ts`（route 定義）
  - `apps/api/src/repositories/pokemon.ts`（real DB 実装）、`apps/api/src/repositories/pokemon.mock.ts`（mock 実装）
  - `apps/api/src/lib/cursor.ts`（opaque cursor encode/decode）
  - `packages/contracts/src/pokemon/*.ts`（request/response/error schemas）
  - `supabase/migrations/0002_add_search_indexes.sql`
- **変更されるコード**
  - `packages/contracts/src/envelope.ts`（generic 化）
  - `apps/api/src/index.ts`（route 登録）
- **既存仕様の更新**
  - `openspec/specs/shared-contracts/spec.md`
  - `openspec/specs/domain-schema/spec.md`
- **非ゴール（Non-Goals）**
  - 地方（region）スラッグでの検索 → 将来 change で対応
  - 図鑑番号「範囲」検索や、タイプ「OR」検索 → 本 change では AND のみ
  - ポケモンの作成・更新・削除（書き込み系）→ 本 change は read-only API
- **テスト**
  - route 層: mock repository を注入したユニットテスト
  - repository 層: real DB に対する統合テスト（`DATABASE_URL` 環境変数 skipIf パターンを継承）
- **依存パッケージ**: 既存に追加なし（Hono / Valibot / Drizzle / postgres-js / @hono/valibot-validator）
