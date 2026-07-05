'use client';

import { NuqsAdapter } from 'nuqs/adapters/next/app';
import type { ReactNode } from 'react';

/**
 * `nuqs` の `NuqsAdapter` (Next.js App Router 用) を Client 側で適用する Provider。
 *
 * `useQueryState` / `useQueryStates` を子 component から利用するために必要な adapter。
 * App Router の `useRouter` / `useSearchParams` 等を内部で参照するため `'use client'` 必須。
 */
export function NuqsProvider({ children }: { children: ReactNode }) {
  return <NuqsAdapter>{children}</NuqsAdapter>;
}
