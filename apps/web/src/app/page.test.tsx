import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import type { ReactNode } from 'react';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { successEnvelope } from '@/lib/envelope';
import { pokemonListSuccessHandler } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';

import HomePage from './page';

const apiUrl = process.env.API_URL;
if (apiUrl === undefined) {
  throw new Error('API_URL is required');
}

class StubIO implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = '';
  readonly scrollMargin = '';
  readonly thresholds: readonly number[] = [];
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => [] as IntersectionObserverEntry[]);
}

beforeAll(() => {
  vi.stubGlobal('IntersectionObserver', StubIO);
});

afterAll(() => {
  vi.unstubAllGlobals();
});

const renderWithProviders = (ui: ReactNode) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <NuqsTestingAdapter hasMemory>{ui}</NuqsTestingAdapter>
    </QueryClientProvider>,
  );
};

describe('HomePage (RSC)', () => {
  it("'use client' を持たず Server Component として実装される", () => {
    // HomePage は async function (RSC) として export されている: 関数自体が AsyncFunction
    expect(HomePage.constructor.name).toBe('AsyncFunction');
  });

  it('searchParams 未指定なら national 図鑑の既定値で fetch し HTML に結果を含む', async () => {
    server.use(pokemonListSuccessHandler);

    const ui = await HomePage({ searchParams: Promise.resolve({}) });
    renderWithProviders(ui);

    // RSC fetch で取得した 1 ページ目 3 件が SSR で HTML に含まれる (loading skeleton ではない)
    expect(screen.getByText('フシギダネ')).toBeInTheDocument();
    expect(screen.getByText('ヒトカゲ')).toBeInTheDocument();
    expect(screen.getByText('ゼニガメ')).toBeInTheDocument();
  });

  it('searchParams.pokedex=paldea で upstream に pokedex=paldea を渡す', async () => {
    let received: string | null = null;
    server.use(
      http.get(`${apiUrl}/api/pokemon`, ({ request }) => {
        received = new URL(request.url).searchParams.get('pokedex');
        return HttpResponse.json(successEnvelope([], { nextCursor: null }), { status: 200 });
      }),
    );

    const ui = await HomePage({ searchParams: Promise.resolve({ pokedex: 'paldea' }) });
    renderWithProviders(ui);

    expect(received).toBe('paldea');
  });

  it('searchParams.pokedex に未知の slug が来たら DEFAULT_POKEDEX_SLUG (national) で fetch する', async () => {
    let received: string | null = null;
    server.use(
      http.get(`${apiUrl}/api/pokemon`, ({ request }) => {
        received = new URL(request.url).searchParams.get('pokedex');
        return HttpResponse.json(successEnvelope([], { nextCursor: null }), { status: 200 });
      }),
    );

    const ui = await HomePage({ searchParams: Promise.resolve({ pokedex: 'unknown-slug' }) });
    renderWithProviders(ui);

    expect(received).toBe('national');
  });

  it('upstream が 5xx を返したら HomePage は throw して error.tsx 経路に飛ばす', async () => {
    server.use(
      http.get(`${apiUrl}/api/pokemon`, () =>
        HttpResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'down' } }, { status: 500 }),
      ),
    );

    await expect(HomePage({ searchParams: Promise.resolve({}) })).rejects.toThrow(/upstream returned 5/u);
  });

  it('upstream が 4xx を返したら initialPage 不在で Client 側 fetch にフォールバックする (throw しない)', async () => {
    server.use(
      http.get(`${apiUrl}/api/pokemon`, () =>
        HttpResponse.json({ success: false, error: { code: 'INVALID_QUERY', message: 'bad' } }, { status: 400 }),
      ),
    );

    const ui = await HomePage({ searchParams: Promise.resolve({}) });
    expect(ui).toBeDefined();
  });

  it('upstream が 200 + envelope error を返したら initialPage 不在で Client 側 fetch にフォールバックする (throw しない)', async () => {
    server.use(
      http.get(`${apiUrl}/api/pokemon`, () =>
        HttpResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'partial' } }, { status: 200 }),
      ),
    );

    const ui = await HomePage({ searchParams: Promise.resolve({}) });
    expect(ui).toBeDefined();
  });
});
