'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

/**
 * TanStack Query の `QueryClient` を Client 側で提供する Provider。
 *
 * `useState` の lazy initializer で `QueryClient` を生成することで、
 * モジュールスコープの singleton 共有を避け、SSR のリクエスト間で
 * state が漏れない構成にする (TanStack Query 公式の Next.js App Router 推奨パターン)。
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
