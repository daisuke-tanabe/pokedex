import { pgTable, varchar } from 'drizzle-orm/pg-core';

/**
 * 多言語名テーブル (`*_names`) が参照する言語コードの lookup。
 *
 * pgEnum ではなくテーブルにしているのは、将来 fr / de / it / es / ko / zh-Hans /
 * zh-Hant 等を追加するときに ALTER TYPE ではなく INSERT で済むようにするため。
 * `code` は contracts の `LOCALE_VALUES` と同期したシードで投入する。
 *
 * `*_names.locale` 系の FK はすべて ON DELETE NO ACTION (drizzle デフォルト) で参照する。
 * これは「サポート対象の locale を実運用中に削除させない」ことを DB レベルで保証する
 * ための意図的な選択 (削除しようとすると FK 違反でブロックされる)。locale を廃止する
 * 場合は、まず該当 `*_names` 行を削除/別 locale に振り替えた上で `locales` 行を削除する。
 */
export const locales = pgTable('locales', {
  code: varchar('code', { length: 16 }).primaryKey(),
  name: varchar('name', { length: 64 }).notNull(),
});

export type LocaleRow = typeof locales.$inferSelect;
export type NewLocaleRow = typeof locales.$inferInsert;
