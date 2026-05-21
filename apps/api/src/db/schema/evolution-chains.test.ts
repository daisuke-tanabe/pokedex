import { getTableColumns, getTableName } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { evolutionChains } from './evolution-chains.js';

describe('evolution_chains table', () => {
  it('物理名は evolution_chains である', () => {
    expect(getTableName(evolutionChains)).toBe('evolution_chains');
  });

  it('id は主キーである', () => {
    expect(evolutionChains.id.primary).toBe(true);
  });

  it('属性カラムを持たない (id のみ)', () => {
    expect(Object.keys(getTableColumns(evolutionChains))).toEqual(['id']);
  });
});
