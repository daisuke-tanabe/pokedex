import type { PokemonListItem } from '@pokedex/contracts';
import type { ReactNode } from 'react';

import { PokemonCard } from './pokemon-card';

/**
 * 結果一覧の grid layout。breakpoint ごとに列数を増やし、件数 0 では何も描画しない
 * (空状態の表示は親側の `<EmptyState>` が責務)。
 */
export function PokemonGrid({ items, footer }: { items: readonly PokemonListItem[]; footer?: ReactNode }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <ul
        aria-label="ポケモン一覧"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      >
        {items.map((item) => (
          <li key={`${item.speciesSlug}:${item.formSlug}`}>
            <PokemonCard item={item} />
          </li>
        ))}
      </ul>
      {footer}
    </div>
  );
}
