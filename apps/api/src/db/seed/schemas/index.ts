import { FORM_CATEGORY_VALUES, LOCALE_VALUES, SPRITE_GENDER_VALUES, SPRITE_KIND_VALUES } from '@pokedex/contracts';
import * as v from 'valibot';

/**
 * slug 列の最大長は Drizzle schema 側の `varchar(N)` 定義と一致させる。
 * DB 挿入時の cryptic なエラーではなく valibot パース段階で fail-fast させる目的。
 */
const SLUG_MAX_SHORT = 32; // types / regions / pokedexes / typeNames 参照
const SLUG_MAX_LONG = 64; // species / forms / 関連スラッグ参照
const NAME_MAX_LOCALE = 64; // locales.name (varchar(64))

const localeCodeSchema = v.picklist(LOCALE_VALUES);
const slugShortSchema = v.pipe(v.string(), v.nonEmpty(), v.maxLength(SLUG_MAX_SHORT));
const slugLongSchema = v.pipe(v.string(), v.nonEmpty(), v.maxLength(SLUG_MAX_LONG));

/**
 * 多言語名エントリ (locale + name)。
 */
const nameEntrySchema = v.object({
  locale: localeCodeSchema,
  name: v.pipe(v.string(), v.nonEmpty()),
});

export type NameEntrySeed = v.InferOutput<typeof nameEntrySchema>;

const localeRowSchema = v.object({
  code: localeCodeSchema,
  name: v.pipe(v.string(), v.nonEmpty(), v.maxLength(NAME_MAX_LOCALE)),
});

export const localesFileSchema = v.array(localeRowSchema);
export type LocaleSeed = v.InferOutput<typeof localeRowSchema>;

const typeRowSchema = v.object({
  slug: slugShortSchema,
  names: v.array(nameEntrySchema),
});

export const typesFileSchema = v.array(typeRowSchema);
export type TypeSeed = v.InferOutput<typeof typeRowSchema>;

const regionRowSchema = v.object({
  slug: slugShortSchema,
  names: v.array(nameEntrySchema),
});

export const regionsFileSchema = v.array(regionRowSchema);
export type RegionSeed = v.InferOutput<typeof regionRowSchema>;

const pokedexRowSchema = v.object({
  slug: slugShortSchema,
  regionSlug: v.nullish(slugShortSchema),
  names: v.array(nameEntrySchema),
  entries: v.array(
    v.object({
      speciesSlug: slugLongSchema,
      pokedexNumber: v.pipe(v.number(), v.integer(), v.minValue(1)),
      formSlug: v.nullish(slugLongSchema),
    }),
  ),
});

export const pokedexesFileSchema = v.array(pokedexRowSchema);
export type PokedexSeed = v.InferOutput<typeof pokedexRowSchema>;

const speciesRowSchema = v.object({
  slug: slugLongSchema,
  nationalDexNumber: v.pipe(v.number(), v.integer(), v.minValue(1)),
  // evolutionChainKey は DB 列に直接マッピングされず seed 内部の chainIdByKey を引くためだけの
  // 識別子。文字数上限は意味を持たないため maxLength は適用しない。
  evolutionChainKey: v.nullish(v.pipe(v.string(), v.nonEmpty())),
  names: v.array(nameEntrySchema),
  evolutions: v.optional(
    v.array(
      v.object({
        toSpeciesSlug: slugLongSchema,
      }),
    ),
  ),
});

export const speciesFileSchema = v.array(speciesRowSchema);
export type SpeciesSeed = v.InferOutput<typeof speciesRowSchema>;

const spriteEntrySchema = v.object({
  gender: v.picklist(SPRITE_GENDER_VALUES),
  kind: v.picklist(SPRITE_KIND_VALUES),
  url: v.pipe(v.string(), v.nonEmpty()),
});

const typeSlotSchema = v.object({
  slot: v.picklist([1, 2]),
  typeSlug: slugShortSchema,
});

const formRowSchema = v.object({
  speciesSlug: slugLongSchema,
  slug: slugLongSchema,
  category: v.picklist(FORM_CATEGORY_VALUES),
  types: v.pipe(v.array(typeSlotSchema), v.minLength(1)),
  sprites: v.pipe(v.array(spriteEntrySchema), v.minLength(1)),
  names: v.pipe(v.array(nameEntrySchema), v.minLength(1)),
});

export const formsFileSchema = v.array(formRowSchema);
export type FormSeed = v.InferOutput<typeof formRowSchema>;
