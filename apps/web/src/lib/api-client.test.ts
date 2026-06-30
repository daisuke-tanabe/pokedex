import { afterEach, describe, expect, it, vi } from 'vitest';

import { createApiClient } from './api-client';

describe('api-client (factory)', () => {
  it('createApiClient が関数として named export されている', () => {
    expect(typeof createApiClient).toBe('function');
  });

  it('createApiClient(baseUrl) で hc<AppType> クライアントを生成して返す', () => {
    const client = createApiClient('http://example.test');
    expect(client).toBeDefined();
  });
});

describe('api-client.server initialization', () => {
  const originalApiUrl = process.env.API_URL;

  afterEach(() => {
    if (originalApiUrl === undefined) {
      delete process.env.API_URL;
    } else {
      process.env.API_URL = originalApiUrl;
    }
    vi.resetModules();
  });

  it('serverApiClient が named export として定義されている (API_URL 設定済み)', async () => {
    process.env.API_URL = 'http://example.test';
    vi.resetModules();
    const { serverApiClient } = await import('./api-client.server');
    expect(serverApiClient).toBeDefined();
  });

  it('API_URL 未設定でモジュール評価時に Error を throw する', async () => {
    delete process.env.API_URL;
    vi.resetModules();
    await expect(import('./api-client.server')).rejects.toThrow(/API_URL is required/);
  });
});
