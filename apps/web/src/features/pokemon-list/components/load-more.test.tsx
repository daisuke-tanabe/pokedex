import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LoadMore } from './load-more';

type Observer = {
  callback: IntersectionObserverCallback;
  observe: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  fire: (isIntersecting: boolean) => void;
};

const observers: Observer[] = [];

class MockIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = '';
  readonly scrollMargin = '';
  readonly thresholds: readonly number[] = [];
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => [] as IntersectionObserverEntry[]);

  constructor(cb: IntersectionObserverCallback) {
    observers.push({
      callback: cb,
      observe: this.observe,
      disconnect: this.disconnect,
      fire: (isIntersecting) => {
        cb([{ isIntersecting } as IntersectionObserverEntry], this);
      },
    });
  }
}

describe('<LoadMore>', () => {
  beforeEach(() => {
    observers.length = 0;
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('IntersectionObserver で viewport に入ると onLoadMore が呼ばれる', () => {
    const onLoadMore = vi.fn();
    render(<LoadMore onLoadMore={onLoadMore} isLoading={false} />);

    expect(observers).toHaveLength(1);
    act(() => {
      observers[0]?.fire(true);
    });

    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('ボタンを click すると onLoadMore が呼ばれる (a11y フォールバック)', async () => {
    const user = userEvent.setup();
    const onLoadMore = vi.fn();
    render(<LoadMore onLoadMore={onLoadMore} isLoading={false} />);

    await user.click(screen.getByRole('button', { name: 'もっと見る' }));

    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('isLoading=true のとき Button が disabled + skeleton が表示される', () => {
    const { container } = render(<LoadMore onLoadMore={vi.fn()} isLoading={true} />);

    expect(screen.getByRole('button', { name: 'もっと見る' })).toBeDisabled();
    // Skeleton は data-slot="skeleton" を持つ
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
  });

  it('isLoading=true のとき IntersectionObserver が viewport に入っても onLoadMore は呼ばれない', () => {
    const onLoadMore = vi.fn();
    render(<LoadMore onLoadMore={onLoadMore} isLoading={true} />);

    act(() => {
      observers[0]?.fire(true);
    });

    expect(onLoadMore).not.toHaveBeenCalled();
  });
});
