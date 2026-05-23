# 並列ルートとインターセプトルート

並列ルートは、同じ layout 内で複数のページを描画する。インターセプトルートは、アプリ内からの遷移と URL への直接アクセスで異なる UI を表示する。両者を組み合わせるとモーダルパターンを実現できる。

## ファイル構成

```
app/
├── @modal/                    # 並列ルートのスロット
│   ├── default.tsx            # 必須! null を返す
│   ├── (.)photos/             # /photos/* をインターセプト
│   │   └── [id]/
│   │       └── page.tsx       # モーダルの中身
│   └── [...]catchall/         # 任意: 未マッチをキャッチする
│       └── page.tsx
├── photos/
│   └── [id]/
│       └── page.tsx           # フルページ（直接アクセス）
├── layout.tsx                 # children と @modal を両方レンダリング
└── page.tsx
```

## ステップ 1: スロット付きのルートレイアウト

```tsx
// app/layout.tsx
export default function RootLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <html>
      <body>
        {children}
        {modal}
      </body>
    </html>
  );
}
```

## ステップ 2: default ファイル（重要!）

**並列ルートのスロットには必ず `default.tsx` を置く**。これがないとハードナビゲーション時に 404 になる。

```tsx
// app/@modal/default.tsx
export default function Default() {
  return null;
}
```

このファイルが無いと、どんなページでもリロード時に 404 になる。`@modal` スロットでレンダリングすべき内容を Next.js が判断できないためだ。

## ステップ 3: インターセプトルート（モーダル）

`(.)` プレフィックスで同階層のルートをインターセプトする。

```tsx
// app/@modal/(.)photos/[id]/page.tsx
import { Modal } from '@/components/modal';

export default async function PhotoModal({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const photo = await getPhoto(id);

  return (
    <Modal>
      <img src={photo.url} alt={photo.title} />
    </Modal>
  );
}
```

## ステップ 4: フルページ（直接アクセス）

```tsx
// app/photos/[id]/page.tsx
export default async function PhotoPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const photo = await getPhoto(id);

  return (
    <div className="full-page">
      <img src={photo.url} alt={photo.title} />
      <h1>{photo.title}</h1>
    </div>
  );
}
```

## ステップ 5: 正しい閉じ方を持つモーダルコンポーネント

**重要: モーダルを閉じるには `router.back()` を使う。`router.push()` や `<Link>` は使わない。**

```tsx
// components/modal.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';

export function Modal({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);

  // Escape キーで閉じる
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        router.back(); // 正しい
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [router]);

  // オーバーレイクリックで閉じる
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      router.back(); // 正しい
    }
  }, [router]);

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        <button
          onClick={() => router.back()} // 正しい!
          className="absolute top-4 right-4"
        >
          Close
        </button>
        {children}
      </div>
    </div>
  );
}
```

### `router.push('/')` や `<Link href="/">` を使わない理由

`push` や `Link` でモーダルを「閉じる」と:

1. 新しい履歴エントリが追加される（戻るボタンでモーダルが再表示される）
2. インターセプトされたルートが正しくクリアされない
3. モーダルが一瞬チラついたり、想定外に残ったりする

`router.back()` を使えば:

1. 履歴からインターセプトされたルートが取り除かれる
2. 元のページに戻る
3. モーダルが正しくアンマウントされる

## マッチャーのリファレンス

マッチャーは **ルートセグメント** にマッチする。ファイルシステムのパスではない。

| マッチャー | マッチ対象 | 例 |
|---------|---------|---------|
| `(.)` | 同階層 | `@modal/(.)photos` が `/photos` をインターセプト |
| `(..)` | 1 階層上 | `/dashboard/@modal` 配下の `@modal/(..)settings` が `/settings` をインターセプト |
| `(..)(..)` | 2 階層上 | あまり使わない |
| `(...)` | ルートから | `@modal/(...)photos` が `/photos` をどこからでもインターセプト |

**よくある誤解**: `(..)` を「親フォルダ」と捉えてしまう。実際は「親のルートセグメント」を意味する。

## ハードナビゲーションの扱い

ユーザーが `/photos/123` に直接アクセスした場合（ブックマーク、リロード、共有リンクなど）:

- インターセプトルートは適用されない
- `photos/[id]/page.tsx` の本体がレンダリングされる
- モーダルは表示されない（想定通りの挙動）

直接アクセス時にもモーダル風にしたい場合は、追加のロジックが必要:

```tsx
// app/photos/[id]/page.tsx
import { Modal } from '@/components/modal';

export default async function PhotoPage({ params }) {
  const { id } = await params;
  const photo = await getPhoto(id);

  // 案: 直接アクセス時にも Modal として描画する
  return (
    <Modal>
      <img src={photo.url} alt={photo.title} />
    </Modal>
  );
}
```

## よくある落とし穴

### 1. `default.tsx` 不足によるリロード 404

すべての `@slot` フォルダには `null`（あるいは適切な内容）を返す `default.tsx` が必要。

### 2. ナビゲーション後もモーダルが残る

`router.back()` ではなく `router.push()` を使っているのが原因。

### 3. ネストした並列ルートには default もネストして配置する

ルートグループ内に `@modal` を置く場合、各階層に `default.tsx` が必要:

```
app/
├── (marketing)/
│   ├── @modal/
│   │   └── default.tsx     # 必要!
│   └── layout.tsx
└── layout.tsx
```

### 4. インターセプトされたルートの中身がおかしい

マッチャーを再確認する:

- `(.)photos` は同じルート階層から `/photos` をインターセプトする
- `@modal` が `app/dashboard/@modal` にあるなら、`(.)photos` がインターセプトするのは `/dashboard/photos` であって `/photos` ではない

### 5. `params` で TypeScript エラー

Next.js 15 以降では `params` は Promise:

```tsx
// 正しい
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}
```

## 完全な例: フォトギャラリーモーダル

```
app/
├── @modal/
│   ├── default.tsx
│   └── (.)photos/
│       └── [id]/
│           └── page.tsx
├── photos/
│   ├── page.tsx           # ギャラリーのグリッド
│   └── [id]/
│       └── page.tsx       # フルページの写真
├── layout.tsx
└── page.tsx
```

ギャラリー内のリンク:

```tsx
// app/photos/page.tsx
import Link from 'next/link';

export default async function Gallery() {
  const photos = await getPhotos();

  return (
    <div className="grid grid-cols-3 gap-4">
      {photos.map(photo => (
        <Link key={photo.id} href={`/photos/${photo.id}`}>
          <img src={photo.thumbnail} alt={photo.title} />
        </Link>
      ))}
    </div>
  );
}
```

写真クリック → モーダルが開く（インターセプト）
直接 URL アクセス → フルページが描画される
モーダルを開いたままリロード → フルページが描画される
