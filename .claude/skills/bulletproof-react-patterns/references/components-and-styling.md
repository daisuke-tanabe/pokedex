# コンポーネントとスタイリング

## コンポーネントのベストプラクティス

### 使用箇所の近くに配置する (コロケーション)

コンポーネント、関数、スタイル、state は利用箇所のできるだけ近くに置く。可読性が上がり、state 更新による不要な再レンダリングが減る。

### ネストしたレンダリング関数を避ける

インラインのレンダリング関数は別コンポーネントに切り出す:

```tsx
// 避ける — すぐに肥大化する
function Component() {
    function renderItems() {
        return <ul>...</ul>;
    }
    return <div>{renderItems()}</div>;
}

// 推奨 — 別コンポーネントに切り出す
function Items() {
    return <ul>...</ul>;
}

function Component() {
    return (
        <div>
            <Items />
        </div>
    );
}
```

### props を絞る

props が多すぎる場合は複数コンポーネントに分割するか、`children` やスロットでコンポジションを使う。

### サードパーティコンポーネントのラップ

サードパーティ製コンポーネントは自分のアプリケーション API に合わせてラップする。依存を 1 ファイルに閉じ込めることで、ライブラリ差し替え時の影響範囲が局所化される:

```tsx
import { Link as RouterLink, type LinkProps as RouterLinkProps } from "react-router";

interface LinkProps extends Omit<RouterLinkProps, "className"> {
    variant?: "default" | "muted";
}

export function Link({ variant = "default", ...props }: LinkProps) {
    return <RouterLink className={linkStyles({ variant })} {...props} />;
}
```

### コンポーネントライブラリ

一貫性と保守性のため、共有コンポーネントの周りに抽象を組み立てる。誤った抽象を避けるため、コンポーネント化する前に繰り返しが本当にあるかを確認する。

## コンポーネント階層

```
Page Components          → ルート単位、features を合成、レイアウトを担当
  └── Feature Components → 機能専用、ビジネスロジックを保持
        └── UI Components      → 共有プリミティブ、ビジネスロジックを持たない
```

### UI Components

- 可能なら **stateless**: データとコールバックは props で受け取る。
- **コンポーザブル**: 複雑な UI は compound component パターンを使う。
- 必要に応じて **ポリモーフィック**: `as` や `asChild` で柔軟なレンダリングを許容する。

### Feature Components

Feature コンポーネントは以下を行ってよい:

- query フック経由でのデータ取得・更新
- 機能専用 state へのアクセス
- ビジネスロジックを含めて UI コンポーネントを合成
- 機能固有のエラー / ローディング状態のハンドリング

## コンポーネントライブラリ

### フル機能 (スタイル付き)

- [Chakra UI](https://chakra-ui.com/) — DX が良い、プロトタイピングが速い、a11y 標準装備
- [AntD](https://ant.design/) — コンポーネントが豊富、管理画面に最適
- [MUI](https://mui.com/) — 最も普及、Material Design or headless
- [Mantine](https://mantine.dev/) — モダン、カスタマイズ性が高く hooks 豊富

### Headless (スタイルなし)

独自デザインシステムを構築するときに最適:

- [Radix UI](https://www.radix-ui.com/)
- [Headless UI](https://headlessui.dev/)
- [React Aria](https://react-spectrum.adobe.com/react-aria/)
- [Ark UI](https://ark-ui.com/)
- [Reakit](https://reakit.io/)

### コードベース (コピペ・改変可能)

パッケージではなくソースコードで提供されるプリビルドコンポーネント:

- [ShadCN UI](https://ui.shadcn.com/)
- [Park UI](https://park-ui.com/)

## スタイリング手法

- [Tailwind CSS](https://tailwindcss.com/) — ユーティリティファースト、ゼロランタイム
- [vanilla-extract](https://github.com/seek-oss/vanilla-extract) — 型安全、ゼロランタイム
- [Panda CSS](https://panda-css.com/) — 型安全、ゼロランタイム
- [CSS Modules](https://github.com/css-modules/css-modules) — スコープ付き、ゼロランタイム
- [styled-components](https://styled-components.com/) — ランタイム CSS-in-JS
- [emotion](https://emotion.sh/) — ランタイム CSS-in-JS

React Server Components を考慮する場合、ゼロランタイム系のスタイリングが必要になる点に注意。

## Storybook

コンポーネントを分離した状態で開発・テストするために [Storybook](https://storybook.js.org/) を使う。開発と発見容易性のためのコンポーネントカタログとしても機能する。
