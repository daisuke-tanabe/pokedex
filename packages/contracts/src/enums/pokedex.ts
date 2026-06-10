/**
 * 図鑑 (pokedex) スラッグの非空タプル。
 *
 * Valibot `v.picklist()` や pgEnum など non-empty readonly tuple を要求する API に
 * 渡すための配列形式 export。`PokedexSlug` オブジェクトとの同期は `satisfies` で
 * 型保証する。後続 change での seed 拡張時には本配列と `pokedexes.json` を同期で
 * 更新する (整合性は `apps/api/src/db/seed` の test が gatekeeper)。
 */
export const POKEDEX_SLUG_VALUES = ['national', 'paldea'] as const;

/**
 * 図鑑のスラッグ。
 *
 * - national: 全国図鑑 (全ての region を横断する master 図鑑)
 * - paldea: パルデア図鑑 (スカーレット・バイオレット)
 */
export const PokedexSlug = {
  NATIONAL: 'national',
  PALDEA: 'paldea',
} as const satisfies Readonly<Record<string, (typeof POKEDEX_SLUG_VALUES)[number]>>;

/**
 * `PokedexSlug` の値のリテラルユニオン型。
 */
export type PokedexSlug = (typeof POKEDEX_SLUG_VALUES)[number];
