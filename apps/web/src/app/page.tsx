import { DEFAULT_POKEDEX_SLUG, POKEDEX_SLUG_VALUES, type PokedexSlug } from '@pokedex/contracts';

import type { PokemonSearchPage } from '@/features/pokemon-list/api/search-pokemon';
import { PokemonListView } from '@/features/pokemon-list/components/pokemon-list-view';
import { serverApiClient } from '@/lib/api-client.server';

const POKEDEX_SLUG_SET = new Set<string>(POKEDEX_SLUG_VALUES);

const isPokedexSlug = (value: string | undefined): value is PokedexSlug =>
  value !== undefined && POKEDEX_SLUG_SET.has(value);

type RawSearchParams = {
  pokedex?: string;
  types?: string;
  cursor?: string;
  limit?: string;
};

/**
 * upstream が 5xx で応答した、もしくは Hono RPC で必須のはずのルートが取得できなかった
 * 「持続的なサーバ障害」を表す Error。Next.js の `error.tsx` 経路に飛ばす目印として使う。
 * catch ブロックで message 文字列マッチに頼らず instanceof で判別する。
 */
class UpstreamServerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UpstreamServerError';
  }
}

/**
 * RSC で 1 ページ目を fetch する。
 *
 * 本 RSC 段は SSR 最適化 (初回 skeleton 回避) のための先取り fetch。失敗種別ごとに方針を分ける:
 *
 * - **network error (ECONNREFUSED 等) / 4xx / envelope error** → `undefined` を返し Client `useInfiniteQuery` の retry に委ねる
 *   (一時的 / Client から復旧可能なケース。apps/api 未起動の dev 環境でも error.tsx に飛ばず graceful に劣化)
 * - **upstream 5xx** → `Error` を throw して `error.tsx` に飛ばす
 *   (持続的なサーバ障害は Client retry でも復旧しないため握り潰さず可視化する)
 */
async function fetchInitialPage(params: RawSearchParams): Promise<PokemonSearchPage | undefined> {
  const pokedex: PokedexSlug = isPokedexSlug(params.pokedex) ? params.pokedex : DEFAULT_POKEDEX_SLUG;
  const query = {
    pokedex,
    types: params.types ?? '',
    ...(params.cursor === undefined ? {} : { cursor: params.cursor }),
    ...(params.limit === undefined ? {} : { limit: params.limit }),
  };

  try {
    const upstream = await serverApiClient.api.pokemon?.$get({ query });
    if (upstream === undefined) {
      // Hono RPC 型推論で optional になっているが、ランタイムでは必ず存在する
      // (健全性を欠く構成変更を早期検出するため error.tsx へ)
      throw new UpstreamServerError('[page] upstream client missing api.pokemon route');
    }
    if (upstream.status >= 500) {
      // 持続的なサーバエラーは Client retry でも復旧しないため error.tsx に委ねる
      throw new UpstreamServerError(`[page] upstream returned ${upstream.status}`);
    }
    if (!upstream.ok) {
      // 4xx (typically INVALID_QUERY): URL の query が壊れている可能性。Client 側の再試行で
      // ユーザ操作の結果として復旧しうるので graceful fallback
      console.warn(`[page] upstream returned ${upstream.status}, falling back to client fetch`);
      return undefined;
    }
    const body = await upstream.json();
    if (!body.success) {
      // envelope error も Client retry に委ねる (Client 側で同じ症状に当たれば同じ error.tsx 経路)
      console.warn('[page] upstream envelope error, falling back to client fetch:', body.error.code);
      return undefined;
    }
    return {
      data: body.data,
      meta: { nextCursor: body.meta?.nextCursor ?? null },
    };
  } catch (error) {
    // UpstreamServerError (5xx / missing route) は再 throw して error.tsx へ。
    // network error (ECONNREFUSED 等) / JSON decode error はここで吸収して Client retry に倒す。
    if (error instanceof UpstreamServerError) {
      throw error;
    }
    console.error('[page] RSC initial fetch failed (network / decode), falling back to client fetch:', error);
    return undefined;
  }
}

/**
 * トップページの RSC エントリ。
 *
 * Next.js 15+ の async searchParams pattern を採用 (`searchParams` は `Promise` で渡される)。
 * `await searchParams` を経由しないと型が `Promise` のまま展開できないため、
 * 必ず最初に await して raw クエリを取り出してから fetch に渡す。
 *
 * RSC が 1 ページ目を fetch し `<PokemonListView initialPage>` に渡すことで、
 * Client は `useInfiniteQuery` の `initialData` で hydrate でき、初回 render の
 * skeleton を避けられる (Decision 2: Hybrid 構成)。
 */
export default async function HomePage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const params = await searchParams;
  const initialPage = await fetchInitialPage(params);

  return (
    <main className="container mx-auto px-4 py-6">
      <h1 className="mb-6 text-2xl font-semibold">ポケモン図鑑</h1>
      <PokemonListView {...(initialPage === undefined ? {} : { initialPage })} />
    </main>
  );
}
