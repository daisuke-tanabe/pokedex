# Route Handlers

`route.ts` で API エンドポイントを作る。

## 基本的な使い方

```tsx
// app/api/users/route.ts
export async function GET() {
  const users = await getUsers()
  return Response.json(users)
}

export async function POST(request: Request) {
  const body = await request.json()
  const user = await createUser(body)
  return Response.json(user, { status: 201 })
}
```

## サポートされる HTTP メソッド

`GET`、`POST`、`PUT`、`PATCH`、`DELETE`、`HEAD`、`OPTIONS`

## GET ハンドラと page.tsx の衝突

**同じフォルダ内に `route.ts` と `page.tsx` を共存させることはできない。**

```
app/
├── api/
│   └── users/
│       └── route.ts    # /api/users
└── users/
    ├── page.tsx        # /users（ページ）
    └── route.ts        # 警告: page.tsx と衝突する!
```

同じパスでページと API の両方が必要なら、別のパスにする。

```
app/
├── users/
│   └── page.tsx        # /users（ページ）
└── api/
    └── users/
        └── route.ts    # /api/users（API）
```

## 実行環境の挙動

route handler は **Server Component と同等の環境** で動作する。

- Yes: `async/await` が使える
- Yes: `cookies()`、`headers()` にアクセス可能
- Yes: Node.js API が使える
- No: React フックは使えない
- No: React DOM API は使えない
- No: ブラウザ API は使えない

```tsx
// Bad: これは動作しない - route handler では React DOM が使えない
import { renderToString } from 'react-dom/server'

export async function GET() {
  const html = renderToString(<Component />)  // Error!
  return new Response(html)
}
```

## 動的 route handler

```tsx
// app/api/users/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getUser(id)

  if (!user) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  return Response.json(user)
}
```

## リクエストヘルパー

```tsx
export async function GET(request: Request) {
  // URL と search params
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  // ヘッダ
  const authHeader = request.headers.get('authorization')

  // Cookie（Next.js のヘルパー）
  const cookieStore = await cookies()
  const token = cookieStore.get('token')

  return Response.json({ query, token })
}
```

## レスポンスヘルパー

```tsx
// JSON レスポンス
return Response.json({ data })

// ステータス付き
return Response.json({ error: 'Not found' }, { status: 404 })

// ヘッダ付き
return Response.json(data, {
  headers: {
    'Cache-Control': 'max-age=3600',
  },
})

// リダイレクト
return Response.redirect(new URL('/login', request.url))

// ストリーム
return new Response(stream, {
  headers: { 'Content-Type': 'text/event-stream' },
})
```

## Route Handlers と Server Actions の使い分け

| ユースケース | Route Handlers | Server Actions |
|----------|----------------|----------------|
| フォーム送信 | No | Yes |
| UI からのデータミューテーション | No | Yes |
| サードパーティの webhook | Yes | No |
| 外部 API の利用 | Yes | No |
| 公開 REST API | Yes | No |
| ファイルアップロード | どちらも可 | どちらも可 |

**UI からのミューテーションには Server Actions を推奨**。
**外部連携や公開 API には Route Handlers を使う**。
