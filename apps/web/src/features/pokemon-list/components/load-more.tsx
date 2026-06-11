'use client';

import { useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

type LoadMoreProps = {
  onLoadMore: () => void;
  isLoading: boolean;
};

const ROOT_MARGIN = '200px';

/**
 * 一覧末端の sentinel + 「もっと見る」ボタン。
 *
 * 1 つの `<Button>` を sentinel 兼ボタンとして配置。IntersectionObserver で
 * viewport に入ったら `onLoadMore` を自動発火 (UX 主流体験) しつつ、キーボード /
 * クリックでも `onLoadMore` を呼べるように Button としても残す (a11y フォールバック、
 * Decision 5)。取得中は disabled + 直下に skeleton を 1 行表示。
 *
 * 末尾ページ (nextCursor=null) では本 component は親で描画されない (Requirement に従い親が制御)。
 */
export function LoadMore({ onLoadMore, isLoading }: LoadMoreProps) {
  const sentinelRef = useRef<HTMLButtonElement>(null);
  // 親から渡される `onLoadMore` / `isLoading` は毎レンダで identity が変わりうるが、
  // IntersectionObserver は mount 時 1 度だけ生成し、unmount で disconnect すれば十分。
  // ref 経由で最新値を読むことで `useEffect` 依存配列を空に保ち、毎レンダの
  // disconnect/observe 再初期化を避ける (closure では古い値を掴むので ref が必要)。
  const onLoadMoreRef = useRef(onLoadMore);
  const isLoadingRef = useRef(isLoading);
  onLoadMoreRef.current = onLoadMore;
  isLoadingRef.current = isLoading;

  useEffect((): (() => void) | undefined => {
    const target = sentinelRef.current;
    if (target === null) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !isLoadingRef.current) {
          onLoadMoreRef.current();
        }
      },
      { rootMargin: ROOT_MARGIN },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex flex-col items-center gap-3 py-6">
      <Button ref={sentinelRef} onClick={onLoadMore} disabled={isLoading} variant="outline">
        もっと見る
      </Button>
      {isLoading ? (
        <div
          aria-hidden
          className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
        >
          {/* xl breakpoint の最大列数 (5) に合わせ skeleton も 5 件並べる */}
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : null}
    </div>
  );
}
