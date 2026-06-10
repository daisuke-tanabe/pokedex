import * as v from 'valibot';
import { describe, expect, it } from 'vitest';

import { DEFAULT_POKEDEX_SLUG, MAX_TYPES, PAGE_SIZE } from '../constants.js';
import { pokemonListQuerySchema } from './pokemon-query.js';

describe('pokemonListQuerySchema', () => {
  it('空のクエリは既定値で解決される', () => {
    // Arrange / Act
    const result = v.parse(pokemonListQuerySchema, {});

    // Assert
    expect(result).toEqual({
      pokedex: DEFAULT_POKEDEX_SLUG,
      types: [],
      cursor: undefined,
      limit: PAGE_SIZE,
    });
  });

  it('types はカンマ区切りで配列にパースされる', () => {
    // Arrange / Act
    const result = v.parse(pokemonListQuerySchema, { types: 'fire,flying' });

    // Assert
    expect(result.types).toEqual(['fire', 'flying']);
  });

  it('types が MAX_TYPES を超えると例外を投げる', () => {
    // Arrange
    const overflow = Array.from({ length: MAX_TYPES + 1 }, (_, index) => `t${index}`).join(',');

    // Act / Assert
    expect(() => v.parse(pokemonListQuerySchema, { types: overflow })).toThrow();
  });

  it('limit が下限未満で例外を投げる', () => {
    expect(() => v.parse(pokemonListQuerySchema, { limit: '0' })).toThrow();
  });

  it('limit が上限超過で例外を投げる', () => {
    expect(() => v.parse(pokemonListQuerySchema, { limit: '101' })).toThrow();
  });

  it('limit に整数文字列を渡すと number に変換される', () => {
    // Arrange / Act
    const result = v.parse(pokemonListQuerySchema, { limit: '5' });

    // Assert
    expect(result.limit).toBe(5);
  });

  it('cursor が base64url 文字集合外だと例外を投げる', () => {
    expect(() => v.parse(pokemonListQuerySchema, { cursor: 'not base64url!' })).toThrow();
  });

  it('pokedex slug を上書きできる', () => {
    // Arrange / Act
    const result = v.parse(pokemonListQuerySchema, { pokedex: 'paldea' });

    // Assert
    expect(result.pokedex).toBe('paldea');
  });

  it('未定義の pokedex slug は parse に失敗する', () => {
    expect(() => v.parse(pokemonListQuerySchema, { pokedex: 'kalos' })).toThrow();
  });

  it('未定義の type slug は parse に失敗する', () => {
    expect(() => v.parse(pokemonListQuerySchema, { types: 'fire,cosmic' })).toThrow();
  });
});
