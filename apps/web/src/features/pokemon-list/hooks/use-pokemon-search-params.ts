'use client';

import {
  DEFAULT_POKEDEX_SLUG,
  MAX_TYPES,
  POKEDEX_SLUG_VALUES,
  TYPE_SLUG_VALUES,
  type PokedexSlug,
  type TypeSlug,
} from '@pokedex/contracts';
import { parseAsArrayOf, parseAsStringLiteral, throttle, useQueryState } from 'nuqs';
import { useCallback } from 'react';

const pokedexParser = parseAsStringLiteral(POKEDEX_SLUG_VALUES).withDefault(DEFAULT_POKEDEX_SLUG);

// types は max MAX_TYPES (= 2) 件 + AND 絞り込みで、ユーザが 2 件目を選ぶ過程で
// 連続 toggle されると無駄 fetch が増える (Decision 10)。300ms throttle で
// 「ボタン押下が落ち着いてから fetch」する。pokedex は即時反映 (素通し)。
const typesParser = parseAsArrayOf(parseAsStringLiteral(TYPE_SLUG_VALUES))
  .withDefault([])
  .withOptions({ limitUrlUpdates: throttle(300) });

type SetTypes = (next: readonly TypeSlug[]) => Promise<URLSearchParams>;

type PokemonSearchParams = {
  pokedex: PokedexSlug;
  setPokedex: (next: PokedexSlug | null) => Promise<URLSearchParams>;
  types: readonly TypeSlug[];
  setTypes: SetTypes;
};

/**
 * 検索条件 (pokedex / types) を URL クエリと双方向同期する hook。
 *
 * - `pokedex`: 即時反映 (`parseAsStringLiteral` で `POKEDEX_SLUG_VALUES` を picklist 制約)
 * - `types`: 300ms throttle 付き (Decision 10)、`MAX_TYPES` 超過は guard で reject
 *
 * 未知の slug が URL に含まれる場合は parser が null を返し、`withDefault` で既定値に
 * 解決される (BE の Valibot picklist と二重バリデーションになる)。
 */
export function usePokemonSearchParams(): PokemonSearchParams {
  const [pokedex, setPokedex] = useQueryState('pokedex', pokedexParser);
  const [types, setTypesRaw] = useQueryState('types', typesParser);

  const setTypes = useCallback<SetTypes>(
    (next) => {
      // MAX_TYPES を超える選択は、最も古い選択を退避して末尾 (新しい順) の MAX_TYPES 件に絞る
      // (Requirement: "最古の選択を退避する")。ToggleGroup は新しく押した値を末尾に append するため、
      // 末尾 MAX_TYPES 件を残せば最古が落ちる。例: ほのお→くさ→でんき で くさ,でんき になる。
      const limited = next.length > MAX_TYPES ? next.slice(next.length - MAX_TYPES) : next;
      return setTypesRaw([...limited]);
    },
    [setTypesRaw],
  );

  return { pokedex, setPokedex, types, setTypes };
}
