import { hc } from 'hono/client';
import { describe, expectTypeOf, it } from 'vitest';

import type { AppType } from '../index.js';

describe('AppType', () => {
  it('hc<AppType> で型推論が成立する', () => {
    const client = hc<AppType>('http://localhost:3000');
    expectTypeOf(client).toBeObject();
  });
});
