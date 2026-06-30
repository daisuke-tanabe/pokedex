## Context

`apps/web` は `web-foundation` capability により Next.js 16 + Tailwind v4 + shadcn `new-york-v4` + Hono RPC ベースの `serverApiClient` + Vitest + MSW のテスト基盤が既に整備されている。前段 change `add-shared-pokedex-and-type-enums` (#160) で `PokedexSlug` / `TypeSlug` enum + `POKEDEX_SLUG_VALUES` / `TYPE_SLUG_VALUES` 非空タプルが contracts に集約され、Valibot picklist による early reject も完了している。`apps/api` の `GET /pokemon` は cursor pagination (`{ nextCursor: string | null }`) + `pokemonListQuerySchema` で利用可能。

本 change では「BE は動いているが UI が無い」状態を解消する。`/` (トップページ) を検索 UI と結果一覧の統合ページとし、ユーザがブラウザから図鑑切替・タイプ AND 絞り込み・無限スクロールで結果を閲覧できるようにする。後続の詳細ページ / locale routing / Cache Components 本番適用は別 change のスコープ。

実装には bulletproof-react 風の `features/pokemon-list/` ディレクトリを置き、`api/` (apiClient ラッパ + hook) / `components/` (UI) / `hooks/` (URL state) に分割する。

## Goals / Non-Goals

**Goals:**

- `/` で検索フォーム + 結果一覧を表示し、ユーザが pokedex / type を指定して図鑑を絞り込める
- URL クエリ (`?pokedex=paldea&types=fire,flying`) と検索状態を双方向同期し、ブックマーク / シェアが可能
- RSC で 1 ページ目を SSR し、初回表示の TTFB / SEO 双方を確保する
- 2 ページ目以降は `useInfiniteQuery` で `initialData` を hydrate し CSR fetch
- IntersectionObserver で次ページを自動取得しつつ、`prefers-reduced-motion` / キーボード操作ユーザ向けに「もっと見る」`<Button>` を a11y フォールバックとして残す
- `@pokedex/contracts` の enum を import して検索フォームの選択肢を構築し、BE / seed との乖離を防ぐ
- 検索 UI / 一覧 / 無限スクロール / URL state / エラー境界をすべて Vitest + RTL + MSW でテストする

**Non-Goals:**

- 詳細ページ実装 → 別 change `add-web-detail-ui` (仮称)
- card クリックでの遷移 → 詳細ページと一体で別 change
- locale routing (`/ja`, `/en`) → 別 change
- Cache Components (`use cache` / `cacheLife` / `cacheTag`) の本番適用 → 別 change
- ソート切替 UI (現状 API は pokedex_number 昇順固定) → API 拡張も含めて別 change
- 検索履歴の localStorage 永続化 → 必要性が確認できてから別 change
- shiny / form 切替フィルタ → 詳細ページの責務
- ページ送り (page 番号方式) → cursor 一本化で十分

## Decisions

### Decision 1: `/` 1 ルートに検索 + 一覧を統合 (ルート分離なし)

**Why:** 検索フォームと結果一覧は同一文脈で操作・閲覧されるため、ルートを `/search` などに分けると URL state (`?pokedex=...`) の二重管理 (top と search) になる。トップページ訪問時に何も表示されない空ページを避ける意味でも、`/` で即座に national 図鑑 1 ページ目を見せるほうが UX として自然。

**Outcome:** `apps/web/src/app/page.tsx` で `searchParams` から `pokedex` / `types` / `cursor` / `limit` を読み、`serverApiClient` で 1 ページ目を fetch して `<PokemonListView initialData={...}>` に props で渡す。

**Alternatives considered:**

- A) `/search` 専用ルート → 二重管理、空のトップを避けるための redirect が必要、却下
- B) `/?q=...` 形式の独自 query 設計 → contracts の `pokemonListQuerySchema` と乖離、却下

### Decision 2: Hybrid (RSC 1 ページ目 + Client 続き)

**Why:** 1 ページ目を CSR fetch にすると初期表示が常に loading skeleton → 中身、となり TTFB / SEO 双方で不利。完全 SSR (全ページ) にすると無限スクロールが書きづらく `'use client'` の境界が崩れる。Hybrid なら 1 ページ目は server fetch (`searchParams` 反映済) で hydrate 完了、2 ページ目以降は `useInfiniteQuery` で CSR fetch という標準パターンに収まる。

**Outcome:** RSC で 1 ページ目を fetch → `<PokemonListView initialData={page1}>` に props 渡し → Client 側で `useInfiniteQuery({ initialData: { pages: [initialData], pageParams: [undefined] } })` で hydrate。

**Alternatives considered:**

- A) 完全 CSR → 初期表示 SEO に弱い、却下
- B) 完全 SSR + Server Actions で次ページ取得 → URL state と相性が悪く `<Link>` ナビゲーション全体が遅くなる、却下

### Decision 3: TanStack Query (`useInfiniteQuery`) 採用

**Why:** cursor 駆動の無限スクロールは `useInfiniteQuery` の `getNextPageParam` が標準パターン。再フェッチ / キャッシュ / loading / error 状態管理が hook 一つで揃う。SWR や手書き fetch + useReducer に比べてコスト面で勝るタイプの問題ではないが、後続 (詳細ページ / `useQuery` 化) で TanStack Query を多用する見通しを踏まえると今のうちに導入したほうが累計コスト最小。

**Outcome:** `apps/web/src/app/query-provider.tsx` で `QueryClientProvider` を `'use client'` で wrap。`features/pokemon-list/api/use-infinite-pokemon-search.ts` に `useInfiniteQuery` を集約。

**Alternatives considered:**

- A) SWR → `useSWRInfinite` も同等だが、後続の楽観的更新 / mutation の見通しを考えると TanStack Query が標準
- B) 手書き fetch + useReducer → DRY 違反、却下

### Decision 4: nuqs で URL state 同期

**Why:** URL クエリと検索状態を手書きで双方向同期するのは history.push / popstate / searchParams 取得を毎回書く必要があり実装コストが嵩む。nuqs は React Server Components 対応 + Next.js App Router 公式推奨で、`useQueryState` / `parseAsString` 等の API で型安全に書ける。

**Outcome:** `apps/web/src/app/nuqs-provider.tsx` で `NuqsAdapter` を `'use client'` で wrap。`features/pokemon-list/hooks/use-pokemon-search-params.ts` で `pokedex` / `types` を `useQueryState` で扱う。

**Alternatives considered:**

- A) 手書き `useSearchParams` + `router.replace` → boilerplate が増える、却下
- B) Zustand 等の external store + URL 手動同期 → state の二重ソースを生む、却下

### Decision 5: IntersectionObserver + `<Button>` a11y フォールバック

**Why:** スクロール末端で自動的に次ページを取得するのが主流体験だが、キーボード単独ユーザ / `prefers-reduced-motion` 設定ユーザにとって自動 fetch は不意打ちで困る。両方を共存させるには、IntersectionObserver で fetch を発火しつつ、その同じ要素を `<Button>` として残して click でも fetch できるようにする。

**Outcome:** `features/pokemon-list/components/load-more.tsx` で sentinel 要素を `<Button>` として render し、`useIntersectionObserver` で visible になったら `fetchNextPage` を呼ぶ。Button は通常時 visible (テキスト「もっと見る」)、`isFetchingNextPage` 中は disabled + skeleton。

**Alternatives considered:**

- A) IntersectionObserver 単独 (Button なし) → a11y NG
- B) Button のみ (auto fetch なし) → スクロール UX が劣化

### Decision 6: Cache Components (`use cache` / `cacheLife` / `cacheTag`) は本 change で適用しない

**Why:** Cache Components は Next.js 16 のキャッシュレイヤを `use cache` ディレクティブで明示する仕組みだが、本 change のスコープは「動作するトップページを作る」こと。Cache 設計を入れると ttl / tag invalidation を最初から考える必要があり、UI 実装と並行して扱うとリスクが高い。先に CRUD 経路を確定し、本番適用は別 change で扱う。

**Outcome:** `page.tsx` の RSC fetch は標準の `fetch` (デフォルト `cache: 'no-store'` 相当, `searchParams` 変更で都度 fetch)。`use cache` は使わない。

**Alternatives considered:**

- A) 1 ページ目だけ `use cache` 適用 → searchParams 駆動の cache key 設計が複雑、却下

### Decision 7: 追加 shadcn コンポーネント 5 件 (`card` / `badge` / `skeleton` / `select` / `toggle-group`)

**Why:** 検索フォーム (`select` / `toggle-group`)、結果カード (`card` / `badge`)、ローディング表示 (`skeleton`) は本 change で必須の primitives。`new-york-v4` registry の最新版を `shadcn add` で生成し、既存の `button.tsx` と同様 `apps/web/src/components/ui/` に配置。

**Outcome:** `pnpm dlx shadcn@latest add card badge skeleton select toggle-group` で一括追加。生成された `.tsx` は手動編集せず upstream の registry と同期可能な状態を保つ。

**Alternatives considered:**

- A) 手書き UI → 既存 button.tsx の方針 (own code モデル + new-york-v4) と整合しない、却下
- B) headless 別ライブラリ → shadcn を採用済みのため不統一になる、却下

### Decision 8: contracts の enum (`POKEDEX_SLUG_VALUES` / `TYPE_SLUG_VALUES` / `PokedexSlug` / `TypeSlug`) を import して選択肢を構築

**Why:** 前段 change で contracts に集約済。FE が hardcode すると seed / BE と乖離するリスクが復活する。enum を import すれば変更時の同期忘れが構造的にゼロになる。

**Outcome:** `features/pokemon-list/components/search-form.tsx` で `POKEDEX_SLUG_VALUES.map(...)` で `<SelectItem>`、`TYPE_SLUG_VALUES.map(...)` で `<ToggleGroupItem>` を生成。表示名 (日本語 / 英語ラベル) は表示時に別途解決する (`labels-pokedex.ts` / `labels-type.ts` を `features/pokemon-list/lib/` に置く想定。詳細は tasks 段階で確定)。

**Alternatives considered:**

- A) FE で hardcode → 前段 change の意義を打ち消す、却下
- B) `/api/master` のような master 取得 API → contracts enum で足りる、過剰設計

### Decision 9: 詳細ページへの遷移は本 change で実装しない

**Why:** 詳細ページ実装はそれ単独で別 change 規模 (`add-web-detail-ui`)。本 change の scope を膨らませると同時マージのリスクが上がる。card は表示のみとし、クリック挙動は次 change で hook する。

**Outcome:** `pokemon-card.tsx` は `<a>` / `<Link>` を持たず、`<article>` 等の semantic タグでカードを描画。aria-label に species name を付け、後続 change で `<Link>` 化したときに spec 変更最小に収まる構造にする。

**Alternatives considered:**

- A) `<Link href={...}>` だけ先に張る → 404 ページに飛ぶだけで体験が悪い、却下

### Decision 10: 入力反映の throttling — pokedex は即時 / types は 300ms throttle

**Why:** pokedex select は 1 アクション = 1 切替で連打が起きないため即時反映 (URL 更新 + fetch) で問題ない。types toggle-group は max 2 件の AND 制約があり、ユーザが 2 件目を選ぶ過程で連続 toggle されると無駄 fetch が増える (例: `fire` ON → `water` ON で 2 度 fetch される)。300ms throttle で「ボタン押下が落ち着いてから fetch」する。

**Outcome:** `use-pokemon-search-params.ts` 内で `types` 側だけ throttle 適用。`pokedex` は素通し。

**Alternatives considered:**

- A) どちらも即時 → types の連打で無駄 fetch、却下
- B) debounce → 入力途中の最後の状態だけ反映、ユーザの「決定」と FE の「fetch」のタイミング差が大きく感じる、却下

### Decision 11: Provider 構成は Next.js 16 公式 docs 例示スタイル (個別ファイル分割)

**Why:** Next.js 16 の公式ドキュメントでは `'use client'` provider をそれぞれ独立ファイル (`query-provider.tsx` / `theme-provider.tsx` 等) として書き、`layout.tsx` でネストして wrap する例示が標準。集約 `providers.tsx` を作ると "use client" 境界が広がり、不要な client bundle が増える。本 change ではこの公式スタイルを採用する。

**Outcome:**

```tsx
// app/layout.tsx (RSC)
<html lang="ja">
  <body>
    <QueryProvider>
      <NuqsProvider>{children}</NuqsProvider>
    </QueryProvider>
  </body>
</html>
```

`apps/web/src/app/query-provider.tsx` / `nuqs-provider.tsx` をそれぞれ `'use client'` 単独ファイルとして配置。`{children}` のみを wrap し、`<html>` / `<body>` は RSC のまま。

**Alternatives considered:**

- A) `apps/web/src/app/providers.tsx` で集約 → 公式と外れる、不要な client bundle 拡大の懸念
- B) `apps/web/src/components/providers/` 配下に分離 → `app/` 直下に置くのが Next.js 公式の慣習で整合性高い

### Decision 12: API 呼び出しは既存 `serverApiClient` (RSC 側) と `createApiClient` (Client 側) を使い分ける

**Why:** `web-foundation` の Requirement で既に `serverApiClient` (`process.env.API_URL` 解決済) と `createApiClient(baseUrl)` factory が提供されている。RSC 側は `serverApiClient` を直接 import、Client 側は `createApiClient('/api')` で Next.js の rewrite (もしくは Route Handler proxy) 経由で呼ぶ構成にしておくと、ブラウザに `API_URL` を露出させずに済む。

**Outcome:** Client 側の baseUrl は `'/api'` (相対パス) に固定し、`apps/web/src/app/api/pokemon/route.ts` で proxy する… が、これも別 change 候補。本 change では Client 側も `process.env.NEXT_PUBLIC_API_URL` を使わず、最終的な構成は実装着手時 (apply phase) に re-decide する。Open Question として残す。

**Alternatives considered:**

- A) `NEXT_PUBLIC_API_URL` 導入 → `web-foundation` の Requirement「`NEXT_PUBLIC_API_URL` は導入しない」と衝突、却下
- B) Route Handler proxy (`/api/pokemon` → `serverApiClient`) → 本 change の scope を膨らませる、apply phase で要検討

## Risks / Trade-offs

- **[Risk] TanStack Query 採用による client bundle 増加** → Mitigation: 1 ページ目は RSC で server fetch するため初期 hydration cost は微増のみ。tree-shaking + 必要箇所だけ import で実害最小に抑える
- **[Risk] nuqs と RSC の `searchParams` のシリアライゼーション不整合** → Mitigation: `parseAsString` / `parseAsArrayOf` のスキーマで両側を統一。`page.tsx` 側は Next.js の `searchParams` を直接読み取り、nuqs はクライアント側の URL 更新のみ責務にする
- **[Risk] IntersectionObserver の a11y フォールバック品質** → Mitigation: Button を sentinel と兼用し、disabled / loading / error 状態を全て表示。`prefers-reduced-motion` ユーザ向けに自動 fetch を抑制するオプションは別 change で再評価
- **[Risk] throttle 値 (types 300ms) の妥当性** → Mitigation: 実装後に体験テストで再調整。300ms は debounce / throttle の業界平均
- **[Risk] `page.tsx` の RSC fetch エラー時の表示** → Mitigation: `apps/web/src/app/error.tsx` でフォールバック。手動リトライ用の `<Button onClick={reset}>` を提供
- **[Trade-off] Cache Components 未適用** → 本番ロードが増える可能性。アクセス傾向を見て別 change で `use cache` / `cacheTag('pokemon-list', pokedex, types)` を入れる宿題
- **[Trade-off] 詳細ページ遷移なし** → card クリックの体験不足。次 change で `<Link>` 化する

## Migration Plan

1. feature ブランチ `feat/add-web-search-ui` で作業 (済)
2. shadcn 追加 5 件 (`card` / `badge` / `skeleton` / `select` / `toggle-group`) を `pnpm dlx shadcn@latest add` で生成
3. 依存追加: `@tanstack/react-query` / `nuqs` を `apps/web/package.json` の `dependencies` に追加 (`pnpm add`)
4. `apps/web/src/app/query-provider.tsx` / `nuqs-provider.tsx` を新規作成 (`'use client'`)
5. `apps/web/src/app/layout.tsx` を更新し、`<QueryProvider><NuqsProvider>{children}</NuqsProvider></QueryProvider>` で wrap
6. `apps/web/src/app/error.tsx` を新規作成 (Next.js App Router の error boundary)
7. `apps/web/src/features/pokemon-list/` ディレクトリを新規作成:
   - `api/search-pokemon.ts` (apiClient ラッパ)
   - `api/use-infinite-pokemon-search.ts` (`useInfiniteQuery` hook)
   - `hooks/use-pokemon-search-params.ts` (nuqs ラッパ + throttle)
   - `components/pokemon-list-view.tsx` (親, `'use client'`)
   - `components/search-form.tsx` (`'use client'`)
   - `components/pokemon-grid.tsx` (grid layout)
   - `components/pokemon-card.tsx` (1 件)
   - `components/load-more.tsx` (`'use client'`, IntersectionObserver + Button)
   - `components/empty-state.tsx` (0 件表示)
   - `lib/labels-pokedex.ts` / `lib/labels-type.ts` (slug → 表示名マップ、apply 時に検討)
8. `apps/web/src/app/page.tsx` を RSC fetch (`serverApiClient` 経由) に書き換え、`<PokemonListView initialData={...}>` に props 渡し
9. `apps/web/src/test/msw/handlers.ts` に `/pokemon` モックを追加
10. `apps/web/src/features/pokemon-list/**/*.test.tsx` のテストを書く (RTL + MSW)
11. `pnpm -r typecheck` / `lint` / `format:check` / `test` で全 green を確認
12. `openspec validate add-web-search-ui --strict`
13. セルフレビュー (`typescript-reviewer` + `react-reviewer` を並列起動)
14. PR 作成

Rollback: 本 change が原因で問題発生時は PR を revert。`web-foundation` の Requirements を破壊する変更は含まないため、revert で `/` がスケルトンページに戻るだけ。

## Open Questions

- Client 側 API 呼び出しの baseUrl 解決 (Decision 12): Route Handler proxy を本 change に含めるか、別 change に切るか → apply phase 着手時に決定
- pokedex select の表示順 (national 先頭 / 地方順 / アルファベット順)
- types toggle-group の表示順 (国際標準のタイプ相性表順 / 五十音順 / アルファベット順)
- empty-state の文言 (「該当するポケモンが見つかりませんでした。条件を変えてみてください」程度の標準文言で十分か)
- pokedex_number 表示形式 (`#0025` のゼロ埋め桁数を 3 桁にするか 4 桁にするか — paldea 図鑑 400 件 / national 1024 件を踏まえ 4 桁が無難)
