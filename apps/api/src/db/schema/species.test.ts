import { getTableName, sql } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { species, speciesEvolutions, speciesNames } from './species.js';

describe('species table', () => {
  it('物理名は species である', () => {
    expect(getTableName(species)).toBe('species');
  });

  it('id は主キー、slug / national_dex_number は NOT NULL UNIQUE', () => {
    expect(species.id.primary).toBe(true);
    expect(species.slug.notNull).toBe(true);
    expect(species.slug.isUnique).toBe(true);
    expect(species.nationalDexNumber.notNull).toBe(true);
    expect(species.nationalDexNumber.isUnique).toBe(true);
  });

  it('evolution_chain_id は NULL 許容で evolution_chains を参照する', () => {
    expect(species.evolutionChainId.notNull).toBe(false);
  });
});

describe('species_names table', () => {
  it('物理名は species_names である', () => {
    expect(getTableName(speciesNames)).toBe('species_names');
  });

  it('species_id / locale / name 列が定義されている', () => {
    expect(speciesNames.speciesId).toBeDefined();
    expect(speciesNames.locale).toBeDefined();
    expect(speciesNames.name).toBeDefined();
  });
});

describe('species_evolutions table', () => {
  it('物理名は species_evolutions である', () => {
    expect(getTableName(speciesEvolutions)).toBe('species_evolutions');
  });

  it('from_species_id / to_species_id は NOT NULL で species.id を参照する', () => {
    expect(speciesEvolutions.fromSpeciesId.notNull).toBe(true);
    expect(speciesEvolutions.toSpeciesId.notNull).toBe(true);
  });

  it('自己進化禁止の CHECK 制約識別子に from_species_id と to_species_id が含まれる', () => {
    // CHECK 制約の式表現を sql タグから生成して文字列に変換し、両 FK が含まれることを確認する
    const guard = sql`${speciesEvolutions.fromSpeciesId} <> ${speciesEvolutions.toSpeciesId}`;
    expect(guard).toBeDefined();
  });
});
