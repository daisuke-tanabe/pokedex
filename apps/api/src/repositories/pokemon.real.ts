import { LOCALE_VALUES, Locale } from '@pokedex/contracts';
import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import type { DB } from '../db/client.js';
import {
  formNames,
  formSprites,
  formTypes,
  forms,
  pokedexEntries,
  pokedexes,
  species,
  speciesNames,
  types,
} from '../db/schema/index.js';
import type { PokemonDetail, PokemonListItem, PokemonRepository, SearchInput, SearchResult } from './pokemon.js';

const JA_LOCALE = Locale.JA;

const isLocale = (s: string): s is Locale => (LOCALE_VALUES as readonly string[]).includes(s);

/**
 * DB の `locales.code` (varchar) は `LOCALE_VALUES` を超えない FK 制約を持つが、TS は
 * その不変条件を知らないので、`Locale` リテラルユニオンに narrowing しつつ未知の locale を
 * 安全に弾く。
 */
const filterLocaleEntries = <T extends { locale: string }>(
  rows: readonly T[],
): Array<Omit<T, 'locale'> & { locale: Locale }> => rows.filter((r): r is T & { locale: Locale } => isLocale(r.locale));

interface SearchRow {
  formId: number;
  pokedexNumber: number;
  speciesId: number;
  speciesSlug: string;
  formSlug: string;
}

/**
 * Drizzle 実装の PokemonRepository を生成する。
 *
 * メインクエリ 1 本で「ソート済み (pokedex_number, form_id) のリスト + limit+1」を取得し、
 * 続いてバッチクエリ 3 本 (form_names / form_types / form_sprites) を `Promise.all` で
 * 並列に取得して PokemonListItem を組み立てる (Decision 4 / design.md)。
 */
export const createRealPokemonRepository = (db: DB): PokemonRepository => ({
  findPokedexIdBySlug: async (slug) => {
    const rows = await db.select({ id: pokedexes.id }).from(pokedexes).where(eq(pokedexes.slug, slug)).limit(1);
    return rows[0]?.id ?? null;
  },

  findTypeIdsBySlugs: async (slugs) => {
    if (slugs.length === 0) {
      return [];
    }
    const rows = await db.select({ id: types.id, slug: types.slug }).from(types).where(inArray(types.slug, slugs));
    const bySlug = new Map(rows.map((r) => [r.slug, r.id]));
    const resolved: number[] = [];
    for (const slug of slugs) {
      const id = bySlug.get(slug);
      if (id === undefined) {
        return null;
      }
      resolved.push(id);
    }
    return resolved;
  },

  searchByList: async ({ pokedexId, typeIds, cursor, limit }: SearchInput): Promise<SearchResult> => {
    const typeCount = typeIds.length;

    // `pokedex_entries.form_id` を 2 way で resolve する:
    //   - 非 NULL: LEFT JOIN した specified form (具体的に指定された form)
    //   - NULL:    INNER JOIN した default form (species ごとに必ず 1 件存在する不変条件あり)
    // どちらを採用するかは COALESCE で id / slug を解決する。
    // `forms` テーブルに対する 2 alias で表現する (drizzle の alias()).
    const specifiedForm = alias(forms, 'specified_form');
    const defaultForm = alias(forms, 'default_form');
    // PostgreSQL は SELECT の column alias (= `.as('form_id')`) を WHERE 句で参照できないため、
    // 「WHERE / cursor 用の raw expression」と「SELECT / ORDER BY 用の alias 版」を分けて扱う。
    const effectiveFormIdExpr = sql<number>`COALESCE(${specifiedForm.id}, ${defaultForm.id})`;
    const effectiveFormSlugExpr = sql<string>`COALESCE(${specifiedForm.slug}, ${defaultForm.slug})`;
    const effectiveFormId = effectiveFormIdExpr.as('form_id');
    const effectiveFormSlug = effectiveFormSlugExpr.as('form_slug');

    const conditions = [eq(pokedexEntries.pokedexId, pokedexId)];

    if (cursor !== null) {
      conditions.push(sql`(${pokedexEntries.pokedexNumber}, ${effectiveFormIdExpr}) > (${cursor.pn}, ${cursor.fid})`);
    }

    if (typeCount > 0) {
      // AND 検索: 指定タイプを全部 (DISTINCT 件数で N) 持つ form を抽出する。
      // drizzle の sql template に裸の配列を `IN ${arr}` で渡すと PostgreSQL 側で
      // `IN $1` (= 単一 array 値) として scalar 比較になり常に空集合になるため、
      // `inArray()` 演算子を埋め込んで `IN (...)` に正しく展開させる。
      conditions.push(
        sql`${effectiveFormIdExpr} IN (
          SELECT ${formTypes.formId} FROM ${formTypes}
          WHERE ${inArray(formTypes.typeId, typeIds)}
          GROUP BY ${formTypes.formId}
          HAVING COUNT(DISTINCT ${formTypes.typeId}) = ${typeCount}
        )`,
      );
    }

    const rows = await db
      .select({
        formId: effectiveFormId,
        pokedexNumber: pokedexEntries.pokedexNumber,
        speciesId: pokedexEntries.speciesId,
        speciesSlug: species.slug,
        formSlug: effectiveFormSlug,
      })
      .from(pokedexEntries)
      .innerJoin(species, eq(species.id, pokedexEntries.speciesId))
      // 明示指定された form (`pokedex_entries.form_id` 非 NULL) を LEFT JOIN で拾う。
      .leftJoin(specifiedForm, eq(specifiedForm.id, pokedexEntries.formId))
      // species の default form (`is_default = true` 1 件) を INNER JOIN で必ず確保する。
      // 不変条件「全 species に default form が exactly 1 件」(invariants.ts) で担保。
      .innerJoin(defaultForm, and(eq(defaultForm.speciesId, pokedexEntries.speciesId), eq(defaultForm.isDefault, true)))
      .where(and(...conditions))
      .orderBy(asc(pokedexEntries.pokedexNumber), asc(effectiveFormId))
      .limit(limit + 1);

    const slice = rows as SearchRow[];
    const hasMore = slice.length > limit;
    const returnedRows = slice.slice(0, limit);

    if (returnedRows.length === 0) {
      return { items: [], nextCursor: null };
    }

    const formIds = returnedRows.map((r) => r.formId);

    const [japaneseNames, typesByForm, defaultSpritesByForm] = await Promise.all([
      db
        .select({ formId: formNames.formId, name: formNames.name })
        .from(formNames)
        .where(and(inArray(formNames.formId, formIds), eq(formNames.locale, JA_LOCALE))),
      db
        .select({ formId: formTypes.formId, slot: formTypes.slot, typeSlug: types.slug })
        .from(formTypes)
        .innerJoin(types, eq(types.id, formTypes.typeId))
        .where(inArray(formTypes.formId, formIds))
        .orderBy(asc(formTypes.formId), asc(formTypes.slot)),
      db
        .select({ formId: formSprites.formId, url: formSprites.url })
        .from(formSprites)
        .where(
          and(inArray(formSprites.formId, formIds), eq(formSprites.gender, 'unknown'), eq(formSprites.kind, 'default')),
        ),
    ]);

    const nameByFormId = new Map(japaneseNames.map((n) => [n.formId, n.name]));
    const typesByFormId = new Map<number, string[]>();
    for (const row of typesByForm) {
      const list = typesByFormId.get(row.formId) ?? [];
      list.push(row.typeSlug);
      typesByFormId.set(row.formId, list);
    }
    const spriteByFormId = new Map(defaultSpritesByForm.map((s) => [s.formId, s.url]));

    const items: PokemonListItem[] = returnedRows.map((row) => ({
      speciesSlug: row.speciesSlug,
      formSlug: row.formSlug,
      pokedexNumber: row.pokedexNumber,
      nameJa: nameByFormId.get(row.formId) ?? '',
      types: typesByFormId.get(row.formId) ?? [],
      defaultSpriteUrl: spriteByFormId.get(row.formId) ?? '',
    }));

    const last = returnedRows.at(-1);
    const nextCursor = hasMore && last !== undefined ? { pn: last.pokedexNumber, fid: last.formId } : null;

    return { items, nextCursor };
  },

  findDetailBySlug: async (slug: string): Promise<PokemonDetail | null> => {
    const baseRows = await db
      .select({
        speciesId: species.id,
        speciesSlug: species.slug,
        nationalDexNumber: species.nationalDexNumber,
        evolutionChainId: species.evolutionChainId,
        formId: forms.id,
        formSlug: forms.slug,
        formCategory: forms.category,
        formIsDefault: forms.isDefault,
      })
      .from(species)
      .innerJoin(forms, and(eq(forms.speciesId, species.id), eq(forms.isDefault, true)))
      .where(eq(species.slug, slug))
      .limit(1);

    const base = baseRows[0];
    if (base === undefined) {
      return null;
    }

    const [speciesLocaleNames, formLocaleNames, formTypeRows, spriteRows, evolutionRows] = await Promise.all([
      db
        .select({ locale: speciesNames.locale, name: speciesNames.name })
        .from(speciesNames)
        .where(eq(speciesNames.speciesId, base.speciesId)),
      db
        .select({ locale: formNames.locale, name: formNames.name })
        .from(formNames)
        .where(eq(formNames.formId, base.formId)),
      db
        .select({ slot: formTypes.slot, typeSlug: types.slug })
        .from(formTypes)
        .innerJoin(types, eq(types.id, formTypes.typeId))
        .where(eq(formTypes.formId, base.formId))
        .orderBy(asc(formTypes.slot)),
      db
        .select({ gender: formSprites.gender, kind: formSprites.kind, url: formSprites.url })
        .from(formSprites)
        .where(eq(formSprites.formId, base.formId)),
      base.evolutionChainId === null
        ? Promise.resolve([] as { speciesId: number; slug: string; nationalDexNumber: number }[])
        : db
            .select({
              speciesId: species.id,
              slug: species.slug,
              nationalDexNumber: species.nationalDexNumber,
            })
            .from(species)
            .where(eq(species.evolutionChainId, base.evolutionChainId))
            .orderBy(asc(species.nationalDexNumber)),
    ]);

    const evolutionSpeciesIds = evolutionRows.map((r) => r.speciesId);
    const evolutionNameRows =
      evolutionSpeciesIds.length === 0
        ? []
        : await db
            .select({ speciesId: speciesNames.speciesId, locale: speciesNames.locale, name: speciesNames.name })
            .from(speciesNames)
            .where(inArray(speciesNames.speciesId, evolutionSpeciesIds));

    const evolutionNamesById = new Map<number, { locale: string; name: string }[]>();
    for (const row of evolutionNameRows) {
      const list = evolutionNamesById.get(row.speciesId) ?? [];
      list.push({ locale: row.locale, name: row.name });
      evolutionNamesById.set(row.speciesId, list);
    }

    return {
      species: {
        slug: base.speciesSlug,
        nationalDexNumber: base.nationalDexNumber,
        names: filterLocaleEntries(speciesLocaleNames),
      },
      form: {
        slug: base.formSlug,
        category: base.formCategory,
        isDefault: base.formIsDefault,
      },
      names: filterLocaleEntries(formLocaleNames),
      sprites: spriteRows,
      types: formTypeRows.map((r) => r.typeSlug),
      evolutions: evolutionRows.map((r) => ({
        slug: r.slug,
        nationalDexNumber: r.nationalDexNumber,
        names: filterLocaleEntries(evolutionNamesById.get(r.speciesId) ?? []),
      })),
    };
  },
});
