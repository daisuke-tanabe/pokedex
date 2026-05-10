import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

const client = postgres(connectionString);

/**
 * Drizzle DB クライアント (プロセス内 singleton)。
 *
 * ESM のモジュールキャッシュにより `import('./client')` のたびに同一インスタンスが
 * 返る。テストで再評価したい場合は `vi.resetModules()` を呼ぶこと。
 */
export const db = drizzle(client);

/**
 * `db` の型エイリアス。テスト・他モジュールから型としてのみ参照できる。
 */
export type DB = typeof db;
