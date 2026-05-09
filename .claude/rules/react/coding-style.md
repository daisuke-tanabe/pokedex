---
paths:
  - "**/*.tsx"
  - "**/*.jsx"
---

# React コーディングスタイル

React（Web / Native 共通）の書き方をまとめる。

## Props 型定義

- コンポーネントの props は名前付きの `interface` または `type` で定義する
- コールバック props は明示的に型付けする
- 特定の理由がない限り `React.FC` を使わない

```typescript
interface UserCardProps {
  user: User
  onSelect: (id: string) => void
}

function UserCard({ user, onSelect }: UserCardProps) {
  return <button onClick={() => onSelect(user.id)}>{user.email}</button>
}
```

## カスタムフック

```typescript
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}
```

## 状態更新

前の状態に依存する更新では関数型更新を使う。state を直接参照する更新は非同期シナリオで古い値を取り得る。

```typescript
const [count, setCount] = useState(0)

// Good: 関数型更新
setCount(prev => prev + 1)

// Bad: state を直接参照
setCount(count + 1)  // 非同期シナリオで古い値になる可能性がある
```

## 条件付きレンダリング

`&&` を並べる平坦な記述を優先し、入れ子の三項演算子は避ける。

```typescript
// Good: 並列の && で読みやすい
{isLoading && <Spinner />}
{error && <ErrorMessage error={error} />}
{data && <DataDisplay data={data} />}

// Bad: 三項演算子の地獄
{isLoading ? <Spinner /> : error ? <ErrorMessage error={error} /> : data ? <DataDisplay data={data} /> : null}
```

## メモ化

重い計算と再生成されたくないコールバックは `useMemo` / `useCallback` でメモ化する。乱用はしない（軽い処理にメモ化を入れるとオーバーヘッドの方が大きい）。

```typescript
import { useMemo, useCallback } from 'react'

// Good: 重い計算をメモ化
const sortedItems = useMemo(() => {
  return [...items].sort((a, b) => b.score - a.score)
}, [items])

// Good: コールバックをメモ化
const handleSearch = useCallback((query: string) => {
  setSearchQuery(query)
}, [])
```

## 遅延読み込み

重いコンポーネント・ページは `lazy` + `Suspense` で動的読み込みする。初期バンドルを小さく保つ。

```typescript
import { lazy, Suspense } from 'react'

const HeavyChart = lazy(() => import('./HeavyChart'))

export function Dashboard() {
  return (
    <Suspense fallback={<Spinner />}>
      <HeavyChart />
    </Suspense>
  )
}
```
