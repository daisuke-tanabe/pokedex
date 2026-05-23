import type { PokemonDetail, PokemonListItem } from '@pokedex/contracts';

import type { CursorPayload } from '../lib/cursor.js';

/**
 * 検索クエリの入力値。
 *
 * `pokedexId` と `typeIds` は route 層で slug → id 解決済みの状態で渡される。
 * `typeIds` が空配列のときは「タイプ絞り込みなし」を意味する。
 */
export interface SearchInput {
  readonly pokedexId: number;
  readonly typeIds: readonly number[];
  readonly cursor: CursorPayload | null;
  readonly limit: number;
}

/**
 * 検索結果。`nextCursor` が `null` のとき次ページは存在しない。
 *
 * Repository 側で `limit + 1` 件を取得し、+1 件目の有無で次ページの有無を判定する
 * (`has_more` 計算は repository の責務、cursor encode は route の責務)。
 */
export interface SearchResult {
  readonly items: readonly PokemonListItem[];
  readonly nextCursor: CursorPayload | null;
}

/**
 * ポケモン取得のデータアクセス層。
 *
 * route 層はこの interface のみに依存し、本番では Drizzle 実装、テストでは mock を
 * 注入する (スタートポロジー)。pokedex / type slug → id 解決もここに集約することで、
 * route が DB クライアントに直接アクセスする経路を遮断する。
 */
export interface PokemonRepository {
  /** ポケモン検索一覧。安定ソートは `(pokedex_number, form_id)` 複合キー。 */
  searchByList(input: SearchInput): Promise<SearchResult>;
  /** species slug → 詳細レスポンス。未知 slug は `null`。 */
  findDetailBySlug(slug: string): Promise<PokemonDetail | null>;
  /** pokedex slug → 内部 id。未知 slug は `null`。 */
  findPokedexIdBySlug(slug: string): Promise<number | null>;
  /** type slug 配列 → 内部 id 配列。1 つでも未知 slug があれば `null`。 */
  findTypeIdsBySlugs(slugs: readonly string[]): Promise<readonly number[] | null>;
}

export type { PokemonDetail, PokemonListItem };
