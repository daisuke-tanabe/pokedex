---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
---
# TypeScript/JavaScript コーディングスタイル

## 型とインターフェース

型を使用して、パブリックAPI、共有モデル、コンポーネントpropsを明示的・読みやすく・再利用可能にする。

### パブリックAPI

- エクスポートされる関数、共有ユーティリティ、パブリッククラスメソッドにはパラメータと戻り値の型を追加する
- 明らかなローカル変数の型はTypeScriptに推論させる
- 繰り返されるインラインオブジェクト形状は名前付き型またはインターフェースに抽出する

```typescript
// 誤り：明示的な型のないエクスポート関数
export function formatUser(user) {
  return `${user.firstName} ${user.lastName}`
}

// 正解：パブリックAPIに明示的な型
interface User {
  firstName: string
  lastName: string
}

export function formatUser(user: User): string {
  return `${user.firstName} ${user.lastName}`
}
```

### インターフェース vs 型エイリアス

- 拡張または実装される可能性のあるオブジェクト形状には `interface` を使用する
- ユニオン、インターセクション、タプル、マップ型、ユーティリティ型には `type` を使用する
- 相互運用性のために `enum` が必要な場合を除き、文字列リテラルユニオンを `enum` より優先する

```typescript
interface User {
  id: string
  email: string
}

type UserRole = 'admin' | 'member'
type UserWithRole = User & {
  role: UserRole
}
```

### `any` を避ける

- アプリケーションコードで `any` を避ける
- 外部または信頼できない入力には `unknown` を使用し、安全にナローイングする
- 値の型が呼び出し元に依存する場合はジェネリクスを使用する

```typescript
// 誤り：anyは型安全性を失わせる
function getErrorMessage(error: any) {
  return error.message
}

// 正解：unknownは安全なナローイングを強制する
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return 'Unexpected error'
}
```

### React Props

- コンポーネントpropsは名前付きの `interface` または `type` で定義する
- コールバックpropsは明示的に型付けする
- 特定の理由がない限り `React.FC` を使用しない

```typescript
interface User {
  id: string
  email: string
}

interface UserCardProps {
  user: User
  onSelect: (id: string) => void
}

function UserCard({ user, onSelect }: UserCardProps) {
  return <button onClick={() => onSelect(user.id)}>{user.email}</button>
}
```

### JavaScriptファイル

- `.js` と `.jsx` ファイルでは、型が明確さを向上させ、TypeScriptへの移行が現実的でない場合にJSDocを使用する
- JSDocをランタイムの動作に合わせて保つ

```javascript
/**
 * @param {{ firstName: string, lastName: string }} user
 * @returns {string}
 */
export function formatUser(user) {
  return `${user.firstName} ${user.lastName}`
}
```

## イミュータビリティ

スプレッド演算子を使用したイミュータブルな更新：

```typescript
interface User {
  id: string
  name: string
}

// 誤り：ミューテーション
function updateUser(user: User, name: string): User {
  user.name = name // ミューテーション！
  return user
}

// 正解：イミュータビリティ
function updateUser(user: Readonly<User>, name: string): User {
  return {
    ...user,
    name
  }
}
```

## エラーハンドリング

async/awaitとtry-catchを使用し、unknownエラーを安全にナローイングする：

```typescript
interface User {
  id: string
  email: string
}

declare function riskyOperation(userId: string): Promise<User>

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return 'Unexpected error'
}

const logger = {
  error: (message: string, error: unknown) => {
    // Replace with your production logger (for example, pino or winston).
  }
}

async function loadUser(userId: string): Promise<User> {
  try {
    const result = await riskyOperation(userId)
    return result
  } catch (error: unknown) {
    logger.error('Operation failed', error)
    throw new Error(getErrorMessage(error))
  }
}
```

## 入力バリデーション

Zodを使用したスキーマベースのバリデーションと、スキーマからの型推論：

```typescript
import { z } from 'zod'

const userSchema = z.object({
  email: z.string().email(),
  age: z.number().int().min(0).max(150)
})

type UserInput = z.infer<typeof userSchema>

const validated: UserInput = userSchema.parse(input)
```

## Console.log

- 本番コードに `console.log` 文を残さない
- 代わりに適切なロギングライブラリを使用する
- 自動検出についてはフックを参照

## Async/Await

可能な限り並列実行する。逐次 await は依存がある場合だけにとどめる。

```typescript
// PASS: GOOD: 並列実行
const [users, orders, stats] = await Promise.all([
  fetchUsers(),
  fetchOrders(),
  fetchStats()
])

// FAIL: BAD: 不必要な逐次実行
const users = await fetchUsers()
const orders = await fetchOrders()
const stats = await fetchStats()
```

## コメントとドキュメント

### コメントを書くべきとき

WHY を説明する（WHAT は自己説明的な命名に任せる）。

```typescript
// PASS: GOOD: 非自明な意図を残す
// 障害時に API を圧迫しないよう指数バックオフを使う
const delay = Math.min(1000 * Math.pow(2, retryCount), 30000)

// 大きな配列のパフォーマンスのために意図的にミューテーションを使用
items.push(newItem)

// FAIL: BAD: 自明なことを書く
// カウンターを 1 増やす
count++
```

### 公開 API への JSDoc

エクスポートする関数・公開クラスメソッドには JSDoc を付け、引数・戻り値・例外・例を記載する。

```typescript
/**
 * セマンティック類似度を使ってリソースを検索する。
 *
 * @param query - 自然言語検索クエリ
 * @param limit - 結果の最大件数（デフォルト: 10）
 * @returns 類似度スコア順にソートされた結果配列
 * @throws {Error} 外部 API が失敗した場合
 *
 * @example
 * ```typescript
 * const results = await searchResources('keyword', 5)
 * ```
 */
export async function searchResources(
  query: string,
  limit: number = 10
): Promise<Resource[]> {
  // 実装
}
```

## コードスメル

### 長い関数

```typescript
// FAIL: BAD: 50 行超
function processData() {
  // 100 行のコード
}

// PASS: GOOD: 責務単位の小関数に分割
function processData() {
  const validated = validate()
  const transformed = transform(validated)
  return save(transformed)
}
```

### 深いネスト

```typescript
// FAIL: BAD: 5 段以上のネスト
if (user) {
  if (user.isAdmin) {
    if (resource) {
      if (resource.isActive) {
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
if (!resource) return
if (!resource.isActive) return
if (!hasPermission) return

// 何かする
```

### マジックナンバー

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

## ファイル構成

### プロジェクト構造（Next.js App Router 例）

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # API ルート
│   ├── <feature>/          # 機能ごとのページ
│   └── (auth)/             # ルートグループ
├── components/             # React コンポーネント
│   ├── ui/                 # 汎用 UI コンポーネント
│   ├── forms/              # フォームコンポーネント
│   └── layouts/            # レイアウトコンポーネント
├── hooks/                  # カスタム React フック
├── lib/                    # ユーティリティと設定
│   ├── api/                # API クライアント
│   ├── utils/              # ヘルパー関数
│   └── constants/          # 定数
├── types/                  # TypeScript の型
└── styles/                 # グローバルスタイル
```

### ファイルの命名

```
components/Button.tsx          # コンポーネントは PascalCase + .tsx
hooks/useAuth.ts               # 'use' プレフィックス + camelCase + .ts
lib/formatDate.ts              # ユーティリティは camelCase
types/order.types.ts           # camelCase + .types サフィックス
```

- `.tsx`: JSX を含むファイル
- `.ts`: 型定義のみ／純粋ロジック