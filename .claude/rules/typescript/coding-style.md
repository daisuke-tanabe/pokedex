---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
---
# TypeScript/JavaScript コーディングスタイル

TypeScript / JavaScript 固有の書き方をまとめる。

## 変数宣言は const を使う

原則は `const` のみ、再代入が必要な最終手段としてのみ `let` を使う。

```typescript
// Good
const userName = 'Taro';
const items = data.filter(item => item.isActive);
const total = items.reduce((sum, item) => sum + item.count, 0);

// Bad: 不要な let (配列メソッドで解決できる)
let total = 0;
for (const item of items) {
  total += item.count;
}

// Bad: 不要な let (再代入していない)
let userName = 'Taro';

// Bad: 条件分岐で再代入 (三項演算子で解決できる)
let message;
if (isError) {
  message = 'エラー';
} else {
  message = '正常';
}

// Good: 三項演算子で初期化
const message = isError ? 'エラー' : '正常';
```

## 値がない状態は null か undefined

「値がない」ことを `{}` で表さない。`null` または `undefined` を使う。
`{}` 型は「`null` と `undefined` 以外のすべての値」であり、空オブジェクトではない。

```typescript
// Bad: {} は空オブジェクトを意味しない
let user = {};
user.name = 'Taro'; // エラー: Property 'name' does not exist on type '{}'

// Good: null で「まだ値がない」ことを明示
let user: User | null = null;
if (shouldCreateUser) {
  user = { name: 'Taro', age: 25 };
}

// Good: undefined を省略可能な値として
let cachedUser: User | undefined;
cachedUser = await fetchUser();
```

## イミュータビリティ

スプレッド演算子を使用したイミュータブルな更新：

```typescript
interface User {
  id: string
  name: string
}

// Bad: ミューテーション
function updateUser(user: User, name: string): User {
  user.name = name
  return user
}

// Good: イミュータビリティ
function updateUser(user: Readonly<User>, name: string): User {
  return {
    ...user,
    name
  }
}
```

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

## 反復処理は意図に応じて選ぶ

純粋な変換・絞り込み・集計には配列メソッドを使う:

| 用途 | メソッド |
|---|---|
| 変換 | `map()` |
| 絞り込み | `filter()` |
| 検索 | `find()`, `findLast()`, `findIndex()`, `findLastIndex()` |
| 存在確認 | `some()`, `every()`, `includes()` |
| 集計 | `reduce()`, `reduceRight()` |
| 平坦化 | `flat()`, `flatMap()` |
| 結合 | `concat()`, `join()` |
| グルーピング | `Object.groupBy()`, `Map.groupBy()` |
| イミュータブル並び替え | `toSorted()`, `toReversed()`, `toSpliced()`, `with()` |
| ミュータブル並び替え | `sort()`, `reverse()`(基本避ける) |
| 返り値が不要 | `forEach()`(副作用なしの場合のみ) |

副作用を伴う反復には `for...of` を使う:

- async/await を含む直列処理
- early break / continue が必要な処理
- async iterator (`for await...of`)

避けるべきもの:

- `for (let i = 0; ...)`(インデックス操作が本質的に必要な場合を除く)
- `for...in`(オブジェクトのキー列挙以外)
- 副作用を含む `forEach`(直列 await が機能しない)
- ミュータブルメソッド `sort()`, `reverse()`, `splice()`(`toSorted()` 等を優先)

```typescript
// Bad: for + push
const results = [];
for (let i = 0; i < items.length; i++) {
  if (items[i].isActive) {
    results.push(items[i].name);
  }
}

// Good: 配列メソッドで意図を明示
const results = items
  .filter(item => item.isActive)
  .map(item => item.name);

// Good: 副作用を伴う直列処理は for...of
for (const item of items) {
  await processItem(item);
}
```

## 三項演算子は式として使う

三項演算子は値を返す式として使い、文として副作用を起こさない。
複雑な条件・処理を詰め込むと可読性が下がるので、簡潔な場合のみ。

```typescript
// Bad: 文として使用、副作用を発生
let status = "";
isActive ? (status = "Active") : (status = "Inactive");

// Good: 式として使用
const status = isActive ? "Active" : "Inactive";
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
// Good: 並列実行
const [users, orders, stats] = await Promise.all([
  fetchUsers(),
  fetchOrders(),
  fetchStats()
])

// Bad: 不必要な逐次実行
const users = await fetchUsers()
const orders = await fetchOrders()
const stats = await fetchStats()
```

## エクスポート

ワイルドカードバレルと default export を避け、名前付き export を使う。

```typescript
// Bad: ワイルドカードバレル
export * from './user'
export * from './order'
// 何が公開されているか不明、tree-shaking が効きにくい、衝突に気づきにくい

// Good: 名前付き export
export { fetchUser, createUser } from './user'
export { fetchOrder, createOrder } from './order'
```

```typescript
// Bad: default export はリネームの追跡が難しい
export default function fetchUser() { /* ... */ }

// Good: named export
export function fetchUser() { /* ... */ }
```

## コメントとドキュメント

### コメントを書くべきとき

WHY を説明する（WHAT は自己説明的な命名に任せる）。

```typescript
// Good: 非自明な意図を残す
// 障害時に API を圧迫しないよう指数バックオフを使う
const delay = Math.min(1000 * Math.pow(2, retryCount), 30000)

// 大きな配列のパフォーマンスのために意図的にミューテーションを使用
items.push(newItem)

// Bad: 自明なことを書く
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
