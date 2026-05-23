import type { PokemonDetail, PokemonListItem, PokemonRepository, SearchInput, SearchResult } from './pokemon.js';

/**
 * mock repository に投入する固定データ。
 *
 * `entries` は (pokedexId, pokedexNumber, formId) の組で 1 行を表現し、route 層が
 * 期待する `PokemonListItem` を直接保持する。検索の絞り込み・ソート・ページネーション
 * は mock 側でも本実装と同じセマンティクスで再現する。
 */
export interface MockPokemonData {
  readonly pokedexes: ReadonlyArray<{ id: number; slug: string }>;
  readonly types: ReadonlyArray<{ id: number; slug: string }>;
  readonly entries: ReadonlyArray<{
    pokedexId: number;
    pokedexNumber: number;
    formId: number;
    typeIds: readonly number[];
    listItem: PokemonListItem;
  }>;
  readonly details: ReadonlyMap<string, PokemonDetail>;
}

const resolveTypeIds = (slugs: readonly string[], catalog: MockPokemonData['types']): readonly number[] | null => {
  const resolved: number[] = [];
  for (const slug of slugs) {
    const type = catalog.find((t) => t.slug === slug);
    if (type === undefined) {
      return null;
    }
    resolved.push(type.id);
  }
  return resolved;
};

const computeSearchResult = (data: MockPokemonData, input: SearchInput): SearchResult => {
  const { pokedexId, typeIds, cursor, limit } = input;
  const filtered = data.entries
    .filter((e) => e.pokedexId === pokedexId)
    // `Array#every` は空配列で `true` を返すため、typeIds 空のときは自動でパスする。
    .filter((e) => typeIds.every((tid) => e.typeIds.includes(tid)))
    .toSorted((a, b) =>
      a.pokedexNumber === b.pokedexNumber ? a.formId - b.formId : a.pokedexNumber - b.pokedexNumber,
    );

  const afterCursor = cursor
    ? filtered.filter((e) => e.pokedexNumber > cursor.pn || (e.pokedexNumber === cursor.pn && e.formId > cursor.fid))
    : filtered;

  const slice = afterCursor.slice(0, limit + 1);
  const hasMore = slice.length > limit;
  const returned = slice.slice(0, limit);
  const last = returned.at(-1);
  const nextCursor = hasMore && last !== undefined ? { pn: last.pokedexNumber, fid: last.formId } : null;

  return {
    items: returned.map((e) => e.listItem),
    nextCursor,
  };
};

/**
 * mock 実装を生成する。テストでは fixture data を渡してから `route.request(...)` する。
 */
export const createMockPokemonRepository = (data: MockPokemonData): PokemonRepository => ({
  findPokedexIdBySlug: (slug) => Promise.resolve(data.pokedexes.find((p) => p.slug === slug)?.id ?? null),

  findTypeIdsBySlugs: (slugs) => Promise.resolve(resolveTypeIds(slugs, data.types)),

  searchByList: (input) => Promise.resolve(computeSearchResult(data, input)),

  findDetailBySlug: (slug) => Promise.resolve(data.details.get(slug) ?? null),
});
