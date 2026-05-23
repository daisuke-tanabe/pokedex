# ディレクティブ

## React ディレクティブ

これらは React のディレクティブであり、Next.js 固有のものではない。

### `'use client'`

コンポーネントを Client Component として扱う。以下の用途で必要になる。

- React フック（`useState`、`useEffect` など）
- イベントハンドラ（`onClick`、`onChange`）
- ブラウザ API（`window`、`localStorage`）

```tsx
'use client'

import { useState } from 'react'

export function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

参考: https://react.dev/reference/rsc/use-client

### `'use server'`

関数を Server Action として扱う。Client Component に渡せる。

```tsx
'use server'

export async function submitForm(formData: FormData) {
  // サーバー上で実行される
}
```

Server Component 内にインラインで書くこともできる。

```tsx
export default function Page() {
  async function submit() {
    'use server'
    // サーバー上で実行される
  }
  return <form action={submit}>...</form>
}
```

参考: https://react.dev/reference/rsc/use-server

---

## Next.js のディレクティブ

### `'use cache'`

関数やコンポーネントをキャッシュ対象としてマークする。Next.js Cache Components の一部。

```tsx
'use cache'

export async function getCachedData() {
  return await fetchData()
}
```

`next.config.ts` で `cacheComponents: true` を有効にする必要がある。

キャッシュプロファイル、`cacheLife()`、`cacheTag()`、`updateTag()` を含む詳しい使い方は、`next-cache-components` スキルを参照する。

参考: https://nextjs.org/docs/app/api-reference/directives/use-cache
