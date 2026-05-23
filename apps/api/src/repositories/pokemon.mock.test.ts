import type { PokemonDetail, PokemonListItem } from '@pokedex/contracts';
import { describe, expect, it } from 'vitest';

import { type MockPokemonData, createMockPokemonRepository } from './pokemon.mock.js';

const buildListItem = (overrides: Partial<PokemonListItem> = {}): PokemonListItem => ({
  speciesSlug: 'pikachu',
  formSlug: 'pikachu',
  pokedexNumber: 25,
  nameJa: 'ピカチュウ',
  types: ['electric'],
  defaultSpriteUrl: 'sprites/pikachu/default.png',
  ...overrides,
});

const buildDetail = (slug: string): PokemonDetail => ({
  species: { slug, nationalDexNumber: 1, names: [] },
  form: { slug, category: 'normal', isDefault: true },
  names: [],
  sprites: [],
  types: [],
  evolutions: [],
});

const buildData = (): MockPokemonData => ({
  pokedexes: [
    { id: 1, slug: 'national' },
    { id: 2, slug: 'paldea' },
  ],
  types: [
    { id: 10, slug: 'fire' },
    { id: 11, slug: 'flying' },
    { id: 12, slug: 'electric' },
  ],
  entries: [
    {
      pokedexId: 1,
      pokedexNumber: 1,
      formId: 100,
      typeIds: [12],
      listItem: buildListItem({ speciesSlug: 'bulbasaur', pokedexNumber: 1 }),
    },
    {
      pokedexId: 1,
      pokedexNumber: 2,
      formId: 101,
      typeIds: [10, 11],
      listItem: buildListItem({ speciesSlug: 'charizard', pokedexNumber: 2 }),
    },
    {
      pokedexId: 1,
      pokedexNumber: 3,
      formId: 102,
      typeIds: [10],
      listItem: buildListItem({ speciesSlug: 'charmander', pokedexNumber: 3 }),
    },
    {
      pokedexId: 2,
      pokedexNumber: 1,
      formId: 200,
      typeIds: [10],
      listItem: buildListItem({ speciesSlug: 'sprigatito', pokedexNumber: 1 }),
    },
  ],
  details: new Map([
    ['pikachu', buildDetail('pikachu')],
    ['bulbasaur', buildDetail('bulbasaur')],
  ]),
});

describe('createMockPokemonRepository.findPokedexIdBySlug', () => {
  it('既知の slug で id を返す', async () => {
    const repo = createMockPokemonRepository(buildData());
    expect(await repo.findPokedexIdBySlug('paldea')).toBe(2);
  });

  it('未知の slug で null を返す', async () => {
    const repo = createMockPokemonRepository(buildData());
    expect(await repo.findPokedexIdBySlug('unknown')).toBeNull();
  });
});

describe('createMockPokemonRepository.findTypeIdsBySlugs', () => {
  it('全て既知の slug なら id 配列を入力順で返す', async () => {
    const repo = createMockPokemonRepository(buildData());
    expect(await repo.findTypeIdsBySlugs(['fire', 'flying'])).toEqual([10, 11]);
  });

  it('1 つでも未知の slug があれば null を返す', async () => {
    const repo = createMockPokemonRepository(buildData());
    expect(await repo.findTypeIdsBySlugs(['fire', 'unknown'])).toBeNull();
  });

  it('空配列なら空配列を返す', async () => {
    const repo = createMockPokemonRepository(buildData());
    expect(await repo.findTypeIdsBySlugs([])).toEqual([]);
  });
});

describe('createMockPokemonRepository.searchByList', () => {
  it('pokedexId で絞り込み、(pokedexNumber, formId) 昇順で返す', async () => {
    const repo = createMockPokemonRepository(buildData());
    const result = await repo.searchByList({ pokedexId: 1, typeIds: [], cursor: null, limit: 10 });
    expect(result.items.map((i) => i.speciesSlug)).toEqual(['bulbasaur', 'charizard', 'charmander']);
    expect(result.nextCursor).toBeNull();
  });

  it('typeIds の AND 検索を行う', async () => {
    const repo = createMockPokemonRepository(buildData());
    const result = await repo.searchByList({ pokedexId: 1, typeIds: [10, 11], cursor: null, limit: 10 });
    expect(result.items.map((i) => i.speciesSlug)).toEqual(['charizard']);
  });

  it('cursor を渡すと続きから返す', async () => {
    const repo = createMockPokemonRepository(buildData());
    const result = await repo.searchByList({ pokedexId: 1, typeIds: [], cursor: { pn: 1, fid: 100 }, limit: 10 });
    expect(result.items.map((i) => i.speciesSlug)).toEqual(['charizard', 'charmander']);
  });

  it('limit で件数を制限し、有 nextCursor のときは続きの cursor を返す', async () => {
    const repo = createMockPokemonRepository(buildData());
    const result = await repo.searchByList({ pokedexId: 1, typeIds: [], cursor: null, limit: 2 });
    expect(result.items).toHaveLength(2);
    expect(result.nextCursor).toEqual({ pn: 2, fid: 101 });
  });

  it('該当 0 件で空配列と null cursor を返す', async () => {
    const repo = createMockPokemonRepository(buildData());
    const result = await repo.searchByList({ pokedexId: 1, typeIds: [10, 12], cursor: null, limit: 10 });
    expect(result.items).toEqual([]);
    expect(result.nextCursor).toBeNull();
  });
});

describe('createMockPokemonRepository.findDetailBySlug', () => {
  it('既知の slug で詳細を返す', async () => {
    const repo = createMockPokemonRepository(buildData());
    expect(await repo.findDetailBySlug('pikachu')).toEqual(buildDetail('pikachu'));
  });

  it('未知の slug で null を返す', async () => {
    const repo = createMockPokemonRepository(buildData());
    expect(await repo.findDetailBySlug('missing')).toBeNull();
  });
});
