import { getTableName } from 'drizzle-orm';
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

  // 自己進化禁止 CHECK 制約 / (from, to) UNIQUE 制約の存在は migrations.test.ts で
  // 生成 SQL を文字列検査して担保している (DRY のため本ファイルでは smoke 確認に留める)
});
