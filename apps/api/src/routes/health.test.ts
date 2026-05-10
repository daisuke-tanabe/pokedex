import { describe, expect, it } from 'vitest';

import { healthRoute } from './health.js';

describe('GET /health', () => {
  it('200 とエンベロープボディを返す', async () => {
    const res = await healthRoute.request('/health');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ success: true, data: { status: 'ok' } });
  });

  it('Content-Type に application/json が含まれる', async () => {
    const res = await healthRoute.request('/health');
    expect(res.headers.get('Content-Type')).toContain('application/json');
  });
});
