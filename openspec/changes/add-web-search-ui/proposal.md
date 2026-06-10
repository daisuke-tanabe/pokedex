## Why

ポケモン図鑑のトップページ機能 (検索フォーム + 結果一覧の無限スクロール) を `apps/web` に実装する。前段 change `add-shared-pokedex-and-type-enums` (#160) で `PokedexSlug` / `TypeSlug` enum が contracts に集約されたため、FE は hardcode せず enum を import するだけで検索フォームの選択肢を構築できる状態が整った。`apps/api` 側は既存の `GET /pokemon` (`pokemonListQuerySchema` + cursor pagination) が利用可能で、契約 (`@pokedex/contracts`) を介して直接呼び出せる。

本 change で「BE は既に動いているが UI が無い」状態を解消し、ユーザがブラウザから図鑑を切り替え・タイプで AND 絞り込み・無限スクロールで結果を閲覧できるようにする。

## What Changes

- **検索 UI 基盤**: `/` (トップページ) に検索フォーム + 結果一覧を統合配置 (ルート分離なし)
- **検索フォーム**: pokedex slug 選択 (`<Select>`, 即時反映)、タイプ AND 絞り込み (`<ToggleGroup type="multiple">`, max 2 件、throttle 300ms)
- **結果一覧**: card + badge + sprite による grid 表示、空状態 (`empty-state`) の専用 UI
- **無限スクロール**: cursor-based pagination で次ページ取得、IntersectionObserver で自動発火 + 「もっと見る」`<Button>` a11y フォールバック
- **URL state**: `nuqs` で `pokedex` / `types` パラメータを URL クエリと双方向同期 (ブックマーク / シェア対応)
- **データ取得方式 (Hybrid)**: RSC (`page.tsx`) で 1 ページ目を `searchParams` ベースに fetch → Client (`useInfiniteQuery`) で `initialData` として hydrate し、続きを CSR fetch
- **Provider 構成**: `apps/web/src/app/query-provider.tsx` / `nuqs-provider.tsx` をそれぞれ独立した `'use client'` ファイルで定義し、`layout.tsx` で `{children}` を wrap (Next.js 16 公式 docs 例示スタイル、`providers.tsx` 集約は採用しない)
- **新規 shadcn コンポーネント**: `card` / `badge` / `skeleton` / `select` / `toggle-group` を `apps/web/src/components/ui/` に追加 (`new-york-v4` registry)
- **新規依存**: `@tanstack/react-query` (TanStack Query)、`nuqs` (URL state)
- **エラーバウンダリ**: `apps/web/src/app/error.tsx` を新規追加 (RSC fetch 失敗時 / Client fetch 失敗時のフォールバック)
- **テスト**: 検索フォーム / 一覧描画 / 無限スクロール / URL state 同期 / エラー表示の Scenario を Vitest + RTL + MSW で実装

## Capabilities

### New Capabilities

- `web-search-ui`: トップページの検索 UI capability。検索フォーム / 結果一覧 / 無限スクロール / URL state / Provider 構成 / エラーバウンダリの Requirements を集約する。`apps/web/src/features/pokemon-list/` を実装単位とし、`web-foundation` (Next.js / Tailwind / shadcn / API client 基盤) の上に積み上がる。

### Modified Capabilities

(なし — `web-foundation` は基盤規定としてそのまま、検索 UI は新規 capability として独立させる)

## Impact

- **コード (新規)**:
  - `apps/web/src/app/page.tsx` (修正: 既存スケルトンを RSC fetch 化)
  - `apps/web/src/app/layout.tsx` (修正: Provider wrap 追加)
  - `apps/web/src/app/query-provider.tsx` (新規, `'use client'`)
  - `apps/web/src/app/nuqs-provider.tsx` (新規, `'use client'`)
  - `apps/web/src/app/error.tsx` (新規)
  - `apps/web/src/features/pokemon-list/` (新規ディレクトリ一式: `api/` / `components/` / `hooks/`)
  - `apps/web/src/components/ui/{card,badge,skeleton,select,toggle-group}.tsx` (新規, shadcn `add` で生成)
- **依存**: `@tanstack/react-query` / `nuqs` を `apps/web/package.json` の `dependencies` に追加。shadcn 追加コンポーネントが要求する radix サブパッケージは既存 `radix-ui` monorepo パッケージで解決される想定 (`add` 実行時に検証)
- **テスト**: `apps/web/src/features/pokemon-list/**/*.test.tsx` を新規追加 (RTL + MSW)。MSW handlers (`apps/web/src/test/msw/handlers.ts`) に `/pokemon` モックを追加
- **既存仕様への影響**: なし (`web-foundation` の Requirements は不変、検索 UI は新規 capability として上乗せ)
- **後続 change**: 詳細ページ (`add-web-detail-ui` 仮称) は本 change のスコープ外。pokemon-list の card クリックは表示のみで遷移しない。locale routing / Cache Components 本番適用も別 change
- **Out of scope**: ソート切替 UI、検索履歴の localStorage 永続化、shiny / form 切替フィルタ、ページ送り (cursor 以外のページネーション方式)
