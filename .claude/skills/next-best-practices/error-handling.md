# エラー処理

Next.js アプリケーションでエラーを丁寧に扱う方法。

参考: https://nextjs.org/docs/app/getting-started/error-handling

## エラー境界

### `error.tsx`

ルートセグメントとその子で発生したエラーを捕捉する。

```tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  )
}
```

**重要:** `error.tsx` は Client Component でなければならない。

### `global-error.tsx`

ルートレイアウトで発生したエラーを捕捉する。

```tsx
'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <h2>Something went wrong!</h2>
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  )
}
```

**重要:** `<html>` と `<body>` タグを必ず含める。

## Server Actions: ナビゲーション API の落とし穴

**ナビゲーション API を try-catch で囲んではいけない。** これらは Next.js が内部で処理する特殊なエラーを投げる。

参考: https://nextjs.org/docs/app/api-reference/functions/redirect#behavior

```tsx
'use server'

import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'

// Bad: try-catch がナビゲーションの「エラー」を捕まえてしまう
async function createPost(formData: FormData) {
  try {
    const post = await db.post.create({ ... })
    redirect(`/posts/${post.id}`)  // ここで throw される!
  } catch (error) {
    // redirect() による throw がここで捕まり、ナビゲーションに失敗する
    return { error: 'Failed to create post' }
  }
}

// Good: ナビゲーション API は try-catch の外で呼ぶ
async function createPost(formData: FormData) {
  let post
  try {
    post = await db.post.create({ ... })
  } catch (error) {
    return { error: 'Failed to create post' }
  }
  redirect(`/posts/${post.id}`)  // try-catch の外
}

// Good: ナビゲーションのエラーは再 throw する
async function createPost(formData: FormData) {
  try {
    const post = await db.post.create({ ... })
    redirect(`/posts/${post.id}`)
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error  // ナビゲーション系エラーは再 throw する
    }
    return { error: 'Failed to create post' }
  }
}
```

以下にも同じ注意が当てはまる:

- `redirect()` - 307 一時リダイレクト
- `permanentRedirect()` - 308 永続リダイレクト
- `notFound()` - 404 not found
- `forbidden()` - 403 forbidden
- `unauthorized()` - 401 unauthorized

catch ブロックの中でこれらのエラーを再 throw するには `unstable_rethrow()` を使う。

```tsx
import { unstable_rethrow } from 'next/navigation'

async function action() {
  try {
    // ...
    redirect('/success')
  } catch (error) {
    unstable_rethrow(error) // Next.js 内部のエラーを再 throw する
    return { error: 'Something went wrong' }
  }
}
```

## リダイレクト

```tsx
import { redirect, permanentRedirect } from 'next/navigation'

// 307 一時リダイレクト - 大半のケースで使う
redirect('/new-path')

// 308 永続リダイレクト - URL の移行時に使う（ブラウザにキャッシュされる）
permanentRedirect('/new-url')
```

## 認証エラー

認証関連のエラーページを発火させる。

```tsx
import { forbidden, unauthorized } from 'next/navigation'

async function Page() {
  const session = await getSession()

  if (!session) {
    unauthorized() // unauthorized.tsx をレンダリング（401）
  }

  if (!session.hasAccess) {
    forbidden() // forbidden.tsx をレンダリング（403）
  }

  return <Dashboard />
}
```

対応するエラーページを作る:

```tsx
// app/forbidden.tsx
export default function Forbidden() {
  return <div>You don't have access to this resource</div>
}

// app/unauthorized.tsx
export default function Unauthorized() {
  return <div>Please log in to continue</div>
}
```

## Not Found

### `not-found.tsx`

ルートセグメント用のカスタム 404 ページ。

```tsx
export default function NotFound() {
  return (
    <div>
      <h2>Not Found</h2>
      <p>Could not find the requested resource</p>
    </div>
  )
}
```

### Not Found を発火させる

```tsx
import { notFound } from 'next/navigation'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const post = await getPost(id)

  if (!post) {
    notFound()  // 最も近い not-found.tsx をレンダリング
  }

  return <div>{post.title}</div>
}
```

## エラーの階層

エラーは最も近いエラー境界へバブルアップする。

```
app/
├── error.tsx           # 配下すべての子のエラーを捕捉
├── blog/
│   ├── error.tsx       # /blog/* 配下のエラーを捕捉
│   └── [slug]/
│       ├── error.tsx   # /blog/[slug] のエラーを捕捉
│       └── page.tsx
└── layout.tsx          # ここでのエラーは global-error.tsx に流れる
```
