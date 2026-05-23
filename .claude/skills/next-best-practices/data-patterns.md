# データパターン

ユースケースに合ったデータ取得パターンを選ぶ。

## 決定ツリー

```
データを取得する必要がある？
├── Server Component から？
│   └── 使う: 直接 fetch（API は不要）
│
├── Client Component から？
│   ├── mutation か（POST/PUT/DELETE）？
│   │   └── 使う: Server Action
│   └── read か（GET）？
│       └── 使う: Route Handler または Server Component から props で渡す
│
├── 外部 API アクセスが必要（webhook、サードパーティ）？
│   └── 使う: Route Handler
│
└── モバイルアプリ / 外部クライアント向けの REST API が必要？
    └── 使う: Route Handler
```

## パターン 1: Server Component（読み取りには第一候補）

Server Component で直接データを取得する。API レイヤーは不要。

```tsx
// app/users/page.tsx
async function UsersPage() {
  // データベースに直接アクセス - API ラウンドトリップなし
  const users = await db.user.findMany();

  // 外部 API から取得することもできる
  const posts = await fetch('https://api.example.com/posts').then(r => r.json());

  return (
    <ul>
      {users.map(user => <li key={user.id}>{user.name}</li>)}
    </ul>
  );
}
```

**メリット**:

- 維持すべき API がない
- client / server 間のウォーターフォールがない
- secret が server 側に留まる
- DB に直接アクセスできる

## パターン 2: Server Actions（変更操作には第一候補）

mutation の処理には Server Actions を使う。

```tsx
// app/actions.ts
'use server';

import { revalidatePath } from 'next/cache';

export async function createPost(formData: FormData) {
  const title = formData.get('title') as string;

  await db.post.create({ data: { title } });

  revalidatePath('/posts');
}

export async function deletePost(id: string) {
  await db.post.delete({ where: { id } });

  revalidateTag('posts');
}
```

```tsx
// app/posts/new/page.tsx
import { createPost } from '@/app/actions';

export default function NewPost() {
  return (
    <form action={createPost}>
      <input name="title" required />
      <button type="submit">Create</button>
    </form>
  );
}
```

**メリット**:

- エンドツーエンドの型安全性
- プログレッシブエンハンスメント（JS なしでも動く）
- リクエスト処理を自動化
- React の transition と統合される

**制約**:

- POST 限定（GET のキャッシュセマンティクスは持たない）
- 内部用途のみ（外部からは呼べない）
- シリアライズ不能なデータは返せない

## パターン 3: Route Handlers（API）

REST API が必要な場合は Route Handlers を使う。

```tsx
// app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server';

// GET はキャッシュ可能
export async function GET(request: NextRequest) {
  const posts = await db.post.findMany();
  return NextResponse.json(posts);
}

// POST は mutation 用
export async function POST(request: NextRequest) {
  const body = await request.json();
  const post = await db.post.create({ data: body });
  return NextResponse.json(post, { status: 201 });
}
```

**使うべきケース**:

- 外部からの API アクセス（モバイルアプリ、サードパーティ）
- 外部サービスからの webhook
- HTTP キャッシュが必要な GET エンドポイント
- OpenAPI / Swagger ドキュメントが必要

**使わないケース**:

- アプリ内部のデータ取得（Server Components を使う）
- 自前 UI からの mutation（Server Actions を使う）

## データウォーターフォールを避ける

### 問題: 逐次 fetch

```tsx
// Bad: 逐次的なウォーターフォール
async function Dashboard() {
  const user = await getUser();        // 待つ...
  const posts = await getPosts();      // また待つ...
  const comments = await getComments(); // また待つ...

  return <div>...</div>;
}
```

### 解決策 1: Promise.all で並列に取得

```tsx
// Good: 並列 fetch
async function Dashboard() {
  const [user, posts, comments] = await Promise.all([
    getUser(),
    getPosts(),
    getComments(),
  ]);

  return <div>...</div>;
}
```

### 解決策 2: Suspense でストリーミング

```tsx
// Good: コンテンツを段階的に表示する
import { Suspense } from 'react';

async function Dashboard() {
  return (
    <div>
      <Suspense fallback={<UserSkeleton />}>
        <UserSection />
      </Suspense>
      <Suspense fallback={<PostsSkeleton />}>
        <PostsSection />
      </Suspense>
    </div>
  );
}

async function UserSection() {
  const user = await getUser(); // 個別に fetch
  return <div>{user.name}</div>;
}

async function PostsSection() {
  const posts = await getPosts(); // 個別に fetch
  return <PostList posts={posts} />;
}
```

### 解決策 3: preload パターン

```tsx
// lib/data.ts
import { cache } from 'react';

export const getUser = cache(async (id: string) => {
  return db.user.findUnique({ where: { id } });
});

export const preloadUser = (id: string) => {
  void getUser(id); // 投げっぱなしで先行起動
};
```

```tsx
// app/user/[id]/page.tsx
import { getUser, preloadUser } from '@/lib/data';

export default async function UserPage({ params }) {
  const { id } = await params;

  // 早めに取得を開始する
  preloadUser(id);

  // 他の処理を実行...

  // この時点ではデータが揃っている可能性が高い
  const user = await getUser(id);
  return <div>{user.name}</div>;
}
```

## Client Component でのデータ取得

Client Component でデータが必要なときの選択肢:

### 選択肢 1: Server Component から渡す（推奨）

```tsx
// Server Component
async function Page() {
  const data = await fetchData();
  return <ClientComponent initialData={data} />;
}

// Client Component
'use client';
function ClientComponent({ initialData }) {
  const [data, setData] = useState(initialData);
  // ...
}
```

### 選択肢 2: マウント時に fetch（必要な場合）

```tsx
'use client';
import { useEffect, useState } from 'react';

function ClientComponent() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/data')
      .then(r => r.json())
      .then(setData);
  }, []);

  if (!data) return <Loading />;
  return <div>{data.value}</div>;
}
```

### 選択肢 3: read のために Server Action を使う（動くが本来の用途ではない）

Server Actions は Client Component から read 目的で呼ぶこともできるが、本来の用途ではない:

```tsx
'use client';
import { getData } from './actions';
import { useEffect, useState } from 'react';

function ClientComponent() {
  const [data, setData] = useState(null);

  useEffect(() => {
    getData().then(setData);
  }, []);

  return <div>{data?.value}</div>;
}
```

**Note**: Server Actions は常に POST なので HTTP キャッシュは効かない。キャッシュ可能な read には Route Handlers を選ぶ。

## クイックリファレンス

| パターン | ユースケース | HTTP メソッド | キャッシュ |
|---------|----------|-------------|---------|
| Server Component の fetch | 内部 read | 任意 | Next.js の完全なキャッシュ |
| Server Action | mutation、フォーム送信 | POST のみ | なし |
| Route Handler | 外部 API、webhook | 任意 | GET はキャッシュ可能 |
| Client から API への fetch | client 側の read | 任意 | HTTP キャッシュヘッダ |
