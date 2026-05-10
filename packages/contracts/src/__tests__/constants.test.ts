import { describe, expect, expectTypeOf, it } from 'vitest';

import { DEFAULT_POKEDEX_SLUG, MAX_TYPES, PAGE_SIZE } from '../index.js';

describe('domain constants', () => {
  it('PAGE_SIZE は 30 で固定される', () => {
    expect(PAGE_SIZE).toBe(30);
  });

  it('MAX_TYPES は 2 で固定される', () => {
    expect(MAX_TYPES).toBe(2);
  });

  it("DEFAULT_POKEDEX_SLUG は 'national' で固定される", () => {
    expect(DEFAULT_POKEDEX_SLUG).toBe('national');
  });

  it('`as const` でリテラル型に narrowing されている', () => {
    expectTypeOf(PAGE_SIZE).toEqualTypeOf<30>();
    expectTypeOf(MAX_TYPES).toEqualTypeOf<2>();
    expectTypeOf(DEFAULT_POKEDEX_SLUG).toEqualTypeOf<'national'>();
  });
});
