import { getTableName } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { typeNames, types } from './types.js';

describe('types table', () => {
  it('物理名は types である', () => {
    expect(getTableName(types)).toBe('types');
  });

  it('id は主キーである', () => {
    expect(types.id.primary).toBe(true);
  });

  it('slug は NOT NULL かつ UNIQUE である', () => {
    expect(types.slug.notNull).toBe(true);
    expect(types.slug.isUnique).toBe(true);
  });
});

describe('type_names table', () => {
  it('物理名は type_names である', () => {
    expect(getTableName(typeNames)).toBe('type_names');
  });

  it('type_id / locale / name 列が定義されている', () => {
    expect(typeNames.typeId).toBeDefined();
    expect(typeNames.locale).toBeDefined();
    expect(typeNames.name).toBeDefined();
  });

  it('locale は NOT NULL で locales.code を参照する', () => {
    expect(typeNames.locale.notNull).toBe(true);
  });
});
