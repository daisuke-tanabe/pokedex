import { getTableName } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { regionNames, regions } from './regions.js';

describe('regions table', () => {
  it('物理名は regions である', () => {
    expect(getTableName(regions)).toBe('regions');
  });

  it('id は主キー、slug は NOT NULL UNIQUE', () => {
    expect(regions.id.primary).toBe(true);
    expect(regions.slug.notNull).toBe(true);
    expect(regions.slug.isUnique).toBe(true);
  });
});

describe('region_names table', () => {
  it('物理名は region_names である', () => {
    expect(getTableName(regionNames)).toBe('region_names');
  });

  it('region_id / locale / name 列が定義されている', () => {
    expect(regionNames.regionId).toBeDefined();
    expect(regionNames.locale).toBeDefined();
    expect(regionNames.name).toBeDefined();
  });
});
