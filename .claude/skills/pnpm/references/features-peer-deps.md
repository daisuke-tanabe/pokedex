---
name: pnpm-peer-dependencies
description: 自動インストールと解決ルールによる peer dependency の取り扱い
---

# pnpm の Peer Dependencies

pnpm はデフォルトで peer dependency を厳格に扱う。解決方法や警告の出し方を制御する設定を提供している。

## Peer dependency の自動インストール

デフォルトでは、pnpm は peer dependency を自動的にインストールする。

```ini
# .npmrc (pnpm v8 以降のデフォルトは true)
auto-install-peers=true
```

有効な場合、不足している peer dependency をベストマッチのバージョンで自動的に追加する。

## Strict な peer dependency

peer dependency の問題でエラーにするかどうかを制御する。

```ini
# peer dependency の問題で失敗させる (デフォルト: false)
strict-peer-dependencies=true
```

strict にすると、次の場合に失敗する。
- peer dependency が不足している
- インストール済みバージョンが要求範囲に合わない

## Peer dependency のルール

`package.json` で peer dependency の挙動を設定する。

```json
{
  "pnpm": {
    "peerDependencyRules": {
      "ignoreMissing": ["@babel/*", "eslint"],
      "allowedVersions": {
        "react": "17 || 18"
      },
      "allowAny": ["@types/*"]
    }
  }
}
```

### ignoreMissing

不足している peer dependency の警告を抑制する。

```json
{
  "pnpm": {
    "peerDependencyRules": {
      "ignoreMissing": [
        "@babel/*",
        "eslint",
        "webpack"
      ]
    }
  }
}
```

利用可能なパターン:
- `"react"` — パッケージ名の完全一致
- `"@babel/*"` — スコープ配下のすべてのパッケージ
- `"*"` — すべてのパッケージ (非推奨)

### allowedVersions

警告対象になる特定バージョンを許可する。

```json
{
  "pnpm": {
    "peerDependencyRules": {
      "allowedVersions": {
        "react": "17 || 18",
        "webpack": "4 || 5",
        "@types/react": "*"
      }
    }
  }
}
```

### allowAny

指定の peer dependency に対して任意のバージョンを許可する。

```json
{
  "pnpm": {
    "peerDependencyRules": {
      "allowAny": ["@types/*", "eslint"]
    }
  }
}
```

## Hook で peer dependency を追加

`.pnpmfile.cjs` で不足する peer dependency を補える。

```js
// .pnpmfile.cjs
function readPackage(pkg, context) {
  // 不足する peer dependency を追加
  if (pkg.name === 'problematic-package') {
    pkg.peerDependencies = {
      ...pkg.peerDependencies,
      react: '*'
    }
  }
  return pkg
}

module.exports = {
  hooks: {
    readPackage
  }
}
```

## Workspaces における peer dependency

workspace パッケージ自身が peer dependency を満たせる。

```json
// packages/app/package.json
{
  "dependencies": {
    "react": "^18.2.0",
    "@myorg/components": "workspace:^"
  }
}

// packages/components/package.json
{
  "peerDependencies": {
    "react": "^17.0.0 || ^18.0.0"
  }
}
```

workspace の `app` が `react` を提供することで、`components` の peer dependency を満たす。

## よくあるシナリオ

### Monorepo で React を共有

```yaml
# pnpm-workspace.yaml
catalog:
  react: ^18.2.0
  react-dom: ^18.2.0
```

```json
// packages/ui/package.json
{
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}

// apps/web/package.json
{
  "dependencies": {
    "react": "catalog:",
    "react-dom": "catalog:",
    "@myorg/ui": "workspace:^"
  }
}
```

### ESLint プラグインの警告を抑制

```json
{
  "pnpm": {
    "peerDependencyRules": {
      "ignoreMissing": [
        "eslint",
        "@typescript-eslint/parser"
      ]
    }
  }
}
```

### 複数のメジャーバージョンを許容

```json
{
  "pnpm": {
    "peerDependencyRules": {
      "allowedVersions": {
        "webpack": "4 || 5",
        "postcss": "7 || 8"
      }
    }
  }
}
```

## Peer dependency のデバッグ

```bash
# パッケージがインストールされている理由を確認
pnpm why <package>

# すべての peer dependency 警告を列挙
pnpm install --reporter=append-only 2>&1 | grep -i peer

# 依存ツリーを確認
pnpm list --depth=Infinity
```

## ベストプラクティス

1. **`auto-install-peers` を有効化する**: 利便性が高い (pnpm v8 以降のデフォルト)

2. **`peerDependencyRules` を使う**: すべての警告を握りつぶすのではなく、ルールで制御する

3. **抑制した警告は文書化する**: なぜ安全なのかを説明する

4. **ライブラリでは peer dependency の範囲を広く保つ**:
   ```json
   {
     "peerDependencies": {
       "react": "^17.0.0 || ^18.0.0"
     }
   }
   ```

5. **複数のメジャーをサポートする場合は実際に複数で検証する**

<!--
Source references:
- https://pnpm.io/package_json#pnpmpeerdependencyrules
- https://pnpm.io/npmrc#auto-install-peers
-->
