# Suspense 境界

Suspense 境界が無いと CSR bailout を引き起こすクライアントフック。

## useSearchParams

静的ルートでは必ず Suspense 境界が必要。Suspense 境界がないとページ全体が client side rendering になる。

```tsx
// Bad: ページ全体が CSR になる
'use client'

import { useSearchParams } from 'next/navigation'

export default function SearchBar() {
  const searchParams = useSearchParams()
  return <div>Query: {searchParams.get('q')}</div>
}
```

```tsx
// Good: Suspense で包む
import { Suspense } from 'react'
import SearchBar from './search-bar'

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchBar />
    </Suspense>
  )
}
```

## usePathname

ルートに動的パラメータが含まれる場合は Suspense 境界が必要。

```tsx
// 動的ルート [slug] で使う
// Bad: Suspense なし
'use client'
import { usePathname } from 'next/navigation'

export function Breadcrumb() {
  const pathname = usePathname()
  return <nav>{pathname}</nav>
}
```

```tsx
// Good: Suspense で包む
<Suspense fallback={<BreadcrumbSkeleton />}>
  <Breadcrumb />
</Suspense>
```

`generateStaticParams` を使っているなら、Suspense は任意。

## クイックリファレンス

| Hook | Suspense が必須か |
|------|-------------------|
| `useSearchParams()` | Yes |
| `usePathname()` | Yes（動的ルート） |
| `useParams()` | No |
| `useRouter()` | No |
