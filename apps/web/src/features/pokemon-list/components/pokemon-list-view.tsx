'use client';

import type { PokemonSearchPage } from '../api/search-pokemon';
import { useInfinitePokemonSearch } from '../api/use-infinite-pokemon-search';
import { usePokemonSearchParams } from '../hooks/use-pokemon-search-params';
import { EmptyState } from './empty-state';
import { ListSkeleton } from './list-skeleton';
import { LoadMore } from './load-more';
import { PokemonGrid } from './pokemon-grid';
import { SearchForm } from './search-form';

type PokemonListViewProps = {
  initialPage?: PokemonSearchPage;
};

/**
 * トップページの親 client component。
 *
 * - URL state (`usePokemonSearchParams`) を読み取り、`useInfiniteQuery` の input に渡す
 * - `initialPage` が渡されている場合、searchParams と一致する初回ページとして hydrate する
 *   (RSC + Client Hybrid: Decision 2)
 * - 状態に応じて `<ListSkeleton>` (初回 pending) / `<EmptyState>` (0 件) / `<PokemonGrid>`
 *   (1 件以上) を切り替え、`hasNextPage` のときのみ `<LoadMore>` を grid 末尾に置く
 */
export function PokemonListView({ initialPage }: PokemonListViewProps) {
  const { pokedex, types } = usePokemonSearchParams();
  const query = useInfinitePokemonSearch({ pokedex, types }, initialPage);

  const items = query.data?.pages.flatMap((page) => page.data) ?? [];
  // `initialPage` 不在で Client 初回 fetch が pending の間、`<PokemonGrid>` (items=0 で null 返却)
  // と `<EmptyState>` (isSuccess + 0 件) のどちらも描画されず空白になる経路を埋める。
  const showLoading = query.isPending && items.length === 0;
  const showEmpty = query.isSuccess && items.length === 0;

  return (
    <div className="space-y-6">
      <SearchForm />
      {showLoading ? (
        <ListSkeleton />
      ) : showEmpty ? (
        <EmptyState />
      ) : (
        <PokemonGrid
          items={items}
          footer={
            query.hasNextPage ? (
              <LoadMore
                onLoadMore={() => {
                  void query.fetchNextPage();
                }}
                isLoading={query.isFetchingNextPage}
              />
            ) : null
          }
        />
      )}
    </div>
  );
}
