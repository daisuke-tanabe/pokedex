---
name: next-upgrade
description: 公式マイグレーションガイドと codemod に従って Next.js を最新版にアップグレードする
argument-hint: "[target-version]"
---

# Next.js のアップグレード

公式マイグレーションガイドに従い、現在のプロジェクトを最新の Next.js バージョンにアップグレードする。

## 手順

1. **現在のバージョンを検出**: `package.json` を読み、現在の Next.js バージョンと関連依存（React、React DOM など）を特定する。

2. **最新のアップグレードガイドを取得**: WebFetch で公式アップグレードドキュメントを取得する。
   - Codemods: https://nextjs.org/docs/app/guides/upgrading/codemods
   - バージョン別ガイド（必要に応じてバージョンを変える）:
     - https://nextjs.org/docs/app/guides/upgrading/version-16
     - https://nextjs.org/docs/app/guides/upgrading/version-15
     - https://nextjs.org/docs/app/guides/upgrading/version-14

3. **アップグレードパスを決定**: 現在のバージョンを踏まえ、どの移行ステップを適用するか判断する。メジャーバージョンを大きく飛ばす場合は段階的にアップグレードする（例: 13 → 14 → 15）。

4. **まず codemod を実行**: Next.js は破壊的変更を自動化する codemod を提供している。

   ```bash
   npx @next/codemod@latest <transform> <path>
   ```

   よく使う transform:
   - `next-async-request-api` - 非同期 Request API への更新（v15）
   - `next-request-geo-ip` - geo/ip プロパティの移行（v15）
   - `next-dynamic-access-named-export` - dynamic import の変換（v15）

5. **依存を更新**: Next.js とピア依存をまとめてアップグレードする。

   ```bash
   npm install next@latest react@latest react-dom@latest
   ```

6. **破壊的変更を確認**: アップグレードガイドで手動対応が必要な変更を確認する。
   - API の変更（例: v15 の async params）
   - `next.config.js` の設定変更
   - 削除される非推奨機能

7. **TypeScript の型を更新**（該当する場合）:

   ```bash
   npm install @types/react@latest @types/react-dom@latest
   ```

8. **アップグレードをテスト**:
   - `npm run build` を実行してビルドエラーがないか確認する
   - `npm run dev` を実行し、主要機能を動作確認する
