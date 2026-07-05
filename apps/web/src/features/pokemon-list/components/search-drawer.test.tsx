import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { SearchDrawer } from './search-drawer';

const buildWrapper =
  (searchParams = ''): ((props: { children: ReactNode }) => ReactNode) =>
  ({ children }) => (
    <NuqsTestingAdapter searchParams={searchParams} hasMemory>
      {children}
    </NuqsTestingAdapter>
  );

describe('<SearchDrawer>', () => {
  it('初期状態では Drawer は閉じており検索フォームは描画されない', () => {
    render(<SearchDrawer />, { wrapper: buildWrapper() });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('図鑑を選択')).not.toBeInTheDocument();
  });

  it('トリガークリックで Drawer が開き検索フォームが描画される', async () => {
    const user = userEvent.setup();
    render(<SearchDrawer />, { wrapper: buildWrapper() });

    await user.click(screen.getByRole('button', { name: /絞り込み/ }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByLabelText('図鑑を選択')).toBeInTheDocument();
    // radix ToggleGroup (type=multiple, roving focus) は Root を role="toolbar" で描画する
    expect(within(dialog).getByRole('toolbar', { name: 'タイプ絞り込み' })).toBeInTheDocument();
  });

  it('Escape で Drawer が閉じる', async () => {
    const user = userEvent.setup();
    render(<SearchDrawer />, { wrapper: buildWrapper() });

    const trigger = screen.getByRole('button', { name: /絞り込み/ });
    await user.click(trigger);
    await screen.findByRole('dialog');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await user.keyboard('{Escape}');

    // vaul は閉じるアニメーション中も content を一時的に残すため、DOM 消滅ではなく
    // open 状態 (trigger の aria-expanded / content の data-state) で閉成を検証する。
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
    expect(screen.getByRole('dialog')).toHaveAttribute('data-state', 'closed');
  });

  it('タイプ未選択のときトリガーに件数バッジを出さない', () => {
    render(<SearchDrawer />, { wrapper: buildWrapper() });

    expect(screen.queryByLabelText(/件選択中/)).not.toBeInTheDocument();
  });

  it('タイプが選択されているとトリガーに選択件数バッジを表示する', () => {
    render(<SearchDrawer />, { wrapper: buildWrapper('?types=fire,flying') });

    const badge = screen.getByLabelText('タイプ 2 件選択中');
    expect(badge).toHaveTextContent('2');
  });

  it('Drawer 内のタイプ選択が即時に URL state へ反映される (適用ボタンなし)', async () => {
    const onUrlUpdate = vi.fn();
    const user = userEvent.setup();
    render(<SearchDrawer />, {
      wrapper: ({ children }) => (
        <NuqsTestingAdapter searchParams="" hasMemory onUrlUpdate={onUrlUpdate}>
          {children}
        </NuqsTestingAdapter>
      ),
    });

    await user.click(screen.getByRole('button', { name: /絞り込み/ }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'ほのお' }));

    const lastCall = onUrlUpdate.mock.calls.at(-1)?.[0];
    expect(lastCall?.searchParams.get('types')).toBe('fire');
  });
});
