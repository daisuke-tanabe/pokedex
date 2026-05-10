import { defineConfig } from 'drizzle-kit';

/**
 * Drizzle Kit 設定。
 *
 * 実際のテーブル定義 (`src/db/schema.ts`) と SQL マイグレーション生成は
 * 後続 change `add-domain-schema` で行う。本 change ではファイル雛形のみ。
 *
 * `DATABASE_URL` 未設定時は src/db/client.ts と同じく fail-fast で例外を
 * 投げる (drizzle-kit の cryptic なエラーで debug する手間を回避)。
 */
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: '../../supabase/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
});
