import { http, HttpResponse } from 'msw';

import { errorEnvelope, successEnvelope } from '@/lib/envelope';

const apiUrl = process.env.API_URL ?? 'http://localhost:3000';

export const healthSuccessHandler = http.get(`${apiUrl}/health`, () =>
  HttpResponse.json(successEnvelope({ status: 'ok' as const }), { status: 200 }),
);

export const healthErrorHandler = http.get(`${apiUrl}/health`, () =>
  HttpResponse.json(errorEnvelope('INTERNAL_ERROR', 'upstream failure'), { status: 500 }),
);

export const healthNetworkErrorHandler = http.get(`${apiUrl}/health`, () => HttpResponse.error());

export const handlers = [healthSuccessHandler];
