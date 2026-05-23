import { beforeAll, describe, expect, it } from 'vitest';

import type { PokemonRepository } from './pokemon.js';

const SHOULD_SKIP = process.env.DATABASE_URL === undefined;

/**
 * Drizzle 実装の統合テスト。
 *
 * `DATABASE_URL` が設定された環境 (= ローカル supabase が稼働しているか CI で
 * Postgres コンテナが立っている) でのみ実行する。`db` (postgres-js client) を
 * 動的 import することで `DATABASE_URL` 未設定時のモジュール読み込みエラーを回避し、
 * `describe.skipIf` で実テストをスキップする。
 *
 * 検証対象データは `apps/api/src/db/seed/data/*.json` で投入されたものを使う。
 */
describe.skipIf(SHOULD_SKIP)('createRealPokemonRepository (integration)', () => {
  let repo: PokemonRepository;
  let nationalPokedexId: number;
  let paldeaPokedexId: number;
  let fireTypeId: number;
  let flyingTypeId: number;

  beforeAll(async () => {
    const { db } = await import('../db/client.js');
    const { createRealPokemonRepository } = await import('./pokemon.real.js');
    repo = createRealPokemonRepository(db);
    nationalPokedexId = (await repo.findPokedexIdBySlug('national')) ?? -1;
    paldeaPokedexId = (await repo.findPokedexIdBySlug('paldea')) ?? -1;
    const fireIds = (await repo.findTypeIdsBySlugs(['fire'])) ?? [];
    const flyingIds = (await repo.findTypeIdsBySlugs(['flying'])) ?? [];
    fireTypeId = fireIds[0] ?? -1;
    flyingTypeId = flyingIds[0] ?? -1;
  });

  describe('searchByList', () => {
    it('national 図鑑を pokedexNumber 昇順で返す', async () => {
      const { items, nextCursor } = await repo.searchByList({
        pokedexId: nationalPokedexId,
        typeIds: [],
        cursor: null,
        limit: 100,
      });

      const numbers = items.map((i) => i.pokedexNumber);
      expect(numbers).toEqual([...numbers].toSorted((a, b) => a - b));
      expect(nextCursor).toBeNull();
    });

    it('paldea 図鑑では Paldea 専属の entries のみ返す', async () => {
      const { items } = await repo.searchByList({
        pokedexId: paldeaPokedexId,
        typeIds: [],
        cursor: null,
        limit: 100,
      });

      expect(items.length).toBeGreaterThan(0);
      expect(items.map((i) => i.speciesSlug)).toContain('ogerpon');
    });

    it('typeIds で単一タイプ絞り込みができる', async () => {
      const { items } = await repo.searchByList({
        pokedexId: nationalPokedexId,
        typeIds: [fireTypeId],
        cursor: null,
        limit: 100,
      });

      expect(items.length).toBeGreaterThan(0);
      for (const item of items) {
        expect(item.types).toContain('fire');
      }
    });

    it('typeIds で AND 検索できる (fire + flying)', async () => {
      const { items } = await repo.searchByList({
        pokedexId: nationalPokedexId,
        typeIds: [fireTypeId, flyingTypeId],
        cursor: null,
        limit: 100,
      });

      for (const item of items) {
        expect(item.types).toContain('fire');
        expect(item.types).toContain('flying');
      }
    });

    it('cursor を渡すと続きから返す', async () => {
      const firstPage = await repo.searchByList({
        pokedexId: nationalPokedexId,
        typeIds: [],
        cursor: null,
        limit: 3,
      });
      expect(firstPage.nextCursor).not.toBeNull();

      const secondPage = await repo.searchByList({
        pokedexId: nationalPokedexId,
        typeIds: [],
        cursor: firstPage.nextCursor,
        limit: 3,
      });

      const firstSlugs = new Set(firstPage.items.map((i) => i.speciesSlug));
      for (const item of secondPage.items) {
        expect(firstSlugs.has(item.speciesSlug)).toBe(false);
      }
    });

    it('該当 0 件のとき空配列と null cursor を返す', async () => {
      const { items, nextCursor } = await repo.searchByList({
        pokedexId: -9999,
        typeIds: [],
        cursor: null,
        limit: 10,
      });

      expect(items).toEqual([]);
      expect(nextCursor).toBeNull();
    });

    it('limit 境界: 1 件取得時に hasMore があれば nextCursor が返る', async () => {
      const { items, nextCursor } = await repo.searchByList({
        pokedexId: nationalPokedexId,
        typeIds: [],
        cursor: null,
        limit: 1,
      });

      expect(items).toHaveLength(1);
      expect(nextCursor).not.toBeNull();
    });
  });

  describe('findDetailBySlug', () => {
    it('既存スラッグで詳細を返す', async () => {
      const detail = await repo.findDetailBySlug('pikachu');

      expect(detail).not.toBeNull();
      expect(detail?.species.slug).toBe('pikachu');
    });

    it('未知スラッグで null を返す', async () => {
      const detail = await repo.findDetailBySlug('non-existent-species-slug');

      expect(detail).toBeNull();
    });

    it('返す form は is_default = true である', async () => {
      const detail = await repo.findDetailBySlug('pikachu');

      expect(detail?.form.isDefault).toBe(true);
    });

    it('進化チェーンを持つ species は evolutions に同じチェーンの species が並ぶ', async () => {
      const detail = await repo.findDetailBySlug('charmander');

      expect(detail?.evolutions.map((e) => e.slug)).toEqual(
        expect.arrayContaining(['charmander', 'charmeleon', 'charizard']),
      );
    });

    it('多言語 names が ja / en の双方含まれる', async () => {
      const detail = await repo.findDetailBySlug('pikachu');

      const locales = detail?.names.map((n) => n.locale) ?? [];
      expect(locales).toEqual(expect.arrayContaining(['ja', 'en']));
    });
  });
});
