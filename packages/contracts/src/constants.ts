/**
 * 一覧 API の 1 ページあたりの件数。
 */
export const PAGE_SIZE = 30 as const;

/**
 * ポケモンが同時に持てるタイプの最大数 (例: ほのお / ひこう)。
 */
export const MAX_TYPES = 2 as const;

/**
 * 既定の図鑑 slug (全国図鑑)。
 */
export const DEFAULT_POKEDEX_SLUG = 'national' as const;
