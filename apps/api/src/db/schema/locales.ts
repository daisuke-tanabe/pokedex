import { pgTable, varchar } from 'drizzle-orm/pg-core';

/**
 * 多言語名テーブル (`*_names`) が参照する言語コードの lookup。
 *
 * pgEnum ではなくテーブルにしているのは、将来 fr / de / it / es / ko / zh-Hans /
 * zh-Hant 等を追加するときに ALTER TYPE ではなく INSERT で済むようにするため。
 * `code` は contracts の `LOCALE_VALUES` と同期したシードで投入する。
 */
export const locales = pgTable('locales', {
  code: varchar('code', { length: 16 }).primaryKey(),
  name: varchar('name', { length: 64 }),
});

export type LocaleRow = typeof locales.$inferSelect;
export type NewLocaleRow = typeof locales.$inferInsert;
