import { describe, expect, it } from 'vitest';

import {
  PAGE_2_CURSOR_TOKEN,
  pokemonListEmptyHandler,
  pokemonListErrorHandler,
  pokemonListNetworkErrorHandler,
  pokemonListSuccessHandler,
} from '@/test/msw/handlers';
import { server } from '@/test/msw/server';

import { GET } from './route';

const buildRequest = (search: string): Request => new Request(`http://localhost:3001/api/pokemon${search}`);

describe('GET /api/pokemon (Route Handler proxy)', () => {
  it('upstream の 1 ページ目を 200 + envelope で透過する', async () => {
    server.use(pokemonListSuccessHandler);

    const response = await GET(buildRequest(''));

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      success: true;
      data: { speciesSlug: string }[];
      meta: { nextCursor: string | null };
    };
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(3);
    expect(body.meta.nextCursor).toBe(PAGE_2_CURSOR_TOKEN);
  });

  it('cursor を upstream に転送し 2 ページ目を返す', async () => {
    server.use(pokemonListSuccessHandler);

    const response = await GET(buildRequest(`?cursor=${PAGE_2_CURSOR_TOKEN}`));

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      success: true;
      data: { speciesSlug: string }[];
      meta: { nextCursor: string | null };
    };
    expect(body.data).toHaveLength(1);
    expect(body.meta.nextCursor).toBeNull();
  });

  it('upstream が 200 + 空配列を返したらそのまま透過する', async () => {
    server.use(pokemonListEmptyHandler);

    const response = await GET(buildRequest(''));

    expect(response.status).toBe(200);
    const body = (await response.json()) as { success: true; data: unknown[] };
    expect(body.data).toEqual([]);
  });

  it('upstream が 500 を返したら同じ status で透過する', async () => {
    server.use(pokemonListErrorHandler);

    const response = await GET(buildRequest(''));

    expect(response.status).toBe(500);
    const body = (await response.json()) as { success: false; error: { code: string } };
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });

  it('Content-Type に application/json を含む', async () => {
    server.use(pokemonListSuccessHandler);

    const response = await GET(buildRequest(''));

    expect(response.headers.get('content-type')).toContain('application/json');
  });

  it('upstream fetch が失敗 (ネットワーク断 / タイムアウト abort 相当) したら 503 を返す', async () => {
    // AbortSignal.timeout の abort や upstream 断は fetch が reject し、catch 経路で 503 になる。
    server.use(pokemonListNetworkErrorHandler);

    const response = await GET(buildRequest(''));

    expect(response.status).toBe(503);
    const body = (await response.json()) as { success: false; error: { code: string } };
    expect(body.success).toBe(false);
  });
});
