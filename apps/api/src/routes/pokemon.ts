import { vValidator } from '@hono/valibot-validator';
import { ErrorCode, pokemonListQuerySchema } from '@pokedex/contracts';
import { Hono } from 'hono';
import type * as v from 'valibot';

import { decodeCursor, encodeCursor } from '../lib/cursor.js';
import { errorEnvelope, successEnvelope } from '../lib/envelope.js';
import type { PokemonRepository } from '../repositories/pokemon.js';

/**
 * `vValidator` の hook で Valibot 失敗を `INVALID_QUERY` (400) に整形する。
 * issue メッセージは複数まとめて `; ` で連結し、debug ヒントとして残す。
 */
const buildValidationMessage = (issues: readonly v.BaseIssue<unknown>[]): string =>
  issues.map((i) => i.message).join('; ');

/**
 * `pokemon` ルーター。route 層は `PokemonRepository` interface のみに依存する
 * (Decision 6 / design.md)。コンポジションルート (`src/index.ts`) で real / mock の
 * 注入を切り替える。
 *
 * 想定外例外 (DB 接続失敗 / SQL エラー等) は `onError` で捕捉し、500 +
 * `INTERNAL_ERROR` に整形する (pokemon-api spec の Requirement)。
 */
export const createPokemonRoutes = (repo: PokemonRepository) =>
  new Hono()
    .onError((err, c) => {
      console.error('[pokemon] unexpected error:', err);
      return c.json(errorEnvelope(ErrorCode.INTERNAL_ERROR, 'internal error'), 500);
    })
    .get(
      '/pokemon',
      vValidator('query', pokemonListQuerySchema, (result, c): Response | undefined => {
        if (!result.success) {
          return c.json(errorEnvelope(ErrorCode.INVALID_QUERY, buildValidationMessage(result.issues)), 400);
        }
        // oxlint-disable-next-line unicorn/no-useless-undefined -- `noImplicitReturns`
        // と `consistent-return` の両方を満たすために明示的に `undefined` を返す。
        return undefined;
      }),
      async (c) => {
        const { pokedex, types, cursor: cursorToken, limit } = c.req.valid('query');

        const cursor = cursorToken !== undefined ? decodeCursor(cursorToken) : null;
        if (cursorToken !== undefined && cursor === null) {
          return c.json(errorEnvelope(ErrorCode.INVALID_QUERY, 'invalid cursor'), 400);
        }

        const pokedexId = await repo.findPokedexIdBySlug(pokedex);
        if (pokedexId === null) {
          return c.json(errorEnvelope(ErrorCode.INVALID_QUERY, `unknown pokedex: ${pokedex}`), 400);
        }

        const typeIds = await repo.findTypeIdsBySlugs(types);
        if (typeIds === null) {
          return c.json(errorEnvelope(ErrorCode.INVALID_QUERY, 'unknown type slug'), 400);
        }

        const { items, nextCursor } = await repo.searchByList({ pokedexId, typeIds, cursor, limit });
        const encodedNext = nextCursor === null ? null : encodeCursor(nextCursor);

        return c.json(successEnvelope(items, { nextCursor: encodedNext }));
      },
    )
    .get('/pokemon/:slug', async (c) => {
      const slug = c.req.param('slug');
      const detail = await repo.findDetailBySlug(slug);
      if (detail === null) {
        return c.json(errorEnvelope(ErrorCode.POKEMON_NOT_FOUND, `pokemon not found: ${slug}`), 404);
      }
      return c.json(successEnvelope(detail));
    });
