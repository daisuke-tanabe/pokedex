import { envelopeSchema } from '@pokedex/contracts';
import * as v from 'valibot';
import { describe, expect, it } from 'vitest';

import { errorEnvelope, successEnvelope } from '../envelope.js';

describe('successEnvelope', () => {
  it('data のみのエンベロープを返す', () => {
    expect(successEnvelope({ status: 'ok' })).toEqual({
      success: true,
      data: { status: 'ok' },
    });
  });

  it('meta 付きのエンベロープを返す', () => {
    expect(successEnvelope([1, 2, 3], { total: 3, page: 1, limit: 30 })).toEqual({
      success: true,
      data: [1, 2, 3],
      meta: { total: 3, page: 1, limit: 30 },
    });
  });
});

describe('errorEnvelope', () => {
  it('code と message を持つエンベロープを返す', () => {
    expect(errorEnvelope('POKEDEX_NOT_FOUND', 'pokedex not found')).toEqual({
      success: false,
      error: { code: 'POKEDEX_NOT_FOUND', message: 'pokedex not found' },
    });
  });
});

describe('contracts との結合 (smoke)', () => {
  it('successEnvelope の出力が envelopeSchema を通る', () => {
    const schema = envelopeSchema(v.object({ status: v.string() }));
    const parsed = v.parse(schema, successEnvelope({ status: 'ok' }));
    expect(parsed.success).toBe(true);
  });

  it('errorEnvelope の出力が envelopeSchema を通る', () => {
    const schema = envelopeSchema(v.unknown());
    const parsed = v.parse(schema, errorEnvelope('INVALID_QUERY', 'invalid'));
    expect(parsed.success).toBe(false);
  });
});
