import { describe, expect, it } from 'vitest';

import { FormCategory } from './form-category.js';

describe('FormCategory', () => {
  it('8 つのカテゴリ値をすべて保持する', () => {
    // Arrange
    const expected = ['normal', 'regional', 'mega', 'mega-x', 'mega-y', 'gigantamax', 'tera', 'other'];

    // Act
    const values = Object.values(FormCategory);

    // Assert
    expect(values).toEqual(expect.arrayContaining(expected));
    expect(values).toHaveLength(8);
  });

  it('FormCategory.NORMAL はリテラル文字列 normal にマップされる', () => {
    expect(FormCategory.NORMAL).toBe('normal');
  });

  it('FormCategory.MEGA_X はハイフン入りの mega-x にマップされる', () => {
    expect(FormCategory.MEGA_X).toBe('mega-x');
  });

  it('未定義のカテゴリ文字列は FormCategory 型に代入できない', () => {
    // @ts-expect-error 未知の文字列リテラルは FormCategory 型に代入できない
    const invalid: FormCategory = 'unknown-category';
    expect(invalid).toBe('unknown-category');
  });
});
