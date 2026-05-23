# 画像最適化

`next/image` を使えば画像を自動で最適化できる。

## 必ず next/image を使う

```tsx
// Bad: ネイティブ img を避ける
<img src="/hero.png" alt="Hero" />

// Good: next/image を使う
import Image from 'next/image'
<Image src="/hero.png" alt="Hero" width={800} height={400} />
```

## 必須の props

レイアウトシフトを防ぐため、画像には明示的な寸法が必要。

```tsx
// ローカル画像 - 寸法は自動で推測される
import heroImage from './hero.png'
<Image src={heroImage} alt="Hero" />

// リモート画像 - width と height を必ず指定する
<Image src="https://example.com/image.jpg" alt="Hero" width={800} height={400} />

// 親要素に追従させたい場合は fill を使う
<div style={{ position: 'relative', width: '100%', height: 400 }}>
  <Image src="/hero.png" alt="Hero" fill style={{ objectFit: 'cover' }} />
</div>
```

## リモート画像の設定

リモートドメインは `next.config.js` で設定する。

```js
// next.config.js
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'example.com',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: '*.cdn.com', // サブドメインのワイルドカード
      },
    ],
  },
}
```

## レスポンシブ画像

`sizes` でブラウザにダウンロードすべきサイズを伝える。

```tsx
// フル幅のヒーロー画像
<Image
  src="/hero.png"
  alt="Hero"
  fill
  sizes="100vw"
/>

// レスポンシブグリッド（デスクトップで 3 カラム、モバイルで 1 カラム）
<Image
  src="/card.png"
  alt="Card"
  fill
  sizes="(max-width: 768px) 100vw, 33vw"
/>

// 固定サイズのサイドバー画像
<Image
  src="/avatar.png"
  alt="Avatar"
  width={200}
  height={200}
  sizes="200px"
/>
```

## blur placeholder

placeholder でレイアウトシフトを防ぐ。

```tsx
// ローカル画像 - 自動で blur hash が生成される
import heroImage from './hero.png'
<Image src={heroImage} alt="Hero" placeholder="blur" />

// リモート画像 - blurDataURL を渡す
<Image
  src="https://example.com/image.jpg"
  alt="Hero"
  width={800}
  height={400}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRg..."
/>

// 単色の placeholder を使う
<Image
  src="https://example.com/image.jpg"
  alt="Hero"
  width={800}
  height={400}
  placeholder="empty"
  style={{ backgroundColor: '#e0e0e0' }}
/>
```

## 優先読み込み（priority）

ファーストビューに含まれる画像（LCP）には `priority` を使う。

```tsx
// ヒーロー画像 - 即座に読み込む
<Image src="/hero.png" alt="Hero" fill priority />

// ファーストビュー外の画像 - 既定で遅延読み込み（priority は不要）
<Image src="/card.png" alt="Card" width={400} height={300} />
```

## よくあるミス

```tsx
// Bad: fill 利用時に sizes を指定していない - 最大サイズの画像がダウンロードされる
<Image src="/hero.png" alt="Hero" fill />

// Good: 適切なレスポンシブ挙動になるよう sizes を追加する
<Image src="/hero.png" alt="Hero" fill sizes="100vw" />

// Bad: アスペクト比のためだけに width/height を使う
<Image src="/hero.png" alt="Hero" width={16} height={9} />

// Good: 実際の表示寸法を指定するか、fill と sizes を組み合わせる
<Image src="/hero.png" alt="Hero" fill sizes="100vw" style={{ objectFit: 'cover' }} />

// Bad: 設定なしのリモート画像
<Image src="https://untrusted.com/image.jpg" alt="Image" width={400} height={300} />
// Error: Invalid src prop, hostname not configured

// Good: next.config.js の remotePatterns に hostname を追加する
```

## 静的エクスポート

`output: 'export'` を使う場合は、`unoptimized` を指定するかカスタムローダーを使う。

```tsx
// 選択肢 1: 最適化を無効化する
<Image src="/hero.png" alt="Hero" width={800} height={400} unoptimized />

// 選択肢 2: グローバル設定で無効化する
// next.config.js
module.exports = {
  output: 'export',
  images: { unoptimized: true },
}

// 選択肢 3: カスタムローダー（Cloudinary、Imgix など）
const cloudinaryLoader = ({ src, width, quality }) => {
  return `https://res.cloudinary.com/demo/image/upload/w_${width},q_${quality || 75}/${src}`
}

<Image loader={cloudinaryLoader} src="sample.jpg" alt="Sample" width={800} height={400} />
```
