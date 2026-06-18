'use client';

import type { PokedexSlug, TypeSlug } from '@pokedex/contracts';
import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query';
import { useRef } from 'react';

import { searchPokemon, type PokemonSearchPage } from './search-pokemon';

export type PokemonSearchInput = {
  pokedex: PokedexSlug;
  types: readonly TypeSlug[];
};

type CursorPageParam = string | undefined;

// RSC が先取りした 1 ページ目 (initialData) を mount 直後に Client が再 fetch しないための
// stale 猶予。staleTime 未指定 (既定 0) だと initialData が即 stale 扱いになり背景 re-fetch が
// 走り、RSC 先取りの帯域節約効果を打ち消す。
// なお staleTime は queryKey 単位の新鮮度制御なので initialData の有無に関わらず作用し、
// 通常 fetch (検索条件変更後など) の完了後も 30 秒間は fresh 扱いで重複 re-fetch を抑止する。
// 図鑑データは静的寄りで頻繁な更新が無いため 30 秒で十分。
const LIST_STALE_TIME_MS = 30_000;

// types は選択順を含めた一致を判定する。URL query の types は ToggleGroup の選択順を
// そのまま反映するため、順序が変われば別の検索条件 (別 queryKey) とみなす。
const isSameInput = (a: PokemonSearchInput, b: PokemonSearchInput): boolean =>
  a.pokedex === b.pokedex && a.types.length === b.types.length && a.types.every((t, i) => t === b.types[i]);

/**
 * 検索条件 (pokedex / types) ベースで cursor pagination の無限スクロールを行う hook。
 *
 * - `queryKey` に `pokedex` / `types` を含めるため、検索条件変更で fetch がリセットされる
 * - `initialPage` を渡すと RSC 1 ページ目を hydrate し、初回 render の skeleton を回避する
 * - `getNextPageParam` で `meta.nextCursor` を次ページの `cursor` に解決する
 *
 * `initialPage` は RSC が「マウント時点の検索条件」で取得した 1 ページ目なので、その input に
 * だけ `initialData` として供給する。検索条件を変えた後の別 queryKey にまで `initialData` を
 * 渡すと react-query がそのキーを初期ページで seed してしまい、`isPending` にならず古い一覧が
 * success 状態で残る (= 切替時に一瞬古い一覧が見える) ため、初期 input のときのみに限定する。
 */
export function useInfinitePokemonSearch(input: PokemonSearchInput, initialPage?: PokemonSearchPage) {
  // マウント時点の input を snapshot として固定し、以後 `.current` を更新しない。
  // これにより検索条件を変えた後の別 queryKey に initialPage が誤って供給されるのを防ぐ。
  const initialInputRef = useRef(input);

  // initialPage はマウント時の検索条件で取得したページなので、その input と一致するときだけ
  // initialData として供給する (詳細は JSDoc 参照)。不一致なら undefined = initialData なし。
  const initialData =
    initialPage !== undefined && isSameInput(input, initialInputRef.current)
      ? ({
          pages: [initialPage],
          pageParams: [undefined],
        } satisfies InfiniteData<PokemonSearchPage, CursorPageParam>)
      : undefined;

  return useInfiniteQuery<
    PokemonSearchPage,
    Error,
    InfiniteData<PokemonSearchPage, CursorPageParam>,
    readonly unknown[],
    CursorPageParam
  >({
    queryKey: ['pokemon', input.pokedex, input.types],
    queryFn: ({ pageParam }) =>
      searchPokemon({
        pokedex: input.pokedex,
        types: input.types,
        ...(pageParam === undefined ? {} : { cursor: pageParam }),
      }),
    initialPageParam: undefined,
    getNextPageParam: (last) => last.meta.nextCursor ?? undefined,
    staleTime: LIST_STALE_TIME_MS,
    // initialData プロパティは undefined を直接受け付けない型のため、ある時だけキーを展開する。
    ...(initialData === undefined ? {} : { initialData }),
  });
}
