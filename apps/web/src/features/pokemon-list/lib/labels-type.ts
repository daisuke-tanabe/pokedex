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

/**
 * `type` slug → badge 背景色の Tailwind className マップ。
 *
 * 値は `globals.css` の `--color-type-<slug>` トークンを arbitrary value で参照する
 * (`@theme inline` に map せず utility 化しない / Decision 2)。`Record<TypeSlug, string>` で
 * 18 タイプの網羅性を型強制する。badge 側で `text-foreground` を併用し light/dark とも
 * 文字とのコントラスト 4.5:1 を確保する (Decision 3)。
 */
const TYPE_COLOR_CLASS: Record<TypeSlug, string> = {
  normal: 'bg-[var(--color-type-normal)]',
  fire: 'bg-[var(--color-type-fire)]',
  water: 'bg-[var(--color-type-water)]',
  electric: 'bg-[var(--color-type-electric)]',
  grass: 'bg-[var(--color-type-grass)]',
  ice: 'bg-[var(--color-type-ice)]',
  fighting: 'bg-[var(--color-type-fighting)]',
  poison: 'bg-[var(--color-type-poison)]',
  ground: 'bg-[var(--color-type-ground)]',
  flying: 'bg-[var(--color-type-flying)]',
  psychic: 'bg-[var(--color-type-psychic)]',
  bug: 'bg-[var(--color-type-bug)]',
  rock: 'bg-[var(--color-type-rock)]',
  ghost: 'bg-[var(--color-type-ghost)]',
  dragon: 'bg-[var(--color-type-dragon)]',
  dark: 'bg-[var(--color-type-dark)]',
  steel: 'bg-[var(--color-type-steel)]',
  fairy: 'bg-[var(--color-type-fairy)]',
};

/**
 * 既知の `TypeSlug` の badge 背景色 className を返す。
 *
 * 呼び出し側は raw `string` を `TypeSlug` に絞り込んだうえで呼ぶこと。未知 slug は
 * このマップを経由せず、neutral な badge フォールバックに倒す (Decision 4)。
 */
export const typeColorClass = (slug: TypeSlug): string => TYPE_COLOR_CLASS[slug];
