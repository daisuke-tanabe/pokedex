## ADDED Requirements

### Requirement: トップページの検索 UI と結果一覧の統合配置

`apps/web` は `/` (トップページ) に検索フォームと結果一覧を統合配置しなければならない（MUST）。別ルート (`/search` 等) を作成してはならない（MUST NOT）。`apps/web/src/app/page.tsx` は React Server Component として実装され、`searchParams` (`pokedex` / `types` / `cursor` / `limit`) を読み取って `serverApiClient` 経由で 1 ページ目を fetch し、結果を `<PokemonListView initialData={...}>` に props として渡さなければならない（MUST）。

#### Scenario [unit]: page.tsx が Server Component として実装される

- **WHEN** `apps/web/src/app/page.tsx` の先頭を読む
- **THEN** `"use client"` ディレクティブで始まっていない (Server Component として扱われる)

#### Scenario [integration]: RSC が searchParams から 1 ページ目を fetch する

- **WHEN** MSW で `GET /pokemon?pokedex=paldea` を「200 + 1 ページ目データ」で応答するようにモックし、`/?pokedex=paldea` を RSC で render する
- **THEN** `<PokemonListView>` に `initialData` として fetch 結果の配列および `nextCursor` が渡る

#### Scenario [integration]: searchParams が未指定なら national 図鑑の既定値で fetch する

- **WHEN** MSW で `GET /pokemon` を「200 + national 図鑑 1 ページ目データ」で応答するようにモックし、`/` を RSC で render する
- **THEN** リクエストの `pokedex` クエリが `national` (もしくは未指定で BE の default 解決) であり、結果が `<PokemonListView>` に渡る

### Requirement: 検索フォームの pokedex 選択

検索フォームは `pokedex` を `<Select>` (shadcn) で 1 つ選択させなければならない（MUST）。選択肢は `@pokedex/contracts` の `POKEDEX_SLUG_VALUES` を import して構築されなければならない（MUST、hardcode 禁止）。選択変更は即時に URL クエリ (`?pokedex=<slug>`) と検索状態に反映されなければならない（MUST）。

#### Scenario [unit]: pokedex select が POKEDEX_SLUG_VALUES から選択肢を生成する

- **WHEN** `<SearchForm>` を RTL で render し、pokedex select を開く
- **THEN** `POKEDEX_SLUG_VALUES` の全要素 (例: `national`, `paldea`) に対応する `<SelectItem>` が描画される

#### Scenario [unit]: pokedex 変更で即時に URL クエリと state が更新される

- **WHEN** `<SearchForm>` で pokedex を `paldea` に変更する
- **THEN** URL クエリが `?pokedex=paldea` に更新され、`<PokemonListView>` の検索条件にも `paldea` が即時反映される (debounce / throttle なし)

### Requirement: 検索フォームの type AND 絞り込み

検索フォームは `types` を `<ToggleGroup type="multiple">` (shadcn) で最大 `MAX_TYPES` (= 2) 件まで選択させなければならない（MUST）。選択肢は `@pokedex/contracts` の `TYPE_SLUG_VALUES` を import して構築されなければならない（MUST）。複数選択時の意味は AND (両方を持つポケモンを絞り込む) でなければならない（MUST）。選択変更は **300ms** の throttle を介して URL クエリ (`?types=<slug>,<slug>`) と検索状態に反映されなければならない（MUST）。`MAX_TYPES` を超える選択を試みた場合は、新しい選択を受け付けず既存選択を維持する (もしくは最古の選択を退避する) UI 制御を行わなければならない（MUST）。

#### Scenario [unit]: type toggle-group が TYPE_SLUG_VALUES から選択肢を生成する

- **WHEN** `<SearchForm>` を RTL で render する
- **THEN** `TYPE_SLUG_VALUES` の 18 要素に対応する `<ToggleGroupItem>` が描画される

#### Scenario [unit]: 2 件選択は URL に CSV 形式で同期される (throttle 後)

- **WHEN** `<SearchForm>` で `fire` を選び、続けて `flying` を選び、300ms 待つ
- **THEN** URL クエリが `?types=fire,flying` に更新される

#### Scenario [unit]: MAX_TYPES を超える選択は最古を退避する (FIFO)

- **WHEN** `<SearchForm>` で既に `fire` と `flying` を選んだ状態でさらに `water` を選ぶ
- **THEN** 最古の `fire` が外れ、選択は `flying,water` になる (末尾 MAX_TYPES 件を残す)

### Requirement: nuqs による URL state 双方向同期

検索状態 (`pokedex` / `types`) は `nuqs` (`useQueryState` / `parseAsString` / `parseAsArrayOf`) を介して URL クエリと双方向同期されなければならない（MUST）。ブラウザの戻る / 進む / リロード / URL ペーストいずれの操作でも検索状態が再現されなければならない（MUST）。URL に未知の `pokedex` slug が含まれる場合は BE が Valibot picklist で 400 を返し、`error.tsx` でフォールバックされる前提とする（MUST、本 UI は URL バリデーションを重複実装しない）。

#### Scenario [unit]: useQueryState で URL → state が反映される

- **WHEN** `/?pokedex=paldea&types=fire,flying` で `<SearchForm>` を render する
- **THEN** pokedex select の初期値が `paldea`、type toggle-group の active な要素が `fire` と `flying` になる

#### Scenario [integration]: ブラウザ戻る操作で 1 つ前の検索状態に戻る

- **WHEN** `/` 訪問後に pokedex を `paldea` に変更し (URL が `?pokedex=paldea`)、ブラウザ戻るを実行する
- **THEN** URL が `/` に戻り、pokedex select も `national` (既定値) に戻る

### Requirement: 結果一覧の grid 表示

結果一覧は `<PokemonGrid>` で grid layout として描画されなければならない（MUST）。各 entry は `<PokemonCard>` として shadcn `<Card>` + `<Badge>` で構築され、最低限 `pokedexNumber` (#NNNN ゼロ埋め)、`nameJa`、`types` (badge 配列)、`defaultSpriteUrl` (`<img>` または `<Image>`) を表示しなければならない（MUST）。card は本 change ではリンクを持たず（MUST NOT 持つ）、表示専用とする。

#### Scenario [unit]: PokemonCard が species name / types / sprite を描画する

- **WHEN** `<PokemonCard item={{ speciesSlug: 'pikachu', formSlug: 'pikachu', pokedexNumber: 25, nameJa: 'ピカチュウ', types: ['electric'], defaultSpriteUrl: 'sprites/pikachu.png' }} />` を render する
- **THEN** `ピカチュウ` テキスト、`electric` を内容に含む `<Badge>` 、`<img src="sprites/pikachu.png">` (もしくは Next.js `<Image>`) が DOM に存在する

#### Scenario [unit]: PokemonCard はリンクを持たない

- **WHEN** `<PokemonCard>` を render し、`querySelector('a')` で `<a>` 要素を探す
- **THEN** 0 件である (本 change では詳細ページ遷移なし)

#### Scenario [unit]: pokedexNumber は 4 桁ゼロ埋めで表示される

- **WHEN** `<PokemonCard item={{ pokedexNumber: 25, ... }} />` を render する
- **THEN** `#0025` 形式のテキストが描画される

### Requirement: 無限スクロール (IntersectionObserver + Button フォールバック)

結果一覧の末端には `<LoadMore>` sentinel 要素を配置しなければならない（MUST）。sentinel は `<Button>` として render され、IntersectionObserver で viewport に入ったとき自動で `fetchNextPage` を呼ばなければならない（MUST）。Button はキーボード操作 / クリックでも手動で `fetchNextPage` を呼べなければならない（MUST、a11y フォールバック）。次ページ取得中は Button を disabled + skeleton 表示にしなければならない（MUST）。`nextCursor` が `null` (末尾ページ) の場合は `<LoadMore>` を描画してはならない（MUST NOT）。

#### Scenario [unit]: LoadMore が visible になると fetchNextPage が呼ばれる

- **WHEN** `<LoadMore>` を render し、IntersectionObserver のコールバックを「`isIntersecting: true`」で発火させる
- **THEN** `fetchNextPage` が 1 回呼ばれる

#### Scenario [unit]: LoadMore のクリックで fetchNextPage が呼ばれる

- **WHEN** `<LoadMore>` を render し、Button を click する
- **THEN** `fetchNextPage` が 1 回呼ばれる

#### Scenario [unit]: nextCursor が null なら LoadMore が描画されない

- **WHEN** `<PokemonListView>` を render し、`hasNextPage` が `false` (= `nextCursor === null`)
- **THEN** `<LoadMore>` が DOM 上に存在しない

#### Scenario [unit]: 取得中は Button が disabled + skeleton 表示

- **WHEN** `<LoadMore>` を `isFetchingNextPage: true` で render する
- **THEN** Button が `disabled` 属性を持ち、`<Skeleton>` が同時に表示されている

### Requirement: データ取得 Hybrid (RSC 1 ページ目 + Client 続き)

1 ページ目は RSC (`page.tsx`) で `serverApiClient` を直接呼び、`<PokemonListView initialData={...}>` に props として渡されなければならない（MUST）。Client 側 (`<PokemonListView>`) は `useInfiniteQuery` (`@tanstack/react-query`) を使い、`initialData` として `{ pages: [initialData], pageParams: [undefined] }` を hydrate しなければならない（MUST）。2 ページ目以降は `fetchNextPage` が CSR で API を fetch しなければならない（MUST）。`useInfiniteQuery` の `queryKey` には `searchParams` (`pokedex` / `types`) を含め、検索条件変更で fetch がリセットされなければならない（MUST）。

#### Scenario [integration]: 初回表示は server fetch 結果が SSR で含まれる

- **WHEN** MSW で `GET /pokemon` を「200 + entries 3 件」で応答するようにモックし、`/` を RSC で render して HTML を取得する
- **THEN** HTML 内に 3 件の species name (例: `bulbasaur`, `charizard`, `charmander`) が含まれる (loading skeleton ではない)

#### Scenario [integration]: 2 ページ目以降は Client が fetch する

- **WHEN** RSC initial render 後、`<LoadMore>` を visible にする
- **THEN** `useInfiniteQuery` が次ページの `GET /pokemon?cursor=<...>` を CSR で fetch し、結果が一覧に追加描画される

#### Scenario [integration]: searchParams 変更で queryKey が変わりリストがリセットされる

- **WHEN** `<PokemonListView>` を render し、pokedex select を `paldea` に変更する
- **THEN** `useInfiniteQuery` の queryKey が変わり、新しい queryKey で 1 ページ目から fetch し直す (古い `national` 図鑑のリストは破棄される)

### Requirement: Provider 構成 (個別 'use client' ファイル分割)

`apps/web/src/app/query-provider.tsx` と `apps/web/src/app/nuqs-provider.tsx` をそれぞれ独立した `'use client'` ファイルとして配置しなければならない（MUST）。集約 `providers.tsx` を作成してはならない（MUST NOT）。`apps/web/src/app/layout.tsx` は RSC のまま (`'use client'` を持たない、MUST NOT 持つ) で、`{children}` のみを `<QueryProvider><NuqsProvider>{children}</NuqsProvider></QueryProvider>` で wrap しなければならない（MUST、`<html>` / `<body>` は wrap しない）。

#### Scenario [unit]: query-provider.tsx が 'use client' を持つ

- **WHEN** `apps/web/src/app/query-provider.tsx` の先頭を読む
- **THEN** `'use client'` ディレクティブで始まり、`QueryClientProvider` を内部で使う React コンポーネントを named export している

#### Scenario [unit]: nuqs-provider.tsx が 'use client' を持つ

- **WHEN** `apps/web/src/app/nuqs-provider.tsx` の先頭を読む
- **THEN** `'use client'` ディレクティブで始まり、`NuqsAdapter` を内部で使う React コンポーネントを named export している

#### Scenario [unit]: layout.tsx が Server Component のまま children を Provider で wrap する

- **WHEN** `apps/web/src/app/layout.tsx` を読む
- **THEN** `'use client'` ディレクティブを持たず、JSX 内で `<QueryProvider>` および `<NuqsProvider>` で `{children}` を wrap している (`<html>` / `<body>` は wrap 外)

#### Scenario [unit]: 集約 providers.tsx は作成されない

- **WHEN** `apps/web/src/app/providers.tsx` をファイルシステムで確認する
- **THEN** ファイルが存在しない

### Requirement: エラーバウンダリ (error.tsx)

`apps/web/src/app/error.tsx` を新規追加し、RSC fetch 失敗 / Client fetch 失敗いずれの場合もユーザにエラー表示と再試行手段を提供しなければならない（MUST）。`reset` 関数を `<Button onClick={reset}>` に bind し、ユーザが手動で再試行できなければならない（MUST）。

#### Scenario [unit]: error.tsx が 'use client' で error / reset prop を受ける

- **WHEN** `apps/web/src/app/error.tsx` を読む
- **THEN** `'use client'` ディレクティブで始まり、`{ error: Error; reset: () => void }` 型相当の props を受ける React コンポーネントを default export している

#### Scenario [integration]: RSC fetch 失敗時に error.tsx へフォールバックする

- **WHEN** MSW で `GET /pokemon` を「500 応答」で固定し、`/` を RSC で render する
- **THEN** Next.js の error boundary が発火し、`<button>` (テキスト「再試行」相当) が DOM に存在する

### Requirement: 空状態 (empty-state)

検索結果が 0 件のときは `<EmptyState>` 専用コンポーネントを描画しなければならない（MUST）。`<EmptyState>` は「該当するポケモンが見つかりませんでした」相当の文言と、検索条件を変更するよう促す案内文を含まなければならない（MUST）。`<PokemonGrid>` は描画してはならない（MUST NOT、loading skeleton と混在させない）。

#### Scenario [unit]: 検索結果 0 件で EmptyState が描画される

- **WHEN** `<PokemonListView initialData={{ data: [], meta: { nextCursor: null } }} />` を render する
- **THEN** `<EmptyState>` が DOM に存在し、`<PokemonGrid>` および `<LoadMore>` は描画されない

#### Scenario [unit]: 検索結果が 1 件以上なら EmptyState は描画されない

- **WHEN** `<PokemonListView initialData={{ data: [<1件>], meta: { nextCursor: null } }} />` を render する
- **THEN** `<EmptyState>` が DOM 上に存在しない

### Requirement: 新規 shadcn コンポーネントの追加

`apps/web/src/components/ui/` に `card.tsx` / `badge.tsx` / `skeleton.tsx` / `select.tsx` / `toggle-group.tsx` の 5 ファイルが存在しなければならない（MUST）。いずれも shadcn `new-york-v4` registry で生成されたものでなければならない（MUST、既存 `button.tsx` と同様に `data-slot` 属性を持つ）。

#### Scenario [unit]: 5 つの shadcn コンポーネントファイルが存在する

- **WHEN** `apps/web/src/components/ui/` を列挙する
- **THEN** `card.tsx` / `badge.tsx` / `skeleton.tsx` / `select.tsx` / `toggle-group.tsx` の 5 ファイルが存在する

#### Scenario [unit]: 各コンポーネントが data-slot 属性を持つ

- **WHEN** 上記 5 ファイルの本文を読む
- **THEN** 各ファイル内で `data-slot=` 相当の属性付与が含まれている (shadcn v4 `new-york-v4` registry の規約)

### Requirement: 新規依存の追加

`apps/web/package.json` の `dependencies` に `@tanstack/react-query` と `nuqs` が追加されなければならない（MUST）。バージョンは Next.js 16 / React 19 互換のメジャーを採用しなければならない（MUST、apply 時に最新安定版を確認）。

#### Scenario [unit]: package.json に @tanstack/react-query が含まれる

- **WHEN** `apps/web/package.json` を読む
- **THEN** `dependencies` に `@tanstack/react-query` のエントリが含まれる

#### Scenario [unit]: package.json に nuqs が含まれる

- **WHEN** `apps/web/package.json` を読む
- **THEN** `dependencies` に `nuqs` のエントリが含まれる

### Requirement: ディレクトリ構造 (features/pokemon-list)

検索 UI の実装は `apps/web/src/features/pokemon-list/` 配下に集約されなければならない（MUST）。ディレクトリは `api/` / `components/` / `hooks/` (および必要なら `lib/`) に分割されなければならない（MUST、bulletproof-react 風）。`api/` には apiClient ラッパと `useInfiniteQuery` hook を、`components/` には UI コンポーネント (parent / search-form / grid / card / load-more / empty-state)、`hooks/` には URL state hook (`use-pokemon-search-params.ts`) を配置しなければならない（MUST）。すべての `.tsx` / `.ts` ファイル名は kebab-case でなければならない（MUST、`web-foundation` のディレクトリ構造規約に従う）。

#### Scenario [unit]: features/pokemon-list/ ディレクトリが存在する

- **WHEN** `apps/web/src/features/pokemon-list/` をファイルシステムで確認する
- **THEN** ディレクトリが存在し、`api/` / `components/` / `hooks/` の 3 サブディレクトリが直下に含まれる

#### Scenario [unit]: api/ に search-pokemon.ts と use-infinite-pokemon-search.ts が存在する

- **WHEN** `apps/web/src/features/pokemon-list/api/` を列挙する
- **THEN** `search-pokemon.ts` と `use-infinite-pokemon-search.ts` の 2 ファイルが存在する

#### Scenario [unit]: components/ に最低 6 ファイル (parent / search-form / grid / card / load-more / empty-state) が存在する

- **WHEN** `apps/web/src/features/pokemon-list/components/` を列挙する
- **THEN** `pokemon-list-view.tsx` / `search-form.tsx` / `pokemon-grid.tsx` / `pokemon-card.tsx` / `load-more.tsx` / `empty-state.tsx` の 6 ファイルが存在する

#### Scenario [unit]: hooks/ に use-pokemon-search-params.ts が存在する

- **WHEN** `apps/web/src/features/pokemon-list/hooks/` を列挙する
- **THEN** `use-pokemon-search-params.ts` が存在する
