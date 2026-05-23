/* oxlint-disable typescript/no-unnecessary-type-parameters --
 * valibot のスキーマ生成は型推論をユーザ側に伝播するため、戻り値型を valibot に
 * 委ねている。`envelope.ts` と同じ方針。
 */
import * as v from 'valibot';

import { DEFAULT_POKEDEX_SLUG, MAX_TYPES, PAGE_SIZE } from '../constants.js';

const LIMIT_MIN = 1;
const LIMIT_MAX = 100;

/**
 * slug 形式の小さなバリデーション (空文字列除外)。
 */
const slugSchema = v.pipe(v.string(), v.minLength(1));

/**
 * base64url 文字集合 (`A-Za-z0-9_-`) のみで構成された文字列。
 */
const base64UrlSchema = v.pipe(v.string(), v.regex(/^[A-Za-z0-9_-]+$/u));

/**
 * `1..LIMIT_MAX` の整数を表す文字列 (HTTP クエリは原則 string で来る)。
 */
const limitSchema = v.pipe(
  v.string(),
  v.transform((input) => Number.parseInt(input, 10)),
  v.number(),
  v.check((value) => Number.isFinite(value), 'limit must be a finite number'),
  v.integer(),
  v.minValue(LIMIT_MIN),
  v.maxValue(LIMIT_MAX),
);

/**
 * カンマ区切りタイプ slug 文字列を `string[]` に変換するスキーマ。
 *
 * 空文字列は `[]` を返す。配列要素は空文字列を許容しないため
 * `pokemon=fire,` のような末尾カンマは弾かれる。
 */
const typesSchema = v.pipe(
  v.string(),
  v.transform((input) => (input.length === 0 ? [] : input.split(','))),
  v.array(slugSchema),
  v.maxLength(MAX_TYPES),
);

/**
 * `GET /api/pokemon` のクエリパラメータ。
 *
 * すべて optional。省略時は spec で定義された既定値に解決される。
 */
export const pokemonListQuerySchema = v.object({
  pokedex: v.optional(slugSchema, DEFAULT_POKEDEX_SLUG),
  types: v.optional(typesSchema, ''),
  cursor: v.optional(base64UrlSchema),
  limit: v.optional(limitSchema, String(PAGE_SIZE)),
});

export type PokemonListQuery = v.InferOutput<typeof pokemonListQuerySchema>;
