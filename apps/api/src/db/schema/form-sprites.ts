import { index, integer, pgTable, serial, text, unique } from 'drizzle-orm/pg-core';

import { spriteGenderEnum, spriteKindEnum } from './enums.js';
import { forms } from './forms.js';

/**
 * フォームのスプライト画像エントリ。
 *
 * (form_id, gender, kind) で UNIQUE。url には Supabase Storage の **相対パス** を
 * 格納する。本 change では placeholder 文字列で構わない (実画像は
 * 後続 add-sprite-assets change で投入)。
 */
export const formSprites = pgTable(
  'form_sprites',
  {
    id: serial('id').primaryKey(),
    formId: integer('form_id')
      .notNull()
      .references(() => forms.id, { onDelete: 'cascade' }),
    gender: spriteGenderEnum('gender').notNull(),
    kind: spriteKindEnum('kind').notNull(),
    url: text('url').notNull(),
  },
  (table) => [
    unique('form_sprites_form_id_gender_kind_unique').on(table.formId, table.gender, table.kind),
    // 検索ホットパス: 一覧で各 form の sprites をバッチ取得する経路 (`add-search-api`)。
    index('form_sprites_form_id_idx').on(table.formId),
  ],
);

export type FormSprite = typeof formSprites.$inferSelect;
export type NewFormSprite = typeof formSprites.$inferInsert;
