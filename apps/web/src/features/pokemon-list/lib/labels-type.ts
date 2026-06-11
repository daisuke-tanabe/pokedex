import { TYPE_SLUG_VALUES, type TypeSlug } from '@pokedex/contracts';

/**
 * `type` slug → 日本語ラベルのマップ。
 *
 * `pokemon-api` seed (`apps/api/src/db/seed/data/types.json`) の typeNames と整合する文字列。
 * `Record<TypeSlug, string>` で網羅性を強制する。
 */
const TYPE_LABEL_MAP: Record<TypeSlug, string> = {
  normal: 'ノーマル',
  fire: 'ほのお',
  water: 'みず',
  electric: 'でんき',
  grass: 'くさ',
  ice: 'こおり',
  fighting: 'かくとう',
  poison: 'どく',
  ground: 'じめん',
  flying: 'ひこう',
  psychic: 'エスパー',
  bug: 'むし',
  rock: 'いわ',
  ghost: 'ゴースト',
  dragon: 'ドラゴン',
  dark: 'あく',
  steel: 'はがね',
  fairy: 'フェアリー',
};

/**
 * toggle-group 用に `[slug, label]` ペアの配列を `TYPE_SLUG_VALUES` のタプル順で返す。
 *
 * 表示順は国際標準のタイプ相性表順 (normal → fire → water → electric → grass → ...) で
 * `TYPE_SLUG_VALUES` のタプル順そのまま。
 */
export const TYPE_OPTIONS: ReadonlyArray<{ slug: TypeSlug; label: string }> = TYPE_SLUG_VALUES.map((slug) => ({
  slug,
  label: TYPE_LABEL_MAP[slug],
}));

export const typeLabel = (slug: TypeSlug): string => TYPE_LABEL_MAP[slug];
