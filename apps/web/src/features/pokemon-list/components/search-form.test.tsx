import { POKEDEX_SLUG_VALUES, TYPE_SLUG_VALUES } from '@pokedex/contracts';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { SearchForm } from './search-form';

const buildWrapper =
  (searchParams = ''): ((props: { children: ReactNode }) => ReactNode) =>
  ({ children }) => (
    <NuqsTestingAdapter searchParams={searchParams} hasMemory>
      {children}
    </NuqsTestingAdapter>
  );

describe('<SearchForm>', () => {
  it('pokedex select の trigger を開くと POKEDEX_SLUG_VALUES の全項目が描画される', async () => {
    const user = userEvent.setup();
    render(<SearchForm />, { wrapper: buildWrapper() });

    await user.click(screen.getByLabelText('図鑑を選択'));

    const listbox = await screen.findByRole('listbox');
    for (const slug of POKEDEX_SLUG_VALUES) {
      expect(
        within(listbox).getByRole('option', { name: new RegExp(slug === 'national' ? '全国図鑑' : 'パルデア図鑑') }),
      ).toBeInTheDocument();
    }
  });

  it('pokedex を変更すると onUrlUpdate が呼ばれ即時に URL が更新される', async () => {
    const onUrlUpdate = vi.fn();
    const user = userEvent.setup();
    render(<SearchForm />, {
      wrapper: ({ children }) => (
        <NuqsTestingAdapter searchParams="" hasMemory onUrlUpdate={onUrlUpdate}>
          {children}
        </NuqsTestingAdapter>
      ),
    });

    await user.click(screen.getByLabelText('図鑑を選択'));
    const listbox = await screen.findByRole('listbox');
    await user.click(within(listbox).getByRole('option', { name: 'パルデア図鑑' }));

    expect(onUrlUpdate).toHaveBeenCalled();
    const lastCall = onUrlUpdate.mock.calls.at(-1)?.[0];
    expect(lastCall?.searchParams.get('pokedex')).toBe('paldea');
  });

  it('type toggle-group が TYPE_SLUG_VALUES の 18 項目を描画する', () => {
    render(<SearchForm />, { wrapper: buildWrapper() });

    // radix ToggleGroup (type=multiple, roving focus) は Root を role="toolbar" で描画する
    const group = screen.getByRole('toolbar', { name: 'タイプ絞り込み' });
    // ToggleGroupItem は radio もしくは button として描画される (Radix の type=multiple は button[aria-pressed])
    const items = within(group).getAllByRole('button');
    expect(items).toHaveLength(TYPE_SLUG_VALUES.length);
  });

  it('2 件選択 (fire, flying) で URL が CSV 形式 ?types=fire,flying に同期される', async () => {
    // throttle の存在自体は use-pokemon-search-params.test.tsx で `withOptions({ limitUrlUpdates })` の
    // 設定として担保している。ここでは「最終的に URL が `types=fire,flying` になる」事実だけを検証する
    // (rateLimitFactor=0 デフォルトで throttle を無効化し、両クリック後の最終状態を見る)。
    const onUrlUpdate = vi.fn();
    const user = userEvent.setup();
    render(<SearchForm />, {
      wrapper: ({ children }) => (
        <NuqsTestingAdapter searchParams="" hasMemory onUrlUpdate={onUrlUpdate}>
          {children}
        </NuqsTestingAdapter>
      ),
    });

    // radix ToggleGroup (type=multiple, roving focus) は Root を role="toolbar" で描画する
    const group = screen.getByRole('toolbar', { name: 'タイプ絞り込み' });
    await user.click(within(group).getByRole('button', { name: 'ほのお' }));
    await user.click(within(group).getByRole('button', { name: 'ひこう' }));

    const lastCall = onUrlUpdate.mock.calls.at(-1)?.[0];
    expect(lastCall?.searchParams.get('types')).toBe('fire,flying');
  });

  it('既に 2 件選択された状態でさらに 1 件選ぶと最古が外れ新しい 2 件が active になる (FIFO)', async () => {
    const user = userEvent.setup();
    render(<SearchForm />, { wrapper: buildWrapper('?types=fire,flying') });

    // radix ToggleGroup (type=multiple, roving focus) は Root を role="toolbar" で描画する
    const group = screen.getByRole('toolbar', { name: 'タイプ絞り込み' });
    const fire = within(group).getByRole('button', { name: 'ほのお' });
    const flying = within(group).getByRole('button', { name: 'ひこう' });
    const water = within(group).getByRole('button', { name: 'みず' });

    expect(fire).toHaveAttribute('data-state', 'on');
    expect(flying).toHaveAttribute('data-state', 'on');
    expect(water).toHaveAttribute('data-state', 'off');

    await user.click(water);

    // 最古の fire が外れ、flying / water が active になる
    expect(fire).toHaveAttribute('data-state', 'off');
    expect(flying).toHaveAttribute('data-state', 'on');
    expect(water).toHaveAttribute('data-state', 'on');
  });

  it('ほのお→くさ→でんき の順に選ぶと最古が落ちて くさ,でんき が URL に残る (FIFO 例)', async () => {
    const onUrlUpdate = vi.fn();
    const user = userEvent.setup();
    render(<SearchForm />, {
      wrapper: ({ children }) => (
        <NuqsTestingAdapter searchParams="" hasMemory onUrlUpdate={onUrlUpdate}>
          {children}
        </NuqsTestingAdapter>
      ),
    });

    // radix ToggleGroup (type=multiple, roving focus) は Root を role="toolbar" で描画する
    const group = screen.getByRole('toolbar', { name: 'タイプ絞り込み' });
    await user.click(within(group).getByRole('button', { name: 'ほのお' }));
    await user.click(within(group).getByRole('button', { name: 'くさ' }));
    await user.click(within(group).getByRole('button', { name: 'でんき' }));

    const lastCall = onUrlUpdate.mock.calls.at(-1)?.[0];
    expect(lastCall?.searchParams.get('types')).toBe('grass,electric');
  });
});
