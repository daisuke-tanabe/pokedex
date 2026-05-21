import { integer, pgTable, serial, text, unique, varchar } from 'drizzle-orm/pg-core';

import { locales } from './locales.js';

/**
 * ポケモンのタイプ (ノーマル / ほのお / みず / ...)。
 * `slug` を UNIQUE にして API レスポンスや FK の自然キー候補にする。
 */
export const types = pgTable('types', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 32 }).notNull().unique(),
});

export type Type = typeof types.$inferSelect;
export type NewType = typeof types.$inferInsert;

/**
 * タイプの多言語名。
 * `(type_id, locale)` を UNIQUE にして同一言語の重複を防ぐ。
 */
export const typeNames = pgTable(
  'type_names',
  {
    id: serial('id').primaryKey(),
    typeId: integer('type_id')
      .notNull()
      .references(() => types.id, { onDelete: 'cascade' }),
    locale: varchar('locale', { length: 16 })
      .notNull()
      .references(() => locales.code),
    name: text('name').notNull(),
  },
  (table) => [unique('type_names_type_id_locale_unique').on(table.typeId, table.locale)],
);

export type TypeName = typeof typeNames.$inferSelect;
export type NewTypeName = typeof typeNames.$inferInsert;
