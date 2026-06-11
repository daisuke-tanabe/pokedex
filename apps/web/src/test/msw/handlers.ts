import type { PokemonListItem } from '@pokedex/contracts';
import { http, HttpResponse } from 'msw';

import { errorEnvelope, successEnvelope } from '@/lib/envelope';

// API_URL は vitest.config.ts の test.env で必ず注入される (api-client.ts の guard と整合)。
// 未設定なら handler の URL が壊れて MSW のマッチが全失敗するため、起動時に fail-fast で気付かせる。
const apiUrl = process.env.API_URL;
if (!apiUrl) {
  throw new Error('API_URL is required for MSW handlers (typically injected via vitest.config.ts test.env)');
}

export const healthSuccessHandler = http.get(`${apiUrl}/health`, () =>
  HttpResponse.json(successEnvelope({ status: 'ok' as const }), { status: 200 }),
);

export const healthErrorHandler = http.get(`${apiUrl}/health`, () =>
  HttpResponse.json(errorEnvelope('INTERNAL_ERROR', 'upstream failure'), { status: 500 }),
);

export const healthNetworkErrorHandler = http.get(`${apiUrl}/health`, () => HttpResponse.error());

const SAMPLE_POKEMON_PAGE_1: readonly PokemonListItem[] = [
  {
    speciesSlug: 'bulbasaur',
    formSlug: 'bulbasaur',
    pokedexNumber: 1,
    nameJa: 'フシギダネ',
    types: ['grass', 'poison'],
    defaultSpriteUrl: 'https://example.test/sprites/bulbasaur.png',
  },
  {
    speciesSlug: 'charmander',
    formSlug: 'charmander',
    pokedexNumber: 4,
    nameJa: 'ヒトカゲ',
    types: ['fire'],
    defaultSpriteUrl: 'https://example.test/sprites/charmander.png',
  },
  {
    speciesSlug: 'squirtle',
    formSlug: 'squirtle',
    pokedexNumber: 7,
    nameJa: 'ゼニガメ',
    types: ['water'],
    defaultSpriteUrl: 'https://example.test/sprites/squirtle.png',
  },
];

const SAMPLE_POKEMON_PAGE_2: readonly PokemonListItem[] = [
  {
    speciesSlug: 'pikachu',
    formSlug: 'pikachu',
    pokedexNumber: 25,
    nameJa: 'ピカチュウ',
    types: ['electric'],
    defaultSpriteUrl: 'https://example.test/sprites/pikachu.png',
  },
];

/**
 * デフォルトハンドラ。cursor 未指定で 3 件 + nextCursor を持つ 1 ページ目を返し、
 * cursor=PAGE_2_TOKEN を渡すと 1 件 + nextCursor=null を返す (cursor pagination の最小再現)。
 * pokedex / types クエリは応答内容に影響させない (テストで必要なら個別に server.use(...) で差し替える)。
 */
export const PAGE_2_CURSOR_TOKEN = 'msw-cursor-page-2';

export const pokemonListSuccessHandler = http.get(`${apiUrl}/api/pokemon`, ({ request }) => {
  const url = new URL(request.url);
  const cursor = url.searchParams.get('cursor');

  if (cursor === PAGE_2_CURSOR_TOKEN) {
    return HttpResponse.json(successEnvelope([...SAMPLE_POKEMON_PAGE_2], { nextCursor: null }), { status: 200 });
  }

  if (cursor === null) {
    return HttpResponse.json(successEnvelope([...SAMPLE_POKEMON_PAGE_1], { nextCursor: PAGE_2_CURSOR_TOKEN }), {
      status: 200,
    });
  }

  return HttpResponse.json(errorEnvelope('INVALID_QUERY', `unknown cursor: ${cursor}`), { status: 400 });
});

export const pokemonListEmptyHandler = http.get(`${apiUrl}/api/pokemon`, () =>
  HttpResponse.json(successEnvelope([], { nextCursor: null }), { status: 200 }),
);

export const pokemonListErrorHandler = http.get(`${apiUrl}/api/pokemon`, () =>
  HttpResponse.json(errorEnvelope('INTERNAL_ERROR', 'upstream failure'), { status: 500 }),
);

export const handlers = [healthSuccessHandler, pokemonListSuccessHandler];
