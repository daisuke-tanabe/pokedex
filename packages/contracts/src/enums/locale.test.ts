import { describe, expect, it } from 'vitest';

import { LOCALE_VALUES, Locale } from './locale.js';

describe('Locale', () => {
  it('ja と en の 2 値を最低限保持する', () => {
    // Arrange / Act
    const values = Object.values(Locale);

    // Assert
    expect(values).toEqual(expect.arrayContaining(['ja', 'en']));
  });

  it('Locale.JA は文字列 ja にマップされる', () => {
    expect(Locale.JA).toBe('ja');
  });

  it('Locale.EN は文字列 en にマップされる', () => {
    expect(Locale.EN).toBe('en');
  });

  it('未定義の言語コードは Locale 型に代入できない', () => {
    // @ts-expect-error 未知の言語コードは Locale 型に代入できない
    const invalid: Locale = 'xx';
    expect(invalid).toBe('xx');
  });

  it('LOCALE_VALUES と Locale は同じ値集合を持つ', () => {
    expect([...LOCALE_VALUES].toSorted()).toEqual(Object.values(Locale).toSorted());
  });
});
