import { Hono } from 'hono';

import { successEnvelope } from '../lib/envelope.js';

/**
 * ヘルスチェックルート。
 *
 * `GET /health` に対して `{ success: true, data: { status: 'ok' } }` を返す。
 * 200 OK + `application/json` を保証する。
 */
export const healthRoute = new Hono().get('/health', (c) => c.json(successEnvelope({ status: 'ok' as const })));
