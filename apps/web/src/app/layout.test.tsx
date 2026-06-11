import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('app/layout.tsx', () => {
  it("'use client' を持たず Server Component として実装される", async () => {
    const source = await readFile(resolve(import.meta.dirname, 'layout.tsx'), 'utf8');
    expect(source.trimStart()).not.toMatch(/^'use client'/u);
  });

  it('children を <QueryProvider><NuqsProvider> で wrap している', async () => {
    const source = await readFile(resolve(import.meta.dirname, 'layout.tsx'), 'utf8');
    expect(source).toMatch(
      /<QueryProvider>[\s\S]*<NuqsProvider>[\s\S]*\{children\}[\s\S]*<\/NuqsProvider>[\s\S]*<\/QueryProvider>/u,
    );
  });
});

describe('app/providers.tsx (集約 providers は採用しない)', () => {
  it('apps/web/src/app/providers.tsx が存在しない', () => {
    expect(existsSync(resolve(import.meta.dirname, 'providers.tsx'))).toBe(false);
  });
});
