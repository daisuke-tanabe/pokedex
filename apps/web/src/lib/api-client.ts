import type { AppType } from '@pokedex/api';
import { hc } from 'hono/client';

/**
 * Hono RPC クライアント factory。本ファイルは side-effect free で、Server / Client 双方で
 * 安全に import できる (browser bundle に含まれても module evaluation で throw しない)。
 *
 * - Server 側 (RSC / Route Handler): `import { serverApiClient } from './api-client.server'` で
 *   `process.env.API_URL` 注入済みの singleton を取得する
 * - Client 側: `createApiClient('')` を呼び、相対パス (`/api/pokemon`) で
 *   Next.js Route Handler proxy 経由 upstream へ到達する
 */
export function createApiClient(baseUrl: string) {
  return hc<AppType>(baseUrl);
}
