import { FORM_CATEGORY_VALUES, LOCALE_VALUES, SPRITE_GENDER_VALUES, SPRITE_KIND_VALUES } from '@pokedex/contracts';
import * as v from 'valibot';

const localeCodeSchema = v.picklist(LOCALE_VALUES);

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
  name: v.pipe(v.string(), v.nonEmpty()),
});

export const localesFileSchema = v.array(localeRowSchema);
export type LocaleSeed = v.InferOutput<typeof localeRowSchema>;

const typeRowSchema = v.object({
  slug: v.pipe(v.string(), v.nonEmpty()),
  names: v.array(nameEntrySchema),
});

export const typesFileSchema = v.array(typeRowSchema);
export type TypeSeed = v.InferOutput<typeof typeRowSchema>;

const regionRowSchema = v.object({
  slug: v.pipe(v.string(), v.nonEmpty()),
  names: v.array(nameEntrySchema),
});

export const regionsFileSchema = v.array(regionRowSchema);
export type RegionSeed = v.InferOutput<typeof regionRowSchema>;

const pokedexRowSchema = v.object({
  slug: v.pipe(v.string(), v.nonEmpty()),
  regionSlug: v.optional(v.nullable(v.pipe(v.string(), v.nonEmpty()))),
  names: v.array(nameEntrySchema),
  entries: v.array(
    v.object({
      speciesSlug: v.pipe(v.string(), v.nonEmpty()),
      pokedexNumber: v.pipe(v.number(), v.integer(), v.minValue(1)),
      formSlug: v.optional(v.nullable(v.pipe(v.string(), v.nonEmpty()))),
    }),
  ),
});

export const pokedexesFileSchema = v.array(pokedexRowSchema);
export type PokedexSeed = v.InferOutput<typeof pokedexRowSchema>;

const speciesRowSchema = v.object({
  slug: v.pipe(v.string(), v.nonEmpty()),
  nationalDexNumber: v.pipe(v.number(), v.integer(), v.minValue(1)),
  evolutionChainKey: v.optional(v.nullable(v.pipe(v.string(), v.nonEmpty()))),
  names: v.array(nameEntrySchema),
  evolutions: v.optional(
    v.array(
      v.object({
        toSpeciesSlug: v.pipe(v.string(), v.nonEmpty()),
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
  typeSlug: v.pipe(v.string(), v.nonEmpty()),
});

const formRowSchema = v.object({
  speciesSlug: v.pipe(v.string(), v.nonEmpty()),
  slug: v.pipe(v.string(), v.nonEmpty()),
  category: v.picklist(FORM_CATEGORY_VALUES),
  types: v.pipe(v.array(typeSlotSchema), v.minLength(1)),
  sprites: v.pipe(v.array(spriteEntrySchema), v.minLength(1)),
  names: v.pipe(v.array(nameEntrySchema), v.minLength(1)),
});

export const formsFileSchema = v.array(formRowSchema);
export type FormSeed = v.InferOutput<typeof formRowSchema>;
