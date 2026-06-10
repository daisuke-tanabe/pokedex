## 1. 事前準備とベースライン

- [ ] 1.1 `pnpm -r typecheck` / `lint` / `format:check` / `test` を実行し、ベースラインで全 package green を確認する
- [ ] 1.2 Decision 12 (Client 側 API 呼び出しの baseUrl 解決) を最終決定する: 案 A (本 change で Route Handler proxy `/api/pokemon` も追加) / 案 B (本 change では `serverApiClient` を Client から再利用できる形に再設計) / 案 C (`NEXT_PUBLIC_API_URL` 以外で何らかの暫定対応) のいずれかをユーザ判断で確定する
- [ ] 1.3 [Open Question 解消] pokedex select / types toggle-group の表示順 / pokedexNumber 桁数 (4 桁ゼロ埋め前提)、empty-state 文言の最終形をユーザ確認する

## 2. 依存追加と shadcn コンポーネント追加

各タスクは Requirement「新規依存の追加」「新規 shadcn コンポーネントの追加」に対応する。

- [ ] 2.1 [Impl] `pnpm --filter @pokedex/web add @tanstack/react-query nuqs` を実行し、`apps/web/package.json` の `dependencies` に両者を追加する
- [ ] 2.2 [Impl] `pnpm --filter @pokedex/web exec shadcn@latest add card badge skeleton select toggle-group` を実行し、`apps/web/src/components/ui/` に 5 ファイルを生成する
- [ ] 2.3 [Verify] [Scenario [unit]: 5 つの shadcn コンポーネントファイルが存在する / 各コンポーネントが data-slot 属性を持つ] を満たすことを目視と oxlint で確認する
- [ ] 2.4 [Verify] [Scenario [unit]: package.json に @tanstack/react-query / nuqs が含まれる] を `pnpm --filter @pokedex/web list --depth 0` で確認する
- [ ] 2.5 [Verify] `pnpm --filter @pokedex/web typecheck` / `lint` / `format:check` green

## 3. Provider 構築と layout.tsx 更新

各タスクは Requirement「Provider 構成 (個別 'use client' ファイル分割)」に対応する。

- [ ] 3.1 [Test] `apps/web/src/app/query-provider.test.tsx` (もしくは smoke test) で `<QueryProvider>` が render され、`QueryClient` を子 component が consume できることを Scenario 化する
- [ ] 3.2 [Impl] `apps/web/src/app/query-provider.tsx` を新規作成 (`'use client'`、`QueryClientProvider` を内部で生成)
- [ ] 3.3 [Test] `apps/web/src/app/nuqs-provider.test.tsx` で `<NuqsProvider>` が render され、`useQueryState` が動作することを Scenario 化する
- [ ] 3.4 [Impl] `apps/web/src/app/nuqs-provider.tsx` を新規作成 (`'use client'`、`NuqsAdapter` を内部で wrap)
- [ ] 3.5 [Impl] `apps/web/src/app/layout.tsx` を更新し、`<QueryProvider><NuqsProvider>{children}</NuqsProvider></QueryProvider>` で `{children}` を wrap する (`<html>` / `<body>` は wrap 外)
- [ ] 3.6 [Verify] [Scenario [unit]: layout.tsx が Server Component のまま children を Provider で wrap する / 集約 providers.tsx は作成されない] を確認

## 4. MSW handlers 拡張

- [ ] 4.1 [Impl] `apps/web/src/test/msw/handlers.ts` に `GET /pokemon` (200 + 3 件サンプル) のデフォルトハンドラを追加する (`pokedex` / `types` / `cursor` クエリで分岐できる形)
- [ ] 4.2 [Impl] 同 handlers に `GET /pokemon` (500 応答) / (200 + 空配列) のバリエーションハンドラを export しておき、各テストで `server.use(...)` で差し替えられるようにする

## 5. URL state hook (hooks/use-pokemon-search-params)

各タスクは Requirement「nuqs による URL state 双方向同期」「検索フォームの type AND 絞り込み」(throttle 300ms 部分) に対応する。

- [ ] 5.1 [Test] `apps/web/src/features/pokemon-list/hooks/use-pokemon-search-params.test.tsx` を作成し、[Scenario [unit]: useQueryState で URL → state が反映される] を test 化する (`/?pokedex=paldea&types=fire,flying` で hook 初期値を確認)
- [ ] 5.2 [Test] [Scenario [unit]: 2 件選択は URL に CSV 形式で同期される (throttle 後)] を test 化する (fake timer + `vi.advanceTimersByTime(300)`)
- [ ] 5.3 [Test] [Scenario [unit]: MAX_TYPES を超える選択は受け付けない] を test 化する
- [ ] 5.4 [Impl] `use-pokemon-search-params.ts` を実装する:
  - `useQueryState('pokedex', parseAsString.withDefault(DEFAULT_POKEDEX_SLUG))`
  - `useQueryState('types', parseAsArrayOf(parseAsString).withDefault([]))` + 300ms throttle (`startTransition` / `setTimeout` ベース、後で `throttle` ライブラリ採用も検討)
  - `setTypes` で `MAX_TYPES` 超過時は既存維持の guard を入れる
- [ ] 5.5 [Verify] hook 単体テスト 3 件 green

## 6. apiClient ラッパと useInfiniteQuery hook

各タスクは Requirement「データ取得 Hybrid (RSC 1 ページ目 + Client 続き)」に対応する。

- [ ] 6.1 [Impl] `apps/web/src/features/pokemon-list/api/search-pokemon.ts` を作成し、`createApiClient(baseUrl)` を呼んで `client.api.pokemon.$get({ query: {...} })` で fetch するラッパ関数 `searchPokemon(params)` を export する (baseUrl は Decision 12 で確定した方針に従う)
- [ ] 6.2 [Test] `apps/web/src/features/pokemon-list/api/use-infinite-pokemon-search.test.tsx` で [Scenario [integration]: 2 ページ目以降は Client が fetch する] を test 化する (`<QueryProvider>` で wrap + MSW 利用)
- [ ] 6.3 [Test] [Scenario [integration]: searchParams 変更で queryKey が変わりリストがリセットされる] を test 化する
- [ ] 6.4 [Impl] `use-infinite-pokemon-search.ts` を実装する:
  - `useInfiniteQuery({ queryKey: ['pokemon', searchParams], queryFn: ({ pageParam }) => searchPokemon({ ...searchParams, cursor: pageParam }), getNextPageParam: (last) => last.meta?.nextCursor ?? undefined, initialPageParam: undefined, initialData? })`
- [ ] 6.5 [Verify] hook test 2 件 green

## 7. UI コンポーネント (search-form / pokemon-card / pokemon-grid / empty-state)

各タスクは Requirement「検索フォームの pokedex 選択 / type AND 絞り込み / 結果一覧の grid 表示 / 空状態」に対応する。

- [ ] 7.1 [Impl] `apps/web/src/features/pokemon-list/lib/labels-pokedex.ts` を作成し、`POKEDEX_SLUG_VALUES` の各 slug に日本語ラベルをマップする (例: `national → 全国図鑑`, `paldea → パルデア図鑑`)
- [ ] 7.2 [Impl] `apps/web/src/features/pokemon-list/lib/labels-type.ts` を作成し、`TYPE_SLUG_VALUES` の各 slug に日本語ラベルをマップする (`pokemon-api` seed の typeNames と整合)
- [ ] 7.3 [Test] `apps/web/src/features/pokemon-list/components/search-form.test.tsx` で [Scenario [unit]: pokedex select が POKEDEX_SLUG_VALUES から選択肢を生成する / pokedex 変更で即時に URL クエリと state が更新される] を test 化する
- [ ] 7.4 [Test] 同 file で [Scenario [unit]: type toggle-group が TYPE_SLUG_VALUES から選択肢を生成する / 2 件選択は URL に CSV 形式で同期される (throttle 後) / MAX_TYPES を超える選択は受け付けない] を test 化する
- [ ] 7.5 [Impl] `search-form.tsx` を `'use client'` で実装。pokedex select は shadcn `<Select>`, types toggle-group は shadcn `<ToggleGroup type="multiple">`。`use-pokemon-search-params` を内部で consume
- [ ] 7.6 [Test] `apps/web/src/features/pokemon-list/components/pokemon-card.test.tsx` で [Scenario [unit]: PokemonCard が species name / types / sprite を描画する / リンクを持たない / pokedexNumber は 4 桁ゼロ埋めで表示される] を test 化する
- [ ] 7.7 [Impl] `pokemon-card.tsx` を shadcn `<Card>` + `<Badge>` で実装。`#${pokedexNumber.toString().padStart(4, '0')}` でゼロ埋め表示。`<a>` / `<Link>` は使わない
- [ ] 7.8 [Impl] `pokemon-grid.tsx` を実装 (CSS grid layout、breakpoint ごとに列数調整)
- [ ] 7.9 [Test] `apps/web/src/features/pokemon-list/components/empty-state.test.tsx` で [Scenario [unit]: 検索結果 0 件で EmptyState が描画される / 1 件以上なら EmptyState は描画されない] を test 化する
- [ ] 7.10 [Impl] `empty-state.tsx` を実装 (文言: 「該当するポケモンが見つかりませんでした。条件を変えてみてください」)

## 8. 無限スクロール (components/load-more)

各タスクは Requirement「無限スクロール (IntersectionObserver + Button フォールバック)」に対応する。

- [ ] 8.1 [Test] `apps/web/src/features/pokemon-list/components/load-more.test.tsx` で [Scenario [unit]: LoadMore が visible になると fetchNextPage が呼ばれる / クリックで fetchNextPage が呼ばれる / nextCursor が null なら LoadMore が描画されない / 取得中は Button が disabled + skeleton 表示] を test 化する (IntersectionObserver は `vi.stubGlobal('IntersectionObserver', ...)` で mock)
- [ ] 8.2 [Impl] `load-more.tsx` を `'use client'` で実装。IntersectionObserver で sentinel ref を観測し、`isIntersecting` で `fetchNextPage` を呼ぶ。同 sentinel を `<Button onClick={fetchNextPage}>` として render。`isFetchingNextPage` で `disabled` + `<Skeleton>` を表示

## 9. PokemonListView (親) と page.tsx の RSC fetch 化

各タスクは Requirement「トップページの検索 UI と結果一覧の統合配置」「データ取得 Hybrid (RSC 1 ページ目 + Client 続き)」に対応する。

- [ ] 9.1 [Test] `apps/web/src/features/pokemon-list/components/pokemon-list-view.test.tsx` で [Scenario [integration]: searchParams 変更で queryKey が変わりリストがリセットされる] と「initialData hydrate により初回 render で skeleton にならない」を test 化する
- [ ] 9.2 [Impl] `pokemon-list-view.tsx` を `'use client'` で実装。`<SearchForm />` + `<PokemonGrid>` + `<LoadMore>` + `<EmptyState>` を `useInfiniteQuery` の状態 (`data` / `isFetchingNextPage` / `hasNextPage`) に応じて表示
- [ ] 9.3 [Test] `apps/web/src/app/page.test.tsx` (RSC test) で [Scenario [integration]: RSC が searchParams から 1 ページ目を fetch する / searchParams が未指定なら national 図鑑の既定値で fetch する / 初回表示は server fetch 結果が SSR で含まれる] を test 化する
- [ ] 9.4 [Impl] `apps/web/src/app/page.tsx` を更新し、`searchParams` から query を構築 → `serverApiClient` で fetch → `<PokemonListView initialData={...}>` に props 渡し
- [ ] 9.5 [Verify] page test green

## 10. エラーバウンダリ (app/error.tsx)

各タスクは Requirement「エラーバウンダリ (error.tsx)」に対応する。

- [ ] 10.1 [Test] `apps/web/src/app/error.test.tsx` で [Scenario [unit]: error.tsx が 'use client' で error / reset prop を受ける / Scenario [integration]: RSC fetch 失敗時に error.tsx へフォールバックする] を test 化する
- [ ] 10.2 [Impl] `apps/web/src/app/error.tsx` を新規作成 (`'use client'`)、`{ error: Error; reset: () => void }` props を受け、`<Button onClick={reset}>再試行</Button>` を含む

## 11. ディレクトリ構造の整合性確認

各タスクは Requirement「ディレクトリ構造 (features/pokemon-list)」に対応する。

- [ ] 11.1 [Verify] [Scenario [unit]: features/pokemon-list/ ディレクトリが存在する / api/ に search-pokemon.ts と use-infinite-pokemon-search.ts が存在する / components/ に 6 ファイルが存在する / hooks/ に use-pokemon-search-params.ts が存在する] を `ls` で確認する
- [ ] 11.2 [Verify] すべての `.tsx` / `.ts` ファイル名が kebab-case であることを目視 / Bash の `find + grep` で確認する

## 12. openspec validate と最終 GREEN

- [ ] 12.1 `openspec validate add-web-search-ui --strict` を実行し pass することを確認する
- [ ] 12.2 `pnpm -r typecheck` / `pnpm -r lint` / `pnpm -r format:check` をルートで実行し、全 package で green を確認する
- [ ] 12.3 `pnpm -r test` をルートで実行し、`apps/web` の追加テスト含めすべてのテストが green になることを確認する

## 13. セルフレビュー

- [ ] 13.1 CLAUDE.md ルールに従い、`typescript-reviewer` と `react-reviewer` を**並列起動**する (`.tsx` 変更が大量に含まれるため両方必須)。Critical / Major 指摘は妥当性確認のうえ修正、Minor / Info は情報共有のみ

## 14. リファクタ (任意)

- [ ] 14.1 実装中に発見した重複や命名の改善があれば、緑を保ったままリファクタする。**振る舞いを変える変更は本 change で行わず、別 change として切り出す** (例: `findPokedexIdBySlug` rename / pokemon detail ページ追加 / Cache Components 適用は別 change の宿題)
