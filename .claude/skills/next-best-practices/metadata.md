# メタデータ

Metadata API を使って Next.js のページに SEO 用のメタデータを追加する。

## 重要: Server Component でしか使えない

`metadata` オブジェクトと `generateMetadata` 関数は **Server Component でのみサポート** される。Client Component では使えない。

対象ページに `'use client'` が付いている場合は、次のいずれかで対処する。

1. 可能なら `'use client'` を外し、client 側のロジックを子コンポーネントに移す
2. メタデータを親の Server Component の layout に抽出する
3. ファイルを分割する: Server Component がメタデータを持ち、Client Component を import する

## 静的メタデータ

```tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Page Title',
  description: 'Page description for search engines',
}
```

## 動的メタデータ

```tsx
import type { Metadata } from 'next'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  return { title: post.title, description: post.description }
}
```

## 重複した fetch を避ける

メタデータとページで同じデータを使う場合は React の `cache()` を活用する。

```tsx
import { cache } from 'react'

export const getPost = cache(async (slug: string) => {
  return await db.posts.findFirst({ where: { slug } })
})
```

## Viewport

ストリーミングをサポートするため、メタデータとは別に定義する。

```tsx
import type { Viewport } from 'next'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000',
}

// 動的に生成する場合
export function generateViewport({ params }): Viewport {
  return { themeColor: getThemeColor(params) }
}
```

## タイトルテンプレート

サイト全体で命名を統一するため、ルートレイアウトで設定する。

```tsx
export const metadata: Metadata = {
  title: { default: 'Site Name', template: '%s | Site Name' },
}
```

## メタデータファイル規約

参考: https://nextjs.org/docs/app/getting-started/project-structure#metadata-file-conventions

`app/` ディレクトリ（または各ルートセグメント）に以下のファイルを配置する。

| ファイル | 用途 |
|------|---------|
| `favicon.ico` | favicon |
| `icon.png` / `icon.svg` | アプリアイコン |
| `apple-icon.png` | Apple のアプリアイコン |
| `opengraph-image.png` | OG image |
| `twitter-image.png` | Twitter カード画像 |
| `sitemap.ts` / `sitemap.xml` | sitemap（複数生成する場合は `generateSitemaps` を使う） |
| `robots.ts` / `robots.txt` | robots ディレクティブ |
| `manifest.ts` / `manifest.json` | Web App Manifest |

## SEO のベストプラクティス: 静的ファイルだけで十分なことが多い

ほとんどのサイトでは、**静的なメタデータファイルだけで SEO は十分カバーできる**。

```
app/
├── favicon.ico
├── opengraph-image.png     # OG と Twitter の両方で機能する
├── sitemap.ts
├── robots.ts
└── layout.tsx              # title / description を含むメタデータ
```

**Tips:**

- `opengraph-image.png` を 1 枚用意すれば、Open Graph と Twitter の両方をカバーできる（Twitter は OG にフォールバックする）
- layout のメタデータに静的な `title` と `description` があれば、ほとんどのページで足りる
- ページごとに内容が変わる場合のみ、動的な `generateMetadata` を使う

---

# OG image の生成

`next/og` を使って動的な Open Graph 画像を生成する。

## 重要なルール

1. **`next/og` を使う** - `@vercel/og` ではない（Next.js に組み込まれている）
2. **searchParams は使えない** - OG image から search params にアクセスできない。ルートパラメータを使う
3. **Edge ランタイムは避ける** - 既定の Node.js ランタイムを使う

```tsx
// Good
import { ImageResponse } from 'next/og'

// Bad
// import { ImageResponse } from '@vercel/og'
// export const runtime = 'edge'
```

## 基本的な OG image

```tsx
// app/opengraph-image.tsx
import { ImageResponse } from 'next/og'

export const alt = 'Site Name'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: 'white',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        Hello World
      </div>
    ),
    { ...size }
  )
}
```

## 動的な OG image

```tsx
// app/blog/[slug]/opengraph-image.tsx
import { ImageResponse } from 'next/og'

export const alt = 'Blog Post'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

type Props = { params: Promise<{ slug: string }> }

export default async function Image({ params }: Props) {
  const { slug } = await params
  const post = await getPost(slug)

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 48,
          background: 'linear-gradient(to bottom, #1a1a1a, #333)',
          color: 'white',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 48,
        }}
      >
        <div style={{ fontSize: 64, fontWeight: 'bold' }}>{post.title}</div>
        <div style={{ marginTop: 24, opacity: 0.8 }}>{post.description}</div>
      </div>
    ),
    { ...size }
  )
}
```

## カスタムフォント

```tsx
import { ImageResponse } from 'next/og'
import { join } from 'path'
import { readFile } from 'fs/promises'

export default async function Image() {
  const fontPath = join(process.cwd(), 'assets/fonts/Inter-Bold.ttf')
  const fontData = await readFile(fontPath)

  return new ImageResponse(
    (
      <div style={{ fontFamily: 'Inter', fontSize: 64 }}>
        Custom Font Text
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [{ name: 'Inter', data: fontData, style: 'normal' }],
    }
  )
}
```

## ファイル名

- `opengraph-image.tsx` - Open Graph（Facebook、LinkedIn）
- `twitter-image.tsx` - Twitter/X カード（任意。OG にフォールバックされる）

## スタイリングに関する注意

ImageResponse は Flexbox レイアウトを使う。

- `display: 'flex'` を使う
- CSS Grid はサポートされない
- スタイルはインラインオブジェクトで指定する

## 複数の OG image

ルートあたり複数の image を持たせる場合は `generateImageMetadata` を使う。

```tsx
// app/blog/[slug]/opengraph-image.tsx
import { ImageResponse } from 'next/og'

export async function generateImageMetadata({ params }) {
  const images = await getPostImages(params.slug)
  return images.map((img, idx) => ({
    id: idx,
    alt: img.alt,
    size: { width: 1200, height: 630 },
    contentType: 'image/png',
  }))
}

export default async function Image({ params, id }) {
  const images = await getPostImages(params.slug)
  const image = images[id]
  return new ImageResponse(/* ... */)
}
```

## 複数の sitemap

大規模サイトでは `generateSitemaps` を使う。

```tsx
// app/sitemap.ts
import type { MetadataRoute } from 'next'

export async function generateSitemaps() {
  // sitemap の ID 配列を返す
  return [{ id: 0 }, { id: 1 }, { id: 2 }]
}

export default async function sitemap({
  id,
}: {
  id: number
}): Promise<MetadataRoute.Sitemap> {
  const start = id * 50000
  const end = start + 50000
  const products = await getProducts(start, end)

  return products.map((product) => ({
    url: `https://example.com/product/${product.id}`,
    lastModified: product.updatedAt,
  }))
}
```

`/sitemap/0.xml`、`/sitemap/1.xml` といった URL が生成される。
