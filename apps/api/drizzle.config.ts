import { defineConfig } from 'drizzle-kit';

/**
 * Drizzle Kit 設定。
 *
 * `DATABASE_URL` 未設定時は src/db/client.ts と同じく fail-fast で例外を
 * 投げる (drizzle-kit の cryptic なエラーで debug する手間を回避)。
 */
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: '../../supabase/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
});
