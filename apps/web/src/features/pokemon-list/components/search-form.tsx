'use client';

import { POKEDEX_SLUG_VALUES, TYPE_SLUG_VALUES, type PokedexSlug, type TypeSlug } from '@pokedex/contracts';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

import { usePokemonSearchParams } from '../hooks/use-pokemon-search-params';
import { POKEDEX_OPTIONS } from '../lib/labels-pokedex';
import { TYPE_OPTIONS } from '../lib/labels-type';

const POKEDEX_SLUG_SET = new Set<string>(POKEDEX_SLUG_VALUES);
const TYPE_SLUG_SET = new Set<string>(TYPE_SLUG_VALUES);

const isPokedexSlug = (value: string): value is PokedexSlug => POKEDEX_SLUG_SET.has(value);

const filterTypeSlugs = (values: readonly string[]): TypeSlug[] =>
  values.filter((v): v is TypeSlug => TYPE_SLUG_SET.has(v));

/**
 * 検索フォーム。pokedex 選択 (即時反映) と types 絞り込み (300ms throttle / max 2 件) を行う。
 *
 * 選択肢は `@pokedex/contracts` の enum から構築し (hardcode 禁止)、表示順は
 * `POKEDEX_OPTIONS` / `TYPE_OPTIONS` のタプル順に従う。
 */
export function SearchForm() {
  const { pokedex, setPokedex, types, setTypes } = usePokemonSearchParams();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <label htmlFor="pokedex-select" className="text-sm font-medium">
          図鑑
        </label>
        <Select
          value={pokedex}
          onValueChange={(value) => {
            if (isPokedexSlug(value)) {
              void setPokedex(value);
            }
          }}
        >
          <SelectTrigger id="pokedex-select" aria-label="図鑑を選択" className="w-48">
            <SelectValue placeholder="図鑑を選択" />
          </SelectTrigger>
          <SelectContent>
            {POKEDEX_OPTIONS.map(({ slug, label }) => (
              <SelectItem key={slug} value={slug}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">タイプ (最大 2 件、AND 絞り込み)</legend>
        <ToggleGroup
          type="multiple"
          variant="outline"
          spacing={4}
          value={[...types]}
          onValueChange={(values: string[]) => {
            void setTypes(filterTypeSlugs(values));
          }}
          aria-label="タイプ絞り込み"
          className="flex-wrap"
        >
          {TYPE_OPTIONS.map(({ slug, label }) => (
            <ToggleGroupItem key={slug} value={slug} aria-label={label}>
              {label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </fieldset>
    </div>
  );
}
