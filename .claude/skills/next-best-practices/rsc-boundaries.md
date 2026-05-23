# RSC 境界

Server / Client コンポーネントの境界を越える際の不正なパターンを検出し、未然に防ぐ。

## 検出ルール

### 1. async な Client Component は不正

Client コンポーネントを async 関数にすることは **できない**。async にできるのは Server Component だけ。

**検出条件:** ファイルに `'use client'` があり、かつコンポーネントが `async function` か `Promise` を返している。

```tsx
// Bad: async な client component
'use client'
export default async function UserProfile() {
  const user = await getUser() // client component で await はできない
  return <div>{user.name}</div>
}

// Good: async を外し、親の server component でデータを取得する
// page.tsx（server component - 'use client' なし）
export default async function Page() {
  const user = await getUser()
  return <UserProfile user={user} />
}

// UserProfile.tsx（client component）
'use client'
export function UserProfile({ user }: { user: User }) {
  return <div>{user.name}</div>
}
```

```tsx
// Bad: async なアロー関数の client component
'use client'
const Dashboard = async () => {
  const data = await fetchDashboard()
  return <div>{data}</div>
}

// Good: server component でデータを取得し、props 経由で渡す
```

### 2. Client Component に渡す非シリアライズ Props

Server → Client に渡す props は JSON シリアライズ可能でなければならない。

**検出条件:** server component から client component に以下を渡している。

- 関数（`'use server'` 付きの Server Action は除く）
- `Date` オブジェクト
- `Map`、`Set`、`WeakMap`、`WeakSet`
- クラスのインスタンス
- `Symbol`（グローバルに登録されているものを除く）
- 循環参照

```tsx
// Bad: 関数を props で渡す
// page.tsx（server）
export default function Page() {
  const handleClick = () => console.log('clicked')
  return <ClientButton onClick={handleClick} />
}

// Good: client component の中で関数を定義する
// ClientButton.tsx
'use client'
export function ClientButton() {
  const handleClick = () => console.log('clicked')
  return <button onClick={handleClick}>Click</button>
}
```

```tsx
// Bad: Date オブジェクト（暗黙的に文字列化され、後で実行時エラーになる）
// page.tsx（server）
export default async function Page() {
  const post = await getPost()
  return <PostCard createdAt={post.createdAt} /> // Date オブジェクト
}

// PostCard.tsx（client） - .getFullYear() でクラッシュする
'use client'
export function PostCard({ createdAt }: { createdAt: Date }) {
  return <span>{createdAt.getFullYear()}</span> // 実行時エラー!
}

// Good: server 側で文字列にシリアライズする
// page.tsx（server）
export default async function Page() {
  const post = await getPost()
  return <PostCard createdAt={post.createdAt.toISOString()} />
}

// PostCard.tsx（client）
'use client'
export function PostCard({ createdAt }: { createdAt: string }) {
  const date = new Date(createdAt)
  return <span>{date.getFullYear()}</span>
}
```

```tsx
// Bad: クラスインスタンス
const user = new UserModel(data)
<ClientProfile user={user} /> // メソッドは剥がれてしまう

// Good: プレーンオブジェクトを渡す
const user = await getUser()
<ClientProfile user={{ id: user.id, name: user.name }} />
```

```tsx
// Bad: Map / Set
<ClientComponent items={new Map([['a', 1]])} />

// Good: 配列やオブジェクトに変換する
<ClientComponent items={Object.fromEntries(map)} />
<ClientComponent items={Array.from(set)} />
```

### 3. Server Action は例外

`'use server'` でマークされた関数は client component に渡せる。

```tsx
// Valid: Server Action は受け渡し可能
// actions.ts
'use server'
export async function submitForm(formData: FormData) {
  // server 側のロジック
}

// page.tsx（server）
import { submitForm } from './actions'
export default function Page() {
  return <ClientForm onSubmit={submitForm} /> // OK!
}

// ClientForm.tsx（client）
'use client'
export function ClientForm({ onSubmit }: { onSubmit: (data: FormData) => Promise<void> }) {
  return <form action={onSubmit}>...</form>
}
```

## クイックリファレンス

| パターン | 妥当か？ | 対処 |
|---------|--------|-----|
| `'use client'` + `async function` | No | 親の server component で取得して渡す |
| client に `() => {}` を渡す | No | client 側で定義するか server action を使う |
| client に `new Date()` を渡す | No | `.toISOString()` を使う |
| client に `new Map()` を渡す | No | オブジェクト/配列に変換する |
| client にクラスインスタンスを渡す | No | プレーンオブジェクトを渡す |
| client に server action を渡す | Yes | - |
| `string/number/boolean` を渡す | Yes | - |
| プレーンなオブジェクト/配列を渡す | Yes | - |
