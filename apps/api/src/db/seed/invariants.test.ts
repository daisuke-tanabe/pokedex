import { beforeAll, describe, expect, it } from 'vitest';

import type { collectInvariantViolations as CollectInvariantViolations } from './invariants.js';

const SHOULD_SKIP = process.env.DATABASE_URL === undefined;

/**
 * シード適用後の DB に対して不変条件を検証する。
 *
 * `apps/api/src/db/seed/invariants.ts` は `apps/api/src/db/client.ts` 経由で
 * `DATABASE_URL` を要求する (api-foundation spec で MUST 規定の fail-fast)。
 * 静的 import すると `DATABASE_URL` 未設定環境でモジュールロード時に throw され、
 * `describe.skipIf` の評価より先にテストファイルが落ちる。
 *
 * これを避けるため `pokemon.real.test.ts` / `app-smoke.test.ts` と同じ
 * **「dynamic import + `beforeAll`」テンプレート**で guard する:
 *
 * - `describe.skipIf(SHOULD_SKIP)`: `DATABASE_URL` 未設定なら describe ごと skip
 * - `beforeAll` で `await import('./invariants.js')`: 値ロードは skip 時に走らない
 * - 型は `import type { ... }` で型空間だけに取り込む。`verbatimModuleSyntax` 下では
 *   コンパイル時に完全に消えるため実行時のロードを発生させない (型注釈のみで使う)。
 */
describe.skipIf(SHOULD_SKIP)('domain invariants (seed 適用後)', () => {
  let collectInvariantViolations: typeof CollectInvariantViolations;

  beforeAll(async () => {
    ({ collectInvariantViolations } = await import('./invariants.js'));
  });

  it('全ての不変条件をパスする (national_dex 整合 / forms 必須子要素 / evolutions チェーン一致 / pokedex_entries.form 整合 / default form 1 件 exactly)', async () => {
    const violations = await collectInvariantViolations();
    expect(violations).toEqual([]);
  });
});
