import { getTableName } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { formTypes } from './form-types.js';

describe('form_types table', () => {
  it('物理名は form_types である', () => {
    expect(getTableName(formTypes)).toBe('form_types');
  });

  it('form_id / slot / type_id 列が NOT NULL で定義されている', () => {
    expect(formTypes.formId.notNull).toBe(true);
    expect(formTypes.slot.notNull).toBe(true);
    expect(formTypes.typeId.notNull).toBe(true);
  });
});
