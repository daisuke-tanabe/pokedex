/**
 * ポケモンフォームの分類。
 *
 * - normal: 通常フォーム
 * - regional: 地方フォーム (アローラ / ガラル / パルデア など)
 * - mega: メガシンカ (X/Y 分岐がないもの)
 * - mega-x / mega-y: メガシンカ X / Y (リザードン・ミュウツーで分岐するもの)
 * - gigantamax: キョダイマックス
 * - tera: テラスタル特殊形態 (テラパゴス、オーガポンの仮面別テラなど)
 * - other: 上記に当てはまらない種特有フォーム (ロトムのヒート、アルセウスのプレート、コスプレピカ等)
 */
export const FormCategory = {
  NORMAL: 'normal',
  REGIONAL: 'regional',
  MEGA: 'mega',
  MEGA_X: 'mega-x',
  MEGA_Y: 'mega-y',
  GIGANTAMAX: 'gigantamax',
  TERA: 'tera',
  OTHER: 'other',
} as const;

/**
 * `FormCategory` の値のリテラルユニオン型。
 */
export type FormCategory = (typeof FormCategory)[keyof typeof FormCategory];
