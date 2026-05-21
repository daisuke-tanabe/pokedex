import { integer, pgTable, serial, unique } from 'drizzle-orm/pg-core';

import { forms } from './forms.js';
import { pokedexes } from './pokedexes.js';
import { species } from './species.js';

/**
 * 図鑑ごとの species エントリ。
 *
 * - (pokedex_id, pokedex_number) UNIQUE: 同一図鑑で番号重複を防ぐ
 * - (pokedex_id, species_id) UNIQUE: 同一図鑑で同一 species の二重登録を防ぐ
 * - form_id (NULL 許容): その図鑑で表示するフォームを指定する。NULL の場合は
 *   UI 側で category='normal' のフォームをデフォルト表示するフォールバック前提。
 */
export const pokedexEntries = pgTable(
  'pokedex_entries',
  {
    id: serial('id').primaryKey(),
    pokedexId: integer('pokedex_id')
      .notNull()
      .references(() => pokedexes.id, { onDelete: 'cascade' }),
    speciesId: integer('species_id')
      .notNull()
      .references(() => species.id, { onDelete: 'cascade' }),
    pokedexNumber: integer('pokedex_number').notNull(),
    formId: integer('form_id').references(() => forms.id),
  },
  (table) => [
    unique('pokedex_entries_pokedex_id_pokedex_number_unique').on(table.pokedexId, table.pokedexNumber),
    unique('pokedex_entries_pokedex_id_species_id_unique').on(table.pokedexId, table.speciesId),
  ],
);

export type PokedexEntry = typeof pokedexEntries.$inferSelect;
export type NewPokedexEntry = typeof pokedexEntries.$inferInsert;
