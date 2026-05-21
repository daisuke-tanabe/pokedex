import { relations, sql } from 'drizzle-orm';
import { check, integer, pgTable, serial, text, unique, varchar } from 'drizzle-orm/pg-core';

import { evolutionChains } from './evolution-chains.js';
import { forms } from './forms.js';
import { locales } from './locales.js';

/**
 * ポケモンの種族 (national_dex_number を持つ単位)。
 *
 * フォームは forms テーブルで別管理する。evolution_chain_id は進化系統に
 * 属する species のみ非 NULL を持ち、進化しない単独種族 (ミュウ等) は NULL。
 */
export const species = pgTable('species', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 64 }).notNull().unique(),
  nationalDexNumber: integer('national_dex_number').notNull().unique(),
  evolutionChainId: integer('evolution_chain_id').references(() => evolutionChains.id),
});

export type Species = typeof species.$inferSelect;
export type NewSpecies = typeof species.$inferInsert;

/**
 * 種族の多言語名。
 */
export const speciesNames = pgTable(
  'species_names',
  {
    id: serial('id').primaryKey(),
    speciesId: integer('species_id')
      .notNull()
      .references(() => species.id, { onDelete: 'cascade' }),
    locale: varchar('locale', { length: 16 })
      .notNull()
      .references(() => locales.code),
    name: text('name').notNull(),
  },
  (table) => [unique('species_names_species_id_locale_unique').on(table.speciesId, table.locale)],
);

export type SpeciesName = typeof speciesNames.$inferSelect;
export type NewSpeciesName = typeof speciesNames.$inferInsert;

/**
 * 進化前後の species 間の対応関係 (自己参照)。
 *
 * 進化条件 (レベル / 道具 / 通信交換等) は本 change では持たず、対応関係のみ。
 * 自己進化 (from = to) は CHECK で禁止する。
 */
export const speciesEvolutions = pgTable(
  'species_evolutions',
  {
    id: serial('id').primaryKey(),
    fromSpeciesId: integer('from_species_id')
      .notNull()
      .references(() => species.id, { onDelete: 'cascade' }),
    toSpeciesId: integer('to_species_id')
      .notNull()
      .references(() => species.id, { onDelete: 'cascade' }),
  },
  (table) => [
    unique('species_evolutions_from_to_unique').on(table.fromSpeciesId, table.toSpeciesId),
    check('species_evolutions_from_to_distinct', sql`${table.fromSpeciesId} <> ${table.toSpeciesId}`),
  ],
);

export type SpeciesEvolution = typeof speciesEvolutions.$inferSelect;
export type NewSpeciesEvolution = typeof speciesEvolutions.$inferInsert;

export const speciesRelations = relations(species, ({ many, one }) => ({
  evolutionChain: one(evolutionChains, {
    fields: [species.evolutionChainId],
    references: [evolutionChains.id],
  }),
  forms: many(forms),
  names: many(speciesNames),
}));

export const speciesEvolutionsRelations = relations(speciesEvolutions, ({ one }) => ({
  from: one(species, {
    fields: [speciesEvolutions.fromSpeciesId],
    references: [species.id],
    relationName: 'speciesEvolutionFrom',
  }),
  to: one(species, {
    fields: [speciesEvolutions.toSpeciesId],
    references: [species.id],
    relationName: 'speciesEvolutionTo',
  }),
}));
