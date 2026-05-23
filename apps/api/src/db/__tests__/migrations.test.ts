import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const MIGRATIONS_DIR = resolve(import.meta.dirname, '../../../../../supabase/migrations');

/**
 * `supabase/migrations` 配下の `<timestamp>_*.sql` を全て読み、結合した文字列を返す。
 *
 * 将来 `0001_*.sql` 以降が追加されても全ファイルが検査対象に含まれるよう、`find` ではなく
 * `filter` で全件取得する。これにより本 change で定義した制約が後続マイグレーションで
 * 誤って解除された場合も気付ける (CREATE TYPE / PRIMARY KEY / CHECK 等は ALTER で
 * 取り除かれない限り全ファイルの結合文字列に残る)。
 */
const readGeneratedSql = (): string => {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.sql') && /\d{4}_/.test(file))
    .toSorted();
  if (files.length === 0) {
    throw new Error(`SQL migration file not found in ${MIGRATIONS_DIR}`);
  }
  return files.map((file) => readFileSync(resolve(MIGRATIONS_DIR, file), 'utf8')).join('\n');
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

  it('生成 SQL に forms.is_default の boolean NOT NULL DEFAULT false が含まれる', () => {
    const sql = readGeneratedSql();
    expect(sql).toMatch(/"is_default" boolean DEFAULT false NOT NULL/);
  });

  it('生成 SQL に forms の部分 UNIQUE インデックス (species_id WHERE is_default = true) が含まれる', () => {
    const sql = readGeneratedSql();
    expect(sql).toMatch(
      /CREATE UNIQUE INDEX "forms_species_id_default_unique" ON "forms".*\("species_id"\) WHERE "forms"\."is_default" = true/,
    );
  });

  it('生成 SQL に pokedex_entries(pokedex_id) 単独列インデックスが含まれる', () => {
    const sql = readGeneratedSql();
    expect(sql).toMatch(/CREATE INDEX "pokedex_entries_pokedex_id_idx" ON "pokedex_entries".*\("pokedex_id"\)/);
  });

  it('生成 SQL に pokedex_entries(form_id) 単独列インデックスが含まれる', () => {
    const sql = readGeneratedSql();
    expect(sql).toMatch(/CREATE INDEX "pokedex_entries_form_id_idx" ON "pokedex_entries".*\("form_id"\)/);
  });

  it('生成 SQL に form_types(form_id) 単独列インデックスが含まれる', () => {
    const sql = readGeneratedSql();
    expect(sql).toMatch(/CREATE INDEX "form_types_form_id_idx" ON "form_types".*\("form_id"\)/);
  });

  it('生成 SQL に form_types(type_id) 単独列インデックスが含まれる', () => {
    const sql = readGeneratedSql();
    expect(sql).toMatch(/CREATE INDEX "form_types_type_id_idx" ON "form_types".*\("type_id"\)/);
  });

  it('生成 SQL に form_sprites(form_id) 単独列インデックスが含まれる', () => {
    const sql = readGeneratedSql();
    expect(sql).toMatch(/CREATE INDEX "form_sprites_form_id_idx" ON "form_sprites".*\("form_id"\)/);
  });

  it('生成 SQL に form_names(form_id) 単独列インデックスが含まれる', () => {
    const sql = readGeneratedSql();
    expect(sql).toMatch(/CREATE INDEX "form_names_form_id_idx" ON "form_names".*\("form_id"\)/);
  });
});
