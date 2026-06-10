import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { POKEDEX_SLUG_VALUES, TYPE_SLUG_VALUES } from '@pokedex/contracts';
import { describe, expect, it } from 'vitest';

/**
 * seed JSON と contracts の enum との slug 集合一致を検証する DB 非依存テスト。
 *
 * 同じディレクトリの `invariants.test.ts` は DB を立てた状態 (`DATABASE_URL`) でしか
 * 動かないが、本ファイルは contracts の値集合と JSON ファイルだけを参照するため、
 * `pnpm -r test` のローカル実行 (DB 無し) でも常に走る gatekeeper として機能する。
 */
const dataDir = resolve(fileURLToPath(import.meta.url), '../data');

const loadSlugs = async (filename: string): Promise<readonly string[]> => {
  const raw = await readFile(resolve(dataDir, filename), 'utf8');
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error(`[seed-data-alignment] ${filename} の root は配列でなければならない`);
  }
  return parsed.map((row, index) => {
    if (typeof row !== 'object' || row === null || !('slug' in row) || typeof row.slug !== 'string') {
      throw new Error(`[seed-data-alignment] ${filename}[${index}] に文字列 slug が無い`);
    }
    return row.slug;
  });
};

const toSortedSet = (values: readonly string[]): readonly string[] => [...new Set(values)].toSorted();

describe('seed data ↔ contracts enum alignment', () => {
  it('pokedexes.json の slug 集合は POKEDEX_SLUG_VALUES と一致する', async () => {
    // Arrange
    const seedSlugs = await loadSlugs('pokedexes.json');

    // Act
    const seedSorted = toSortedSet(seedSlugs);
    const enumSorted = toSortedSet(POKEDEX_SLUG_VALUES);

    // Assert
    expect(seedSorted).toEqual(enumSorted);
  });

  it('types.json の slug 集合は TYPE_SLUG_VALUES と一致する', async () => {
    // Arrange
    const seedSlugs = await loadSlugs('types.json');

    // Act
    const seedSorted = toSortedSet(seedSlugs);
    const enumSorted = toSortedSet(TYPE_SLUG_VALUES);

    // Assert
    expect(seedSorted).toEqual(enumSorted);
  });
});
