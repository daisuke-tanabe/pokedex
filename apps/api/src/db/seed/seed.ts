import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import * as v from 'valibot';

import { type DB, db } from '../client.js';
import {
  evolutionChains,
  formNames,
  formSprites,
  formTypes,
  forms,
  locales,
  pokedexEntries,
  pokedexNames,
  pokedexes,
  regionNames,
  regions,
  species,
  speciesEvolutions,
  speciesNames,
  typeNames,
  types,
} from '../schema/index.js';
import { runInvariants } from './invariants.js';
import {
  type FormSeed,
  formsFileSchema,
  type LocaleSeed,
  localesFileSchema,
  type PokedexSeed,
  pokedexesFileSchema,
  type RegionSeed,
  regionsFileSchema,
  type SpeciesSeed,
  speciesFileSchema,
  type TypeSeed,
  typesFileSchema,
} from './schemas/index.js';

const dataDir = resolve(fileURLToPath(import.meta.url), '../data');

/**
 * drizzle の `db.transaction()` のコールバック引数型。`db` と互換のインターフェースを持ち、
 * 同一トランザクション内で insert / select / delete / execute を呼べる。
 */
type Tx = Parameters<Parameters<DB['transaction']>[0]>[0];

async function loadJson<T>(filename: string, schema: v.GenericSchema<T>): Promise<T> {
  const raw = await readFile(resolve(dataDir, filename), 'utf8');
  const parsed: unknown = JSON.parse(raw);
  return v.parse(schema, parsed);
}

type SlugIdMap = ReadonlyMap<string, number>;

/**
 * `Map.get` 等で `undefined` が返ったときに明示的なエラーで停止するヘルパー。
 *
 * `INSERT ... RETURNING` 直後の Map 参照は論理的には undefined にならないが、`!` を
 * 並べると将来 returning から該当列が抜けたときに型エラーではなく runtime の暗黙
 * undefined 伝播になる。すべての lookup を `required()` 経由にすることで、失敗時に
 * 「どの参照で undefined が出たか」を seed のエラーメッセージから即座に特定できる。
 */
const required = <T>(value: T | undefined, message: string): T => {
  if (value === undefined) {
    throw new Error(`[seed] ${message}`);
  }
  return value;
};

async function seedLocales(tx: Tx, rows: readonly LocaleSeed[]): Promise<void> {
  if (rows.length === 0) return;
  await tx.insert(locales).values(rows.map((row) => ({ code: row.code, name: row.name })));
}

async function seedTypes(tx: Tx, rows: readonly TypeSeed[]): Promise<SlugIdMap> {
  if (rows.length === 0) return new Map();
  const inserted = await tx
    .insert(types)
    .values(rows.map((row) => ({ slug: row.slug })))
    .returning({ id: types.id, slug: types.slug });
  const map = new Map(inserted.map((row) => [row.slug, row.id]));
  const nameValues = rows.flatMap((row) =>
    row.names.map((entry) => ({
      typeId: required(map.get(row.slug), `type_names lookup: unknown type slug '${row.slug}'`),
      locale: entry.locale,
      name: entry.name,
    })),
  );
  if (nameValues.length > 0) {
    await tx.insert(typeNames).values(nameValues);
  }
  return map;
}

async function seedRegions(tx: Tx, rows: readonly RegionSeed[]): Promise<SlugIdMap> {
  if (rows.length === 0) return new Map();
  const inserted = await tx
    .insert(regions)
    .values(rows.map((row) => ({ slug: row.slug })))
    .returning({ id: regions.id, slug: regions.slug });
  const map = new Map(inserted.map((row) => [row.slug, row.id]));
  const nameValues = rows.flatMap((row) =>
    row.names.map((entry) => ({
      regionId: required(map.get(row.slug), `region_names lookup: unknown region slug '${row.slug}'`),
      locale: entry.locale,
      name: entry.name,
    })),
  );
  if (nameValues.length > 0) {
    await tx.insert(regionNames).values(nameValues);
  }
  return map;
}

async function seedSpecies(tx: Tx, rows: readonly SpeciesSeed[]): Promise<SlugIdMap> {
  if (rows.length === 0) return new Map();

  const chainKeys = [...new Set(rows.flatMap((row) => (row.evolutionChainKey ? [row.evolutionChainKey] : [])))];
  const chainIdByKey = new Map<string, number>();
  if (chainKeys.length > 0) {
    const insertedChains = await tx
      .insert(evolutionChains)
      .values(chainKeys.map(() => ({})))
      .returning({ id: evolutionChains.id });
    chainKeys.forEach((key, index) => {
      const row = required(
        insertedChains[index],
        `evolution_chains RETURNING row at index ${index} for key '${key}' is missing`,
      );
      chainIdByKey.set(key, row.id);
    });
  }

  const inserted = await tx
    .insert(species)
    .values(
      rows.map((row) => ({
        slug: row.slug,
        nationalDexNumber: row.nationalDexNumber,
        evolutionChainId: row.evolutionChainKey
          ? required(
              chainIdByKey.get(row.evolutionChainKey),
              `species: unknown evolutionChainKey '${row.evolutionChainKey}'`,
            )
          : null,
      })),
    )
    .returning({ id: species.id, slug: species.slug });
  const speciesIds = new Map(inserted.map((row) => [row.slug, row.id]));

  const nameValues = rows.flatMap((row) =>
    row.names.map((entry) => ({
      speciesId: required(speciesIds.get(row.slug), `species_names lookup: unknown species slug '${row.slug}'`),
      locale: entry.locale,
      name: entry.name,
    })),
  );
  if (nameValues.length > 0) {
    await tx.insert(speciesNames).values(nameValues);
  }

  const evolutionValues = rows.flatMap((row) =>
    (row.evolutions ?? []).map((evolution) => {
      const fromId = speciesIds.get(row.slug);
      const toId = speciesIds.get(evolution.toSpeciesSlug);
      if (fromId === undefined || toId === undefined) {
        throw new Error(
          `[seed] species_evolutions: unknown species slug (from=${row.slug}, to=${evolution.toSpeciesSlug})`,
        );
      }
      return { fromSpeciesId: fromId, toSpeciesId: toId };
    }),
  );
  if (evolutionValues.length > 0) {
    await tx.insert(speciesEvolutions).values(evolutionValues);
  }

  return speciesIds;
}

/**
 * forms のキー型: `${species_id}:${slug}`。DB の UNIQUE は (species_id, slug) 複合のため、
 * slug のみだと異なる species で同じ slug を持つフォーム (例: 'normal') が衝突する可能性が
 * ある。speciesId を含めた複合キーで silent corruption を防ぐ。
 */
type FormCompositeKey = `${number}:${string}`;
type FormIdMap = ReadonlyMap<FormCompositeKey, number>;

const formKey = (speciesId: number, slug: string): FormCompositeKey => `${speciesId}:${slug}`;

async function seedForms(
  tx: Tx,
  rows: readonly FormSeed[],
  speciesIds: SlugIdMap,
  typeIds: SlugIdMap,
): Promise<FormIdMap> {
  if (rows.length === 0) return new Map();

  const inserted = await tx
    .insert(forms)
    .values(
      rows.map((row) => ({
        speciesId: required(speciesIds.get(row.speciesSlug), `forms: unknown species slug '${row.speciesSlug}'`),
        slug: row.slug,
        category: row.category,
      })),
    )
    .returning({ id: forms.id, slug: forms.slug, speciesId: forms.speciesId });
  const formIds = new Map<FormCompositeKey, number>(inserted.map((row) => [formKey(row.speciesId, row.slug), row.id]));

  const resolveFormId = (speciesSlug: string, formSlug: string): number => {
    const speciesId = required(speciesIds.get(speciesSlug), `forms lookup: unknown species slug '${speciesSlug}'`);
    return required(
      formIds.get(formKey(speciesId, formSlug)),
      `forms lookup: unknown form '${speciesSlug}:${formSlug}'`,
    );
  };

  const nameValues = rows.flatMap((row) =>
    row.names.map((entry) => ({
      formId: resolveFormId(row.speciesSlug, row.slug),
      locale: entry.locale,
      name: entry.name,
    })),
  );
  if (nameValues.length > 0) {
    await tx.insert(formNames).values(nameValues);
  }

  const typeValues = rows.flatMap((row) =>
    row.types.map((entry) => ({
      formId: resolveFormId(row.speciesSlug, row.slug),
      slot: entry.slot,
      typeId: required(
        typeIds.get(entry.typeSlug),
        `form_types: unknown type slug '${entry.typeSlug}' for form '${row.slug}'`,
      ),
    })),
  );
  if (typeValues.length > 0) {
    await tx.insert(formTypes).values(typeValues);
  }

  const spriteValues = rows.flatMap((row) =>
    row.sprites.map((entry) => ({
      formId: resolveFormId(row.speciesSlug, row.slug),
      gender: entry.gender,
      kind: entry.kind,
      url: entry.url,
    })),
  );
  if (spriteValues.length > 0) {
    await tx.insert(formSprites).values(spriteValues);
  }

  return formIds;
}

async function seedPokedexes(
  tx: Tx,
  rows: readonly PokedexSeed[],
  speciesIds: SlugIdMap,
  formIds: FormIdMap,
  regionIds: SlugIdMap,
): Promise<void> {
  if (rows.length === 0) return;

  const inserted = await tx
    .insert(pokedexes)
    .values(
      rows.map((row) => ({
        slug: row.slug,
        regionId: row.regionSlug
          ? required(regionIds.get(row.regionSlug), `pokedexes: unknown region slug '${row.regionSlug}'`)
          : null,
      })),
    )
    .returning({ id: pokedexes.id, slug: pokedexes.slug });
  const pokedexIds = new Map(inserted.map((row) => [row.slug, row.id]));

  const nameValues = rows.flatMap((row) =>
    row.names.map((entry) => ({
      pokedexId: required(pokedexIds.get(row.slug), `pokedex_names lookup: unknown pokedex slug '${row.slug}'`),
      locale: entry.locale,
      name: entry.name,
    })),
  );
  if (nameValues.length > 0) {
    await tx.insert(pokedexNames).values(nameValues);
  }

  const entryValues = rows.flatMap((row) =>
    row.entries.map((entry) => {
      const speciesId = required(
        speciesIds.get(entry.speciesSlug),
        `pokedex_entries: unknown species slug '${entry.speciesSlug}'`,
      );
      const formId = entry.formSlug
        ? required(
            formIds.get(formKey(speciesId, entry.formSlug)),
            `pokedex_entries: unknown form '${entry.speciesSlug}:${entry.formSlug}'`,
          )
        : null;
      return {
        pokedexId: required(pokedexIds.get(row.slug), `pokedex_entries: unknown pokedex slug '${row.slug}'`),
        speciesId,
        pokedexNumber: entry.pokedexNumber,
        formId,
      };
    }),
  );
  if (entryValues.length > 0) {
    await tx.insert(pokedexEntries).values(entryValues);
  }
}

async function clearAll(tx: Tx): Promise<void> {
  // 子テーブル → 親テーブル の順で削除する。FK で cascade されるテーブルもあるが、
  // 明示削除で seed の冪等性を担保する。
  await tx.delete(pokedexEntries);
  await tx.delete(pokedexNames);
  await tx.delete(pokedexes);
  await tx.delete(formSprites);
  await tx.delete(formTypes);
  await tx.delete(formNames);
  await tx.delete(forms);
  await tx.delete(speciesEvolutions);
  await tx.delete(speciesNames);
  await tx.delete(species);
  await tx.delete(evolutionChains);
  await tx.delete(regionNames);
  await tx.delete(regions);
  await tx.delete(typeNames);
  await tx.delete(types);
  await tx.delete(locales);
}

export async function seed(): Promise<void> {
  const [localesData, typesData, regionsData, pokedexesData, speciesData, formsData] = await Promise.all([
    loadJson('locales.json', localesFileSchema),
    loadJson('types.json', typesFileSchema),
    loadJson('regions.json', regionsFileSchema),
    loadJson('pokedexes.json', pokedexesFileSchema),
    loadJson('species.json', speciesFileSchema),
    loadJson('forms.json', formsFileSchema),
  ]);

  // clearAll → 親 → 子 → invariants をすべて単一トランザクションで実行する。
  // 途中で例外が発生した場合、drizzle が自動でロールバックを発行し、DB は seed 開始前
  // (または直前の整合状態) に戻る。runInvariants が違反を検出して throw すると、シード
  // データもまるごと巻き戻る。
  await db.transaction(async (tx) => {
    await clearAll(tx);

    await seedLocales(tx, localesData);
    const typeIds = await seedTypes(tx, typesData);
    const regionIds = await seedRegions(tx, regionsData);
    const speciesIds = await seedSpecies(tx, speciesData);
    const formIds = await seedForms(tx, formsData, speciesIds, typeIds);
    await seedPokedexes(tx, pokedexesData, speciesIds, formIds, regionIds);

    await runInvariants(tx);
  });
}

// 直接 CLI で呼ばれた場合は実行する (test ファイルからの import は実行しない)
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  seed()
    .then(() => {
      // eslint-disable-next-line no-console
      console.log('[seed] completed successfully');
      // postgres-js の接続が常駐するため、明示的に exit してプロセスを終わらせる。
      process.exit(0);
    })
    .catch((error: unknown) => {
      // eslint-disable-next-line no-console
      console.error('[seed] failed:', error);
      process.exit(1);
    });
}
