import * as v from 'valibot';
import { describe, expect, it } from 'vitest';

import { pokemonListItemSchema, pokemonListMetaSchema } from './pokemon-list.js';

describe('pokemonListItemSchema', () => {
  it('必須フィールドを揃えた item を通す', () => {
    // Arrange
    const item = {
      speciesSlug: 'pikachu',
      formSlug: 'pikachu',
      pokedexNumber: 25,
      nameJa: 'ピカチュウ',
      types: ['electric'],
      defaultSpriteUrl: 'sprites/pikachu/default.png',
    };

    // Act
    const result = v.parse(pokemonListItemSchema, item);

    // Assert
    expect(result).toEqual(item);
  });

  it('必須フィールド欠落で例外を投げる', () => {
    expect(() =>
      v.parse(pokemonListItemSchema, {
        speciesSlug: 'pikachu',
        formSlug: 'pikachu',
        pokedexNumber: 25,
        // nameJa 欠落
        types: ['electric'],
        defaultSpriteUrl: 'sprites/pikachu/default.png',
      }),
    ).toThrow();
  });
});

describe('pokemonListMetaSchema', () => {
  it('nextCursor に null を許容する', () => {
    // Arrange / Act
    const result = v.parse(pokemonListMetaSchema, { nextCursor: null });

    // Assert
    expect(result).toEqual({ nextCursor: null });
  });

  it('nextCursor に文字列を許容する', () => {
    // Arrange / Act
    const result = v.parse(pokemonListMetaSchema, { nextCursor: 'abc' });

    // Assert
    expect(result).toEqual({ nextCursor: 'abc' });
  });

  it('nextCursor 欠落で例外を投げる', () => {
    expect(() => v.parse(pokemonListMetaSchema, {})).toThrow();
  });
});
