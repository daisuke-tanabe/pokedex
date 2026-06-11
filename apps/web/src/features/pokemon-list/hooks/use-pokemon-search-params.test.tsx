import { act, renderHook } from '@testing-library/react';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { usePokemonSearchParams } from './use-pokemon-search-params';

const buildWrapper =
  (searchParams: string, rateLimitFactor = 0): ((props: { children: ReactNode }) => ReactNode) =>
  ({ children }) => (
    <NuqsTestingAdapter searchParams={searchParams} hasMemory rateLimitFactor={rateLimitFactor}>
      {children}
    </NuqsTestingAdapter>
  );

describe('usePokemonSearchParams', () => {
  it('URL クエリ pokedex=paldea / types=fire,flying が hook 初期値に反映される', () => {
    const { result } = renderHook(() => usePokemonSearchParams(), {
      wrapper: buildWrapper('?pokedex=paldea&types=fire,flying'),
    });

    expect(result.current.pokedex).toBe('paldea');
    expect(result.current.types).toEqual(['fire', 'flying']);
  });

  it('URL クエリ未指定なら pokedex=national / types=[] が既定値として返る', () => {
    const { result } = renderHook(() => usePokemonSearchParams(), {
      wrapper: buildWrapper(''),
    });

    expect(result.current.pokedex).toBe('national');
    expect(result.current.types).toEqual([]);
  });

  it('setTypes で 2 件 (fire, flying) を選択すると state に反映される', async () => {
    const { result } = renderHook(() => usePokemonSearchParams(), {
      wrapper: buildWrapper(''),
    });

    await act(async () => {
      await result.current.setTypes(['fire', 'flying']);
    });

    expect(result.current.types).toEqual(['fire', 'flying']);
  });

  it('MAX_TYPES (= 2) を超える選択 (3 件) は受け付けず既存値を維持する', async () => {
    const { result } = renderHook(() => usePokemonSearchParams(), {
      wrapper: buildWrapper('?types=fire,flying'),
    });

    expect(result.current.types).toEqual(['fire', 'flying']);

    await act(async () => {
      await result.current.setTypes(['fire', 'flying', 'water']);
    });

    expect(result.current.types).toEqual(['fire', 'flying']);
  });

  it('setPokedex で pokedex を変更すると state に反映される (即時)', async () => {
    const { result } = renderHook(() => usePokemonSearchParams(), {
      wrapper: buildWrapper(''),
    });

    await act(async () => {
      await result.current.setPokedex('paldea');
    });

    expect(result.current.pokedex).toBe('paldea');
  });
});
