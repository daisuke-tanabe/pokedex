import { FORM_CATEGORY_VALUES, SPRITE_GENDER_VALUES, SPRITE_KIND_VALUES } from '@pokedex/contracts';
import { pgEnum } from 'drizzle-orm/pg-core';

export const formCategoryEnum = pgEnum('form_category', FORM_CATEGORY_VALUES);
export const spriteGenderEnum = pgEnum('sprite_gender', SPRITE_GENDER_VALUES);
export const spriteKindEnum = pgEnum('sprite_kind', SPRITE_KIND_VALUES);
