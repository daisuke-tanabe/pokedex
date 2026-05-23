# hydration エラー

React の hydration mismatch エラーを診断し、修正する。

## エラーの兆候

- "Hydration failed because the initial UI does not match"
- "Text content does not match server-rendered HTML"

## デバッグ

開発環境では、hydration エラーをクリックするとサーバー / クライアントの差分が確認できる。

## よくある原因と対処

### ブラウザ専用の API

```tsx
// Bad: mismatch を起こす - server に window は存在しない
<div>{window.innerWidth}</div>

// Good: mounted 判定付きの client component を使う
'use client'
import { useState, useEffect } from 'react'

export function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted ? children : null
}
```

### 日付 / 時刻の描画

server と client でタイムゾーンが異なることがある:

```tsx
// Bad: mismatch を起こす
<span>{new Date().toLocaleString()}</span>

// Good: client 側でだけ描画する
'use client'
const [time, setTime] = useState<string>()
useEffect(() => setTime(new Date().toLocaleString()), [])
```

### 乱数や ID

```tsx
// Bad: 乱数は server と client で異なる
<div id={Math.random().toString()}>

// Good: useId フックを使う
import { useId } from 'react'

function Input() {
  const id = useId()
  return <input id={id} />
}
```

### 不正な HTML のネスト

```tsx
// Bad: 無効 - p の中に div
<p><div>Content</div></p>

// Bad: 無効 - p の中に p
<p><p>Nested</p></p>

// Good: 正しいネスト
<div><p>Content</p></div>
```

### サードパーティスクリプト

hydration 中に DOM を書き換えるスクリプト。

```tsx
// Good: next/script を afterInteractive で使う
import Script from 'next/script'

export default function Page() {
  return (
    <Script
      src="https://example.com/script.js"
      strategy="afterInteractive"
    />
  )
}
```
