import { integer, pgTable, serial, text, unique, varchar } from 'drizzle-orm/pg-core';

import { formCategoryEnum } from './enums.js';
import { locales } from './locales.js';
import { species } from './species.js';

/**
 * ポケモン種族のフォーム実体 (通常 / 地方 / メガ / キョダイ / テラ / コスプレ 等)。
 *
 * (species_id, slug) を UNIQUE にして同一種族での重複を防ぐ。category は
 * pgEnum で 8 値に限定。
 */
export const forms = pgTable(
  'forms',
  {
    id: serial('id').primaryKey(),
    speciesId: integer('species_id')
      .notNull()
      .references(() => species.id, { onDelete: 'cascade' }),
    slug: varchar('slug', { length: 64 }).notNull(),
    category: formCategoryEnum('category').notNull(),
  },
  (table) => [unique('forms_species_id_slug_unique').on(table.speciesId, table.slug)],
);

export type Form = typeof forms.$inferSelect;
export type NewForm = typeof forms.$inferInsert;

/**
 * フォームの多言語名。
 */
export const formNames = pgTable(
  'form_names',
  {
    id: serial('id').primaryKey(),
    formId: integer('form_id')
      .notNull()
      .references(() => forms.id, { onDelete: 'cascade' }),
    locale: varchar('locale', { length: 16 })
      .notNull()
      .references(() => locales.code),
    name: text('name').notNull(),
  },
  (table) => [unique('form_names_form_id_locale_unique').on(table.formId, table.locale)],
);

export type FormName = typeof formNames.$inferSelect;
export type NewFormName = typeof formNames.$inferInsert;
