import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { useQueryClient } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { QueryProvider } from './query-provider';

function QueryClientConsumer() {
  const client = useQueryClient();
  return <span data-testid="client-detected">{client === undefined ? 'no' : 'yes'}</span>;
}

describe('<QueryProvider>', () => {
  it("'use client' ディレクティブで始まり QueryClientProvider を内部で使う", async () => {
    const source = await readFile(resolve(import.meta.dirname, 'query-provider.tsx'), 'utf8');
    expect(source.trimStart()).toMatch(/^'use client'/u);
    expect(source).toMatch(/QueryClientProvider/u);
  });

  it('children が QueryClient を consume できる', () => {
    render(
      <QueryProvider>
        <QueryClientConsumer />
      </QueryProvider>,
    );
    expect(screen.getByTestId('client-detected')).toHaveTextContent('yes');
  });
});
