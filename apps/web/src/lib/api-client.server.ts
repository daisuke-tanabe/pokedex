// `server-only` は副作用 import で、Client Component から間接的に import されたら build 時 error にする
// Next.js convention のフラグ。binding は不要なので no-unassigned-import を localize disable する。
// oxlint-disable-next-line import/no-unassigned-import
import 'server-only';
import { createApiClient } from './api-client';

/**
 * Server-only Hono RPC クライアント singleton。
 *
 * `process.env.API_URL` を起動時に解決し、Server Components / Route Handler から再利用する。
 * `'server-only'` 宣言により、誤って Client Components へ import すると build 時にエラーになる
 * (api-client.ts の module-level guard が browser bundle に紛れ込むのを根本から防ぐ)。
 */
const apiUrl = process.env.API_URL;
if (apiUrl === undefined) {
  throw new Error('[api-client.server] API_URL is required');
}

export const serverApiClient = createApiClient(apiUrl);
