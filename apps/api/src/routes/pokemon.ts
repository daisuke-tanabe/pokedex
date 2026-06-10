import { vValidator } from '@hono/valibot-validator';
import { ErrorCode, pokemonDetailParamSchema, pokemonListQuerySchema } from '@pokedex/contracts';
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
      vValidator('query', pokemonListQuerySchema, (result, c): Response | void => {
        if (!result.success) {
          return c.json(errorEnvelope(ErrorCode.INVALID_QUERY, buildValidationMessage(result.issues)), 400);
        }
      }),
      async (c) => {
        const { pokedex, types, cursor: cursorToken, limit } = c.req.valid('query');

        const cursor = cursorToken !== undefined ? decodeCursor(cursorToken) : null;
        if (cursorToken !== undefined && cursor === null) {
          return c.json(errorEnvelope(ErrorCode.INVALID_QUERY, 'invalid cursor'), 400);
        }

        // Valibot picklist (`POKEDEX_SLUG_VALUES`) で early reject 済のため、
        // DB と contracts の enum が同期している限り null は起こり得ない。
        // 万一 null が返った場合は invariants 違反 (DB と enum の乖離) として
        // fail-fast し、onError で 500 INTERNAL_ERROR に整形させる。
        const pokedexId = await repo.findPokedexIdBySlug(pokedex);
        if (pokedexId === null) {
          throw new Error(`[pokemon] invariants violation: pokedex slug '${pokedex}' not found in DB`);
        }

        // types は Valibot picklist で early reject 済だが、findTypeIdsBySlugs の
        // 戻り値型を non-nullable に揃えるリファクタは別 change の宿題候補 (design.md Decision 6)。
        // それまでの暫定として 400 INVALID_QUERY を返す既存挙動を維持する。
        const typeIds = await repo.findTypeIdsBySlugs(types);
        if (typeIds === null) {
          return c.json(errorEnvelope(ErrorCode.INVALID_QUERY, 'unknown type slug'), 400);
        }

        const { items, nextCursor } = await repo.searchByList({ pokedexId, typeIds, cursor, limit });
        const encodedNext = nextCursor === null ? null : encodeCursor(nextCursor);

        return c.json(successEnvelope(items, { nextCursor: encodedNext }));
      },
    )
    .get(
      '/pokemon/:slug',
      vValidator('param', pokemonDetailParamSchema, (result, c): Response | void => {
        if (!result.success) {
          return c.json(errorEnvelope(ErrorCode.INVALID_QUERY, buildValidationMessage(result.issues)), 400);
        }
      }),
      async (c) => {
        const { slug } = c.req.valid('param');
        const detail = await repo.findDetailBySlug(slug);
        if (detail === null) {
          return c.json(errorEnvelope(ErrorCode.POKEMON_NOT_FOUND, `pokemon not found: ${slug}`), 404);
        }
        return c.json(successEnvelope(detail));
      },
    );
