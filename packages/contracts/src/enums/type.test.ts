import { describe, expect, it } from 'vitest';

import { TYPE_SLUG_VALUES, TypeSlug } from './type.js';

describe('TypeSlug', () => {
  it('標準 18 タイプの slug をすべて保持する', () => {
    // Arrange
    const expected = [
      'normal',
      'fire',
      'water',
      'electric',
      'grass',
      'ice',
      'fighting',
      'poison',
      'ground',
      'flying',
      'psychic',
      'bug',
      'rock',
      'ghost',
      'dragon',
      'dark',
      'steel',
      'fairy',
    ];

    // Act
    const values = Object.values(TypeSlug);

    // Assert
    expect(values).toEqual(expect.arrayContaining(expected));
    expect(values).toHaveLength(18);
  });

  it('TypeSlug.FIRE は文字列 fire にマップされる', () => {
    expect(TypeSlug.FIRE).toBe('fire');
  });

  it('TypeSlug.FAIRY は文字列 fairy にマップされる', () => {
    expect(TypeSlug.FAIRY).toBe('fairy');
  });

  it('未定義の type スラッグは TypeSlug 型に代入できない', () => {
    // @ts-expect-error 未知の文字列リテラルは TypeSlug 型に代入できない
    const invalid: TypeSlug = 'cosmic';
    expect(invalid).toBe('cosmic');
  });

  it('TYPE_SLUG_VALUES と TypeSlug は同じ値集合を持つ', () => {
    expect([...TYPE_SLUG_VALUES].toSorted()).toEqual(Object.values(TypeSlug).toSorted());
  });
});
