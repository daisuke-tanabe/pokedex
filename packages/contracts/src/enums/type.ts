/**
 * ポケモンタイプのスラッグ非空タプル (標準 18 タイプ)。
 *
 * Valibot `v.picklist()` や pgEnum など non-empty readonly tuple を要求する API に
 * 渡すための配列形式 export。`TypeSlug` オブジェクトとの同期は `satisfies` で
 * 型保証する。タイプは新世代追加時にのみ拡張される (現状の標準 18 タイプは
 * 第 6 世代以降変動なし)。
 */
export const TYPE_SLUG_VALUES = [
  'normal',
  'fire',
  'water',
  'electric',
  'grass',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
] as const;

/**
 * ポケモンの標準 18 タイプ。
 */
export const TypeSlug = {
  NORMAL: 'normal',
  FIRE: 'fire',
  WATER: 'water',
  ELECTRIC: 'electric',
  GRASS: 'grass',
  ICE: 'ice',
  FIGHTING: 'fighting',
  POISON: 'poison',
  GROUND: 'ground',
  FLYING: 'flying',
  PSYCHIC: 'psychic',
  BUG: 'bug',
  ROCK: 'rock',
  GHOST: 'ghost',
  DRAGON: 'dragon',
  DARK: 'dark',
  STEEL: 'steel',
  FAIRY: 'fairy',
} as const satisfies Readonly<Record<string, (typeof TYPE_SLUG_VALUES)[number]>>;

/**
 * `TypeSlug` の値のリテラルユニオン型。
 */
export type TypeSlug = (typeof TYPE_SLUG_VALUES)[number];
