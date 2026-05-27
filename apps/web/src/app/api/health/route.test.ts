import { describe, expect, it } from 'vitest';

import { healthErrorHandler, healthNetworkErrorHandler, healthSuccessHandler } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';

import { GET } from './route';

describe('GET /api/health', () => {
  it('upstream api に到達できたとき 200 と success envelope を返す', async () => {
    server.use(healthSuccessHandler);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true, data: { status: 'ok' } });
  });

  it('upstream api が 5xx を返したとき 503 と INTERNAL_ERROR envelope を返す', async () => {
    server.use(healthErrorHandler);

    const response = await GET();

    expect(response.status).toBe(503);
    const body = (await response.json()) as { success: false; error: { code: string; message: string } };
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INTERNAL_ERROR');
    expect(typeof body.error.message).toBe('string');
  });

  it('upstream api に到達不能 (ネットワークエラー) のとき 503 と INTERNAL_ERROR envelope を返す', async () => {
    server.use(healthNetworkErrorHandler);

    const response = await GET();

    expect(response.status).toBe(503);
    const body = (await response.json()) as { success: false; error: { code: string; message: string } };
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });

  it('Content-Type に application/json を含む', async () => {
    server.use(healthSuccessHandler);

    const response = await GET();

    expect(response.headers.get('content-type')).toContain('application/json');
  });
});
