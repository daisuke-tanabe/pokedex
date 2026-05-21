import { Locale } from '@pokedex/contracts';
import { and, eq, isNull, ne, sql } from 'drizzle-orm';

import { type DB, db } from '../client.js';
import { formNames, formSprites, formTypes, forms, pokedexEntries, pokedexes, species } from '../schema/index.js';

const NATIONAL_POKEDEX_SLUG = 'national';
const JA_LOCALE = Locale.JA;

/**
 * `db.transaction()` のコールバック引数型。`db` と互換のインターフェースを持ち、
 * 同一トランザクション内で select / execute を呼べる。トランザクション外で
 * 呼ぶ場合は `db` をそのまま渡せる。
 */
type Runner = DB | Parameters<Parameters<DB['transaction']>[0]>[0];

/**
 * national 図鑑の id を取得する。本不変条件チェック専用の単純な lookup で
 * 汎用化しない (YAGNI)。他の slug 検索が必要になったら専用関数として
 * 別途追加する想定。
 */
const queryNationalPokedexId = async (runner: Runner): Promise<number | null> => {
  const rows = await runner
    .select({ id: pokedexes.id })
    .from(pokedexes)
    .where(eq(pokedexes.slug, NATIONAL_POKEDEX_SLUG))
    .limit(1);
  return rows[0]?.id ?? null;
};

const countRows = (row: { count: number } | undefined): number => row?.count ?? 0;

const checkNationalDexAlignment = async (runner: Runner): Promise<readonly string[]> => {
  const nationalId = await queryNationalPokedexId(runner);
  if (nationalId === null) {
    return ['national 図鑑が見つからない (pokedexes.slug = "national")'];
  }
  const [row] = await runner
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(pokedexEntries)
    .innerJoin(species, eq(species.id, pokedexEntries.speciesId))
    .where(and(eq(pokedexEntries.pokedexId, nationalId), ne(species.nationalDexNumber, pokedexEntries.pokedexNumber)));
  const mismatch = countRows(row);
  return mismatch > 0
    ? [`national 図鑑の pokedex_number が species.national_dex_number と ${mismatch} 件ずれている`]
    : [];
};

const checkFormHasTypes = async (runner: Runner): Promise<readonly string[]> => {
  const [row] = await runner
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(forms)
    .leftJoin(formTypes, eq(formTypes.formId, forms.id))
    .where(isNull(formTypes.formId));
  const missing = countRows(row);
  return missing > 0 ? [`form_types を持たない forms が ${missing} 件存在する`] : [];
};

const checkFormHasSprites = async (runner: Runner): Promise<readonly string[]> => {
  const [row] = await runner
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(forms)
    .leftJoin(formSprites, eq(formSprites.formId, forms.id))
    .where(isNull(formSprites.formId));
  const missing = countRows(row);
  return missing > 0 ? [`form_sprites を持たない forms が ${missing} 件存在する`] : [];
};

const checkFormHasJapaneseName = async (runner: Runner): Promise<readonly string[]> => {
  const [row] = await runner
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(forms)
    .leftJoin(formNames, and(eq(formNames.formId, forms.id), eq(formNames.locale, JA_LOCALE)))
    .where(isNull(formNames.formId));
  const missing = countRows(row);
  return missing > 0 ? [`form_names(locale=ja) を持たない forms が ${missing} 件存在する`] : [];
};

const checkEvolutionsBothChained = async (runner: Runner): Promise<readonly string[]> => {
  const rows = await runner.execute<{ count: number }>(sql`
    SELECT COUNT(*)::int AS count FROM species_evolutions e
      JOIN species fs ON e.from_species_id = fs.id
      JOIN species ts ON e.to_species_id = ts.id
      WHERE fs.evolution_chain_id IS NULL
        OR ts.evolution_chain_id IS NULL
  `);
  const count = rows[0]?.count ?? 0;
  return count > 0 ? [`species_evolutions に evolution_chain_id が NULL の species が ${count} 件含まれる`] : [];
};

const checkEvolutionsSameChain = async (runner: Runner): Promise<readonly string[]> => {
  const rows = await runner.execute<{ count: number }>(sql`
    SELECT COUNT(*)::int AS count FROM species_evolutions e
      JOIN species fs ON e.from_species_id = fs.id
      JOIN species ts ON e.to_species_id = ts.id
      WHERE fs.evolution_chain_id <> ts.evolution_chain_id
  `);
  const count = rows[0]?.count ?? 0;
  return count > 0 ? [`species_evolutions の from / to で evolution_chain_id が異なる行が ${count} 件存在する`] : [];
};

const checkPokedexEntryFormBelongsToSpecies = async (runner: Runner): Promise<readonly string[]> => {
  const [row] = await runner
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(pokedexEntries)
    // innerJoin が form_id IS NULL の行を自動的に除外するため、isNotNull の追加チェックは不要
    .innerJoin(forms, eq(forms.id, pokedexEntries.formId))
    .where(ne(pokedexEntries.speciesId, forms.speciesId));
  const mismatch = countRows(row);
  return mismatch > 0
    ? [
        `pokedex_entries.form_id が指す form の species_id が pokedex_entries.species_id と一致しない行が ${mismatch} 件存在する`,
      ]
    : [];
};

/**
 * シード適用後の DB に対して、design Decision 5 で定義した不変条件を一括検証する。
 * 違反があれば配列で返す。空配列なら全 OK。
 *
 * `runner` を指定するとそのトランザクション内で検証する。省略時は `db` を使う。
 */
export async function collectInvariantViolations(runner: Runner = db): Promise<readonly string[]> {
  const checks = await Promise.all([
    checkNationalDexAlignment(runner),
    checkFormHasTypes(runner),
    checkFormHasSprites(runner),
    checkFormHasJapaneseName(runner),
    checkEvolutionsBothChained(runner),
    checkEvolutionsSameChain(runner),
    checkPokedexEntryFormBelongsToSpecies(runner),
  ]);
  return checks.flat();
}

/**
 * 不変条件を実行し、違反があれば例外を投げる。`runner` を指定するとそのトランザクション
 * 内で検証する。
 */
export async function runInvariants(runner: Runner = db): Promise<void> {
  const violations = await collectInvariantViolations(runner);
  if (violations.length > 0) {
    throw new Error(`[invariants] violations:\n${violations.map((line) => `  - ${line}`).join('\n')}`);
  }
}
