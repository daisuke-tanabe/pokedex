---
name: next-cache-components
description: Next.js 16 の Cache Components - PPR、use cache ディレクティブ、cacheLife、cacheTag、updateTag
---

# Cache Components (Next.js 16+)

Cache Components を使うと Partial Prerendering (PPR) が有効になり、1 つのルート内で静的・キャッシュ・動的なコンテンツを混在させられる。

## Cache Components を有効化する

```ts
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
}

export default nextConfig
```

これは従来の `experimental.ppr` フラグを置き換える。

---

## 3 種類のコンテンツタイプ

Cache Components を有効化すると、コンテンツは以下の 3 つに分類される。

### 1. 静的（自動プリレンダリング）

同期コード、import、純粋計算などはビルド時にプリレンダリングされる。

```tsx
export default function Page() {
  return (
    <header>
      <h1>Our Blog</h1>  {/* 静的 - 即時表示 */}
      <nav>...</nav>
    </header>
  )
}
```

### 2. キャッシュ（`use cache`）

毎リクエスト最新化が不要な非同期データ。

```tsx
async function BlogPosts() {
  'use cache'
  cacheLife('hours')

  const posts = await db.posts.findMany()
  return <PostList posts={posts} />
}
```

### 3. 動的（Suspense）

常に最新が必要なランタイムデータは Suspense で包む。

```tsx
import { Suspense } from 'react'

export default function Page() {
  return (
    <>
      <BlogPosts />  {/* キャッシュ */}

      <Suspense fallback={<p>Loading...</p>}>
        <UserPreferences />  {/* 動的 - ストリーミング配信 */}
      </Suspense>
    </>
  )
}

async function UserPreferences() {
  const theme = (await cookies()).get('theme')?.value
  return <p>Theme: {theme}</p>
}
```

---

## `use cache` ディレクティブ

### ファイル単位

```tsx
'use cache'

export default async function Page() {
  // ページ全体がキャッシュされる
  const data = await fetchData()
  return <div>{data}</div>
}
```

### コンポーネント単位

```tsx
export async function CachedComponent() {
  'use cache'
  const data = await fetchData()
  return <div>{data}</div>
}
```

### 関数単位

```tsx
export async function getData() {
  'use cache'
  return db.query('SELECT * FROM posts')
}
```

---

## キャッシュプロファイル

### 組み込みプロファイル

```tsx
'use cache'                    // デフォルト: stale 5 分、revalidate 15 分
```

```tsx
'use cache: remote'           // プラットフォーム提供のキャッシュ（Redis、KV）
```

```tsx
'use cache: private'          // コンプライアンス用途。ランタイム API の利用を許可
```

### `cacheLife()` - 寿命をカスタマイズ

```tsx
import { cacheLife } from 'next/cache'

async function getData() {
  'use cache'
  cacheLife('hours')  // 組み込みプロファイル
  return fetch('/api/data')
}
```

組み込みプロファイル: `'default'`, `'minutes'`, `'hours'`, `'days'`, `'weeks'`, `'max'`

### インライン設定

```tsx
async function getData() {
  'use cache'
  cacheLife({
    stale: 3600,      // 1 時間 - 再検証中も stale を返す
    revalidate: 7200, // 2 時間 - バックグラウンド再検証の間隔
    expire: 86400,    // 1 日 - ハード期限
  })
  return fetch('/api/data')
}
```

---

## キャッシュ無効化

### `cacheTag()` - キャッシュにタグを付ける

```tsx
import { cacheTag } from 'next/cache'

async function getProducts() {
  'use cache'
  cacheTag('products')
  return db.products.findMany()
}

async function getProduct(id: string) {
  'use cache'
  cacheTag('products', `product-${id}`)
  return db.products.findUnique({ where: { id } })
}
```

### `updateTag()` - 即時無効化

同一リクエスト内でキャッシュを更新したい場合に使う。

```tsx
'use server'

import { updateTag } from 'next/cache'

export async function updateProduct(id: string, data: FormData) {
  await db.products.update({ where: { id }, data })
  updateTag(`product-${id}`)  // 即時 - 同一リクエスト内で最新データが見える
}
```

### `revalidateTag()` - バックグラウンド再検証

stale-while-revalidate 動作に使う。

```tsx
'use server'

import { revalidateTag } from 'next/cache'

export async function createPost(data: FormData) {
  await db.posts.create({ data })
  revalidateTag('posts')  // バックグラウンド - 次のリクエストから最新データが見える
}
```

---

## ランタイムデータの制約

`use cache` 内では `cookies()`、`headers()`、`searchParams` に**アクセスできない**。

### 解決策: 引数として渡す

```tsx
// 誤り - use cache 内でランタイム API を使っている
async function CachedProfile() {
  'use cache'
  const session = (await cookies()).get('session')?.value  // エラー！
  return <div>{session}</div>
}

// 正しい - 外側で取得し、引数として渡す
async function ProfilePage() {
  const session = (await cookies()).get('session')?.value
  return <CachedProfile sessionId={session} />
}

async function CachedProfile({ sessionId }: { sessionId: string }) {
  'use cache'
  // sessionId は自動的にキャッシュキーの一部になる
  const data = await fetchUserData(sessionId)
  return <div>{data.name}</div>
}
```

### 例外: `use cache: private`

リファクタリングできないコンプライアンス要件向け。

```tsx
async function getData() {
  'use cache: private'
  const session = (await cookies()).get('session')?.value  // 許可される
  return fetchData(session)
}
```

---

## キャッシュキーの生成

キャッシュキーは以下から自動的に生成される。

- **ビルド ID** - デプロイ時にすべてのキャッシュを無効化する
- **関数 ID** - 関数の位置のハッシュ
- **シリアライズ可能な引数** - props がキーの一部になる
- **クロージャ変数** - 外側スコープの値も含まれる

```tsx
async function Component({ userId }: { userId: string }) {
  const getData = async (filter: string) => {
    'use cache'
    // キャッシュキー = userId（クロージャ） + filter（引数）
    return fetch(`/api/users/${userId}?filter=${filter}`)
  }
  return getData('active')
}
```

---

## 完全な例

```tsx
import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { cacheLife, cacheTag } from 'next/cache'

export default function DashboardPage() {
  return (
    <>
      {/* 静的シェル - CDN から即時配信 */}
      <header><h1>Dashboard</h1></header>
      <nav>...</nav>

      {/* キャッシュ - 高速、1 時間ごとに再検証 */}
      <Stats />

      {/* 動的 - 最新データをストリーミング */}
      <Suspense fallback={<NotificationsSkeleton />}>
        <Notifications />
      </Suspense>
    </>
  )
}

async function Stats() {
  'use cache'
  cacheLife('hours')
  cacheTag('dashboard-stats')

  const stats = await db.stats.aggregate()
  return <StatsDisplay stats={stats} />
}

async function Notifications() {
  const userId = (await cookies()).get('userId')?.value
  const notifications = await db.notifications.findMany({
    where: { userId, read: false }
  })
  return <NotificationList items={notifications} />
}
```

---

## 旧バージョンからの移行

| 旧設定 | 置き換え先 |
|-----------|-------------|
| `experimental.ppr` | `cacheComponents: true` |
| `dynamic = 'force-dynamic'` | 削除（デフォルト動作） |
| `dynamic = 'force-static'` | `'use cache'` + `cacheLife('max')` |
| `revalidate = N` | `cacheLife({ revalidate: N })` |
| `unstable_cache()` | `'use cache'` ディレクティブ |

### `unstable_cache` から `use cache` への移行

Next.js 16 では `unstable_cache` は `use cache` ディレクティブに置き換えられた。`cacheComponents` を有効化している場合、`unstable_cache` の呼び出しを `use cache` 関数に変換する。

**変更前 (`unstable_cache`):**

```tsx
import { unstable_cache } from 'next/cache'

const getCachedUser = unstable_cache(
  async (id) => getUser(id),
  ['my-app-user'],
  {
    tags: ['users'],
    revalidate: 60,
  }
)

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCachedUser(id)
  return <div>{user.name}</div>
}
```

**変更後 (`use cache`):**

```tsx
import { cacheLife, cacheTag } from 'next/cache'

async function getCachedUser(id: string) {
  'use cache'
  cacheTag('users')
  cacheLife({ revalidate: 60 })
  return getUser(id)
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCachedUser(id)
  return <div>{user.name}</div>
}
```

主な違い:

- **手動キャッシュキー不要** - `use cache` は関数の引数とクロージャから自動的にキーを生成する。`unstable_cache` の `keyParts` 配列はもう必要ない。
- **タグ** - `options.tags` を関数内の `cacheTag()` 呼び出しに置き換える。
- **再検証** - `options.revalidate` を `cacheLife({ revalidate: N })` または `cacheLife('minutes')` のような組み込みプロファイルに置き換える。
- **動的データ** - `unstable_cache` はコールバック内での `cookies()` や `headers()` をサポートしていなかった。`use cache` でも同じ制約があるが、必要であれば `'use cache: private'` を使える。

---

## 制限事項

- **Edge ランタイム非対応** - Node.js が必要
- **静的エクスポート非対応** - サーバーが必要
- **非決定的な値**（`Math.random()`、`Date.now()`）は `use cache` 内ではビルド時に 1 度だけ実行される

キャッシュ外でリクエスト時のランダム性が必要な場合:

```tsx
import { connection } from 'next/server'

async function DynamicContent() {
  await connection()  // リクエスト時まで遅延
  const id = crypto.randomUUID()  // リクエストごとに異なる
  return <div>{id}</div>
}
```

参考リンク:

- [Cache Components Guide](https://nextjs.org/docs/app/getting-started/cache-components)
- [use cache Directive](https://nextjs.org/docs/app/api-reference/directives/use-cache)
- [unstable_cache (legacy)](https://nextjs.org/docs/app/api-reference/functions/unstable_cache)
