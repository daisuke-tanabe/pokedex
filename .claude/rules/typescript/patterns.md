---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
---
# TypeScript/JavaScript パターン

## APIレスポンスフォーマット

```typescript
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  meta?: {
    total: number
    page: number
    limit: number
  }
}
```

## カスタムフックパターン

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

## リポジトリパターン

```typescript
interface Repository<T> {
  findAll(filters?: Filters): Promise<T[]>
  findById(id: string): Promise<T | null>
  create(data: CreateDto): Promise<T>
  update(id: string, data: UpdateDto): Promise<T>
  delete(id: string): Promise<void>
}
```

## React 状態管理

前の状態に依存する更新では関数型更新を使う。state を直接参照する更新は非同期シナリオで古い値を取り得る。

```typescript
const [count, setCount] = useState(0)

// PASS: GOOD: 関数型更新
setCount(prev => prev + 1)

// FAIL: BAD: state を直接参照
setCount(count + 1)  // 非同期シナリオで古い値になる可能性がある
```

## React 条件付きレンダリング

`&&` を並べる平坦な記述を優先し、入れ子の三項演算子は避ける。

```typescript
// PASS: GOOD: 並列の && で読みやすい
{isLoading && <Spinner />}
{error && <ErrorMessage error={error} />}
{data && <DataDisplay data={data} />}

// FAIL: BAD: 三項演算子の地獄
{isLoading ? <Spinner /> : error ? <ErrorMessage error={error} /> : data ? <DataDisplay data={data} /> : null}
```

## React メモ化

重い計算と再生成されたくないコールバックは `useMemo` / `useCallback` でメモ化する。乱用はしない（軽い処理にメモ化を入れるとオーバーヘッドの方が大きい）。

```typescript
import { useMemo, useCallback } from 'react'

// PASS: GOOD: 重い計算をメモ化
const sortedItems = useMemo(() => {
  return items.sort((a, b) => b.score - a.score)
}, [items])

// PASS: GOOD: コールバックをメモ化
const handleSearch = useCallback((query: string) => {
  setSearchQuery(query)
}, [])
```

## React 遅延読み込み

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

## データベースクエリ最適化

必要なカラムだけ選択し、`SELECT *` を避ける。N+1 を生まないよう関連データはバッチ取得する。

```typescript
// PASS: GOOD: 必要なカラムのみ選択
const { data } = await client
  .from('items')
  .select('id, name, status')
  .limit(10)

// FAIL: BAD: 全カラムを取得
const { data } = await client
  .from('items')
  .select('*')
```