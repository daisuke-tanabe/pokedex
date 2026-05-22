import { FormCategory, SpriteGender, SpriteKind } from '@pokedex/contracts';
import { describe, expect, it } from 'vitest';

import { formCategoryEnum, spriteGenderEnum, spriteKindEnum } from './enums.js';

describe('formCategoryEnum', () => {
  it('物理名は form_category である', () => {
    expect(formCategoryEnum.enumName).toBe('form_category');
  });

  it('値配列が contracts の FormCategory と一致する', () => {
    // Arrange
    const expected = Object.values(FormCategory);

    // Act
    const actual = formCategoryEnum.enumValues;

    // Assert
    expect([...actual].toSorted()).toEqual([...expected].toSorted());
  });
});

describe('spriteGenderEnum', () => {
  it('物理名は sprite_gender である', () => {
    expect(spriteGenderEnum.enumName).toBe('sprite_gender');
  });

  it('値配列が contracts の SpriteGender と一致する', () => {
    const expected = Object.values(SpriteGender);
    expect([...spriteGenderEnum.enumValues].toSorted()).toEqual([...expected].toSorted());
  });
});

describe('spriteKindEnum', () => {
  it('物理名は sprite_kind である', () => {
    expect(spriteKindEnum.enumName).toBe('sprite_kind');
  });

  it('値配列が contracts の SpriteKind と一致する', () => {
    const expected = Object.values(SpriteKind);
    expect([...spriteKindEnum.enumValues].toSorted()).toEqual([...expected].toSorted());
  });
});
