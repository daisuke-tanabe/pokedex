import type { PokedexSlug, PokemonListItem, TypeSlug } from '@pokedex/contracts';

import { createApiClient } from '@/lib/api-client';

/**
 * Client 側の API クライアント。相対パスで `/api/pokemon` を叩き、
 * Next.js Route Handler proxy (`apps/web/src/app/api/pokemon/route.ts`) を介して
 * upstream Hono API に到達する (Decision 12 案 A)。
 * これにより `NEXT_PUBLIC_API_URL` をブラウザに露出させない。
 */
const clientApiClient = createApiClient('');

export type SearchPokemonParams = {
  pokedex: PokedexSlug;
  types: readonly TypeSlug[];
  cursor?: string;
};

export type PokemonSearchPage = {
  data: readonly PokemonListItem[];
  meta: { nextCursor: string | null };
};

/**
 * `GET /api/pokemon` を叩いて 1 ページ分の検索結果を返す。
 *
 * 失敗時は `Error` を throw する。本 hook は `useInfiniteQuery` から呼ばれ、
 * throw された Error は `error.tsx` のフォールバックに伝播する想定。
 */
export async function searchPokemon({ pokedex, types, cursor }: SearchPokemonParams): Promise<PokemonSearchPage> {
  const response = await clientApiClient.api.pokemon.$get({
    query: {
      pokedex,
      types: types.join(','),
      ...(cursor === undefined ? {} : { cursor }),
    },
  });

  if (!response.ok) {
    throw new Error(`[searchPokemon] HTTP ${response.status}`);
  }

  const body = await response.json();
  if (!body.success) {
    throw new Error(`[searchPokemon] ${body.error.code}: ${body.error.message}`);
  }

  return {
    data: body.data,
    meta: { nextCursor: body.meta?.nextCursor ?? null },
  };
}
