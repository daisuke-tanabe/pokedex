# バンドリング

サードパーティパッケージで起きやすいバンドリング問題への対処。

## サーバー非互換のパッケージ

ブラウザ API（`window`、`document`、`localStorage`）を利用するパッケージは Server Components で失敗する。

### エラーの兆候

```
ReferenceError: window is not defined
ReferenceError: document is not defined
ReferenceError: localStorage is not defined
Module not found: Can't resolve 'fs'
```

### 解決策 1: クライアント専用としてマークする

パッケージが client 側でしか必要ない場合:

```tsx
// Bad: 失敗する - パッケージが window を使っている
import SomeChart from 'some-chart-library'

export default function Page() {
  return <SomeChart />
}

// Good: dynamic import に ssr: false を付ける
import dynamic from 'next/dynamic'

const SomeChart = dynamic(() => import('some-chart-library'), {
  ssr: false,
})

export default function Page() {
  return <SomeChart />
}
```

### 解決策 2: サーバーバンドルから外部化する

server 側で動かすが、バンドリングに問題があるパッケージ:

```js
// next.config.js
module.exports = {
  serverExternalPackages: ['problematic-package'],
}
```

次のような場面で使う:

- ネイティブバインディングを持つパッケージ（sharp、bcrypt）
- バンドルしにくいパッケージ（一部の ORM）
- 循環依存があるパッケージ

### 解決策 3: Client Component ラッパー

使用箇所全体を client component で包む:

```tsx
// components/ChartWrapper.tsx
'use client'

import { Chart } from 'chart-library'

export function ChartWrapper(props) {
  return <Chart {...props} />
}

// app/page.tsx（server component）
import { ChartWrapper } from '@/components/ChartWrapper'

export default function Page() {
  return <ChartWrapper data={data} />
}
```

## CSS の import

`<link>` タグではなく CSS ファイルを import する。Next.js がバンドルと最適化を担う。

```tsx
// Bad: 手動の link タグ
<link rel="stylesheet" href="/styles.css" />

// Good: CSS を import する
import './styles.css'

// Good: CSS Modules
import styles from './Button.module.css'
```

## ポリフィル

Next.js は一般的なポリフィルを自動で同梱する。polyfill.io などの CDN から重複して読み込まないこと。

既に含まれているもの: `Array.from`、`Object.assign`、`Promise`、`fetch`、`Map`、`Set`、`Symbol`、`URLSearchParams` など 50 以上。

```tsx
// Bad: 重複したポリフィル
<script src="https://polyfill.io/v3/polyfill.min.js?features=fetch,Promise,Array.from" />

// Good: Next.js が自動で含めてくれる
```

## ESM / CommonJS の問題

### エラーの兆候

```
SyntaxError: Cannot use import statement outside a module
Error: require() of ES Module
Module not found: ESM packages need to be imported
```

### 解決策: パッケージをトランスパイルする

```js
// next.config.js
module.exports = {
  transpilePackages: ['some-esm-package', 'another-package'],
}
```

## 問題が出やすいパッケージ

| Package | Issue | Solution |
|---------|-------|----------|
| `sharp` | ネイティブバインディング | `serverExternalPackages: ['sharp']` |
| `bcrypt` | ネイティブバインディング | `serverExternalPackages: ['bcrypt']` か `bcryptjs` を使う |
| `canvas` | ネイティブバインディング | `serverExternalPackages: ['canvas']` |
| `recharts` | window を使う | `dynamic(() => import('recharts'), { ssr: false })` |
| `react-quill` | document を使う | `dynamic(() => import('react-quill'), { ssr: false })` |
| `mapbox-gl` | window を使う | `dynamic(() => import('mapbox-gl'), { ssr: false })` |
| `monaco-editor` | window を使う | `dynamic(() => import('@monaco-editor/react'), { ssr: false })` |
| `lottie-web` | document を使う | `dynamic(() => import('lottie-react'), { ssr: false })` |

## バンドル解析

組み込みのアナライザでバンドルサイズを解析する（Next.js 16.1+）:

```bash
next experimental-analyze
```

これで対話 UI が開き、次のことができる:

- ルート、環境（client/server）、種別でフィルタリング
- モジュールサイズと import チェーンの確認
- ツリーマップでの可視化

比較用に出力を保存する:

```bash
next experimental-analyze --output
# 出力は .next/diagnostics/analyze に保存される
```

参考: https://nextjs.org/docs/app/guides/package-bundling

## Webpack から Turbopack への移行

Next.js 15 以降は Turbopack が既定のバンドラ。カスタム webpack 設定があれば、Turbopack 互換のものに移行する。

```js
// next.config.js
module.exports = {
  // Good: Turbopack で動く
  serverExternalPackages: ['package'],
  transpilePackages: ['package'],

  // Bad: webpack 専用 - ここから移行する
  webpack: (config) => {
    // カスタム webpack 設定
  },
}
```

参考: https://nextjs.org/docs/app/building-your-application/upgrading/from-webpack-to-turbopack
