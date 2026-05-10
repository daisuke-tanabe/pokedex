import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const ORIGINAL_DATABASE_URL = process.env.DATABASE_URL;

describe('db client', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    if (ORIGINAL_DATABASE_URL === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = ORIGINAL_DATABASE_URL;
    }
  });

  it('DATABASE_URL 未設定時に "DATABASE_URL is required" で例外を投げる', async () => {
    delete process.env.DATABASE_URL;
    await expect(import('./client.js')).rejects.toThrow('DATABASE_URL is required');
  });

  it('DATABASE_URL 設定時に db シンボルが取得できる', async () => {
    // postgres-js は lazy connection なので、import の時点では実 DB に
    // 接続を確立しない (最初のクエリ実行時に接続する)。よって CI 環境で
    // Supabase が起動していなくてもこのテストは通る。
    process.env.DATABASE_URL = 'postgres://postgres:postgres@127.0.0.1:54322/postgres';
    const { db } = await import('./client.js');
    expect(db).toBeDefined();
  });

  it('同一プロセス内で 2 回 import した結果の db が === で等価', async () => {
    // ESM のモジュールキャッシュにより、同じパスの import は同一インスタンスを返す。
    // singleton 性を担保していることの確認。
    process.env.DATABASE_URL = 'postgres://postgres:postgres@127.0.0.1:54322/postgres';
    const first = await import('./client.js');
    const second = await import('./client.js');
    expect(first.db).toBe(second.db);
  });
});
