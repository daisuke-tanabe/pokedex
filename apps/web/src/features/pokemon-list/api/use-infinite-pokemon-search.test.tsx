import type { TypeSlug } from '@pokedex/contracts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { PAGE_2_CURSOR_TOKEN, pokemonListSuccessHandler } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';

import { useInfinitePokemonSearch } from './use-infinite-pokemon-search';

const buildWrapper = (): ((props: { children: ReactNode }) => ReactNode) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

describe('useInfinitePokemonSearch', () => {
  it('初回 fetch で 1 ページ目を取得し hasNextPage が true になる', async () => {
    server.use(pokemonListSuccessHandler);

    const { result } = renderHook(() => useInfinitePokemonSearch({ pokedex: 'national', types: [] }), {
      wrapper: buildWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.pages[0]?.data).toHaveLength(3);
    expect(result.current.hasNextPage).toBe(true);
  });

  it('fetchNextPage で 2 ページ目を fetch し pages が 2 件になる (Client が次ページを取得する)', async () => {
    server.use(pokemonListSuccessHandler);

    const { result } = renderHook(() => useInfinitePokemonSearch({ pokedex: 'national', types: [] }), {
      wrapper: buildWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(true);
    expect(result.current.data?.pages[0]?.meta.nextCursor).toBe(PAGE_2_CURSOR_TOKEN);

    await act(async () => {
      await result.current.fetchNextPage();
    });

    await waitFor(() => expect(result.current.data?.pages).toHaveLength(2));
    expect(result.current.data?.pages[1]?.data).toHaveLength(1);
    expect(result.current.hasNextPage).toBe(false);
  });

  it('searchParams 変更で queryKey が変わり、リストが 1 ページ目からリセットされる', async () => {
    server.use(pokemonListSuccessHandler);

    const { result, rerender } = renderHook(
      ({ pokedex }: { pokedex: 'national' | 'paldea' }) => useInfinitePokemonSearch({ pokedex, types: [] }),
      {
        wrapper: buildWrapper(),
        initialProps: { pokedex: 'national' as 'national' | 'paldea' },
      },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(true);

    await act(async () => {
      await result.current.fetchNextPage();
    });

    await waitFor(() => expect(result.current.data?.pages).toHaveLength(2));

    rerender({ pokedex: 'paldea' as const });

    await waitFor(() => expect(result.current.data?.pages).toHaveLength(1));
    expect(result.current.data?.pages[0]?.meta.nextCursor).toBe(PAGE_2_CURSOR_TOKEN);
  });

  it('initialPage を渡すと初回 render で fetch せずに hydrate される', () => {
    const initialPage = {
      data: [
        {
          speciesSlug: 'mew',
          formSlug: 'mew',
          pokedexNumber: 151,
          nameJa: 'ミュウ',
          types: ['psychic'],
          defaultSpriteUrl: 'https://example.test/sprites/mew.png',
        },
      ],
      meta: { nextCursor: null },
    };

    const { result } = renderHook(() => useInfinitePokemonSearch({ pokedex: 'national', types: [] }, initialPage), {
      wrapper: buildWrapper(),
    });

    expect(result.current.data?.pages[0]).toEqual(initialPage);
    expect(result.current.hasNextPage).toBe(false);
  });

  it('initialPage 提供時は mount 直後に背景 re-fetch を走らせない (staleTime で RSC 先取りの帯域を温存)', async () => {
    server.use(pokemonListSuccessHandler);
    const initialPage = {
      data: [
        {
          speciesSlug: 'mew',
          formSlug: 'mew',
          pokedexNumber: 151,
          nameJa: 'ミュウ',
          types: ['psychic'],
          defaultSpriteUrl: 'https://example.test/sprites/mew.png',
        },
      ],
      meta: { nextCursor: null },
    };

    let pokemonRequests = 0;
    const onRequest = ({ request }: { request: Request }): void => {
      if (new URL(request.url).pathname.endsWith('/api/pokemon')) {
        pokemonRequests += 1;
      }
    };
    server.events.on('request:start', onRequest);

    try {
      renderHook(() => useInfinitePokemonSearch({ pokedex: 'national', types: [] }, initialPage), {
        wrapper: buildWrapper(),
      });

      // mount 時の effect / react-query のフェッチ dispatch を一通りフラッシュしてから件数を確認する。
      // staleTime 未設定だと initialData が即 stale 扱いになり mount 直後に背景 re-fetch (request:start)
      // が走る。フラッシュ後も 0 件であることで、staleTime による re-fetch 抑止を担保する
      // (「0 になるのを待つ」waitFor ではなく、非同期を流し切った後に 1 度だけアサートする)。
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
      expect(pokemonRequests).toBe(0);
    } finally {
      server.events.removeListener('request:start', onRequest);
    }
  });

  it('initialPage は初期 input にのみ適用され、検索条件変更後の queryKey には引き継がれない (切替時に古い一覧を残さない)', async () => {
    server.use(pokemonListSuccessHandler);
    const initialPage = {
      data: [
        {
          speciesSlug: 'mew',
          formSlug: 'mew',
          pokedexNumber: 151,
          nameJa: 'ミュウ',
          types: ['psychic'],
          defaultSpriteUrl: 'https://example.test/sprites/mew.png',
        },
      ],
      meta: { nextCursor: null },
    };

    const { result, rerender } = renderHook(
      ({ types }: { types: readonly TypeSlug[] }) =>
        useInfinitePokemonSearch({ pokedex: 'national', types }, initialPage),
      { wrapper: buildWrapper(), initialProps: { types: [] as readonly TypeSlug[] } },
    );

    // 初期 input (= RSC が取得した条件) では initialPage で即 hydrate される
    expect(result.current.data?.pages[0]).toEqual(initialPage);

    // types を変更すると別 queryKey になり、initialData が引き継がれないため pending に倒れる
    // (= 切替時に古い一覧が success 状態で残らず、呼び出し側が skeleton を出せる)
    rerender({ types: ['fire'] });
    expect(result.current.isPending).toBe(true);
    expect(result.current.data).toBeUndefined();

    // fetch 完了後に新しい queryKey のデータが入る
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.pages[0]?.data).toHaveLength(3);
  });
});
