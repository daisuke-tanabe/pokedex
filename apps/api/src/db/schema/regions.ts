import { integer, pgTable, serial, text, unique, varchar } from 'drizzle-orm/pg-core';

import { locales } from './locales.js';

/**
 * 地方 (カントー / ジョウト / ホウエン / ... / パルデア など)。
 */
export const regions = pgTable('regions', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 32 }).notNull().unique(),
});

export type Region = typeof regions.$inferSelect;
export type NewRegion = typeof regions.$inferInsert;

/**
 * 地方の多言語名。
 */
export const regionNames = pgTable(
  'region_names',
  {
    id: serial('id').primaryKey(),
    regionId: integer('region_id')
      .notNull()
      .references(() => regions.id, { onDelete: 'cascade' }),
    locale: varchar('locale', { length: 16 })
      .notNull()
      .references(() => locales.code),
    name: text('name').notNull(),
  },
  (table) => [unique('region_names_region_id_locale_unique').on(table.regionId, table.locale)],
);

export type RegionName = typeof regionNames.$inferSelect;
export type NewRegionName = typeof regionNames.$inferInsert;
