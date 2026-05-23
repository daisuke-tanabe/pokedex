/* oxlint-disable typescript/no-unnecessary-type-parameters --
 * valibot のスキーマ生成は型推論を呼び出し側に伝播する。`envelope.ts` と同方針。
 */
import * as v from 'valibot';

import { FORM_CATEGORY_VALUES } from '../enums/form-category.js';
import { LOCALE_VALUES } from '../enums/locale.js';
import { SPRITE_GENDER_VALUES, SPRITE_KIND_VALUES } from '../enums/sprite.js';

/**
 * 多言語名エントリ。
 */
const localizedNameSchema = v.object({
  locale: v.picklist(LOCALE_VALUES),
  name: v.string(),
});

/**
 * species の最小表現 (詳細レスポンス本体 + 進化チェーン要素で共用)。
 */
const speciesEntrySchema = v.object({
  slug: v.string(),
  nationalDexNumber: v.number(),
  names: v.array(localizedNameSchema),
});

/**
 * default form (もしくは指定 form) の表現。
 */
const formEntrySchema = v.object({
  slug: v.string(),
  category: v.picklist(FORM_CATEGORY_VALUES),
  isDefault: v.boolean(),
});

/**
 * sprite 表現 (gender × kind × url)。
 */
const formSpriteSchema = v.object({
  gender: v.picklist(SPRITE_GENDER_VALUES),
  kind: v.picklist(SPRITE_KIND_VALUES),
  url: v.string(),
});

/**
 * 詳細レスポンス。`GET /api/pokemon/:slug` 用。
 */
export const pokemonDetailSchema = v.object({
  species: speciesEntrySchema,
  form: formEntrySchema,
  names: v.array(localizedNameSchema),
  sprites: v.array(formSpriteSchema),
  types: v.array(v.string()),
  evolutions: v.array(speciesEntrySchema),
});

export type PokemonDetail = v.InferOutput<typeof pokemonDetailSchema>;
