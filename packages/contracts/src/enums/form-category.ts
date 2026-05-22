/**
 * ポケモンフォームの分類値リスト (非空タプル)。
 *
 * pgEnum など non-empty readonly tuple を要求する API に渡すため、配列形式の
 * export も用意する。`FormCategory` オブジェクトとの同期は `satisfies` で型保証する。
 */
export const FORM_CATEGORY_VALUES = [
  'normal',
  'regional',
  'mega',
  'mega-x',
  'mega-y',
  'gigantamax',
  'tera',
  'other',
] as const;

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
} as const satisfies Readonly<Record<string, (typeof FORM_CATEGORY_VALUES)[number]>>;

/**
 * `FormCategory` の値のリテラルユニオン型。
 */
export type FormCategory = (typeof FORM_CATEGORY_VALUES)[number];
