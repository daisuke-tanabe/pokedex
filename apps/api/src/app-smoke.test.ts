import { beforeAll, describe, expect, it } from 'vitest';

import type { AppType } from './index.js';

const SHOULD_SKIP = process.env.DATABASE_URL === undefined;

/**
 * composed app の起動経路 smoke。
 *
 * `apps/api/src/index.ts` は `db/client.ts` を経由するため DATABASE_URL を要求する。
 * 未設定環境ではモジュールロードに失敗するので `describe.skipIf` でスキップする
 * (real repository 統合テストと同じパターン)。
 *
 * `AppType` は型のみの import なのでモジュール実行を起こさず安全 (type-only import は
 * tsc / 実行時ともに値を読まない)。`app` 本体は `beforeAll` 内で動的 import する。
 */
describe.skipIf(SHOULD_SKIP)('composed app smoke', () => {
  let app: AppType;

  beforeAll(async () => {
    const mod = await import('./index.js');
    app = mod.app;
  });

  it('合成後の app から /health が 200 を返す', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean };
    expect(body.success).toBe(true);
  });

  it('/api/pokemon プレフィックスがマウントされている (404 ではなく 200/400 系を返す)', async () => {
    const res = await app.request('/api/pokemon?limit=1');
    expect(res.status).not.toBe(404);
  });
});
