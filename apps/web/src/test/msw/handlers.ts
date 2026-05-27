import { http, HttpResponse } from 'msw';

const apiUrl = process.env.API_URL ?? 'http://localhost:3000';

export const healthSuccessHandler = http.get(`${apiUrl}/health`, () =>
  HttpResponse.json({ success: true, data: { status: 'ok' } }, { status: 200 }),
);

export const healthErrorHandler = http.get(`${apiUrl}/health`, () =>
  HttpResponse.json(
    { success: false, error: { code: 'INTERNAL_ERROR', message: 'upstream failure' } },
    { status: 500 },
  ),
);

export const healthNetworkErrorHandler = http.get(`${apiUrl}/health`, () => HttpResponse.error());

export const handlers = [healthSuccessHandler];
