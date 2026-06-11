'use client';

import type { PokedexSlug, TypeSlug } from '@pokedex/contracts';
import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query';

import { searchPokemon, type PokemonSearchPage } from './search-pokemon';

export type PokemonSearchInput = {
  pokedex: PokedexSlug;
  types: readonly TypeSlug[];
};

type CursorPageParam = string | undefined;

/**
 * 検索条件 (pokedex / types) ベースで cursor pagination の無限スクロールを行う hook。
 *
 * - `queryKey` に `pokedex` / `types` を含めるため、検索条件変更で fetch がリセットされる
 * - `initialPage` を渡すと RSC 1 ページ目を hydrate し、初回 render の skeleton を回避する
 * - `getNextPageParam` で `meta.nextCursor` を次ページの `cursor` に解決する
 */
export function useInfinitePokemonSearch(input: PokemonSearchInput, initialPage?: PokemonSearchPage) {
  return useInfiniteQuery<
    PokemonSearchPage,
    Error,
    InfiniteData<PokemonSearchPage, CursorPageParam>,
    readonly unknown[],
    CursorPageParam
  >({
    queryKey: ['pokemon', input.pokedex, [...input.types]],
    queryFn: ({ pageParam }) =>
      searchPokemon({
        pokedex: input.pokedex,
        types: input.types,
        ...(pageParam === undefined ? {} : { cursor: pageParam }),
      }),
    initialPageParam: undefined,
    getNextPageParam: (last) => last.meta.nextCursor ?? undefined,
    ...(initialPage === undefined
      ? {}
      : {
          initialData: {
            pages: [initialPage],
            pageParams: [undefined],
          } satisfies InfiniteData<PokemonSearchPage, CursorPageParam>,
        }),
  });
}
