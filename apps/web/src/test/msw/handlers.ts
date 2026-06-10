import { http, HttpResponse } from 'msw';

import { errorEnvelope, successEnvelope } from '@/lib/envelope';

// API_URL は vitest.config.ts の test.env で必ず注入される (api-client.ts の guard と整合)。
// 未設定なら handler の URL が壊れて MSW のマッチが全失敗するため、起動時に fail-fast で気付かせる。
const apiUrl = process.env.API_URL;
if (!apiUrl) {
  throw new Error('API_URL is required for MSW handlers (typically injected via vitest.config.ts test.env)');
}

export const healthSuccessHandler = http.get(`${apiUrl}/health`, () =>
  HttpResponse.json(successEnvelope({ status: 'ok' as const }), { status: 200 }),
);

export const healthErrorHandler = http.get(`${apiUrl}/health`, () =>
  HttpResponse.json(errorEnvelope('INTERNAL_ERROR', 'upstream failure'), { status: 500 }),
);

export const healthNetworkErrorHandler = http.get(`${apiUrl}/health`, () => HttpResponse.error());

export const handlers = [healthSuccessHandler];
