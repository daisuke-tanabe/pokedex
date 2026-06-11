## 1. 事前準備とベースライン

- [x] 1.1 `pnpm -r typecheck` / `lint` / `format:check` / `test` を実行し、ベースラインで全 package green を確認する
- [x] 1.2 Decision 12 (Client 側 API 呼び出しの baseUrl 解決) を最終決定する: **案 A 採用** — 本 change で `apps/web/src/app/api/pokemon/route.ts` Route Handler proxy を追加し、既存 `/api/health/route.ts` パターンと整合させる。Client は `createApiClient('')` で相対パス `/api/pokemon` を呼ぶ。`NEXT_PUBLIC_API_URL` 非導入の `web-foundation` Requirement を維持
- [x] 1.3 [Open Question 解消] 表示順 / 桁数 / 文言を以下で確定:
  - pokedex select 表示順: `POKEDEX_SLUG_VALUES` のタプル順 (`national` → `paldea`、global → regional の自然順)
  - types toggle-group 表示順: `TYPE_SLUG_VALUES` のタプル順 (`normal`, `fire`, `water`, `electric`, ... 国際標準のタイプ相性表順)
  - pokedexNumber: 4 桁ゼロ埋め (`#0025` 形式、national 1024 件 / paldea 400 件を 4 桁で吸収)
  - empty-state 文言: 「該当するポケモンが見つかりませんでした。条件を変えてみてください」

## 2. 依存追加と shadcn コンポーネント追加

各タスクは Requirement「新規依存の追加」「新規 shadcn コンポーネントの追加」に対応する。

- [x] 2.1 [Impl] `pnpm --filter @pokedex/web add @tanstack/react-query nuqs` を実行し、`apps/web/package.json` の `dependencies` に両者を追加する (exact pin に正規化: `5.101.0` / `2.8.9`)
- [x] 2.2 [Impl] `pnpm dlx shadcn@latest add card badge skeleton select toggle-group` を実行し、`apps/web/src/components/ui/` に 5 ファイル (+ toggle-group の依存として `toggle.tsx`) を生成する
- [x] 2.3 [Verify] 5 ファイル (`card.tsx` / `badge.tsx` / `skeleton.tsx` / `select.tsx` / `toggle-group.tsx`) が存在し、すべて `data-slot` 属性を持つことを `grep -l "data-slot"` で確認
- [x] 2.4 [Verify] `apps/web/package.json` の `dependencies` に `@tanstack/react-query` と `nuqs` が含まれる
- [x] 2.5 [Verify] `pnpm --filter @pokedex/web typecheck` / `lint` / `format:check` green (`toggle-group.tsx` の `jsx-no-constructed-context-values` は shadcn upstream 由来の warning で exit 0、upstream fidelity 維持のため非修正)

## 3. Provider 構築と layout.tsx 更新

各タスクは Requirement「Provider 構成 (個別 'use client' ファイル分割)」に対応する。

- [x] 3.1 [Test] `apps/web/src/app/query-provider.test.tsx` で source-level (`'use client'` + `QueryClientProvider`) と integration (children が `QueryClient` を consume できる) を Scenario 化
- [x] 3.2 [Impl] `apps/web/src/app/query-provider.tsx` を新規作成 (`'use client'`、`useState` lazy init で `QueryClient` 生成 → `QueryClientProvider` で wrap)
- [x] 3.3 [Test] `apps/web/src/app/nuqs-provider.test.tsx` で source-level + smoke + `NuqsTestingAdapter` 配下での `useQueryState` 動作を Scenario 化
- [x] 3.4 [Impl] `apps/web/src/app/nuqs-provider.tsx` を新規作成 (`'use client'`、`NuqsAdapter` (`nuqs/adapters/next/app`) で wrap)
- [x] 3.5 [Impl] `apps/web/src/app/layout.tsx` を更新し、`<QueryProvider><NuqsProvider>{children}</NuqsProvider></QueryProvider>` で `{children}` を wrap。lang は `ja` に変更
- [x] 3.6 [Verify] `apps/web/src/app/layout.test.tsx` で「Server Component のまま children Provider wrap」「`providers.tsx` 不在」を test 化 (vitest.config.ts の oxc.jsx: automatic 設定追加で .tsx テストの transform 有効化)

## 4. MSW handlers 拡張

- [x] 4.1 [Impl] `apps/web/src/test/msw/handlers.ts` に `GET /api/pokemon` (200 + 3 件 → cursor=`PAGE_2_CURSOR_TOKEN` で 1 件追加) のデフォルトハンドラ `pokemonListSuccessHandler` を追加 (cursor pagination を最小再現)
- [x] 4.2 [Impl] 同 handlers に `pokemonListEmptyHandler` (200 + 空配列) と `pokemonListErrorHandler` (500) を export
- [x] 4.3 [Impl] (Decision 12 案 A) `apps/web/src/app/api/pokemon/route.ts` を新規追加。`process.env.API_URL` + `fetch` で thin proxy し、`incomingUrl.search` をそのまま転送 (NEXT_PUBLIC_API_URL 不要を維持)
- [x] 4.4 [Test] `apps/web/src/app/api/pokemon/route.test.ts` で 200 透過 / cursor 転送 / 空配列 / 500 透過 / Content-Type 付与の 5 ケースを test 化
- [x] 4.5 [Impl] `apps/web/src/lib/envelope.ts` の `successEnvelope` を `meta` overload 対応に拡張 (apps/api 側と同じシグネチャ) し、MSW handlers で `nextCursor` を返せるようにする
- [x] 4.6 [Impl] `vitest.config.ts` に `oxc.jsx: { runtime: 'automatic' }` を追加し、Next.js の `jsx: preserve` と独立に vitest 側で JSX transform を有効化する

## 5. URL state hook (hooks/use-pokemon-search-params)

各タスクは Requirement「nuqs による URL state 双方向同期」「検索フォームの type AND 絞り込み」(throttle 300ms 部分) に対応する。

- [x] 5.1 [Test] `apps/web/src/features/pokemon-list/hooks/use-pokemon-search-params.test.tsx` を作成、`NuqsTestingAdapter` 配下で URL → state 反映を test 化
- [x] 5.2 [Test] `setTypes(['fire', 'flying'])` で 2 件選択が state に反映されることを test 化 (throttle は nuqs 組み込みの `limitUrlUpdates: throttle(300)` を採用し、state 反映自体は即時)
- [x] 5.3 [Test] MAX_TYPES (= 2) 超過時 (3 件) は既存値を維持することを test 化
- [x] 5.4 [Impl] `use-pokemon-search-params.ts` を実装:
  - `useQueryState('pokedex', parseAsStringLiteral(POKEDEX_SLUG_VALUES).withDefault(DEFAULT_POKEDEX_SLUG))` (即時、picklist 型付き)
  - `useQueryState('types', parseAsArrayOf(parseAsStringLiteral(TYPE_SLUG_VALUES)).withDefault([]).withOptions({ limitUrlUpdates: throttle(300) }))` (300ms throttle)
  - `setTypes` で `MAX_TYPES` 超過時は既存維持 guard を入れる
- [x] 5.5 [Verify] hook 単体テスト 5 件 green

## 6. apiClient ラッパと useInfiniteQuery hook

各タスクは Requirement「データ取得 Hybrid (RSC 1 ページ目 + Client 続き)」に対応する。

- [x] 6.1 [Impl] `apps/web/src/features/pokemon-list/api/search-pokemon.ts` を作成。`createApiClient('')` (相対パス + Decision 12 案 A の Route Handler proxy 経由) で `client.api.pokemon.$get({ query })` を呼び、success/error envelope を narrow して `PokemonSearchPage` を返す
- [x] 6.2 [Test] `use-infinite-pokemon-search.test.tsx` で fetchNextPage が 2 ページ目を fetch することを test 化 (vitest.config の `environmentOptions.jsdom.url = API_URL` で相対 URL を MSW にマッチさせる)
- [x] 6.3 [Test] `rerender` で `pokedex` を切替し queryKey が変わってリストがリセットされることを test 化
- [x] 6.4 [Impl] `use-infinite-pokemon-search.ts` を実装。queryKey に `pokedex` / `types` 配列を含め、`initialPage` を渡せば `initialData: { pages: [initialPage], pageParams: [undefined] }` で hydrate
- [x] 6.5 [Verify] hook test 4 件 (初回 fetch / fetchNextPage / queryKey reset / initialPage hydrate) green

## 7. UI コンポーネント (search-form / pokemon-card / pokemon-grid / empty-state)

各タスクは Requirement「検索フォームの pokedex 選択 / type AND 絞り込み / 結果一覧の grid 表示 / 空状態」に対応する。

- [x] 7.1 [Impl] `labels-pokedex.ts` を実装。`POKEDEX_LABEL_MAP: Record<PokedexSlug, string>` で網羅性を強制 + `POKEDEX_OPTIONS` を タプル順で export
- [x] 7.2 [Impl] `labels-type.ts` を実装。`TYPE_LABEL_MAP: Record<TypeSlug, string>` で 18 タイプを網羅 + `TYPE_OPTIONS` を タプル順で export
- [x] 7.3 [Test] `search-form.test.tsx` で pokedex select の trigger 開閉 + 選択肢生成 + 即時 URL 更新を test 化 (vitest.setup.ts に Radix Select 用 jsdom stub `hasPointerCapture` / `scrollIntoView` 追加)
- [x] 7.4 [Test] 同 file で TYPE_SLUG_VALUES 18 件描画 / 2 件選択で `?types=fire,flying` / MAX_TYPES 超過時の guard (3 件目 active 化されず) を test 化
- [x] 7.5 [Impl] `search-form.tsx` を `'use client'` で実装。shadcn `<Select>` + `<ToggleGroup type="multiple">` + `usePokemonSearchParams` consume + `isPokedexSlug` / `filterTypeSlugs` type guard
- [x] 7.6 [Test] `pokemon-card.test.tsx` で species name / sprite / types badge / `<a>` 0 件 / `#0025` 4 桁ゼロ埋め / 2 タイプ描画を test 化
- [x] 7.7 [Impl] `pokemon-card.tsx` を `<Card>` + `<Badge>` + `next/image` (`unoptimized`) で実装。`<a>` / `<Link>` 不使用。`renderTypeLabel` で未知 slug をフォールバック
- [x] 7.8 [Impl] `pokemon-grid.tsx` を実装 (CSS grid + breakpoint 列数調整 + `<ul>/<li>` セマンティクス + footer slot)
- [x] 7.9 [Test] `empty-state.test.tsx` で文言「該当するポケモンが見つかりませんでした」「条件を変えてみてください」描画 + `role="status"` (= `<output>` 要素) を test 化
- [x] 7.10 [Impl] `empty-state.tsx` を `<output>` セマンティック要素 (= role="status") で実装、border-dashed の状態表示

(追加) vitest.setup.ts に `cleanup()` を afterEach に追加し、vitest の RTL auto-cleanup 欠落を補う

## 8. 無限スクロール (components/load-more)

各タスクは Requirement「無限スクロール (IntersectionObserver + Button フォールバック)」に対応する。

- [x] 8.1 [Test] `load-more.test.tsx` で IntersectionObserver visible / click / isLoading=true disabled + skeleton / isLoading=true で IO 発火しても onLoadMore 呼ばれない の 4 ケースを test 化 (`MockIntersectionObserver` クラスを `vi.stubGlobal` で注入)
- [x] 8.2 [Impl] `load-more.tsx` を `'use client'` で実装。`<Button>` を sentinel 兼ボタンとして使い、IntersectionObserver で `isIntersecting` で `onLoadMore` 発火 (`isLoading=true` 時はスキップ)、`isLoading` 時は disabled + Skeleton 3 件表示。LoadMore 自体は親が `hasNextPage=false` 時に unmount するため本 component 内では nextCursor 判定しない

## 9. PokemonListView (親) と page.tsx の RSC fetch 化

各タスクは Requirement「トップページの検索 UI と結果一覧の統合配置」「データ取得 Hybrid (RSC 1 ページ目 + Client 続き)」に対応する。

- [x] 9.1 [Test] `pokemon-list-view.test.tsx` で initialPage hydrate / empty data → EmptyState / initialPage 不在で MSW fetch / pokedex 変更で queryKey reset / LoadMore click / IntersectionObserver visible の 7 ケースを test 化
- [x] 9.2 [Impl] `pokemon-list-view.tsx` を `'use client'` で実装。`useInfiniteQuery` の `isSuccess && items.length === 0` で EmptyState を排他描画、`hasNextPage` のときのみ `<LoadMore>` を grid footer slot に
- [x] 9.3 [Test] `page.test.tsx` で AsyncFunction 判定 / 既定値 fetch / `pokedex=paldea` 透過 / 未知 slug → DEFAULT_POKEDEX_SLUG フォールバック / 500 時 initialPage undefined を test 化
- [x] 9.4 [Impl] `page.tsx` を async RSC として書き換え。`isPokedexSlug` で型 narrow → `serverApiClient.api.pokemon.$get({ query })` → `<PokemonListView initialPage={...}>` に props 渡し。fetch 失敗時は `initialPage` を undefined にし Client 側 fetch にフォールバック
- [x] 9.5 [Verify] page test 5 件 green

## 10. エラーバウンダリ (app/error.tsx)

各タスクは Requirement「エラーバウンダリ (error.tsx)」に対応する。

- [x] 10.1 [Test] `error.test.tsx` で source-level (`'use client'` + reset prop) + 「再試行」ボタン click で reset 発火 + エラー文言描画 を test 化
- [x] 10.2 [Impl] `error.tsx` を `'use client'` default export で実装。`{ error, reset }` props を受け、`useEffect` でログ出力 + `<Button onClick={reset}>` を提供。エラー詳細は画面に出さず汎用文言のみ表示

## 11. ディレクトリ構造の整合性確認

各タスクは Requirement「ディレクトリ構造 (features/pokemon-list)」に対応する。

- [x] 11.1 [Verify] `apps/web/src/features/pokemon-list/` 直下に `api/` / `components/` / `hooks/` / `lib/` が存在。`api/` に `search-pokemon.ts` + `use-infinite-pokemon-search.ts`、`components/` に 6 ファイル (`empty-state` / `load-more` / `pokemon-card` / `pokemon-grid` / `pokemon-list-view` / `search-form`)、`hooks/` に `use-pokemon-search-params.ts` を確認
- [x] 11.2 [Verify] `find apps/web/src -name "*.ts" -o -name "*.tsx" | grep -E "/[A-Z]"` で PascalCase ファイル名なし (全 kebab-case)

## 12. openspec validate と最終 GREEN

- [x] 12.1 `openspec validate add-web-search-ui --strict` → "Change 'add-web-search-ui' is valid"
- [x] 12.2 `pnpm -r typecheck` / `pnpm -r lint` / `pnpm -r format:check` → 全 package green (lint は `toggle-group.tsx` の shadcn upstream 由来 warning のみ)
- [x] 12.3 `pnpm -r test` → contracts 71 / api 129 / web 60 = 計 260 tests green

## 13. セルフレビュー

- [x] 13.1 `typescript-reviewer` + `react-reviewer` を 1 メッセージで並列起動。レビュー結果:
  - typescript-reviewer: 0 issues (Excellent)
  - react-reviewer: Major 2 件 / Minor 2 件
    - **Major 1 (反映済)**: `LoadMore` の `useEffect` 依存配列に `onLoadMore` / `isLoading` を含めると親で inline 定義された `onLoadMore` が毎レンダで identity 更新され、IntersectionObserver が毎フレーム disconnect/observe される → ref パターン (`onLoadMoreRef` / `isLoadingRef`) で localize 修正し、`useEffect` 依存配列を空 (mount 時のみ) に
    - **Major 2 (反映済)**: `page.tsx` の async `searchParams` パターンが JSDoc 無しで保守者の誤読リスク → `HomePage` に Next.js 15+ async searchParams pattern を明記する JSDoc を追加
    - **Minor 1 (スルー)**: `PokemonGrid` の `items.length === 0 return null` が親の `showEmpty` 分岐と二重 → 親で既に filter されているため redundant だが、defensive check として残す方が小さい設計判断
    - **Minor 2 (スルー)**: `LoadMore` の `aria-busy` / 動的 `aria-label` 追加 → info-only、a11y 強化の宿題候補だが本 change スコープ外
  - 修正後再検証: 60/60 tests + typecheck + lint green

## 14. リファクタ (任意)

- [x] 14.1 実装内のリファクタ候補を確認。本 change では緑を保ったまま反映できる構造的変更は無し (Major 修正は § 13 で反映済)。以下を**別 change の宿題候補**として記録:
  - `POKEDEX_SLUG_SET` / `TYPE_SLUG_SET` (新たな picklist 用 Set) が `search-form.tsx` / `pokemon-card.tsx` / `page.tsx` で重複定義 → 共通 lib (`features/pokemon-list/lib/slug-set.ts` か `@pokedex/contracts` 側) に集約検討
  - `LoadMore` の `aria-busy` / 動的 `aria-label` (Minor 2) → a11y 強化 change で対応
  - `PokemonGrid` の `items.length === 0` 早期 return (Minor 1) → 親で既に filter されている前提でコメント整理 or invariant 化
  - 既存宿題: `findPokedexIdBySlug` rename + non-nullable 化 / pokemon detail ページ追加 / Cache Components (`use cache` / `cacheLife` / `cacheTag`) 適用 / locale routing

最終確認: `openspec validate add-web-search-ui --strict` → valid / `pnpm -r typecheck` / `lint` / `format:check` / `test` (contracts 71 + api 129 + web 60 = 260) → green

## 15. `pnpm dev` 復旧 (Apply 後追加修正)

実装完了後に `pnpm dev` を試したところ、本 change で contracts の **runtime value** import (`POKEDEX_SLUG_VALUES` 等) を初めて入れたことで、これまで顕在化していなかったビルド/ランタイム経路の問題が複数表面化した。dev / build を実用に戻すため以下を一括対応:

- [x] 15.1 [contracts to dist] `packages/contracts/package.json` を `main: ./src/index.ts` → `./dist/index.js` に変更、`exports` / `files` 追加、`build: tsc -p tsconfig.json` 追加。`tsconfig.json` に `noEmit: false` + `declaration` / `declarationMap` / `sourceMap` を override、`exclude: ["**/*.test.ts", "dist"]` を追加。`packages/contracts/dist/` を成果物として emit。Why: Turbopack は workspace package 内の `.js → .ts` 拡張子 rewriting を行わないため、ESM NodeNext (`export * from './constants.js'`) の source を直接配信できず module-not-found になる。
- [x] 15.2 [turbo wiring] `turbo.json` の `dev` task に `dependsOn: ["^build"]` を追加し、cold start で contracts / api が自動 build されるようにする。
- [x] 15.3 [Next.js env loading] `apps/web/package.json` の `dev` / `build` script を `dotenv -e ../../.env.development -e ../../.env.local -- next ...` に変更、`dotenv-cli` を devDependencies に追加。Why: Next.js は cwd の `.env*` しか自動 load しないため、root の `.env.development` に置かれている `API_URL` が apps/web の dev で読まれず module-level guard が throw する。
- [x] 15.4 [Server / Client 分離] `apps/web/src/lib/api-client.ts` を side-effect free な `createApiClient` factory のみに reduce、`serverApiClient` + `API_URL` guard を `apps/web/src/lib/api-client.server.ts` に分離 (`import 'server-only'` で Client から間接 import を build 時に弾く)。consumer 2 件 (`app/page.tsx` / `app/api/health/route.ts`) を新パスに更新。Why: 旧 `api-client.ts` は `process.env.API_URL` を module-level で評価しており、Client Component (search-pokemon.ts) が `createApiClient` だけ import しても guard が browser bundle に紛れ込んで `[error-boundary] API_URL is required` が出ていた。
- [x] 15.5 [graceful RSC fallback] `apps/web/src/app/page.tsx` の `fetchInitialPage` を try/catch で network error (ECONNREFUSED 等) も `undefined` にフォールバックし、Client 側 `useInfiniteQuery` の retry に委ねる。Why: 既存実装は `!ok` / envelope error しか吸収しておらず、apps/api 未起動だと `error.tsx` (500 page) に飛んで dev 体験が悪い。
- [x] 15.6 [vitest 連携] `apps/api/vitest.config.ts` に `include: ['src/**/*.test.ts']` / `exclude: ['**/dist/**']` を追加 (turbo auto-build で生成される `dist/**/*.test.js` を拾わないため)。`apps/web/vitest.config.ts` の `resolve.alias` に `server-only → src/test/server-only-stub.ts` を追加、stub ファイルを新規作成。`apps/web/src/lib/api-client.test.ts` を `api-client.server` の dynamic import 形式に書き換え。
- [x] 15.7 [Verify] `rm -rf packages/contracts/dist apps/api/dist` 状態で `pnpm dev --filter @pokedex/web` → turbo が contracts → api → web dev を自動連鎖、HTTP 200 / 「ポケモン図鑑」描画 / error-boundary 不発火を確認。`openspec validate --strict` + `pnpm -r typecheck` / `lint` / `format:check` / `test` (260) 全 green。

## 16. ブラウザ E2E 確認で見つかった追加バグ修正

実 dev (apps/api + apps/web 起動済み) でブラウザを開いて検証したところ、ユーザ報告どおり **「タイプを選んでも正しい結果が出ない」** と **画面エラー (sprite 404 / 空 src 警告)** が発生していた。Playwright MCP でブラウザを開き、原因を特定して修正:

- [x] 16.1 [api SQL bug] `apps/api/src/repositories/pokemon.real.ts` の `searchByList` で 2 つの SQL バグを発見・修正。**pre-existing バグ** (`06f427b feat(api): pokemon 検索・一覧・詳細 API ...` 由来) で integration test は `describe.skipIf` で常時スキップされており検出されていなかった:
  - **bug 1**: `WHERE ${formTypes.typeId} IN ${typeIds}` で配列を裸で interpolate → PostgreSQL 側で `IN $1` (= 単一 array 値) となり常に空集合になっていた → `inArray()` 演算子で `IN ($1, $2, ...)` に正しく展開
  - **bug 2**: `sql\`COALESCE(...)\`.as('form_id')` を WHERE 句で `${effectiveFormId}` として interpolate → PostgreSQL は SELECT の column alias を WHERE 句で参照できず常に空集合 → `effectiveFormIdExpr` (raw expression) と `effectiveFormId` (alias) に分け、WHERE / cursor では raw expression、SELECT / ORDER BY では alias を使う
- [x] 16.2 [UI sprite fallback] `apps/web/src/features/pokemon-list/components/pokemon-card.tsx` に `<Sprite>` サブコンポーネントを追加。dev seed の `placeholder/<species>/<form>/unknown/default.png` (実体 404) や空 `defaultSpriteUrl` を検出して「no image」 fallback ボックスを描画する。Next.js Image の missing src 警告 (2 件) と 404 (10+件) を解消。判定は `isValidSpriteUrl` で `placeholder/` prefix と空文字列を弾く
- [x] 16.3 [Test] `pokemon-card.test.tsx` に `defaultSpriteUrl=''` と `defaultSpriteUrl='placeholder/...'` の 2 ケースを追加し、`<img>` を出さず「no image」を表示することを test 化 (62 tests green)
- [x] 16.4 [E2E Verify] Playwright MCP で以下を確認:
  - 初期表示: 13 件描画、console errors **0 件** (修正前 16 件)、Next.js Dev Tools issue badge 消失
  - 「ほのお」クリック → URL `?types=fire`、結果 3 件 (ヒトカゲ / リザード / リザードン) ✓
  - 「ひこう」追加クリック → URL `?types=fire,flying`、結果 1 件 (リザードン #0006, ほのお+ひこう) ✓
  - 3 件目「みず」クリック → button は `[active]` で focus は当たるが `[pressed]` 付かず、URL も結果も不変 ✓ (MAX_TYPES guard 動作)
- [x] 16.5 [Verify] `openspec validate --strict` + `pnpm -r typecheck` / `lint` / `format:check` / `test` (contracts 71 + api 129 + web 63 = 263) 全 green
- [x] 16.6 [Test 拡充] sprite fallback の **統合テスト** を `pokemon-list-view.test.tsx` に追加 (`placeholder/` URL と 空 URL の 2 件で `<img>` 0 件 / `"no image"` 2 件)。**ユニットテスト**は § 16.3 で `pokemon-card.test.tsx` に追加済み。
- [x] 16.7 [Test 拡充] API SQL バグの統合テストは `apps/api/src/repositories/pokemon.real.test.ts` に既存 (`'typeIds で単一タイプ絞り込み'` / `'AND 検索 (fire + flying)'` / `'cursor を渡すと続きから返す'`) が、`describe.skipIf(DATABASE_URL === undefined)` で常時スキップだったため bug 1/2 を見逃していた。`DATABASE_URL='postgres://postgres:postgres@127.0.0.1:54322/postgres' pnpm --filter @pokedex/api test` で実 DB に接続して走らせた結果、修正後は全 **144 tests pass** (15 件のスキップが解消)。**SQL の正しさは mock では検出できないため新規ユニットテストは追加せず、既存 integration test を一次防衛線とする**。CI で `DATABASE_URL` を注入する宿題は別 change で扱う。

## 17. 2 回目セルフレビュー (Section 15-16 の追加変更分)

CLAUDE.md ルールに従い、Section 13 以降の追加変更 (.tsx + .ts 多数) について `typescript-reviewer` + `react-reviewer` を**並列起動**:

- [x] 17.1 typescript-reviewer: **0 issues (Excellent)** — Server/Client 分離、`isPokedexSlug` narrow、`inArray` SQL 修正、`effectiveFormIdExpr` vs alias 分離、テスト dynamic import パターンすべて妥当
- [x] 17.2 react-reviewer: **Major 1 + Minor 1**:
  - **Major (反映済)**: `page.tsx::fetchInitialPage` が全エラーを `undefined` に均一化していたため、持続的な 5xx エラーが Client retry で復旧せず silent fail になる懸念。upstream `>=500` は `Error` を throw して `error.tsx` に飛ばし、network error / 4xx / envelope error は従来通り `undefined` で Client retry に倒す方針に分岐。`page.test.tsx` に 5xx throw / 4xx fallback / envelope error fallback の 3 ケースを追加 (置き換え) し挙動を test 化
  - **Minor (反論 + 別形で反映)**: `Sprite` の fallback に `role="img" + aria-label` を付けて SR ユーザに「画像が無い」コンテキストを伝える提案だったが、(1) `role="img"` を `<div>` に付けるのは `jsx-a11y/prefer-tag-over-role` lint と衝突、(2) 親 `<Card aria-label={item.nameJa}>` で species 名は既に SR に通知済みで二重通知になる、ため `aria-hidden` 維持。コメントで設計判断を明文化
- [x] 17.3 [Verify] `openspec validate --strict` + `pnpm -r typecheck` / `lint` / `format:check` / `test` (contracts 71 + api 129 + web 65 = 265) 全 green。`DATABASE_URL` 注入時の api integration: 144 / 144 pass
