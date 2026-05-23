/**
 * API レスポンスのエラーコード。
 *
 * TypeScript の `enum` ではなく `as const` オブジェクト + ユニオン型エイリアスで
 * 表現する。値はそのままリテラル文字列として扱え、tree-shaking との相性も良い。
 */
export const ErrorCode = {
  POKEDEX_NOT_FOUND: 'POKEDEX_NOT_FOUND',
  POKEMON_NOT_FOUND: 'POKEMON_NOT_FOUND',
  INVALID_QUERY: 'INVALID_QUERY',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

/**
 * `ErrorCode` の値の集合からなるリテラルユニオン型。
 */
export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
