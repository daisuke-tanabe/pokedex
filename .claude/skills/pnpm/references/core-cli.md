---
name: pnpm-cli-commands
description: パッケージ管理・スクリプト実行・workspace 操作のための主要な pnpm コマンド
---

# pnpm の CLI コマンド

pnpm は npm/yarn と似た包括的な CLI を提供しつつ、独自機能も備えたパッケージ管理ツールである。

## インストール系コマンド

### すべての依存をインストール
```bash
pnpm install
# または
pnpm i
```

### 依存を追加
```bash
# 本番用 dependency
pnpm add <pkg>

# 開発用 dependency
pnpm add -D <pkg>
pnpm add --save-dev <pkg>

# optional dependency
pnpm add -O <pkg>

# グローバルパッケージ
pnpm add -g <pkg>

# バージョン指定
pnpm add <pkg>@<version>
pnpm add <pkg>@next
pnpm add <pkg>@^1.0.0
```

### 依存を削除
```bash
pnpm remove <pkg>
pnpm rm <pkg>
pnpm uninstall <pkg>
pnpm un <pkg>
```

### 依存を更新
```bash
# すべて更新
pnpm update
pnpm up

# 特定のパッケージを更新
pnpm update <pkg>

# 最新版に更新 (semver を無視)
pnpm update --latest
pnpm up -L

# 対話モードでの更新
pnpm update --interactive
pnpm up -i
```

## スクリプト系コマンド

### スクリプトを実行
```bash
pnpm run <script>
# またはショートハンド
pnpm <script>

# スクリプトに引数を渡す
pnpm run build -- --watch

# スクリプトが存在する場合のみ実行 (無ければエラーにしない)
pnpm run --if-present build
```

### バイナリの実行
```bash
# ローカルのバイナリを実行
pnpm exec <command>

# 例
pnpm exec eslint .
```

### dlx — インストールせずに実行
```bash
# npx の pnpm 版
pnpm dlx <pkg>

# 例
pnpm dlx create-vite my-app
pnpm dlx degit user/repo my-project
```

## Workspace 系コマンド

### すべてのパッケージで実行
```bash
# workspace 内のすべてのパッケージでスクリプトを実行
pnpm -r run <script>
pnpm --recursive run <script>

# 特定のパッケージのみで実行
pnpm --filter <pattern> run <script>

# 例
pnpm --filter "./packages/**" run build
pnpm --filter "!./packages/internal/**" run test
pnpm --filter "@myorg/*" run lint
```

### フィルタパターン
```bash
# パッケージ名で指定
pnpm --filter <pkg-name> <command>
pnpm --filter "@scope/pkg" build

# ディレクトリで指定
pnpm --filter "./packages/core" test

# パッケージの依存元方向 (依存しているパッケージ群)
pnpm --filter "...@scope/app" build

# パッケージの依存先方向 (依存されているパッケージ群)
pnpm --filter "@scope/core..." test

# 特定のコミット/ブランチ以降で変更があったパッケージ
pnpm --filter "...[origin/main]" build
```

## その他の便利なコマンド

### パッケージをリンク
```bash
# グローバルにリンク
pnpm link --global
pnpm link -g

# リンク済みパッケージを利用
pnpm link --global <pkg>
```

### パッケージをパッチ
```bash
# パッケージのパッチを作成
pnpm patch <pkg>@<version>

# 編集後、パッチをコミット
pnpm patch-commit <path>

# パッチを削除
pnpm patch-remove <pkg>
```

### Store の管理
```bash
# store のパスを表示
pnpm store path

# 参照されていないパッケージを削除
pnpm store prune

# store の整合性をチェック
pnpm store status
```

### その他のコマンド
```bash
# クリーンインストール (npm ci 相当)
pnpm install --frozen-lockfile

# インストール済みパッケージの一覧
pnpm list
pnpm ls

# あるパッケージがなぜ入っているかを表示
pnpm why <pkg>

# 古くなったパッケージを表示
pnpm outdated

# 脆弱性監査
pnpm audit

# ネイティブモジュールを再ビルド
pnpm rebuild

# npm/yarn の lockfile からインポート
pnpm import

# tarball を作成
pnpm pack

# パッケージを公開
pnpm publish
```

## 便利なフラグ

```bash
# スクリプトを無視
pnpm install --ignore-scripts

# オフライン (キャッシュ) を優先
pnpm install --prefer-offline

# 厳格な peer dependency チェック
pnpm install --strict-peer-dependencies

# 本番依存のみ
pnpm install --prod
pnpm install -P

# optional dependency を無視
pnpm install --no-optional
```

<!--
Source references:
- https://pnpm.io/cli/install
- https://pnpm.io/cli/add
- https://pnpm.io/cli/run
- https://pnpm.io/filtering
-->
