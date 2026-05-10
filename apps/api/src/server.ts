import { serve } from '@hono/node-server';

import { app } from './index.js';

/**
 * `PORT` 環境変数のパース。非数値文字列が入った場合は `serve(NaN)` の
 * サイレント障害を避けるため明示的に例外を投げる (fail-fast)。
 */
const rawPort = process.env.PORT;
const port = rawPort === undefined ? 3000 : Number.parseInt(rawPort, 10);
if (Number.isNaN(port)) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

serve({ fetch: app.fetch, port });

console.log(`API listening on http://localhost:${port}`);
