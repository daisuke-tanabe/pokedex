/**
 * `PokemonCard` の実描画高に合わせた skeleton 用クラス。
 *
 * `ListSkeleton` (初回ロード) と `LoadMore` (追加取得中) の両方から参照し、
 * 実カード・各 skeleton 間で高さがばらつくことによるレイアウトシフトを防ぐ
 * (一箇所で管理する)。`h-52` (≈208px) は現行カード (sprite + 番号 + 名前 + タイプ badge
 * の縦構成) の実高に概ね一致する。
 */
export const POKEMON_CARD_SKELETON_CLASS = 'h-52 w-full rounded-xl';
