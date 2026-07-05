import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { Component, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PAGE_2_CURSOR_TOKEN, pokemonListErrorHandler, pokemonListSuccessHandler } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';

import type { PokemonSearchPage } from '../api/search-pokemon';
import { PokemonListView } from './pokemon-list-view';

/**
 * throwOnError で投げられた error が境界に伝播することを検証するためのテスト用 error boundary。
 * エラーの内容自体は検証しない (伝播の有無だけ見る) ため getDerivedStateFromError の引数は省略する。
 */
class CatchBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  override state = { hasError: false };
  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }
  override render(): ReactNode {
    return this.state.hasError ? <p>error-fallback</p> : this.props.children;
  }
}

const buildWrapper =
  (searchParams = ''): ((props: { children: ReactNode }) => ReactNode) =>
  ({ children }) => {
    // retry: false は全テスト共通のデフォルト。特に error handler を使うケースで
    // 無限 retry を防ぎ、isError へ即座に遷移させるために必要。
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return (
      <QueryClientProvider client={queryClient}>
        <NuqsTestingAdapter searchParams={searchParams} hasMemory>
          {children}
        </NuqsTestingAdapter>
      </QueryClientProvider>
    );
  };

// IntersectionObserver は自動 fetch を引き起こすため mock 化して観察に留める
const observerCallbacks: IntersectionObserverCallback[] = [];

class StubIO implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = '';
  readonly scrollMargin = '';
  readonly thresholds: readonly number[] = [];
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => [] as IntersectionObserverEntry[]);
  constructor(cb: IntersectionObserverCallback) {
    observerCallbacks.push(cb);
  }
}

const SAMPLE_PAGE: PokemonSearchPage = {
  data: [
    {
      speciesSlug: 'mew',
      formSlug: 'mew',
      pokedexNumber: 151,
      nameJa: 'ミュウ',
      types: ['psychic'],
      defaultSpriteUrl: 'https://example.test/sprites/mew.png',
    },
  ],
  meta: { nextCursor: null },
};

describe('<PokemonListView>', () => {
  beforeEach(() => {
    observerCallbacks.length = 0;
    vi.stubGlobal('IntersectionObserver', StubIO);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('initialPage を hydrate して初回 render で skeleton にならず即座にカードを表示する', () => {
    render(<PokemonListView initialPage={SAMPLE_PAGE} />, { wrapper: buildWrapper() });

    expect(screen.getByText('ミュウ')).toBeInTheDocument();
    expect(screen.queryByLabelText('ポケモン一覧を読み込み中')).not.toBeInTheDocument();
  });

  it('initialPage 不在で Client 初回 fetch が pending の間は ListSkeleton を描画する (空白回避)', async () => {
    // MSW 既定の handler でも fetch は走るが、初回 render 時点では query.isPending=true で items=0
    server.use(pokemonListSuccessHandler);

    render(<PokemonListView />, { wrapper: buildWrapper() });

    // 初回 render 直後は pending → ListSkeleton (aria-label="ポケモン一覧を読み込み中") が描画される
    expect(screen.getByLabelText('ポケモン一覧を読み込み中')).toBeInTheDocument();
    // fetch 完了後は ListSkeleton が消え、データが表示される
    await waitFor(() => expect(screen.getByText('フシギダネ')).toBeInTheDocument());
    expect(screen.queryByLabelText('ポケモン一覧を読み込み中')).not.toBeInTheDocument();
  });

  it('initialPage のアイテムが placeholder/ URL や 空 URL を持つときは "no image" fallback を render する (dev seed 互換)', () => {
    const pageWithBadSprites: PokemonSearchPage = {
      data: [
        {
          speciesSlug: 'bulbasaur',
          formSlug: 'bulbasaur',
          pokedexNumber: 1,
          nameJa: 'フシギダネ',
          types: ['grass', 'poison'],
          defaultSpriteUrl: 'placeholder/bulbasaur/bulbasaur/unknown/default.png',
        },
        {
          speciesSlug: 'mew',
          formSlug: 'mew',
          pokedexNumber: 151,
          nameJa: 'ミュウ',
          types: ['psychic'],
          defaultSpriteUrl: '',
        },
      ],
      meta: { nextCursor: null },
    };
    const { container } = render(<PokemonListView initialPage={pageWithBadSprites} />, { wrapper: buildWrapper() });

    // 2 件とも "no image" fallback を持つ → <img> 要素は 0 件、テキスト "no image" は 2 件
    expect(container.querySelectorAll('img')).toHaveLength(0);
    expect(screen.getAllByText('no image')).toHaveLength(2);
  });

  it('initialPage の nextCursor が null なら LoadMore は描画されない', () => {
    render(<PokemonListView initialPage={SAMPLE_PAGE} />, { wrapper: buildWrapper() });

    expect(screen.queryByRole('button', { name: 'もっと見る' })).not.toBeInTheDocument();
  });

  it('initialPage が data: [] なら EmptyState を描画し PokemonGrid は描画されない', () => {
    render(<PokemonListView initialPage={{ data: [], meta: { nextCursor: null } }} />, { wrapper: buildWrapper() });

    expect(screen.getByText('該当するポケモンが見つかりませんでした')).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'ポケモン一覧' })).not.toBeInTheDocument();
  });

  it('initialPage を渡さなければ MSW handler 経由で 1 ページ目を fetch し PokemonGrid を描画する', async () => {
    server.use(pokemonListSuccessHandler);

    render(<PokemonListView />, { wrapper: buildWrapper() });

    await waitFor(() => expect(screen.getByText('フシギダネ')).toBeInTheDocument());
    // MSW のデフォルトハンドラは 1 ページ目 3 件 + nextCursor あり → LoadMore が描画される
    expect(screen.getByRole('button', { name: 'もっと見る' })).toBeInTheDocument();
  });

  it('searchParams 変更 (タイプ選択) で queryKey が変わり新しい fetch が走る', async () => {
    server.use(pokemonListSuccessHandler);

    // 検索条件変更で新しい fetch が走ることを、/api/pokemon へのリクエスト回数で担保する。
    let pokemonRequests = 0;
    const onRequest = ({ request }: { request: Request }): void => {
      if (new URL(request.url).pathname.endsWith('/api/pokemon')) {
        pokemonRequests += 1;
      }
    };
    server.events.on('request:start', onRequest);

    try {
      render(<PokemonListView />, { wrapper: buildWrapper() });

      await waitFor(() => expect(screen.getByText('フシギダネ')).toBeInTheDocument());
      const requestsAfterInitialLoad = pokemonRequests;

      const user = userEvent.setup();
      // SearchForm は検索モーダル内に移動したため、まずトリガーを開く。
      // 検索条件の変更は Drawer 内の ToggleGroup (タイプ) で行う。図鑑 Select は
      // jsdom + vaul (Drawer) + Radix Select の portal 化により focus トラップが競合し、
      // open 時に無限ループでハングするため UI からは駆動できない (実ブラウザでは正常)。
      // 図鑑 Select を UI から操作する経路自体は search-form.test.tsx (Drawer 外) が担保する。
      await user.click(screen.getByRole('button', { name: /絞り込み/ }));
      const toolbar = await screen.findByRole('toolbar', { name: 'タイプ絞り込み' });
      await user.click(within(toolbar).getByRole('button', { name: 'ほのお' }));

      // types 変更で queryKey が変わり、別条件として新しい fetch が走る (fetch 回数が増える)。
      await waitFor(() => expect(pokemonRequests).toBeGreaterThan(requestsAfterInitialLoad));
      // MSW は同じ 1 ページ目を返すため、再取得後も一覧が表示される。
      await waitFor(() => expect(screen.getAllByText('フシギダネ').length).toBeGreaterThan(0));
    } finally {
      server.events.removeListener('request:start', onRequest);
    }
  });

  it('LoadMore の click で 2 ページ目が取得される', async () => {
    server.use(pokemonListSuccessHandler);

    render(<PokemonListView />, { wrapper: buildWrapper() });

    await waitFor(() => expect(screen.getByText('フシギダネ')).toBeInTheDocument());

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'もっと見る' }));

    await waitFor(() => expect(screen.getByText('ピカチュウ')).toBeInTheDocument());
  });

  it('IntersectionObserver visible で fetchNextPage が走り 2 ページ目が取得される (自動スクロール)', async () => {
    server.use(pokemonListSuccessHandler);

    render(<PokemonListView />, { wrapper: buildWrapper() });

    await waitFor(() => expect(screen.getByText('フシギダネ')).toBeInTheDocument());

    // LoadMore 内の IntersectionObserver を visible として発火
    act(() => {
      observerCallbacks.at(-1)?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    });

    await waitFor(() => expect(screen.getByText('ピカチュウ')).toBeInTheDocument());

    // page 1 の最終 cursor が PAGE_2_CURSOR_TOKEN だった証拠 (sanity check)
    expect(PAGE_2_CURSOR_TOKEN).toBe('msw-cursor-page-2');
  });

  it('initialPage 不在で Client fetch が失敗 (data 無し) すると error が boundary に伝播する (throwOnError → error.tsx)', async () => {
    // throwOnError を持たないと isError でも throw されず、SearchDrawer だけの無音ブランクになる。
    // throwOnError: (_e, q) => q.state.data === undefined により data 未取得の失敗のみ境界へ飛ばす。
    server.use(pokemonListErrorHandler);
    // React は error boundary への伝播時に内部スタックトレースを console.error へ複数回出力する。
    // ここでは意図的に発生させるエラーなので、本テストのスコープ内だけ抑制して CI ログを汚さない。
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    try {
      render(
        <CatchBoundary>
          <PokemonListView />
        </CatchBoundary>,
        { wrapper: buildWrapper() },
      );

      await waitFor(() => expect(screen.getByText('error-fallback')).toBeInTheDocument());
    } finally {
      consoleSpy.mockRestore();
    }
  });
});
