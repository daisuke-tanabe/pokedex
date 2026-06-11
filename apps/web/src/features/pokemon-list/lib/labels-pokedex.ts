import { POKEDEX_SLUG_VALUES, type PokedexSlug } from '@pokedex/contracts';

/**
 * `pokedex` slug → 日本語ラベルのマップ。
 *
 * `POKEDEX_SLUG_VALUES` の各 slug に対してラベルを定義する。
 * 新しい図鑑が enum に追加されたら、ここの map と `pokedexLabel` の型が同期するよう
 * `Record<PokedexSlug, string>` で網羅性を強制する。
 */
const POKEDEX_LABEL_MAP: Record<PokedexSlug, string> = {
  national: '全国図鑑',
  paldea: 'パルデア図鑑',
};

/**
 * select option 用に `[slug, label]` ペアの配列を `POKEDEX_SLUG_VALUES` のタプル順で返す。
 *
 * 表示順は global → regional の自然順 (national を先頭) とし、新しい地方図鑑が追加されたら
 * `POKEDEX_SLUG_VALUES` の末尾に追加するだけで UI に追従する。
 */
export const POKEDEX_OPTIONS: ReadonlyArray<{ slug: PokedexSlug; label: string }> = POKEDEX_SLUG_VALUES.map((slug) => ({
  slug,
  label: POKEDEX_LABEL_MAP[slug],
}));

export const pokedexLabel = (slug: PokedexSlug): string => POKEDEX_LABEL_MAP[slug];
