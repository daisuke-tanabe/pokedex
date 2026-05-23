import { relations, sql } from 'drizzle-orm';
import { boolean, integer, pgTable, serial, text, unique, uniqueIndex, varchar } from 'drizzle-orm/pg-core';

import { formCategoryEnum } from './enums.js';
import { formSprites } from './form-sprites.js';
import { formTypes } from './form-types.js';
import { locales } from './locales.js';
import { species } from './species.js';

/**
 * ポケモン種族のフォーム実体 (通常 / 地方 / メガ / キョダイ / テラ / コスプレ 等)。
 *
 * - `(species_id, slug)` UNIQUE で同一種族での slug 重複を防ぐ
 * - `category` は pgEnum で 8 値に限定 (ゲーム内の形態カテゴリ)
 * - `is_default` は「API / UI のデフォルト表示対象」を表すフラグで、`category` とは
 *   独立な概念 (現シードでは `category='normal'` と一致するが、将来「normal が複数」
 *   「normal が無い」種族が出現したときに乖離させられる)
 * - 部分 UNIQUE インデックス: 1 つの `species_id` につき `is_default = true` の行は
 *   最大 1 件に制限する。"exactly 1 件" の保証は seed の Invariant Test が補完する
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
    isDefault: boolean('is_default').notNull().default(false),
  },
  (table) => [
    unique('forms_species_id_slug_unique').on(table.speciesId, table.slug),
    uniqueIndex('forms_species_id_default_unique')
      .on(table.speciesId)
      .where(sql`${table.isDefault} = true`),
  ],
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

export const formsRelations = relations(forms, ({ many, one }) => ({
  species: one(species, {
    fields: [forms.speciesId],
    references: [species.id],
  }),
  types: many(formTypes),
  sprites: many(formSprites),
  names: many(formNames),
}));
