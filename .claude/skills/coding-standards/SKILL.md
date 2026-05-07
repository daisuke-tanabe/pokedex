---
name: coding-standards
description: 命名・可読性・イミュータビリティ・コード品質レビューのためのプロジェクト横断のベースラインコーディング規約。フレームワーク固有のパターンには詳細なフロントエンド/バックエンドスキルを使う。
---

# コーディング標準とベストプラクティス

プロジェクト横断で適用するベースラインのコーディング規約。

このスキルは共通の最低基準であり、フレームワーク固有の詳細プレイブックではない。

- React、状態管理、フォーム、レンダリング、UI アーキテクチャには `frontend-patterns` を使う。
- リポジトリ/サービス層、エンドポイント設計、バリデーション、サーバー固有の関心事には `backend-patterns` または `api-design` を使う。
- フルスキルではなく最小限の再利用可能ルール層が必要なときは `rules/common/coding-style.md` を使う。

## 起動タイミング

- 新しいプロジェクトやモジュールを開始するとき
- 品質と保守性のためにコードをレビューするとき
- 既存コードを規約に沿うようにリファクタリングするとき
- 命名・フォーマット・構造の一貫性を強制するとき
- リント、フォーマット、型チェックのルールをセットアップするとき
- 新しいコントリビューターをコーディング規約にオンボーディングするとき

## スコープ境界

このスキルを使うべき場面:
- 説明的な命名
- イミュータビリティのデフォルト
- 可読性、KISS、DRY、YAGNI の徹底
- エラーハンドリング期待値とコードスメルレビュー

このスキルを主たる情報源として使ってはならない場面:
- React のコンポジション、フック、レンダリングパターン
- バックエンドアーキテクチャ、API 設計、データベース層化
- より特化した ECC スキルが既に存在するドメイン固有のフレームワーク指針

## コード品質の原則

### 1. 可読性最優先
- コードは書かれるよりも読まれる回数のほうが多い
- 明確な変数名と関数名を使う
- コメントよりも自己説明的なコードを優先する
- 一貫したフォーマットを保つ

### 2. KISS（Keep It Simple, Stupid）
- 動く最もシンプルな解決策を選ぶ
- オーバーエンジニアリングを避ける
- 早すぎる最適化はしない
- 賢いコードよりも理解しやすいコードを優先する

### 3. DRY（Don't Repeat Yourself）
- 共通ロジックを関数に抽出する
- 再利用可能なコンポーネントを作る
- ユーティリティをモジュール間で共有する
- コピーペーストプログラミングを避ける

### 4. YAGNI（You Aren't Gonna Need It）
- 必要になる前に機能を作らない
- 投機的な汎用化を避ける
- 必要なときだけ複雑さを追加する
- シンプルに始め、必要なときにリファクタリングする

## TypeScript/JavaScript の標準

### 変数の命名

```typescript
// PASS: GOOD: 説明的な名前
const marketSearchQuery = 'election'
const isUserAuthenticated = true
const totalRevenue = 1000

// FAIL: BAD: 不明瞭な名前
const q = 'election'
const flag = true
const x = 1000
```

### 関数の命名

```typescript
// PASS: GOOD: 動詞 - 名詞のパターン
async function fetchMarketData(marketId: string) { }
function calculateSimilarity(a: number[], b: number[]) { }
function isValidEmail(email: string): boolean { }

// FAIL: BAD: 不明瞭または名詞のみ
async function market(id: string) { }
function similarity(a, b) { }
function email(e) { }
```

### イミュータビリティパターン（CRITICAL）

```typescript
// PASS: 必ずスプレッド演算子を使う
const updatedUser = {
  ...user,
  name: 'New Name'
}

const updatedArray = [...items, newItem]

// FAIL: 直接ミューテートしてはいけない
user.name = 'New Name'  // BAD
items.push(newItem)     // BAD
```

### エラーハンドリング

```typescript
// PASS: GOOD: 包括的なエラーハンドリング
async function fetchData(url: string) {
  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Fetch failed:', error)
    throw new Error('Failed to fetch data')
  }
}

// FAIL: BAD: エラーハンドリングなし
async function fetchData(url) {
  const response = await fetch(url)
  return response.json()
}
```

### Async/Await のベストプラクティス

```typescript
// PASS: GOOD: 可能なら並列実行する
const [users, markets, stats] = await Promise.all([
  fetchUsers(),
  fetchMarkets(),
  fetchStats()
])

// FAIL: BAD: 不必要な逐次実行
const users = await fetchUsers()
const markets = await fetchMarkets()
const stats = await fetchStats()
```

### 型安全性

```typescript
// PASS: GOOD: 適切な型
interface Market {
  id: string
  name: string
  status: 'active' | 'resolved' | 'closed'
  created_at: Date
}

function getMarket(id: string): Promise<Market> {
  // 実装
}

// FAIL: BAD: 'any' を使う
function getMarket(id: any): Promise<any> {
  // 実装
}
```

## React のベストプラクティス

### コンポーネント構造

```typescript
// PASS: GOOD: 型付きの関数コンポーネント
interface ButtonProps {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary'
}

export function Button({
  children,
  onClick,
  disabled = false,
  variant = 'primary'
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant}`}
    >
      {children}
    </button>
  )
}

// FAIL: BAD: 型なし、構造が不明瞭
export function Button(props) {
  return <button onClick={props.onClick}>{props.children}</button>
}
```

### カスタムフック

```typescript
// PASS: GOOD: 再利用可能なカスタムフック
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

// 利用例
const debouncedQuery = useDebounce(searchQuery, 500)
```

### 状態管理

```typescript
// PASS: GOOD: 適切な状態更新
const [count, setCount] = useState(0)

// 前の状態に依存する場合は関数型更新を使う
setCount(prev => prev + 1)

// FAIL: BAD: 状態を直接参照する
setCount(count + 1)  // 非同期シナリオで古い値になる可能性がある
```

### 条件付きレンダリング

```typescript
// PASS: GOOD: 明瞭な条件付きレンダリング
{isLoading && <Spinner />}
{error && <ErrorMessage error={error} />}
{data && <DataDisplay data={data} />}

// FAIL: BAD: 三項演算子の地獄
{isLoading ? <Spinner /> : error ? <ErrorMessage error={error} /> : data ? <DataDisplay data={data} /> : null}
```

## API 設計の標準

### REST API の規約

```
GET    /api/markets              # すべてのマーケットを一覧
GET    /api/markets/:id          # 特定マーケットを取得
POST   /api/markets              # 新規マーケットを作成
PUT    /api/markets/:id          # マーケットを更新（フル）
PATCH  /api/markets/:id          # マーケットを更新（部分）
DELETE /api/markets/:id          # マーケットを削除

# フィルタリング用のクエリパラメータ
GET /api/markets?status=active&limit=10&offset=0
```

### レスポンスフォーマット

```typescript
// PASS: GOOD: 一貫したレスポンス構造
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

// 成功レスポンス
return NextResponse.json({
  success: true,
  data: markets,
  meta: { total: 100, page: 1, limit: 10 }
})

// エラーレスポンス
return NextResponse.json({
  success: false,
  error: 'Invalid request'
}, { status: 400 })
```

### 入力バリデーション

```typescript
import { z } from 'zod'

// PASS: GOOD: スキーマバリデーション
const CreateMarketSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  endDate: z.string().datetime(),
  categories: z.array(z.string()).min(1)
})

export async function POST(request: Request) {
  const body = await request.json()

  try {
    const validated = CreateMarketSchema.parse(body)
    // 検証済みデータで処理を進める
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      }, { status: 400 })
    }
  }
}
```

## ファイル構成

### プロジェクト構造

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API ルート
│   ├── markets/           # マーケットページ
│   └── (auth)/           # 認証ページ（ルートグループ）
├── components/            # React コンポーネント
│   ├── ui/               # 汎用 UI コンポーネント
│   ├── forms/            # フォームコンポーネント
│   └── layouts/          # レイアウトコンポーネント
├── hooks/                # カスタム React フック
├── lib/                  # ユーティリティと設定
│   ├── api/             # API クライアント
│   ├── utils/           # ヘルパー関数
│   └── constants/       # 定数
├── types/                # TypeScript の型
└── styles/              # グローバルスタイル
```

### ファイルの命名

```
components/Button.tsx          # コンポーネントは PascalCase
hooks/useAuth.ts              # 'use' プレフィックス + camelCase
lib/formatDate.ts             # ユーティリティは camelCase
types/market.types.ts         # camelCase + .types サフィックス
```

## コメントとドキュメント

### コメントを書くべきとき

```typescript
// PASS: GOOD: WHY を説明する（WHAT ではなく）
// 障害時に API を圧迫しないよう指数バックオフを使う
const delay = Math.min(1000 * Math.pow(2, retryCount), 30000)

// 大きな配列のパフォーマンスのために意図的にミューテーションを使用
items.push(newItem)

// FAIL: BAD: 自明なことを書く
// カウンターを 1 増やす
count++

// name にユーザーの名前をセット
name = user.name
```

### 公開 API への JSDoc

```typescript
/**
 * セマンティック類似度を使ってマーケットを検索する。
 *
 * @param query - 自然言語検索クエリ
 * @param limit - 結果の最大件数（デフォルト: 10）
 * @returns 類似度スコア順にソートされたマーケットの配列
 * @throws {Error} OpenAI API が失敗するか Redis が利用不可の場合
 *
 * @example
 * ```typescript
 * const results = await searchMarkets('election', 5)
 * console.log(results[0].name) // "Trump vs Biden"
 * ```
 */
export async function searchMarkets(
  query: string,
  limit: number = 10
): Promise<Market[]> {
  // 実装
}
```

## パフォーマンスのベストプラクティス

### メモ化

```typescript
import { useMemo, useCallback } from 'react'

// PASS: GOOD: 重い計算をメモ化する
const sortedMarkets = useMemo(() => {
  return markets.sort((a, b) => b.volume - a.volume)
}, [markets])

// PASS: GOOD: コールバックをメモ化する
const handleSearch = useCallback((query: string) => {
  setSearchQuery(query)
}, [])
```

### 遅延読み込み

```typescript
import { lazy, Suspense } from 'react'

// PASS: GOOD: 重いコンポーネントは遅延読み込みする
const HeavyChart = lazy(() => import('./HeavyChart'))

export function Dashboard() {
  return (
    <Suspense fallback={<Spinner />}>
      <HeavyChart />
    </Suspense>
  )
}
```

### データベースクエリ

```typescript
// PASS: GOOD: 必要なカラムだけを選択する
const { data } = await supabase
  .from('markets')
  .select('id, name, status')
  .limit(10)

// FAIL: BAD: すべてを選択する
const { data } = await supabase
  .from('markets')
  .select('*')
```

## テストの標準

### テスト構造（AAA パターン）

```typescript
test('calculates similarity correctly', () => {
  // Arrange
  const vector1 = [1, 0, 0]
  const vector2 = [0, 1, 0]

  // Act
  const similarity = calculateCosineSimilarity(vector1, vector2)

  // Assert
  expect(similarity).toBe(0)
})
```

### テスト名

```typescript
// PASS: GOOD: 説明的なテスト名
test('returns empty array when no markets match query', () => { })
test('throws error when OpenAI API key is missing', () => { })
test('falls back to substring search when Redis unavailable', () => { })

// FAIL: BAD: 曖昧なテスト名
test('works', () => { })
test('test search', () => { })
```

## コードスメルの検出

これらのアンチパターンに注意する:

### 1. 長い関数
```typescript
// FAIL: BAD: 関数が 50 行超
function processMarketData() {
  // 100 行のコード
}

// PASS: GOOD: 小さい関数に分割する
function processMarketData() {
  const validated = validateData()
  const transformed = transformData(validated)
  return saveData(transformed)
}
```

### 2. 深いネスト
```typescript
// FAIL: BAD: 5 段以上のネスト
if (user) {
  if (user.isAdmin) {
    if (market) {
      if (market.isActive) {
        if (hasPermission) {
          // 何かする
        }
      }
    }
  }
}

// PASS: GOOD: 早期リターン
if (!user) return
if (!user.isAdmin) return
if (!market) return
if (!market.isActive) return
if (!hasPermission) return

// 何かする
```

### 3. マジックナンバー
```typescript
// FAIL: BAD: 説明のない数値
if (retryCount > 3) { }
setTimeout(callback, 500)

// PASS: GOOD: 名前付き定数
const MAX_RETRIES = 3
const DEBOUNCE_DELAY_MS = 500

if (retryCount > MAX_RETRIES) { }
setTimeout(callback, DEBOUNCE_DELAY_MS)
```

**注意**: コード品質は妥協できない。明確で保守可能なコードは迅速な開発と確信を持ったリファクタリングを可能にする。
