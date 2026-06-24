import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import ErrorBoundary from './error';

describe('error.tsx', () => {
  it("'use client' ディレクティブで始まり error / reset prop を受ける default export", async () => {
    const source = await readFile(resolve(import.meta.dirname, 'error.tsx'), 'utf8');
    expect(source.trimStart()).toMatch(/^'use client'/u);
    expect(source).toMatch(/reset/u);
  });

  it('再試行ボタンを click すると reset が呼ばれる', async () => {
    const reset = vi.fn();
    const user = userEvent.setup();

    render(<ErrorBoundary error={new Error('fetch failed')} reset={reset} />);

    await user.click(screen.getByRole('button', { name: '再試行' }));

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('エラー文言が描画される', () => {
    render(<ErrorBoundary error={new Error('fetch failed')} reset={vi.fn()} />);

    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
    expect(screen.getByText('ポケモン一覧の取得に失敗しました。時間をおいて再試行してください。')).toBeInTheDocument();
  });
});
