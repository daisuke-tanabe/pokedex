# Bulletproof React パターン — リファレンス

bulletproof-react-patterns skill の詳細リファレンス。[bulletproof-react](https://github.com/alan2207/bulletproof-react)（Alan Alickovic 作、MIT License）をベースとしている。

## ファイル一覧（全 9 件）

### アーキテクチャ

- `project-structure.md` — feature ベースの構成、feature 間 import の制限、単方向アーキテクチャ
- `api-layer.md` — API クライアントのセットアップ、リクエスト宣言、query / mutation フックパターン

### コンポーネント

- `components-and-styling.md` — コンポーネントのベストプラクティス、階層、サードパーティラップ、ライブラリ、スタイリング手法

### State とデータ

- `state-management.md` — component / application / server cache / form / URL state のカテゴリ分け

### 信頼性

- `error-handling.md` — API エラー、エラーバウンダリ、エラートラッキング (Sentry)
- `testing.md` — Vitest / Testing Library / Playwright / MSW による unit / integration / e2e テスト
- `security.md` — 認証、トークン保管、XSS 対策、RBAC / PBAC による認可

### 標準とパフォーマンス

- `project-standards.md` — ESLint、Prettier、TypeScript、Husky、絶対 import、ファイル命名規約
- `performance.md` — コード分割、データプリフェッチ、state 最適化、children パターン、スタイリングのパフォーマンス

## 出典

内容は [bulletproof-react](https://github.com/alan2207/bulletproof-react/tree/master/docs) のドキュメント (MIT License) を元にしている。
