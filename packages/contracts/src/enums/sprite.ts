/**
 * スプライトの性別差。
 *
 * 性別による見た目の差異（メノスピンクのリボン色など）を画像で表現するためのキー。
 * 性別差を持たないフォームは `unknown` を使う。
 */
export const SpriteGender = {
  MALE: 'male',
  FEMALE: 'female',
  UNKNOWN: 'unknown',
} as const;

export type SpriteGender = (typeof SpriteGender)[keyof typeof SpriteGender];

/**
 * スプライトの種別。
 *
 * - default: 通常スプライト (図鑑表示の主役)
 * - shiny: 色違い
 * - back: バトル背面表示用
 * - back_shiny: バトル背面表示の色違い
 */
export const SpriteKind = {
  DEFAULT: 'default',
  SHINY: 'shiny',
  BACK: 'back',
  BACK_SHINY: 'back_shiny',
} as const;

export type SpriteKind = (typeof SpriteKind)[keyof typeof SpriteKind];
