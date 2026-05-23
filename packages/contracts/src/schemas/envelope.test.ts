import * as v from 'valibot';
import { describe, expect, it } from 'vitest';

import { envelopeSchema } from '../index.js';

describe('envelopeSchema', () => {
  it('成功エンベロープを通す', () => {
    // Arrange
    const schema = envelopeSchema(v.string());

    // Act
    const result = v.parse(schema, { success: true, data: 'hello' });

    // Assert
    expect(result).toEqual({ success: true, data: 'hello' });
  });

  it('meta 付き成功エンベロープを通す (meta スキーマ省略時は任意の構造を許容)', () => {
    // Arrange
    const schema = envelopeSchema(v.array(v.number()));

    // Act
    const result = v.parse(schema, {
      success: true,
      data: [1, 2, 3],
      meta: { total: 3, page: 1, limit: 30 },
    });

    // Assert
    expect(result).toEqual({
      success: true,
      data: [1, 2, 3],
      meta: { total: 3, page: 1, limit: 30 },
    });
  });

  it('cursor 形式の meta スキーマを渡すと該当形式を通す', () => {
    // Arrange
    const schema = envelopeSchema(v.array(v.string()), v.object({ nextCursor: v.nullable(v.string()) }));

    // Act
    const result = v.parse(schema, {
      success: true,
      data: ['a'],
      meta: { nextCursor: 'opaque-token' },
    });

    // Assert
    expect(result).toEqual({ success: true, data: ['a'], meta: { nextCursor: 'opaque-token' } });
  });

  it('meta スキーマを渡したとき、スキーマに合わない meta は例外を投げる', () => {
    // Arrange
    const schema = envelopeSchema(v.array(v.string()), v.object({ nextCursor: v.nullable(v.string()) }));

    // Act / Assert
    expect(() =>
      v.parse(schema, {
        success: true,
        data: ['a'],
        meta: { totally: 'wrong' },
      }),
    ).toThrow();
  });

  it('失敗エンベロープを通す', () => {
    // Arrange
    const schema = envelopeSchema(v.unknown());

    // Act
    const result = v.parse(schema, {
      success: false,
      error: { code: 'INVALID_QUERY', message: 'invalid' },
    });

    // Assert
    expect(result).toEqual({
      success: false,
      error: { code: 'INVALID_QUERY', message: 'invalid' },
    });
  });

  it('success: true と error が両立する不正値で例外を投げる', () => {
    // Arrange
    const schema = envelopeSchema(v.string());

    // Act / Assert
    expect(() =>
      v.parse(schema, {
        success: true,
        data: 'hello',
        error: { code: 'INVALID_QUERY', message: 'should not be here' },
      }),
    ).toThrow();
  });

  it('error.code に未定義文字列が入った値で例外を投げる', () => {
    // Arrange
    const schema = envelopeSchema(v.unknown());

    // Act / Assert
    expect(() =>
      v.parse(schema, {
        success: false,
        error: { code: 'NOT_AN_ERROR_CODE', message: 'unknown' },
      }),
    ).toThrow();
  });
});
