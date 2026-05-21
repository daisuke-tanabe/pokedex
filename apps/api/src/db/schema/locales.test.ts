import { getTableName } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { locales } from './locales.js';

describe('locales table', () => {
  it('物理名は locales である', () => {
    expect(getTableName(locales)).toBe('locales');
  });

  it('code / name の 2 列が定義されている', () => {
    expect(locales.code).toBeDefined();
    expect(locales.name).toBeDefined();
  });

  it('code 列が主キーとして宣言されている', () => {
    expect(locales.code.primary).toBe(true);
  });

  it('name 列は NULL 許容として宣言されている', () => {
    expect(locales.name.notNull).toBe(false);
  });
});
