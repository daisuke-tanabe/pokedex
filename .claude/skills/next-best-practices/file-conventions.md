# ファイル規約

Next.js App Router はファイルベースのルーティングと特殊なファイル規約を採用している。

## プロジェクト構成

参考: https://nextjs.org/docs/app/getting-started/project-structure

```
app/
├── layout.tsx          # ルートレイアウト（必須）
├── page.tsx            # ホームページ (/)
├── loading.tsx         # ローディング UI
├── error.tsx           # エラー UI
├── not-found.tsx       # 404 UI
├── global-error.tsx    # グローバルエラー UI
├── route.ts            # API エンドポイント
├── template.tsx        # 再レンダリングされるレイアウト
├── default.tsx         # 並列ルートのフォールバック
├── blog/
│   ├── page.tsx        # /blog
│   └── [slug]/
│       └── page.tsx    # /blog/:slug
└── (group)/            # ルートグループ（URL には影響しない）
    └── page.tsx
```

## 特殊ファイル

| ファイル | 用途 |
|------|---------|
| `page.tsx` | ルートセグメントの UI |
| `layout.tsx` | セグメントとその子で共有される UI |
| `loading.tsx` | ローディング UI（Suspense 境界） |
| `error.tsx` | エラー UI（Error 境界） |
| `not-found.tsx` | 404 UI |
| `route.ts` | API エンドポイント |
| `template.tsx` | layout と似ているがナビゲーション時に再レンダリングされる |
| `default.tsx` | 並列ルートのフォールバック |

## ルートセグメント

```
app/
├── blog/               # 静的セグメント: /blog
├── [slug]/             # 動的セグメント: /:slug
├── [...slug]/          # catch-all: /a/b/c
├── [[...slug]]/        # オプショナル catch-all: / または /a/b/c
└── (marketing)/        # ルートグループ（URL では無視される）
```

## 並列ルート

```
app/
├── @analytics/
│   └── page.tsx
├── @sidebar/
│   └── page.tsx
└── layout.tsx          # props として { analytics, sidebar } を受け取る
```

## インターセプトルート

```
app/
├── feed/
│   └── page.tsx
├── @modal/
│   └── (.)photo/[id]/  # /feed から /photo/[id] をインターセプト
│       └── page.tsx
└── photo/[id]/
    └── page.tsx
```

規約:
- `(.)` - 同じ階層
- `(..)` - 1 つ上の階層
- `(..)(..)` - 2 つ上の階層
- `(...)` - ルートから

## プライベートフォルダ

```
app/
├── _components/        # プライベートフォルダ（ルートではない）
│   └── Button.tsx
└── page.tsx
```

`_` をプレフィックスにすることでルーティング対象から除外できる。

## Middleware / Proxy

### Next.js 14-15: `middleware.ts`

```ts
// middleware.ts（プロジェクトルート）
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 認証、リダイレクト、リライトなど
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
};
```

### Next.js 16+: `proxy.ts`

意味を明確にするためにリネームされた。機能は同じで、名前だけが変わる。

```ts
// proxy.ts（プロジェクトルート）
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // middleware と同じロジック
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
};
```

| バージョン | ファイル | エクスポート | Config |
|---------|------|--------|--------|
| v14-15 | `middleware.ts` | `middleware()` | `config` |
| v16+ | `proxy.ts` | `proxy()` | `config` |

**マイグレーション**: `npx @next/codemod@latest upgrade` を実行すると自動でリネームされる。

## ファイル規約リファレンス

参考: https://nextjs.org/docs/app/api-reference/file-conventions
