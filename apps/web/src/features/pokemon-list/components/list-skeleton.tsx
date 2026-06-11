import { Skeleton } from '@/components/ui/skeleton';

const SKELETON_PLACEHOLDERS = Array.from({ length: 10 }, (_, i) => i);

/**
 * 初回 fetch 中の grid placeholder。`<PokemonGrid>` と同じ breakpoint 列構成 (1 / 2 / 3 / 4 / 5)
 * を持ち、xl の最大列数に合わせて 10 件分の Skeleton カードを並べる (2 行分)。
 *
 * `initialPage` が undefined で Client 側 `useInfiniteQuery` の初回 fetch が pending の間に
 * `<PokemonGrid>` (items 0 件で null 返却) と `<EmptyState>` (isSuccess かつ 0 件) の
 * どちらも描画されず空白が出る経路を埋めるために使う。
 */
export function ListSkeleton() {
  return (
    <div
      aria-busy
      aria-live="polite"
      aria-label="ポケモン一覧を読み込み中"
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
    >
      {SKELETON_PLACEHOLDERS.map((i) => (
        <Skeleton key={i} className="h-48 w-full rounded-xl" />
      ))}
    </div>
  );
}
