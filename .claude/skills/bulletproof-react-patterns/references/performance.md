# パフォーマンス

## コード分割

本番 JavaScript をルート単位で分割してロード時間を最適化する。初期ロードに必要なものだけ読み込み、残りは遅延取得する。

```tsx
// app/router.tsx
import { lazy } from "react";

const Dashboard = lazy(() => import("./routes/dashboard"));
const Settings = lazy(() => import("./routes/settings"));
```

過剰な分割は避ける — 小さなチャンクが多すぎるとリクエストオーバーヘッドが増える。クリティカルなルート境界に絞り込む。

## データプリフェッチ

ユーザーがナビゲートする前にデータを取得しておき、体感ロード時間を縮める:

```tsx
function DiscussionLink({ id }: { id: string }) {
    const queryClient = useQueryClient();

    const prefetch = () => {
        queryClient.prefetchQuery({
            queryKey: ["discussion", id],
            queryFn: () => getDiscussion(id),
        });
    };

    return (
        <Link to={`/discussions/${id}`} onMouseEnter={prefetch} onFocus={prefetch}>
            View Discussion
        </Link>
    );
}
```

## state の最適化

### state を分割する

すべてを単一 state に詰め込まない。不要な再レンダリングを避けるため分割する:

```tsx
// モノリシックな state はやめる:
const [state, setState] = useState({ count: 0, name: "", isOpen: false });

// 関心ごとに分割する:
const [count, setCount] = useState(0);
const [name, setName] = useState("");
const [isOpen, setIsOpen] = useState(false);
```

### state を近くに置く

state は利用箇所のできるだけ近くに置く。1 つのコンポーネントツリーでしか使わない state をグローバルストアに巻き上げない。

### initializer 関数

高コストな計算には initializer 関数を使う:

```tsx
// レンダリングごとに実行される:
const [state, setState] = useState(expensiveFn());

// 一度だけ実行される:
const [state, setState] = useState(() => expensiveFn());
```

### Atomic state ライブラリ

多くの要素を同時にトラッキングするアプリでは、[Jotai](https://jotai.pmnd.rs/) のような atomic state ライブラリできめ細かな更新を実現する。

## children による最適化

`children` prop は不要な再レンダリングを避ける最もシンプルな方法。`children` として渡される JSX は親の state 変化で再レンダリングされない独立した VDOM ツリーになる:

```tsx
// 最適化されていない — count 更新のたびに PureComponent も再レンダリングされる
function Counter() {
    const [count, setCount] = useState(0);
    return (
        <div>
            <button onClick={() => setCount((c) => c + 1)}>count is {count}</button>
            <PureComponent />
        </div>
    );
}

// 最適化済み — PureComponent は再レンダリングされない
function App() {
    return (
        <Counter>
            <PureComponent />
        </Counter>
    );
}

function Counter({ children }: { children: React.ReactNode }) {
    const [count, setCount] = useState(0);
    return (
        <div>
            <button onClick={() => setCount((c) => c + 1)}>count is {count}</button>
            {children}
        </div>
    );
}
```

## Context のパフォーマンス

React Context は更新頻度の低いデータ (テーマ、ユーザーデータ、小規模 state) に適している。中〜高頻度更新では:

- selector サポートのために [use-context-selector](https://github.com/dai-shi/use-context-selector) を使う
- もしくは selector を内蔵した state ライブラリ (Zustand, Jotai) を使う

Context に手を伸ばす前に、[state の lift up](https://react.dev/learn/sharing-state-between-components#lifting-state-up-by-example) や [適切なコンポジション](https://react.dev/learn/passing-data-deeply-with-context#before-you-use-context) で解決できないか検討する。

## スタイリングのパフォーマンス

高頻度更新では、ランタイム CSS-in-JS よりゼロランタイムスタイリングを優先する:

| ゼロランタイム (推奨)   | ランタイム (高頻度更新では避ける) |
| ----------------------- | --------------------------------- |
| Tailwind CSS            | styled-components                 |
| vanilla-extract         | emotion                           |
| CSS Modules             |                                   |

## 画像の最適化

- ビューポート外の画像は遅延ロードする
- 高速化のためモダンフォーマット (WebP) を使う
- クライアント画面サイズに合わせた画像を `srcset` で配信する

## Web Vitals

Lighthouse や PageSpeed Insights で [Core Web Vitals](https://web.dev/measure/) (LCP, INP, CLS) を監視する。
