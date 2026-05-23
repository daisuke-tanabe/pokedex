---
name: next-best-practices
description: Next.js ベストプラクティス - ファイル規約、RSC 境界、データパターン、async API、メタデータ、エラー処理、Route Handlers、画像/フォント最適化、バンドリング
user-invocable: false
---

# Next.js ベストプラクティス

Next.js のコードを書く / レビューする際は、これらのルールを適用する。

## ファイル規約

[file-conventions.md](./file-conventions.md) を参照。

- プロジェクト構成と特殊ファイル
- ルートセグメント（dynamic、catch-all、グループ）
- 並列ルートとインターセプトルート
- v16 での middleware リネーム（middleware → proxy）

## RSC 境界

React Server Component の不正なパターンを検出する。

[rsc-boundaries.md](./rsc-boundaries.md) を参照。

- async client component の検出（不正）
- 非シリアライズ可能な props の検出
- Server Action の例外

## Async パターン

Next.js 15 以降の async API 変更点。

[async-patterns.md](./async-patterns.md) を参照。

- async な `params` と `searchParams`
- async な `cookies()` と `headers()`
- マイグレーション codemod

## ランタイム選択

[runtime-selection.md](./runtime-selection.md) を参照。

- 既定では Node.js ランタイムを使う
- Edge ランタイムが適切なケース

## ディレクティブ

[directives.md](./directives.md) を参照。

- `'use client'`、`'use server'`（React）
- `'use cache'`（Next.js）

## 関数

[functions.md](./functions.md) を参照。

- ナビゲーションフック: `useRouter`、`usePathname`、`useSearchParams`、`useParams`
- サーバー関数: `cookies`、`headers`、`draftMode`、`after`
- Generate 関数: `generateStaticParams`、`generateMetadata`

## エラー処理

[error-handling.md](./error-handling.md) を参照。

- `error.tsx`、`global-error.tsx`、`not-found.tsx`
- `redirect`、`permanentRedirect`、`notFound`
- `forbidden`、`unauthorized`（認証エラー）
- catch ブロック用の `unstable_rethrow`

## データパターン

[data-patterns.md](./data-patterns.md) を参照。

- Server Components / Server Actions / Route Handlers の使い分け
- データウォーターフォール回避（`Promise.all`、Suspense、preload）
- Client component でのデータ取得

## Route Handlers

[route-handlers.md](./route-handlers.md) を参照。

- `route.ts` の基本
- GET ハンドラと `page.tsx` の衝突
- 実行環境の挙動（React DOM は使えない）
- Server Actions との使い分け

## メタデータと OG Image

[metadata.md](./metadata.md) を参照。

- 静的メタデータと動的メタデータ
- `generateMetadata` 関数
- `next/og` での OG image 生成
- ファイルベースのメタデータ規約

## 画像最適化

[image.md](./image.md) を参照。

- `<img>` ではなく必ず `next/image` を使う
- リモート画像の設定
- レスポンシブな `sizes` 属性
- blur placeholder
- LCP 向けの priority loading

## フォント最適化

[font.md](./font.md) を参照。

- `next/font` のセットアップ
- Google Fonts、ローカルフォント
- Tailwind CSS との統合
- サブセットの preloading

## バンドリング

[bundling.md](./bundling.md) を参照。

- サーバー非互換パッケージ
- CSS import（link タグではない）
- ポリフィル（既に同梱されている）
- ESM/CommonJS の問題
- バンドル解析

## Scripts

[scripts.md](./scripts.md) を参照。

- `next/script` とネイティブ script タグの使い分け
- inline scripts には `id` が必要
- ロード戦略
- `@next/third-parties` での Google Analytics

## hydration エラー

[hydration-error.md](./hydration-error.md) を参照。

- よくある原因（ブラウザ API、日付、不正な HTML）
- エラーオーバーレイによるデバッグ
- 原因ごとの修正方法

## Suspense 境界

[suspense-boundaries.md](./suspense-boundaries.md) を参照。

- `useSearchParams` と `usePathname` による CSR bailout
- Suspense 境界が必要なフック

## 並列ルートとインターセプトルート

[parallel-routes.md](./parallel-routes.md) を参照。

- `@slot` と `(.)` インターセプタによるモーダルパターン
- フォールバック用の `default.tsx`
- `router.back()` による正しいモーダルの閉じ方

## セルフホスティング

[self-hosting.md](./self-hosting.md) を参照。

- Docker 向けの `output: 'standalone'`
- マルチインスタンス ISR 用のキャッシュハンドラ
- 動作するもの / 追加設定が必要なもの

## デバッグの小技

[debug-tricks.md](./debug-tricks.md) を参照。

- AI 支援デバッグ向けの MCP エンドポイント
- `--debug-build-paths` で特定のルートだけリビルド
