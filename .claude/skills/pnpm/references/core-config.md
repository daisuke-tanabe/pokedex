---
name: pnpm-configuration
description: pnpm-workspace.yaml と .npmrc を用いた設定オプション
---

# pnpm の設定

pnpm では、workspace と pnpm 固有の設定を記述する `pnpm-workspace.yaml` と、npm 互換および pnpm 固有の設定を記述する `.npmrc` という、2 つの主要な設定ファイルを利用する。

## pnpm-workspace.yaml

pnpm 固有の設定の推奨配置先。プロジェクトのルートに置く。

```yaml
# workspace パッケージの定義
packages:
  - 'packages/*'
  - 'apps/*'
  - '!**/test/**'  # 除外パターン

# 共有する依存バージョンの catalog
catalog:
  react: ^18.2.0
  typescript: ~5.3.0

# 依存グループ別の名前付き catalog
catalogs:
  react17:
    react: ^17.0.2
    react-dom: ^17.0.2
  react18:
    react: ^18.2.0
    react-dom: ^18.2.0

# 解決結果の override (推奨配置先)
overrides:
  lodash: ^4.17.21
  'foo@^1.0.0>bar': ^2.0.0

# pnpm 設定 (.npmrc の代替)
settings:
  auto-install-peers: true
  strict-peer-dependencies: false
  link-workspace-packages: true
  prefer-workspace-packages: true
  shared-workspace-lockfile: true
```

## .npmrc の設定

pnpm は `.npmrc` から設定を読み込む。プロジェクトのルートまたはユーザーホームに作成する。

### よく使う pnpm 設定

```ini
# peer dependency を自動インストール
auto-install-peers=true

# peer dependency 問題で失敗させる
strict-peer-dependencies=false

# 依存の hoist パターン
public-hoist-pattern[]=*types*
public-hoist-pattern[]=*eslint*
shamefully-hoist=false

# store の場所
store-dir=~/.pnpm-store

# 仮想 store の場所
virtual-store-dir=node_modules/.pnpm

# lockfile 関連
lockfile=true
prefer-frozen-lockfile=true

# 副作用キャッシュ (再ビルドを高速化)
side-effects-cache=true

# レジストリ設定
registry=https://registry.npmjs.org/
@myorg:registry=https://npm.myorg.com/
```

### Workspace 関連の設定

```ini
# workspace パッケージをリンク
link-workspace-packages=true

# レジストリより workspace パッケージを優先
prefer-workspace-packages=true

# すべてのパッケージで単一の lockfile を共有
shared-workspace-lockfile=true

# workspace 依存の save prefix
save-workspace-protocol=rolling
```

### Node.js 関連の設定

```ini
# 特定の Node.js バージョンを使用
use-node-version=20.10.0

# Node.js バージョンファイル
node-version-file=.nvmrc

# Node.js のバージョン管理
manage-package-manager-versions=true
```

### セキュリティ関連の設定

```ini
# 特定スクリプトを無視
ignore-scripts=false

# 特定のビルドスクリプトのみ許可
onlyBuiltDependencies[]=esbuild
onlyBuiltDependencies[]=sharp

# 不足する peer dependency を補う package extensions
package-extensions[foo@1].peerDependencies.bar=*
```

## 設定の優先順位

設定は次の順に読み込まれ、後のものが先のものを上書きする。

1. `/etc/npmrc` — グローバル設定
2. `~/.npmrc` — ユーザー設定
3. `<project>/.npmrc` — プロジェクト設定
4. 環境変数: `npm_config_<key>=<value>`
5. `pnpm-workspace.yaml` の settings フィールド

## 環境変数

```bash
# 環境変数経由で設定
npm_config_registry=https://registry.npmjs.org/

# pnpm 固有の環境変数
PNPM_HOME=~/.local/share/pnpm
```

## package.json のフィールド

pnpm は `package.json` の特定フィールドを読み取る。

```json
{
  "pnpm": {
    "overrides": {
      "lodash": "^4.17.21"
    },
    "peerDependencyRules": {
      "ignoreMissing": ["@babel/*"],
      "allowedVersions": {
        "react": "17 || 18"
      }
    },
    "neverBuiltDependencies": ["fsevents"],
    "onlyBuiltDependencies": ["esbuild"],
    "allowedDeprecatedVersions": {
      "request": "*"
    },
    "patchedDependencies": {
      "express@4.18.2": "patches/express@4.18.2.patch"
    }
  }
}
```

## npm/yarn との主な違い

1. **デフォルトで strict**: phantom dependency を許容しない
2. **Workspace protocol**: ローカルパッケージに `workspace:*` を使用
3. **Catalogs**: バージョンを一元管理
4. **コンテンツアドレス指定 store**: プロジェクト間で共有される

<!--
Source references:
- https://pnpm.io/pnpm-workspace_yaml
- https://pnpm.io/npmrc
- https://pnpm.io/package_json
-->
