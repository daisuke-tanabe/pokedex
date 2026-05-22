import { integer, pgTable, serial, text, unique, varchar } from 'drizzle-orm/pg-core';

import { locales } from './locales.js';
import { regions } from './regions.js';

/**
 * 図鑑カタログ。
 *
 * パルデア / キタカミ / ブルーベリーのような独立番号体系を持つ図鑑はそれぞれ
 * 別の行として持つ (区別は `slug`)。`region_id` はその図鑑が属する地方で、
 * `national` 図鑑のように特定地方に属さない図鑑は NULL とする。
 */
export const pokedexes = pgTable('pokedexes', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 32 }).notNull().unique(),
  regionId: integer('region_id').references(() => regions.id),
});

export type Pokedex = typeof pokedexes.$inferSelect;
export type NewPokedex = typeof pokedexes.$inferInsert;

/**
 * 図鑑カタログの多言語名。
 */
export const pokedexNames = pgTable(
  'pokedex_names',
  {
    id: serial('id').primaryKey(),
    pokedexId: integer('pokedex_id')
      .notNull()
      .references(() => pokedexes.id, { onDelete: 'cascade' }),
    locale: varchar('locale', { length: 16 })
      .notNull()
      .references(() => locales.code),
    name: text('name').notNull(),
  },
  (table) => [unique('pokedex_names_pokedex_id_locale_unique').on(table.pokedexId, table.locale)],
);

export type PokedexName = typeof pokedexNames.$inferSelect;
export type NewPokedexName = typeof pokedexNames.$inferInsert;
