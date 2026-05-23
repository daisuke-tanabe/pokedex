import { describe, expect, it } from 'vitest';

import { decodeCursor, encodeCursor } from './cursor.js';

describe('encodeCursor', () => {
  it('base64url 文字集合のみで構成された文字列を返す', () => {
    // Arrange / Act
    const token = encodeCursor({ pn: 25, fid: 100 });

    // Assert
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('負の数値を弾く', () => {
    expect(() => encodeCursor({ pn: -1, fid: 1 })).toThrow();
  });

  it('小数を弾く', () => {
    expect(() => encodeCursor({ pn: 1.5, fid: 1 })).toThrow();
  });
});

describe('decodeCursor', () => {
  it('encode した token を即座に decode するとラウンドトリップが成立する', () => {
    // Arrange
    const payload = { pn: 42, fid: 17 } as const;

    // Act
    const decoded = decodeCursor(encodeCursor(payload));

    // Assert
    expect(decoded).toEqual(payload);
  });

  it('base64url 文字集合外の文字列で null を返す', () => {
    expect(decodeCursor('not base64url!')).toBeNull();
  });

  it('base64url だが JSON として不正な文字列で null を返す', () => {
    // Arrange: "abc" を base64url エンコードしたもの (JSON ではない)
    const notJson = Buffer.from('abc', 'utf8').toString('base64url');

    // Act / Assert
    expect(decodeCursor(notJson)).toBeNull();
  });

  it('必須キー fid が欠落した payload で null を返す', () => {
    // Arrange
    const payloadMissingFid = Buffer.from(JSON.stringify({ pn: 1 }), 'utf8').toString('base64url');

    // Act / Assert
    expect(decodeCursor(payloadMissingFid)).toBeNull();
  });

  it('必須キー pn が欠落した payload で null を返す', () => {
    const payloadMissingPn = Buffer.from(JSON.stringify({ fid: 1 }), 'utf8').toString('base64url');
    expect(decodeCursor(payloadMissingPn)).toBeNull();
  });
});
