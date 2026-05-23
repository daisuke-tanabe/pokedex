# Scripts

Next.js でサードパーティスクリプトを読み込む方法。

## next/script を使う

ネイティブの `<script>` タグではなく、必ず `next/script` を使ってパフォーマンスを最適化する。

```tsx
// Bad: ネイティブの script タグ
<script src="https://example.com/script.js"></script>

// Good: Next.js の Script コンポーネント
import Script from 'next/script'

<Script src="https://example.com/script.js" />
```

## インラインスクリプトには id が必要

インラインスクリプトには、Next.js が追跡できるように `id` 属性を付ける。

```tsx
// Bad: id がない
<Script dangerouslySetInnerHTML={{ __html: 'console.log("hi")' }} />

// Good: id がある
<Script id="my-script" dangerouslySetInnerHTML={{ __html: 'console.log("hi")' }} />

// Good: id 付きインライン
<Script id="show-banner">
  {`document.getElementById('banner').classList.remove('hidden')`}
</Script>
```

## Script を Head に入れない

`next/script` は `next/head` の内部に置かない。自身で配置を制御する。

```tsx
// Bad: Head の中に Script を置いている
import Head from 'next/head'
import Script from 'next/script'

<Head>
  <Script src="/analytics.js" />
</Head>

// Good: Script は Head の外
<Head>
  <title>Page</title>
</Head>
<Script src="/analytics.js" />
```

## ロード戦略

```tsx
// afterInteractive（既定） - ページがインタラクティブになった後にロード
<Script src="/analytics.js" strategy="afterInteractive" />

// lazyOnload - アイドル時間にロード
<Script src="/widget.js" strategy="lazyOnload" />

// beforeInteractive - ページがインタラクティブになる前にロード（使用は最小限に）
// app/layout.tsx または pages/_document.js でのみ機能する
<Script src="/critical.js" strategy="beforeInteractive" />

// worker - Web Worker でロード（experimental）
<Script src="/heavy.js" strategy="worker" />
```

## Google Analytics

インラインの GA スクリプトではなく `@next/third-parties` を使う。

```tsx
// Bad: インラインの GA スクリプト
<Script src="https://www.googletagmanager.com/gtag/js?id=G-XXXXX" />
<Script id="ga-init">
  {`window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-XXXXX');`}
</Script>

// Good: Next.js のコンポーネント
import { GoogleAnalytics } from '@next/third-parties/google'

export default function Layout({ children }) {
  return (
    <html>
      <body>{children}</body>
      <GoogleAnalytics gaId="G-XXXXX" />
    </html>
  )
}
```

## Google Tag Manager

```tsx
import { GoogleTagManager } from '@next/third-parties/google'

export default function Layout({ children }) {
  return (
    <html>
      <GoogleTagManager gtmId="GTM-XXXXX" />
      <body>{children}</body>
    </html>
  )
}
```

## その他のサードパーティスクリプト

```tsx
// YouTube の埋め込み
import { YouTubeEmbed } from '@next/third-parties/google'

<YouTubeEmbed videoid="dQw4w9WgXcQ" />

// Google Maps
import { GoogleMapsEmbed } from '@next/third-parties/google'

<GoogleMapsEmbed
  apiKey="YOUR_API_KEY"
  mode="place"
  q="Brooklyn+Bridge,New+York,NY"
/>
```

## クイックリファレンス

| パターン | 問題 | 対処 |
|---------|-------|-----|
| `<script src="...">` | 最適化されない | `next/script` を使う |
| `<Script>` に id がない | インラインスクリプトを追跡できない | `id` 属性を追加する |
| `<Script>` を `<Head>` 内に置く | 配置が誤り | Head の外に出す |
| GA/GTM のインラインスクリプト | 最適化されない | `@next/third-parties` を使う |
| `strategy="beforeInteractive"` を layout 以外で使う | 動作しない | ルートレイアウトでのみ使う |
