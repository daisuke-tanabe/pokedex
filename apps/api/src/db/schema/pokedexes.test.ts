import { getTableName } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { pokedexNames, pokedexes } from './pokedexes.js';

describe('pokedexes table', () => {
  it('物理名は pokedexes である', () => {
    expect(getTableName(pokedexes)).toBe('pokedexes');
  });

  it('id は主キー、slug は NOT NULL UNIQUE', () => {
    expect(pokedexes.id.primary).toBe(true);
    expect(pokedexes.slug.notNull).toBe(true);
    expect(pokedexes.slug.isUnique).toBe(true);
  });

  it('region_id は NULL 許容 (national 図鑑が region を持たないため)', () => {
    expect(pokedexes.regionId.notNull).toBe(false);
  });
});

describe('pokedex_names table', () => {
  it('物理名は pokedex_names である', () => {
    expect(getTableName(pokedexNames)).toBe('pokedex_names');
  });

  it('pokedex_id / locale / name 列が定義されている', () => {
    expect(pokedexNames.pokedexId).toBeDefined();
    expect(pokedexNames.locale).toBeDefined();
    expect(pokedexNames.name).toBeDefined();
  });
});
