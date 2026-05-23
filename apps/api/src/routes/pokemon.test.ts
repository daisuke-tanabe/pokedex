import type { Envelope, PokemonDetail, PokemonListItem, PokemonListMeta } from '@pokedex/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { encodeCursor } from '../lib/cursor.js';
import type { PokemonRepository } from '../repositories/pokemon.js';
import { type MockPokemonData, createMockPokemonRepository } from '../repositories/pokemon.mock.js';
import { createPokemonRoutes } from './pokemon.js';

const buildItem = (overrides: Partial<PokemonListItem> = {}): PokemonListItem => ({
  speciesSlug: 'pikachu',
  formSlug: 'pikachu',
  pokedexNumber: 25,
  nameJa: 'ピカチュウ',
  types: ['electric'],
  defaultSpriteUrl: 'sprites/pikachu/default.png',
  ...overrides,
});

const buildDetail = (slug: string): PokemonDetail => ({
  species: {
    slug,
    nationalDexNumber: 25,
    names: [
      { locale: 'ja', name: 'ピカチュウ' },
      { locale: 'en', name: 'Pikachu' },
    ],
  },
  form: { slug, category: 'normal', isDefault: true },
  names: [
    { locale: 'ja', name: 'ピカチュウ' },
    { locale: 'en', name: 'Pikachu' },
  ],
  sprites: [{ gender: 'unknown', kind: 'default', url: 'sprites/pikachu/default.png' }],
  types: ['electric'],
  evolutions: [],
});

const buildMockData = (): MockPokemonData => ({
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
      listItem: buildItem({ speciesSlug: 'bulbasaur', pokedexNumber: 1 }),
    },
    {
      pokedexId: 1,
      pokedexNumber: 2,
      formId: 101,
      typeIds: [10, 11],
      listItem: buildItem({ speciesSlug: 'charizard', pokedexNumber: 2, types: ['fire', 'flying'] }),
    },
    {
      pokedexId: 1,
      pokedexNumber: 3,
      formId: 102,
      typeIds: [10],
      listItem: buildItem({ speciesSlug: 'charmander', pokedexNumber: 3, types: ['fire'] }),
    },
    {
      pokedexId: 2,
      pokedexNumber: 1,
      formId: 200,
      typeIds: [10],
      listItem: buildItem({ speciesSlug: 'sprigatito', pokedexNumber: 1, types: ['fire'] }),
    },
  ],
  details: new Map([['pikachu', buildDetail('pikachu')]]),
});

type ListEnvelope = Envelope<PokemonListItem[], PokemonListMeta>;
type DetailEnvelope = Envelope<PokemonDetail>;

describe('GET /pokemon (一覧)', () => {
  let app: ReturnType<typeof createPokemonRoutes>;

  beforeEach(() => {
    app = createPokemonRoutes(createMockPokemonRepository(buildMockData()));
  });

  it('既定パラメータで national 図鑑の昇順 1 ページを返す', async () => {
    // Act
    const res = await app.request('/pokemon');

    // Assert
    expect(res.status).toBe(200);
    const body = (await res.json()) as ListEnvelope;
    expect(body.success).toBe(true);
    if (!body.success) return;
    expect(body.data.map((i) => i.speciesSlug)).toEqual(['bulbasaur', 'charizard', 'charmander']);
    expect(body.meta?.nextCursor).toBeNull();
  });

  it('pokedex クエリで図鑑を切り替えられる', async () => {
    const res = await app.request('/pokemon?pokedex=paldea');
    expect(res.status).toBe(200);
    const body = (await res.json()) as ListEnvelope;
    if (!body.success) throw new Error('expected success');
    expect(body.data.map((i) => i.speciesSlug)).toEqual(['sprigatito']);
  });

  it('types で単一タイプを検索する', async () => {
    const res = await app.request('/pokemon?types=fire');
    expect(res.status).toBe(200);
    const body = (await res.json()) as ListEnvelope;
    if (!body.success) throw new Error('expected success');
    expect(body.data.map((i) => i.speciesSlug)).toEqual(['charizard', 'charmander']);
  });

  it('types で AND 検索する (fire,flying)', async () => {
    const res = await app.request('/pokemon?types=fire,flying');
    expect(res.status).toBe(200);
    const body = (await res.json()) as ListEnvelope;
    if (!body.success) throw new Error('expected success');
    expect(body.data.map((i) => i.speciesSlug)).toEqual(['charizard']);
  });

  it('cursor を渡すと続きから返す', async () => {
    const cursor = encodeCursor({ pn: 1, fid: 100 });
    const res = await app.request(`/pokemon?cursor=${cursor}`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as ListEnvelope;
    if (!body.success) throw new Error('expected success');
    expect(body.data.map((i) => i.speciesSlug)).toEqual(['charizard', 'charmander']);
  });

  it('検索結果 0 件で空配列 + meta.nextCursor=null を返す', async () => {
    const res = await app.request('/pokemon?types=fire,electric');
    expect(res.status).toBe(200);
    const body = (await res.json()) as ListEnvelope;
    if (!body.success) throw new Error('expected success');
    expect(body.data).toEqual([]);
    expect(body.meta?.nextCursor).toBeNull();
  });

  it('limit を指定すると件数を制限し nextCursor を返す', async () => {
    const res = await app.request('/pokemon?limit=2');
    expect(res.status).toBe(200);
    const body = (await res.json()) as ListEnvelope;
    if (!body.success) throw new Error('expected success');
    expect(body.data).toHaveLength(2);
    expect(typeof body.meta?.nextCursor).toBe('string');
  });

  it('末尾ページでは nextCursor = null', async () => {
    // Arrange: 全 3 件を limit=10 で取得
    const res = await app.request('/pokemon?limit=10');

    const body = (await res.json()) as ListEnvelope;
    if (!body.success) throw new Error('expected success');
    expect(body.meta?.nextCursor).toBeNull();
  });

  it('不正な cursor で 400 + INVALID_QUERY を返す', async () => {
    // base64url としては valid だが decode 後の JSON 構造が不正なケース
    const malformed = Buffer.from('not-json', 'utf8').toString('base64url');
    const res = await app.request(`/pokemon?cursor=${malformed}`);
    expect(res.status).toBe(400);
    const body = (await res.json()) as Envelope<unknown>;
    if (body.success) throw new Error('expected failure');
    expect(body.error.code).toBe('INVALID_QUERY');
  });

  it('未知の pokedex slug で 400 + INVALID_QUERY を返す', async () => {
    const res = await app.request('/pokemon?pokedex=non-existent');
    expect(res.status).toBe(400);
    const body = (await res.json()) as Envelope<unknown>;
    if (body.success) throw new Error('expected failure');
    expect(body.error.code).toBe('INVALID_QUERY');
  });

  it('未知の type slug で 400 + INVALID_QUERY を返す', async () => {
    const res = await app.request('/pokemon?types=fire,nonexistent');
    expect(res.status).toBe(400);
    const body = (await res.json()) as Envelope<unknown>;
    if (body.success) throw new Error('expected failure');
    expect(body.error.code).toBe('INVALID_QUERY');
  });

  it('types が MAX_TYPES を超えると 400 を返す', async () => {
    const res = await app.request('/pokemon?types=fire,flying,electric');
    expect(res.status).toBe(400);
    const body = (await res.json()) as Envelope<unknown>;
    if (body.success) throw new Error('expected failure');
    expect(body.error.code).toBe('INVALID_QUERY');
  });
});

describe('GET /pokemon/:slug (詳細)', () => {
  let app: ReturnType<typeof createPokemonRoutes>;

  beforeEach(() => {
    app = createPokemonRoutes(createMockPokemonRepository(buildMockData()));
  });

  it('既存スラッグで 200 + 詳細を返す', async () => {
    const res = await app.request('/pokemon/pikachu');
    expect(res.status).toBe(200);
    const body = (await res.json()) as DetailEnvelope;
    if (!body.success) throw new Error('expected success');
    expect(body.data.species.slug).toBe('pikachu');
    expect(body.data.form.isDefault).toBe(true);
  });

  it('多言語名が含まれる', async () => {
    const res = await app.request('/pokemon/pikachu');
    const body = (await res.json()) as DetailEnvelope;
    if (!body.success) throw new Error('expected success');
    expect(body.data.names.map((n) => n.locale)).toEqual(expect.arrayContaining(['ja', 'en']));
  });

  it('未知スラッグで 404 + POKEMON_NOT_FOUND を返す', async () => {
    const res = await app.request('/pokemon/non-existent');
    expect(res.status).toBe(404);
    const body = (await res.json()) as Envelope<unknown>;
    if (body.success) throw new Error('expected failure');
    expect(body.error.code).toBe('POKEMON_NOT_FOUND');
  });
});

describe('想定外例外のハンドリング', () => {
  it('repository が例外を投げると 500 + INTERNAL_ERROR を返す', async () => {
    // Arrange: 例外を投げる repository を直接組む
    const erroringRepo: PokemonRepository = {
      findPokedexIdBySlug: vi.fn().mockResolvedValue(1),
      findTypeIdsBySlugs: vi.fn().mockResolvedValue([]),
      searchByList: vi.fn().mockRejectedValue(new Error('boom')),
      findDetailBySlug: vi.fn().mockResolvedValue(null),
    };
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const app = createPokemonRoutes(erroringRepo);

    // Act
    const res = await app.request('/pokemon');

    // Assert
    expect(res.status).toBe(500);
    const body = (await res.json()) as Envelope<unknown>;
    if (body.success) throw new Error('expected failure');
    expect(body.error.code).toBe('INTERNAL_ERROR');
    consoleSpy.mockRestore();
  });
});
