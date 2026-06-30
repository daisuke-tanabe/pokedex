import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EmptyState } from './empty-state';

describe('<EmptyState>', () => {
  it('「該当するポケモンが見つかりませんでした」相当の文言を表示する', () => {
    render(<EmptyState />);

    expect(screen.getByText('該当するポケモンが見つかりませんでした')).toBeInTheDocument();
    expect(screen.getByText('条件を変えてみてください')).toBeInTheDocument();
  });

  it('role=status を持つ (スクリーンリーダーへの状態通知)', () => {
    render(<EmptyState />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
