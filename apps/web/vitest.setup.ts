import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';

import { server } from './src/test/msw/server';

// api-client.ts のモジュール評価ガード (API_URL 必須) をテスト時に通過させる
// 既存値があれば上書きしない (CI で別 URL を渡す余地を残す)
process.env.API_URL ??= 'http://localhost:3000';

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
