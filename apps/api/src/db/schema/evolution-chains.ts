import { relations } from 'drizzle-orm';
import { pgTable, serial } from 'drizzle-orm/pg-core';

import { species } from './species.js';

/**
 * 進化系統のグルーピング単位。属性は将来追加できるよう id のみで開始する。
 *
 * 進化系統が存在する species だけが対応する行を持ち、進化しない単独種族
 * (ミュウ等) は species.evolution_chain_id を NULL とする。
 */
export const evolutionChains = pgTable('evolution_chains', {
  id: serial('id').primaryKey(),
});

export type EvolutionChain = typeof evolutionChains.$inferSelect;
export type NewEvolutionChain = typeof evolutionChains.$inferInsert;

export const evolutionChainsRelations = relations(evolutionChains, ({ many }) => ({
  species: many(species),
}));
