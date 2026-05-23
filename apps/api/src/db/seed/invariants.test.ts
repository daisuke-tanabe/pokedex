import { describe, expect, it } from 'vitest';

import { collectInvariantViolations } from './invariants.js';

const SHOULD_SKIP = process.env.DATABASE_URL === undefined;

/**
 * シード適用後の DB に対して不変条件を検証する。
 *
 * DATABASE_URL が未設定の環境では skipIf でスキップする (CI で Supabase が
 * 起動していない場合のフォールバック)。ローカルでは `pnpm seed` を直接呼ぶか、
 * `pnpm db:reset` 後にこのテストを実行する。
 */
describe.skipIf(SHOULD_SKIP)('domain invariants (seed 適用後)', () => {
  it('全ての不変条件をパスする (national_dex 整合 / forms 必須子要素 / evolutions チェーン一致 / pokedex_entries.form 整合 / default form 1 件 exactly)', async () => {
    const violations = await collectInvariantViolations();
    expect(violations).toEqual([]);
  });
});
