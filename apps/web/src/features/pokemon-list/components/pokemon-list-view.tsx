'use client';

import type { PokemonSearchPage } from '../api/search-pokemon';
import { useInfinitePokemonSearch } from '../api/use-infinite-pokemon-search';
import { usePokemonSearchParams } from '../hooks/use-pokemon-search-params';
import { EmptyState } from './empty-state';
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
 * - 状態に応じて `<EmptyState>` (0 件) / `<PokemonGrid>` (1 件以上) を切り替え、
 *   `hasNextPage` のときのみ `<LoadMore>` を grid 末尾に置く
 */
export function PokemonListView({ initialPage }: PokemonListViewProps) {
  const { pokedex, types } = usePokemonSearchParams();
  const query = useInfinitePokemonSearch({ pokedex, types }, initialPage);

  const items = query.data?.pages.flatMap((page) => page.data) ?? [];
  const showEmpty = query.isSuccess && items.length === 0;

  return (
    <div className="space-y-6">
      <SearchForm />
      {showEmpty ? (
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
