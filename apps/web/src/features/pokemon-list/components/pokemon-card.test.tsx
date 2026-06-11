import type { PokemonListItem } from '@pokedex/contracts';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PokemonCard } from './pokemon-card';

const PIKACHU: PokemonListItem = {
  speciesSlug: 'pikachu',
  formSlug: 'pikachu',
  pokedexNumber: 25,
  nameJa: 'ピカチュウ',
  types: ['electric'],
  defaultSpriteUrl: 'https://example.test/sprites/pikachu.png',
};

describe('<PokemonCard>', () => {
  it('species name / sprite / types badge を描画する', () => {
    render(<PokemonCard item={PIKACHU} />);

    expect(screen.getByText('ピカチュウ')).toBeInTheDocument();
    const sprite = screen.getByAltText('ピカチュウ');
    expect(sprite).toHaveAttribute('src', PIKACHU.defaultSpriteUrl);
    expect(screen.getByText('でんき')).toBeInTheDocument();
  });

  it('リンクを持たない (<a> 要素 0 件)', () => {
    const { container } = render(<PokemonCard item={PIKACHU} />);

    expect(container.querySelectorAll('a')).toHaveLength(0);
  });

  it('pokedexNumber は 4 桁ゼロ埋めで表示される (#0025)', () => {
    render(<PokemonCard item={PIKACHU} />);

    expect(screen.getByText('#0025')).toBeInTheDocument();
  });

  it('2 タイプ持つポケモンは badge が 2 件描画される', () => {
    render(
      <PokemonCard
        item={{
          ...PIKACHU,
          speciesSlug: 'charizard',
          formSlug: 'charizard',
          pokedexNumber: 6,
          nameJa: 'リザードン',
          types: ['fire', 'flying'],
        }}
      />,
    );

    expect(screen.getByText('ほのお')).toBeInTheDocument();
    expect(screen.getByText('ひこう')).toBeInTheDocument();
    expect(screen.getByText('#0006')).toBeInTheDocument();
  });

  it('defaultSpriteUrl が空のとき "no image" fallback を表示し <img> を出さない', () => {
    const { container } = render(<PokemonCard item={{ ...PIKACHU, defaultSpriteUrl: '' }} />);

    expect(screen.getByText('no image')).toBeInTheDocument();
    expect(container.querySelectorAll('img')).toHaveLength(0);
  });

  it('defaultSpriteUrl が placeholder/... の場合も "no image" fallback を表示する (dev seed 対策)', () => {
    const { container } = render(
      <PokemonCard item={{ ...PIKACHU, defaultSpriteUrl: 'placeholder/pikachu/pikachu/unknown/default.png' }} />,
    );

    expect(screen.getByText('no image')).toBeInTheDocument();
    expect(container.querySelectorAll('img')).toHaveLength(0);
  });
});
