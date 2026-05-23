# フォント最適化

`next/font` を使えば、レイアウトシフトなしでフォントを自動最適化できる。

## Google Fonts

```tsx
// app/layout.tsx
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body>{children}</body>
    </html>
  )
}
```

## 複数フォント

```tsx
import { Inter, Roboto_Mono } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-roboto-mono',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${robotoMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

CSS で使う:

```css
body {
  font-family: var(--font-inter);
}

code {
  font-family: var(--font-roboto-mono);
}
```

## ウェイトとスタイル

```tsx
// 単一ウェイト
const inter = Inter({
  subsets: ['latin'],
  weight: '400',
})

// 複数ウェイト
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
})

// 可変フォント（推奨） - 全ウェイトを含む
const inter = Inter({
  subsets: ['latin'],
  // 可変フォントは全ウェイトに対応するので weight は不要
})

// italic も指定
const inter = Inter({
  subsets: ['latin'],
  style: ['normal', 'italic'],
})
```

## ローカルフォント

```tsx
import localFont from 'next/font/local'

const myFont = localFont({
  src: './fonts/MyFont.woff2',
})

// ウェイトごとに複数ファイルを指定
const myFont = localFont({
  src: [
    {
      path: './fonts/MyFont-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: './fonts/MyFont-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
})

// 可変フォント
const myFont = localFont({
  src: './fonts/MyFont-Variable.woff2',
  variable: '--font-my-font',
})
```

## Tailwind CSS との統合

```tsx
// app/layout.tsx
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}
```

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)'],
      },
    },
  },
}
```

## サブセットのプリロード

必要な文字集合だけを読み込む。

```tsx
// latin のみ（最も一般的）
const inter = Inter({ subsets: ['latin'] })

// 複数のサブセット
const inter = Inter({ subsets: ['latin', 'latin-ext', 'cyrillic'] })
```

## display 戦略

フォントの読み込み挙動を制御する。

```tsx
const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // 既定 - フォールバックを表示し、読み込み後に差し替える
})

// 選択肢:
// 'auto' - ブラウザに任せる
// 'block' - 短い block 期間の後に swap
// 'swap' - 即座にフォールバック、ロード後に差し替え（推奨）
// 'fallback' - 短い block の後、短い swap、最終的にフォールバック
// 'optional' - 短い block の後、swap なし（フォントがオプション扱いの場合）
```

## 手動の font リンクは使わない

Google Fonts には必ず `next/font` を使い、`<link>` タグは使わない。

```tsx
// Bad: 手動の link タグ（描画をブロックし、最適化されない）
<link href="https://fonts.googleapis.com/css2?family=Inter" rel="stylesheet" />

// Bad: display と preconnect が抜けている
<link href="https://fonts.googleapis.com/css2?family=Inter" rel="stylesheet" />

// Good: next/font を使う（self-host されレイアウトシフトもない）
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })
```

## よくあるミス

```tsx
// Bad: 各コンポーネントで font を import している
// components/Button.tsx
import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'] }) // 呼び出すたびに新規インスタンスが作られる!

// Good: layout で一度だけ import し、CSS 変数経由で利用する
// app/layout.tsx
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

// Bad: CSS で @import を使う（描画をブロックする）
/* globals.css */
@import url('https://fonts.googleapis.com/css2?family=Inter');

// Good: next/font を使う（self-host されてネットワークリクエストが発生しない）
import { Inter } from 'next/font/google'

// Bad: 一部のウェイトしか使わないのに全ウェイトを読み込む
const inter = Inter({ subsets: ['latin'] }) // 全ウェイトを読み込む

// Good: 可変フォントでなければ、必要なウェイトだけを指定する
const inter = Inter({ subsets: ['latin'], weight: ['400', '700'] })

// Bad: subset を指定せず全文字を読み込む
const inter = Inter({})

// Good: 必ず subset を指定する
const inter = Inter({ subsets: ['latin'] })
```

## 特定のコンポーネントで使うフォント

```tsx
// コンポーネント固有のフォントは共有ファイルから export する
// lib/fonts.ts
import { Inter, Playfair_Display } from 'next/font/google'

export const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
export const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' })

// components/Heading.tsx
import { playfair } from '@/lib/fonts'

export function Heading({ children }) {
  return <h1 className={playfair.className}>{children}</h1>
}
```
