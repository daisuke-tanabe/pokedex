# プロジェクト構成

ファイル種別ではなく **機能 (feature) 単位** で整理する。コードの大半は `src/` 以下に置く。

```
src/
├── app/                # アプリケーションシェル
│   ├── routes/         # ルート定義とページコンポーネント
│   ├── app.tsx         # メインのアプリケーションコンポーネント
│   ├── provider.tsx    # 全プロバイダの合成 (query / auth / theme など)
│   └── router.tsx      # アプリケーションのルーター設定
├── assets/             # 静的ファイル (画像、フォントなど)
├── components/         # 共有・再利用可能な UI コンポーネント
│   ├── ui/             # プリミティブ (Button, Input, Modal など)
│   └── layouts/        # レイアウトシェル (Sidebar, Header など)
├── config/             # 環境変数、定数
├── features/           # 機能単位のモジュール (下記参照)
├── hooks/              # 共有カスタムフック
├── lib/                # 設定済みライブラリラッパー (axios, dayjs など)
├── stores/             # グローバルクライアント state (zustand, jotai など)
├── testing/            # テストユーティリティ、MSW handlers、factory
├── types/              # 共有 TypeScript 型
└── utils/              # 純粋なユーティリティ関数
```

## 機能モジュールの構成

各機能は自己完結し、必要なフォルダだけを含める:

```
src/features/awesome-feature/
├── api/            # API リクエスト宣言と query フック
├── assets/         # この機能専用の静的ファイル
├── components/     # 機能専用コンポーネント
├── hooks/          # 機能専用フック
├── stores/         # この機能の state ストア
├── types/          # この機能の TypeScript 型
└── utils/          # この機能のユーティリティ関数
```

機能にとって必要なフォルダのみを置く。

## ルール

- features は他の features から直接 import しない。
- 共有コードは `components/` / `hooks/` / `lib/` / `utils/` に配置する。
- 共有ディレクトリへの昇格は 2 つ以上の feature で再利用されたタイミングで行う。
- 機能同士の合成は機能内ではなくアプリケーション層 (`app/`) で行う。
- Vite の tree-shaking を効かせるため、barrel re-export より直接 import を優先する。

## feature 間の import 制限を強制する

ESLint の `import/no-restricted-paths` で features が互いを import するのを防ぐ:

```javascript
"import/no-restricted-paths": [
  "error",
  {
    zones: [
      {
        target: "./src/features/auth",
        from: "./src/features",
        except: ["./auth"],
      },
      {
        target: "./src/features/comments",
        from: "./src/features",
        except: ["./comments"],
      },
      {
        target: "./src/features/discussions",
        from: "./src/features",
        except: ["./discussions"],
      },
      {
        target: "./src/features/users",
        from: "./src/features",
        except: ["./users"],
      },
      // feature 1 つにつき 1 エントリ追加していく...
    ],
  },
],
```

## 単方向アーキテクチャを強制する

コードは一方向に流れる: **shared → features → app**。

- features は shared モジュールを import できるが、`app/` からは import しない。
- shared モジュールは features や app から import しない。

```javascript
"import/no-restricted-paths": [
  "error",
  {
    zones: [
      // features は app から import できない
      { target: "./src/features", from: "./src/app" },
      // shared モジュールは features や app から import できない
      {
        target: [
          "./src/components",
          "./src/hooks",
          "./src/lib",
          "./src/types",
          "./src/utils",
        ],
        from: ["./src/features", "./src/app"],
      },
    ],
  },
],
```

このアーキテクチャはメタフレームワーク (Next.js, Remix, React Native) を横断して適用できる。
