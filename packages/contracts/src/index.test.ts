import { describe, expect, expectTypeOf, it } from 'vitest';

import {
  DEFAULT_POKEDEX_SLUG,
  ErrorCode,
  FormCategory,
  Locale,
  MAX_TYPES,
  PAGE_SIZE,
  SpriteGender,
  SpriteKind,
  envelopeSchema,
} from './index.js';

describe('@pokedex/contracts entry point', () => {
  it('全ての公開シンボルがインポート解決できる (smoke)', () => {
    expect(PAGE_SIZE).toBe(30);
    expect(MAX_TYPES).toBe(2);
    expect(DEFAULT_POKEDEX_SLUG).toBe('national');
    expect(ErrorCode.POKEDEX_NOT_FOUND).toBe('POKEDEX_NOT_FOUND');
    expect(typeof envelopeSchema).toBe('function');
  });

  it('ドメイン分類値 enum がすべて単一エントリポイントから取得できる', () => {
    expect(FormCategory.NORMAL).toBe('normal');
    expect(Locale.JA).toBe('ja');
    expect(SpriteGender.MALE).toBe('male');
    expect(SpriteKind.DEFAULT).toBe('default');
  });

  it('public API の型を保つ', () => {
    expectTypeOf(envelopeSchema).toBeFunction();
    expectTypeOf(PAGE_SIZE).toEqualTypeOf<30>();
  });
});
