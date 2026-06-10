import { describe, expect, it } from 'vitest';

import { POKEDEX_SLUG_VALUES, PokedexSlug } from './pokedex.js';

describe('PokedexSlug', () => {
  it('national と paldea の 2 値を保持する', () => {
    // Arrange / Act
    const values = Object.values(PokedexSlug);

    // Assert
    expect(values).toEqual(expect.arrayContaining(['national', 'paldea']));
    expect(values).toHaveLength(2);
  });

  it('PokedexSlug.NATIONAL は文字列 national にマップされる', () => {
    expect(PokedexSlug.NATIONAL).toBe('national');
  });

  it('PokedexSlug.PALDEA は文字列 paldea にマップされる', () => {
    expect(PokedexSlug.PALDEA).toBe('paldea');
  });

  it('未定義の pokedex スラッグは PokedexSlug 型に代入できない', () => {
    // @ts-expect-error 未知の文字列リテラルは PokedexSlug 型に代入できない
    const invalid: PokedexSlug = 'unknown-dex';
    expect(invalid).toBe('unknown-dex');
  });

  it('POKEDEX_SLUG_VALUES と PokedexSlug は同じ値集合を持つ', () => {
    expect([...POKEDEX_SLUG_VALUES].toSorted()).toEqual(Object.values(PokedexSlug).toSorted());
  });
});
