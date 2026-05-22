import { sql } from 'drizzle-orm';
import { check, integer, pgTable, primaryKey, smallint, unique } from 'drizzle-orm/pg-core';

import { forms } from './forms.js';
import { types } from './types.js';

/**
 * フォーム × タイプの中間テーブル (slot 1 / 2 を持つ)。
 *
 * - (form_id, slot) 複合 PK で同一スロットの 2 重登録を防ぐ
 * - (form_id, type_id) UNIQUE で同一フォーム × 同一タイプの重複登録を防ぐ
 * - slot は CHECK で 1 or 2 のみ
 */
export const formTypes = pgTable(
  'form_types',
  {
    formId: integer('form_id')
      .notNull()
      .references(() => forms.id, { onDelete: 'cascade' }),
    slot: smallint('slot').notNull(),
    typeId: integer('type_id')
      .notNull()
      .references(() => types.id),
  },
  (table) => [
    primaryKey({ name: 'form_types_pk', columns: [table.formId, table.slot] }),
    unique('form_types_form_id_type_id_unique').on(table.formId, table.typeId),
    check('form_types_slot_range', sql`${table.slot} IN (1, 2)`),
  ],
);

export type FormType = typeof formTypes.$inferSelect;
export type NewFormType = typeof formTypes.$inferInsert;
