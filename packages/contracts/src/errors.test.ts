import { describe, expect, it } from 'vitest';

import { ErrorCode } from './index.js';

describe('ErrorCode', () => {
  it('POKEDEX_NOT_FOUND は同名文字列にマップされる', () => {
    expect(ErrorCode.POKEDEX_NOT_FOUND).toBe('POKEDEX_NOT_FOUND');
  });

  it('INVALID_QUERY は同名文字列にマップされる', () => {
    expect(ErrorCode.INVALID_QUERY).toBe('INVALID_QUERY');
  });

  it('Object.values は最低 2 個のエラーコードを返す', () => {
    expect(Object.values(ErrorCode).length).toBeGreaterThanOrEqual(2);
  });

  it('未定義のエラーコード文字列は型エラーになる', () => {
    // @ts-expect-error 未知の文字列リテラルは ErrorCode 型に代入できない
    const invalid: ErrorCode = 'NOT_AN_ERROR_CODE';
    expect(invalid).toBe('NOT_AN_ERROR_CODE');
  });
});
