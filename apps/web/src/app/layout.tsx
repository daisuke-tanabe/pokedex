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
      <body suppressHydrationWarning>
        <QueryProvider>
          <NuqsProvider>{children}</NuqsProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
