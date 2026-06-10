import { afterEach, describe, expect, it, vi } from 'vitest';

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

describe('serverApiClient initialization', () => {
  const originalApiUrl = process.env.API_URL;

  afterEach(() => {
    if (originalApiUrl === undefined) {
      delete process.env.API_URL;
    } else {
      process.env.API_URL = originalApiUrl;
    }
    vi.resetModules();
  });

  it('API_URL 未設定でモジュール評価時に Error を throw する', async () => {
    delete process.env.API_URL;
    vi.resetModules();
    await expect(import('./api-client')).rejects.toThrow(/API_URL is required/);
  });
});
