---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
---
# TypeScript/JavaScript コーディングスタイル

## パブリック API の型注釈

- エクスポートされる関数のパラメータと戻り値型を明示する
- ローカル変数の型は TypeScript に推論させる（冗長な注釈は避ける）
- 繰り返されるインラインオブジェクト形状は名前付き型に抽出する

## JavaScript ファイル

- `.js` と `.jsx` ファイルでは、型を補うために JSDoc を使う
- JSDoc をランタイムの動作に合わせて保つ

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

### 回復可能なエラーは Result 型で表現

回復可能な失敗（バリデーション失敗、外部 API エラー、フォーマット不正等）は
例外ではなく Result 型で表現し、型システムに「失敗の可能性」を組み込む。
制御フロー目的で例外を投げない。

```typescript
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E }

async function fetchUser(id: UserId): Promise<Result<User, FetchError>> {
  try {
    const user = await api.get(`/users/${id}`)
    return { ok: true, value: user }
  } catch (e) {
    return { ok: false, error: e instanceof FetchError ? e : new FetchError(String(e)) }
  }
}

const result = await fetchUser(userId)
if (!result.ok) return showError(result.error)
const user = result.value  // 型は User に絞り込まれている
```

呼び出し側に `if (!result.ok) return ...` を強制できるため、エラー処理漏れが
コンパイル時に発見できる。

### 真に異常な状態は throw

予期しないバグや回復不可能な状態は throw する。catch する側は `unknown` として
受け取り、安全にナローイングする。

```typescript
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Unexpected error'
}

async function loadUser(userId: string): Promise<User> {
  try {
    return await riskyOperation(userId)
  } catch (error: unknown) {
    logger.error('Operation failed', error)
    throw new Error(getErrorMessage(error))
  }
}
```

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

## エクスポート

ワイルドカードバレルと default export を避け、名前付き export を使う。

```typescript
// FAIL: BAD: ワイルドカードバレル
export * from './user'
export * from './order'
// 何が公開されているか不明、tree-shaking が効きにくい、衝突に気づきにくい

// PASS: GOOD: 名前付き export
export { fetchUser, createUser } from './user'
export { fetchOrder, createOrder } from './order'
```

```typescript
// FAIL: BAD: default export はリネームの追跡が難しい
export default function fetchUser() { /* ... */ }

// PASS: GOOD: named export
export function fetchUser() { /* ... */ }
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

