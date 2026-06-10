---
name: bulletproof-react-patterns
description: スケーラブルで保守性の高い React アプリケーションのための Bulletproof React アーキテクチャパターン。機能 (feature) ベースのプロジェクト構成、コンポーネント設計、状態管理の境界、API レイヤー設計、エラーハンドリング、セキュリティ、テスト戦略までカバーする。React プロジェクトの構造設計・アプリケーションアーキテクチャ策定・features の整理を行うとき、また「React プロジェクト構成」「スケーラブルなパターン」について質問されたときに使用する。
paths:
  - "apps/web/**"
---

# Bulletproof React パターン

スケーラブルで保守性の高い React アプリケーションを構築するためのアーキテクチャパターン集。[bulletproof-react](https://github.com/alan2207/bulletproof-react) をベースとしている。

## コアリファレンス

| トピック             | 概要                                                                                  | 参照先                                                         |
| -------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| プロジェクト構成     | feature ベースの構成、単方向アーキテクチャ、ESLint による強制                         | [project-structure](references/project-structure.md)           |
| コンポーネントとスタイリング | コンポーネント階層、サードパーティライブラリのラップ、headless vs styled の選択 | [components-and-styling](references/components-and-styling.md) |
| API レイヤー         | API クライアント、リクエスト宣言、query / mutation フックパターン                     | [api-layer](references/api-layer.md)                           |
| 状態管理             | component / application / server cache / form / URL state のカテゴリ分け              | [state-management](references/state-management.md)             |
| エラーハンドリング   | エラーバウンダリ、API エラー、Sentry によるエラートラッキング                         | [error-handling](references/error-handling.md)                 |
| テスト               | Vitest / Testing Library / Playwright / MSW による unit / integration / e2e 戦略      | [testing](references/testing.md)                               |
| プロジェクト標準     | ESLint、Prettier、TypeScript、Husky、絶対 import、ファイル命名規約                    | [project-standards](references/project-standards.md)           |
| セキュリティ         | 認証、トークン保管、XSS 対策、RBAC / PBAC による認可                                  | [security](references/security.md)                             |
| パフォーマンス       | コード分割、データプリフェッチ、state 最適化、children パターン                       | [performance](references/performance.md)                       |

## プロジェクト構成

ファイル種別ではなく **機能 (feature) 単位** で整理する。

```
src/
├── app/                # アプリケーションシェル (ルート定義、プロバイダ、ルーター)
├── assets/             # 静的ファイル (画像、フォント)
├── components/         # 共有・再利用可能な UI コンポーネント
├── config/             # 環境変数、定数
├── features/           # 機能単位のモジュール
├── hooks/              # 共有カスタムフック
├── lib/                # 設定済みライブラリラッパー
├── stores/             # グローバルクライアント state
├── testing/            # テストユーティリティ、MSW handlers、factory
├── types/              # 共有 TypeScript 型
└── utils/              # 純粋なユーティリティ関数
```

### 機能モジュール

```
features/users/
├── api/            # API 関数と query フック
├── components/     # 機能専用コンポーネント
├── hooks/          # 機能専用フック
├── types/          # 機能専用の型
└── utils/          # 機能専用のユーティリティ
```

**ルール:**

- features は他の features から import しない。アプリケーション層 (`app/`) で合成する。
- コードは一方向に流れる: **shared → features → app**。
- 共有ディレクトリへの昇格は 2 つ以上の feature で再利用されたタイミングで行う。
- Vite の tree-shaking を効かせるため、barrel re-export より直接 import を優先する。

## コンポーネント階層

```
Page Components          → ルート単位、features を合成、レイアウトを担当
  └── Feature Components → 機能専用、ビジネスロジックを保持
        └── UI Components      → 共有プリミティブ、ビジネスロジックを持たない
```

## API レイヤーパターン

```typescript
// 純粋な API 関数
function getUsers(params?: GetUsersParams): Promise<UsersResponse> {
    return api.get("/users", { params });
}

// API 関数をラップする query フック
function useUsers(params?: GetUsersParams) {
    return useQuery({
        queryKey: ["users", params],
        queryFn: () => getUsers(params),
    });
}
```

## 状態管理の境界

| State の種類          | 解法                          | 例                                            |
| --------------------- | ----------------------------- | --------------------------------------------- |
| Server state          | TanStack Query                | ユーザーデータ、投稿、API レスポンス           |
| Client state (global) | Zustand / Jotai               | テーマ、サイドバーの開閉、ユーザー設定         |
| Client state (local)  | useState / useReducer         | フォーム入力、トグル、モーダル開閉             |
| URL state             | URL search params / router    | フィルター、ページネーション、アクティブタブ   |
| Form state            | React Hook Form               | 複数ステップフォーム、バリデーション           |

**server state と client state を混在させない。** query データを `useState` にコピーしてはならない。

## エラー階層

```
App Error Boundary          → 回復不能なクラッシュを捕捉
  └── Route Error Boundary     → ルート単位の失敗を捕捉、リトライ UI を出す
        └── Feature Error Boundary   → 機能固有のエラーを捕捉
```

## テスト戦略

| レイヤー    | ツール                | 何をテストするか                                |
| ----------- | --------------------- | ----------------------------------------------- |
| Components  | Testing Library       | レンダリング結果、ユーザー操作、a11y            |
| Hooks       | renderHook            | state 変化、副作用                              |
| API         | MSW                   | リクエスト/レスポンスのハンドリング、エラー状態 |
| Integration | Testing Library + MSW | 機能フロー全体 (render → 操作 → 検証)           |
| E2E         | Playwright            | クリティカルなユーザージャーニー                |

## 規約

| 項目          | 規約                   | 例                          |
| ------------- | ---------------------- | --------------------------- |
| Components    | PascalCase             | `UserCard.tsx`              |
| Hooks         | camelCase、`use` 接頭辞 | `useUsers.ts`              |
| Utilities     | camelCase              | `formatDate.ts`             |
| Types         | PascalCase             | `User`, `CreateUserInput`   |
| Constants     | UPPER_SNAKE_CASE       | `MAX_RETRIES`               |
| Directories   | kebab-case             | `user-settings/`            |
| Files         | kebab-case             | `user-card.tsx`             |

### Imports

深い相対パスを避けるため path alias を使う:

```typescript
import { Button } from "@/components/ui/button";
import { useUsers } from "@/features/users/api";
```

`tsconfig.json` で `@/` を `src/` の alias として設定する。
