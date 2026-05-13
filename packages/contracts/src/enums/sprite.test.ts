import { describe, expect, it } from 'vitest';

import { SpriteGender, SpriteKind } from './sprite.js';

describe('SpriteGender', () => {
  it('male / female / unknown の 3 値を保持する', () => {
    // Arrange / Act
    const values = Object.values(SpriteGender);

    // Assert
    expect(values).toEqual(expect.arrayContaining(['male', 'female', 'unknown']));
    expect(values).toHaveLength(3);
  });

  it('SpriteGender.MALE は male にマップされる', () => {
    expect(SpriteGender.MALE).toBe('male');
  });

  it('未定義の性別値は SpriteGender 型に代入できない', () => {
    // @ts-expect-error 未知の文字列は SpriteGender 型に代入できない
    const invalid: SpriteGender = 'other';
    expect(invalid).toBe('other');
  });
});

describe('SpriteKind', () => {
  it('default / shiny / back / back_shiny の 4 値を保持する', () => {
    // Arrange / Act
    const values = Object.values(SpriteKind);

    // Assert
    expect(values).toEqual(expect.arrayContaining(['default', 'shiny', 'back', 'back_shiny']));
    expect(values).toHaveLength(4);
  });

  it('SpriteKind.DEFAULT は default にマップされる', () => {
    expect(SpriteKind.DEFAULT).toBe('default');
  });

  it('SpriteKind.BACK_SHINY は back_shiny にマップされる', () => {
    expect(SpriteKind.BACK_SHINY).toBe('back_shiny');
  });

  it('未定義の種別値は SpriteKind 型に代入できない', () => {
    // @ts-expect-error 未知の文字列は SpriteKind 型に代入できない
    const invalid: SpriteKind = 'thumbnail';
    expect(invalid).toBe('thumbnail');
  });
});
