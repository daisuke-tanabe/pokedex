import { describe, expect, it } from 'vitest';

import { evolutionChainsRelations } from './evolution-chains.js';
import { formsRelations } from './forms.js';
import { speciesEvolutionsRelations, speciesRelations } from './species.js';

/**
 * relations() の戻り値は drizzle の内部表現で、`config()` の呼び出しには
 * 専用のテーブルヘルパーが必要なため、ここでは「relations が型エラーなく
 * 定義されている」ことを smoke で確認する。`db.query.<table>.findMany({ with: ... })`
 * での実利用検証は後続 change の API 実装時に integration テストで行う。
 */
describe('relations smoke', () => {
  it('speciesRelations が定義されている', () => {
    expect(speciesRelations).toBeDefined();
  });

  it('speciesEvolutionsRelations が定義されている', () => {
    expect(speciesEvolutionsRelations).toBeDefined();
  });

  it('formsRelations が定義されている', () => {
    expect(formsRelations).toBeDefined();
  });

  it('evolutionChainsRelations が定義されている', () => {
    expect(evolutionChainsRelations).toBeDefined();
  });
});
