/* oxlint-disable typescript/no-unnecessary-type-parameters --
 * valibot のスキーマ生成は型推論を呼び出し側に伝播する。`envelope.ts` と同方針。
 */
import * as v from 'valibot';

/**
 * 一覧 1 アイテムのスキーマ。
 *
 * 一覧では各 species の default form (もしくは pokedex_entries.form_id 指定 form) を
 * 1 件分のフラットな表現として返す。
 */
export const pokemonListItemSchema = v.object({
  speciesSlug: v.string(),
  formSlug: v.string(),
  pokedexNumber: v.number(),
  nameJa: v.string(),
  types: v.array(v.string()),
  defaultSpriteUrl: v.string(),
});

export type PokemonListItem = v.InferOutput<typeof pokemonListItemSchema>;

/**
 * 一覧レスポンスの `meta` 部分。cursor は末尾ページで `null` になる。
 */
export const pokemonListMetaSchema = v.object({
  nextCursor: v.nullable(v.string()),
});

export type PokemonListMeta = v.InferOutput<typeof pokemonListMetaSchema>;
