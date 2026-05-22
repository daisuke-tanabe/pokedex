import { getTableName } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { pokedexEntries } from './pokedex-entries.js';

describe('pokedex_entries table', () => {
  it('物理名は pokedex_entries である', () => {
    expect(getTableName(pokedexEntries)).toBe('pokedex_entries');
  });

  it('pokedex_id / species_id / pokedex_number は NOT NULL', () => {
    expect(pokedexEntries.pokedexId.notNull).toBe(true);
    expect(pokedexEntries.speciesId.notNull).toBe(true);
    expect(pokedexEntries.pokedexNumber.notNull).toBe(true);
  });

  it('form_id は NULL 許容 (デフォルトフォームを UI で選ぶフォールバック前提)', () => {
    expect(pokedexEntries.formId.notNull).toBe(false);
  });
});
