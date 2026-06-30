## Why

`add-web-search-ui` でトップページの検索 UI / 結果一覧 / 無限スクロールは動作するようになったが、見た目が味気ない。検索フォームが本文に常時展開され画面を圧迫し、タイプは全て同色の灰 badge で判別性が低く、カードは名前と番号が横並びで視線誘導が弱い。ミニマルさを保ったまま、検索の集約・タイプの色分け・カードの再設計で一覧の可読性と図鑑らしさを引き上げる。

## What Changes

- **検索 UI のハーフモーダル集約**: 常時展開していた `SearchForm` を下から競り上がるハーフモーダル（shadcn `Drawer` / vaul）内に移し、トップページにはトリガーボタンのみを置く。選択は即時反映（適用ボタンなし）で既存挙動を維持し、トリガーには選択中のタイプ件数バッジを表示する
- **タイプの色分け**: 18 タイプを定番パレット準拠・低〜中彩度の oklch トークンとして `globals.css` に light/dark 両方で定義し、`labels-type.ts` に `slug → className` マップを追加。`PokemonCard` / `SearchForm` の badge に適用する。色は補助に留め、**日本語ラベル文字は必ず併記**（色のみに意味を依存させない）
- **ポケモンカードの再設計**: sprite → 番号 → 名前 → タイプの縦構成へ変更。番号は `font-mono`・細字・muted で名前の上に配置（横並びを廃止）、名前は `font-medium`、ドロップシャドウは `shadow-sm` 相当に薄く、余白を一段詰める
- **新規 shadcn コンポーネント**: `drawer`（vaul ベースのハーフモーダル）を `apps/web/src/components/ui/` に追加（`new-york-v4` registry）
- **検索条件切替時のローディング**: 検索条件（pokedex / types）を変更した直後の再 fetch 中は、古い一覧を残さず `<ListSkeleton>` を表示する。RSC の `initialPage` を `initialData` として供給する範囲を「マウント時点の検索条件」に限定し、別 queryKey へ `initialData` が引き継がれて古い一覧が success 状態で残る挙動を防ぐ
- **テスト**: モーダル開閉 / トリガーの件数表示 / タイプ色クラスの適用 / 色非依存（ラベル併記）/ 検索条件切替時に `initialData` が引き継がれないことの Scenario を Vitest + RTL で追加

## Impact

- Affected specs: `web-search-ui`（ADDED requirements のみ。既存 Requirement の Scenario は不変）
- Affected code:
  - `apps/web/src/app/globals.css`（タイプ色トークン追加）
  - `apps/web/src/features/pokemon-list/lib/labels-type.ts`（slug → color className マップ追加）
  - `apps/web/src/features/pokemon-list/components/pokemon-card.tsx`（レイアウト再設計 + badge 色適用）
  - `apps/web/src/features/pokemon-list/components/search-form.tsx`（モーダル化に伴う調整 / badge 色適用）
  - `apps/web/src/features/pokemon-list/components/search-drawer.tsx`（検索ハーフモーダルを新規追加）
  - `apps/web/src/features/pokemon-list/api/use-infinite-pokemon-search.ts`（`initialData` 供給範囲を初期 input に限定）
  - `apps/web/src/components/ui/drawer.tsx`（新規, shadcn `add` で生成 / vaul 依存）
- **既存挙動への影響**: 検索の即時反映・URL state 同期・無限スクロール・カードの描画要素（名前 / 番号 / タイプ / sprite）は不変。変わるのは配置・色・タイポグラフィ、および検索条件切替時のローディング表示のみ
- **Out of scope**: 全国図鑑 001–1025 の表示範囲制御（データ / クエリ側の別タスク）、詳細ページ遷移、ソート / 検索履歴、shiny / form 切替フィルタ
