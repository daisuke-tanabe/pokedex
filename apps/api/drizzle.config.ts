import { defineConfig } from 'drizzle-kit';

/**
 * Drizzle Kit 設定。
 *
 * 実際のテーブル定義 (`src/db/schema.ts`) と SQL マイグレーション生成は
 * 後続 change `add-domain-schema` で行う。本 change ではファイル雛形のみ。
 */
export default defineConfig({
  schema: './src/db/schema.ts',
  out: '../../supabase/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
});
