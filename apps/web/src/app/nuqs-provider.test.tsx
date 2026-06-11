import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { render, screen } from '@testing-library/react';
import { useQueryState } from 'nuqs';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { describe, expect, it } from 'vitest';

import { NuqsProvider } from './nuqs-provider';

function QueryStateConsumer() {
  const [value] = useQueryState('q');
  return <span data-testid="q-value">{value ?? 'null'}</span>;
}

describe('<NuqsProvider>', () => {
  it("'use client' ディレクティブで始まり NuqsAdapter を内部で使う", async () => {
    const source = await readFile(resolve(import.meta.dirname, 'nuqs-provider.tsx'), 'utf8');
    expect(source.trimStart()).toMatch(/^'use client'/u);
    expect(source).toMatch(/NuqsAdapter/u);
  });

  it('children が render される (smoke test)', () => {
    render(
      <NuqsProvider>
        <span data-testid="child">child</span>
      </NuqsProvider>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('NuqsTestingAdapter 配下で useQueryState が URL を読み取れる (nuqs 統合)', () => {
    render(
      <NuqsTestingAdapter searchParams="?q=hello">
        <QueryStateConsumer />
      </NuqsTestingAdapter>,
    );
    expect(screen.getByTestId('q-value')).toHaveTextContent('hello');
  });
});
