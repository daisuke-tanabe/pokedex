import * as v from 'valibot';
import { describe, expect, it } from 'vitest';

import { pokemonDetailParamSchema, pokemonDetailSchema } from './pokemon-detail.js';

const validDetail = {
  species: {
    slug: 'pikachu',
    nationalDexNumber: 25,
    names: [
      { locale: 'ja', name: 'ピカチュウ' },
      { locale: 'en', name: 'Pikachu' },
    ],
  },
  form: {
    slug: 'pikachu',
    category: 'normal',
    isDefault: true,
  },
  names: [
    { locale: 'ja', name: 'ピカチュウ' },
    { locale: 'en', name: 'Pikachu' },
  ],
  sprites: [{ gender: 'unknown', kind: 'default', url: 'sprites/pikachu/default.png' }],
  types: ['electric'],
  evolutions: [
    {
      slug: 'pichu',
      nationalDexNumber: 172,
      names: [
        { locale: 'ja', name: 'ピチュー' },
        { locale: 'en', name: 'Pichu' },
      ],
    },
  ],
} as const;

describe('pokemonDetailSchema', () => {
  it('species + form + names + sprites + types + evolutions を含む値を通す', () => {
    // Arrange / Act
    const result = v.parse(pokemonDetailSchema, validDetail);

    // Assert
    expect(result.species.slug).toBe('pikachu');
    expect(result.form.isDefault).toBe(true);
    expect(result.names).toHaveLength(2);
    expect(result.sprites[0]?.kind).toBe('default');
    expect(result.types).toEqual(['electric']);
    expect(result.evolutions).toHaveLength(1);
  });

  it('未知の form category を弾く', () => {
    expect(() =>
      v.parse(pokemonDetailSchema, {
        ...validDetail,
        form: { ...validDetail.form, category: 'invalid-category' },
      }),
    ).toThrow();
  });

  it('未知の locale を弾く', () => {
    expect(() =>
      v.parse(pokemonDetailSchema, {
        ...validDetail,
        names: [{ locale: 'fr', name: 'Pikachu' }],
      }),
    ).toThrow();
  });
});

describe('pokemonDetailParamSchema', () => {
  it('1 文字以上 64 文字以下の slug を通す', () => {
    // Arrange / Act
    const result = v.parse(pokemonDetailParamSchema, { slug: 'pikachu' });

    // Assert
    expect(result.slug).toBe('pikachu');
  });

  it('境界値: 64 文字を通す', () => {
    const at64 = 'a'.repeat(64);
    expect(v.parse(pokemonDetailParamSchema, { slug: at64 })).toEqual({ slug: at64 });
  });

  it('空文字列を弾く', () => {
    expect(() => v.parse(pokemonDetailParamSchema, { slug: '' })).toThrow();
  });

  it('65 文字以上を弾く', () => {
    expect(() => v.parse(pokemonDetailParamSchema, { slug: 'a'.repeat(65) })).toThrow();
  });
});
