import { index, integer, pgTable, serial, unique } from 'drizzle-orm/pg-core';

import { forms } from './forms.js';
import { pokedexes } from './pokedexes.js';
import { species } from './species.js';

/**
 * 図鑑ごとの species エントリ。
 *
 * - (pokedex_id, pokedex_number) UNIQUE: 同一図鑑で番号重複を防ぐ
 * - (pokedex_id, species_id) UNIQUE: 同一図鑑で同一 species の二重登録を防ぐ
 * - form_id (NULL 許容): その図鑑で表示するフォームを指定する。NULL の場合は
 *   当該 species の `forms.is_default = true` の form をデフォルト表示する
 *   (API は `searchByList` の `COALESCE(specifiedForm, defaultForm)` で担保、
 *   不変条件は invariants.ts の「全 species に default form が exactly 1 件」で担保)。
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
    formId: integer('form_id').references(() => forms.id, { onDelete: 'set null' }),
  },
  (table) => [
    unique('pokedex_entries_pokedex_id_pokedex_number_unique').on(table.pokedexId, table.pokedexNumber),
    unique('pokedex_entries_pokedex_id_species_id_unique').on(table.pokedexId, table.speciesId),
    // 検索ホットパス: 図鑑スラッグ → entries の絞り込み。PostgreSQL は FK 列に
    // 自動で index を張らないため、明示的に追加する (`add-search-api`)。
    index('pokedex_entries_pokedex_id_idx').on(table.pokedexId),
    // 検索ホットパス: form_id 経由で entries を逆引きする詳細クエリ用。
    index('pokedex_entries_form_id_idx').on(table.formId),
  ],
);

export type PokedexEntry = typeof pokedexEntries.$inferSelect;
export type NewPokedexEntry = typeof pokedexEntries.$inferInsert;
