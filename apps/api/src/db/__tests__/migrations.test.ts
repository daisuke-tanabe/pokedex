import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const MIGRATIONS_DIR = resolve(import.meta.dirname, '../../../../../supabase/migrations');

const readGeneratedSql = (): string => {
  const files = readdirSync(MIGRATIONS_DIR).filter((file) => file.endsWith('.sql'));
  const sqlFile = files.find((file) => /\d{4}_/.test(file));
  if (!sqlFile) {
    throw new Error(`SQL migration file not found in ${MIGRATIONS_DIR}`);
  }
  return readFileSync(resolve(MIGRATIONS_DIR, sqlFile), 'utf8');
};

describe('migration SQL', () => {
  it('supabase/migrations 配下に SQL ファイルが少なくとも 1 つ存在する', () => {
    expect(existsSync(MIGRATIONS_DIR)).toBe(true);
    const files = readdirSync(MIGRATIONS_DIR).filter((file) => file.endsWith('.sql'));
    expect(files.length).toBeGreaterThan(0);
  });

  it('生成 SQL に form_types の (form_id, slot) 複合 PK が含まれる', () => {
    const sql = readGeneratedSql();
    expect(sql).toMatch(/PRIMARY KEY\s*\(\s*"form_id"\s*,\s*"slot"\s*\)/);
  });

  it('生成 SQL に species_evolutions の from <> to CHECK 制約が含まれる', () => {
    const sql = readGeneratedSql();
    expect(sql).toMatch(
      /CHECK\s*\(\s*"species_evolutions"."from_species_id"\s*<>\s*"species_evolutions"."to_species_id"\s*\)/,
    );
  });

  it('生成 SQL に form_types の slot IN (1, 2) CHECK 制約が含まれる', () => {
    const sql = readGeneratedSql();
    expect(sql).toMatch(/CHECK\s*\(\s*"form_types"."slot"\s+IN\s*\(\s*1\s*,\s*2\s*\)\s*\)/);
  });

  it('生成 SQL に species.evolution_chain_id の NULL 許容 FK が含まれる', () => {
    const sql = readGeneratedSql();
    // NOT NULL が付かない (= NULL 許容)
    expect(sql).toMatch(/"evolution_chain_id"\s+integer(?!\s+NOT NULL),/);
    expect(sql).toMatch(/REFERENCES "public"\."evolution_chains"\("id"\)/);
  });

  it('生成 SQL に pokedex_entries.form_id の NULL 許容 FK が含まれる', () => {
    const sql = readGeneratedSql();
    expect(sql).toMatch(/"form_id"\s+integer(?!\s+NOT NULL),/);
    expect(sql).toMatch(/"pokedex_entries_form_id_forms_id_fk".*REFERENCES "public"\."forms"\("id"\)/);
  });

  it('生成 SQL に pgEnum form_category / sprite_gender / sprite_kind が含まれる', () => {
    const sql = readGeneratedSql();
    expect(sql).toContain('CREATE TYPE "public"."form_category"');
    expect(sql).toContain('CREATE TYPE "public"."sprite_gender"');
    expect(sql).toContain('CREATE TYPE "public"."sprite_kind"');
  });
});
