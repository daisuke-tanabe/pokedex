import { getTableName } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { formSprites } from './form-sprites.js';

describe('form_sprites table', () => {
  it('物理名は form_sprites である', () => {
    expect(getTableName(formSprites)).toBe('form_sprites');
  });

  it('form_id / gender / kind / url 列が NOT NULL で定義されている', () => {
    expect(formSprites.formId.notNull).toBe(true);
    expect(formSprites.gender.notNull).toBe(true);
    expect(formSprites.kind.notNull).toBe(true);
    expect(formSprites.url.notNull).toBe(true);
  });
});
