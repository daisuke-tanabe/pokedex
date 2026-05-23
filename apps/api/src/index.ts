import { Hono } from 'hono';

import { db } from './db/client.js';
import { createRealPokemonRepository } from './repositories/pokemon.real.js';
import { healthRoute } from './routes/health.js';
import { createPokemonRoutes } from './routes/pokemon.js';

/**
 * Hono アプリケーション本体。
 *
 * ルート定義は別モジュール (`./routes/*`) に分割し、本ファイルでは合成のみを行う
 * (コンポジションルート)。real repository はここで組み立てて route に注入する
 * (スタートポロジー)。サーバ起動 (`serve`) は `./server.ts` 側で扱う。
 */
const pokemonRepository = createRealPokemonRepository(db);

export const app = new Hono().route('/', healthRoute).route('/api', createPokemonRoutes(pokemonRepository));

/**
 * Hono RPC クライアント (`hc<AppType>`) で型推論を効かせるための型 export。
 */
export type AppType = typeof app;
