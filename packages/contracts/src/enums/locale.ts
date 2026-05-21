/**
 * 多言語名テーブル (`*_names`) で扱う言語コードの非空タプル。
 *
 * 将来 `fr` / `de` / `it` / `es` / `ko` / `zh-Hans` / `zh-Hant` を追加する場合は、
 * (1) 本配列にコードを追加し、(2) `locales` テーブルへの INSERT を seed JSON で行う。
 * pgEnum ではなく lookup テーブルにしているのは、ALTER TYPE を避けて INSERT で済む
 * ようにするため。
 */
export const LOCALE_VALUES = ['ja', 'en'] as const;

/**
 * 多言語名で参照される言語コード。
 */
export const Locale = {
  JA: 'ja',
  EN: 'en',
} as const satisfies Readonly<Record<string, (typeof LOCALE_VALUES)[number]>>;

/**
 * `Locale` の値のリテラルユニオン型。
 */
export type Locale = (typeof LOCALE_VALUES)[number];
