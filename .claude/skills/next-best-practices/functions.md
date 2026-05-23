# 関数

Next.js の関数 API。

参考: https://nextjs.org/docs/app/api-reference/functions

## ナビゲーションフック（Client）

| Hook | 用途 | Reference |
|------|---------|-----------|
| `useRouter` | プログラマブルなナビゲーション（`push`、`replace`、`back`、`refresh`） | [Docs](https://nextjs.org/docs/app/api-reference/functions/use-router) |
| `usePathname` | 現在の pathname を取得 | [Docs](https://nextjs.org/docs/app/api-reference/functions/use-pathname) |
| `useSearchParams` | URL の search パラメータを読む | [Docs](https://nextjs.org/docs/app/api-reference/functions/use-search-params) |
| `useParams` | 動的ルートのパラメータにアクセス | [Docs](https://nextjs.org/docs/app/api-reference/functions/use-params) |
| `useSelectedLayoutSegment` | アクティブな子セグメント（1 階層） | [Docs](https://nextjs.org/docs/app/api-reference/functions/use-selected-layout-segment) |
| `useSelectedLayoutSegments` | layout より下のアクティブな全セグメント | [Docs](https://nextjs.org/docs/app/api-reference/functions/use-selected-layout-segments) |
| `useLinkStatus` | リンクのプリフェッチ状況を確認 | [Docs](https://nextjs.org/docs/app/api-reference/functions/use-link-status) |
| `useReportWebVitals` | Core Web Vitals のメトリクスを送信 | [Docs](https://nextjs.org/docs/app/api-reference/functions/use-report-web-vitals) |

## サーバー関数

| Function | 用途 | Reference |
|----------|---------|-----------|
| `cookies` | cookie の読み書き | [Docs](https://nextjs.org/docs/app/api-reference/functions/cookies) |
| `headers` | リクエストヘッダの読み取り | [Docs](https://nextjs.org/docs/app/api-reference/functions/headers) |
| `draftMode` | CMS の未公開コンテンツのプレビューを有効化 | [Docs](https://nextjs.org/docs/app/api-reference/functions/draft-mode) |
| `after` | レスポンスのストリーミング完了後にコードを実行 | [Docs](https://nextjs.org/docs/app/api-reference/functions/after) |
| `connection` | 動的レンダリングの前に接続を待機 | [Docs](https://nextjs.org/docs/app/api-reference/functions/connection) |
| `userAgent` | User-Agent ヘッダのパース | [Docs](https://nextjs.org/docs/app/api-reference/functions/userAgent) |

## Generate 関数

| Function | 用途 | Reference |
|----------|---------|-----------|
| `generateStaticParams` | ビルド時に動的ルートを事前生成 | [Docs](https://nextjs.org/docs/app/api-reference/functions/generate-static-params) |
| `generateMetadata` | 動的なメタデータ | [Docs](https://nextjs.org/docs/app/api-reference/functions/generate-metadata) |
| `generateViewport` | 動的な viewport 設定 | [Docs](https://nextjs.org/docs/app/api-reference/functions/generate-viewport) |
| `generateSitemaps` | 大規模サイト向けの複数 sitemap | [Docs](https://nextjs.org/docs/app/api-reference/functions/generate-sitemaps) |
| `generateImageMetadata` | ルートごとに複数の OG image を持つ | [Docs](https://nextjs.org/docs/app/api-reference/functions/generate-image-metadata) |

## Request / Response

| Function | 用途 | Reference |
|----------|---------|-----------|
| `NextRequest` | ヘルパー付きの拡張 Request | [Docs](https://nextjs.org/docs/app/api-reference/functions/next-request) |
| `NextResponse` | ヘルパー付きの拡張 Response | [Docs](https://nextjs.org/docs/app/api-reference/functions/next-response) |
| `ImageResponse` | OG image の生成 | [Docs](https://nextjs.org/docs/app/api-reference/functions/image-response) |

## よく使う例

### ナビゲーション

内部リンクには `<a>` ではなく `next/link` を使う。

```tsx
// Bad: 素の anchor タグ
<a href="/about">About</a>

// Good: Next.js の Link
import Link from 'next/link'

<Link href="/about">About</Link>
```

アクティブリンクのスタイリング:

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function NavLink({ href, children }) {
  const pathname = usePathname()

  return (
    <Link href={href} className={pathname === href ? 'active' : ''}>
      {children}
    </Link>
  )
}
```

### 静的生成

```tsx
// app/blog/[slug]/page.tsx
export async function generateStaticParams() {
  const posts = await getPosts()
  return posts.map((post) => ({ slug: post.slug }))
}
```

### レスポンス後

```tsx
import { after } from 'next/server'

export async function POST(request: Request) {
  const data = await processRequest(request)

  after(async () => {
    await logAnalytics(data)
  })

  return Response.json({ success: true })
}
```
