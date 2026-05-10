import { Hono } from 'hono';

import { healthRoute } from './routes/health.js';

/**
 * Hono アプリケーション本体。
 *
 * ルート定義は別モジュール (`./routes/*`) に分割し、本ファイルでは合成のみを行う
 * (コンポジションルート)。サーバ起動 (`serve`) は `./server.ts` 側で扱う。
 */
export const app = new Hono().route('/', healthRoute);

/**
 * Hono RPC クライアント (`hc<AppType>`) で型推論を効かせるための型 export。
 */
export type AppType = typeof app;
