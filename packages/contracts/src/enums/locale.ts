/**
 * 多言語名テーブル (`*_names`) で扱う言語コード。
 *
 * 本 change のシード対象は `ja` / `en` の 2 言語のみ。将来 `fr` / `de` / `it` /
 * `es` / `ko` / `zh-Hans` / `zh-Hant` を追加する場合は、(1) 本ファイルにキーを
 * 追加し、(2) `locales` テーブルへの INSERT を seed JSON で行う。pgEnum ではなく
 * lookup テーブルにしているのは、ALTER TYPE を避けて INSERT で済むようにするため。
 */
export const Locale = {
  JA: 'ja',
  EN: 'en',
} as const;

/**
 * `Locale` の値のリテラルユニオン型。
 */
export type Locale = (typeof Locale)[keyof typeof Locale];
