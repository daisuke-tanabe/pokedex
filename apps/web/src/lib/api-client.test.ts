import { describe, expect, it } from 'vitest';

import { createApiClient, serverApiClient } from './api-client';

describe('api-client', () => {
  it('createApiClient が関数として named export されている', () => {
    expect(typeof createApiClient).toBe('function');
  });

  it('serverApiClient が named export として定義されている', () => {
    expect(serverApiClient).toBeDefined();
  });

  it('createApiClient(baseUrl) で hc<AppType> クライアントを生成して返す', () => {
    const client = createApiClient('http://example.test');
    expect(client).toBeDefined();
  });
});
