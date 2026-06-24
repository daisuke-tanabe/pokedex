import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { NuqsProvider } from './nuqs-provider';
import { QueryProvider } from './query-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'pokedex',
  description: 'Pokemon catalog and search interface.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      {/*
        Grammarly / 翻訳系のブラウザ拡張が <body> に属性 (data-new-gr-c-s-check-loaded 等) を
        注入し SSR / CSR markup が乖離して hydration warning が出るのを抑止する (PR #128)。
        抑止は <body> 直下 1 階層のみで、{children} 配下の mismatch は引き続き検出される。
      */}
      <body suppressHydrationWarning>
        <QueryProvider>
          <NuqsProvider>{children}</NuqsProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
