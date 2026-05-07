---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
---
# TypeScript/JavaScript コーディングスタイル

> このファイルは [common/coding-style.md](../common/coding-style.md) を拡張し、TypeScript/JavaScript固有の内容を追加する。

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