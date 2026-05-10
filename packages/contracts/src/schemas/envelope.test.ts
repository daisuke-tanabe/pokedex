import * as v from 'valibot';
import { describe, expect, it } from 'vitest';

import { envelopeSchema } from '../index.js';

describe('envelopeSchema', () => {
  it('成功エンベロープを通す', () => {
    const schema = envelopeSchema(v.string());
    const result = v.parse(schema, { success: true, data: 'hello' });
    expect(result).toEqual({ success: true, data: 'hello' });
  });

  it('meta 付き成功エンベロープを通す', () => {
    const schema = envelopeSchema(v.array(v.number()));
    const result = v.parse(schema, {
      success: true,
      data: [1, 2, 3],
      meta: { total: 3, page: 1, limit: 30 },
    });
    expect(result).toEqual({
      success: true,
      data: [1, 2, 3],
      meta: { total: 3, page: 1, limit: 30 },
    });
  });

  it('失敗エンベロープを通す', () => {
    const schema = envelopeSchema(v.unknown());
    const result = v.parse(schema, {
      success: false,
      error: { code: 'INVALID_QUERY', message: 'invalid' },
    });
    expect(result).toEqual({
      success: false,
      error: { code: 'INVALID_QUERY', message: 'invalid' },
    });
  });

  it('success: true と error が両立する不正値で例外を投げる', () => {
    const schema = envelopeSchema(v.string());
    expect(() =>
      v.parse(schema, {
        success: true,
        data: 'hello',
        error: { code: 'INVALID_QUERY', message: 'should not be here' },
      }),
    ).toThrow();
  });

  it('error.code に未定義文字列が入った値で例外を投げる', () => {
    const schema = envelopeSchema(v.unknown());
    expect(() =>
      v.parse(schema, {
        success: false,
        error: { code: 'NOT_AN_ERROR_CODE', message: 'unknown' },
      }),
    ).toThrow();
  });
});
