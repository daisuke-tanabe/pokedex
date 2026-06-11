'use client';

import { useEffect } from 'react';

import { Button } from '@/components/ui/button';

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/**
 * Next.js App Router の error boundary。
 *
 * RSC fetch 失敗 / Client fetch 失敗いずれの場合もここに飛び、ユーザに状態と
 * 「再試行」ボタン (`reset`) を提示する。`error.digest` は Next.js 側で集約される
 * 識別子で、サーバログとの照合に使う。
 */
export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // 内部 IP / SQL 等が message に含まれる可能性があるため、画面には出さずに console.error のみ
    console.error('[error-boundary]', error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-xl font-semibold">エラーが発生しました</h1>
      <p className="text-sm text-muted-foreground">
        ポケモン一覧の取得に失敗しました。時間をおいて再試行してください。
      </p>
      <Button onClick={reset} variant="default">
        再試行
      </Button>
    </main>
  );
}
