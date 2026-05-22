import { getTableName } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { formNames, forms } from './forms.js';

describe('forms table', () => {
  it('物理名は forms である', () => {
    expect(getTableName(forms)).toBe('forms');
  });

  it('id は主キー、species_id / slug / category は NOT NULL', () => {
    expect(forms.id.primary).toBe(true);
    expect(forms.speciesId.notNull).toBe(true);
    expect(forms.slug.notNull).toBe(true);
    expect(forms.category.notNull).toBe(true);
  });

  it('is_default は NOT NULL かつ default false の boolean 列である', () => {
    expect(forms.isDefault.notNull).toBe(true);
    expect(forms.isDefault.default).toBe(false);
    expect(forms.isDefault.dataType).toBe('boolean');
  });
});

describe('form_names table', () => {
  it('物理名は form_names である', () => {
    expect(getTableName(formNames)).toBe('form_names');
  });

  it('form_id / locale / name 列が定義されている', () => {
    expect(formNames.formId).toBeDefined();
    expect(formNames.locale).toBeDefined();
    expect(formNames.name).toBeDefined();
  });
});
