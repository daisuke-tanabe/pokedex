---
name: pnpm-catalogs
description: workspace 全体の依存バージョンを一元管理するための仕組み
---

# pnpm の Catalogs

Catalog は workspace 全体で依存バージョンを一元的に管理する方法を提供する。バージョンを一度定義すれば、どこからでも利用できる。

## 基本的な使い方

`pnpm-workspace.yaml` で catalog を定義する。

```yaml
packages:
  - 'packages/*'

catalog:
  react: ^18.2.0
  react-dom: ^18.2.0
  typescript: ~5.3.0
  vite: ^5.0.0
```

`package.json` から `catalog:` で参照する。

```json
{
  "dependencies": {
    "react": "catalog:",
    "react-dom": "catalog:"
  },
  "devDependencies": {
    "typescript": "catalog:",
    "vite": "catalog:"
  }
}
```

## 名前付き Catalog

シナリオごとに複数の catalog を作成できる。

```yaml
packages:
  - 'packages/*'

# デフォルト catalog
catalog:
  lodash: ^4.17.21

# 名前付き catalog
catalogs:
  react17:
    react: ^17.0.2
    react-dom: ^17.0.2

  react18:
    react: ^18.2.0
    react-dom: ^18.2.0

  testing:
    vitest: ^1.0.0
    "@testing-library/react": ^14.0.0
```

名前付き catalog を参照する。

```json
{
  "dependencies": {
    "react": "catalog:react18",
    "react-dom": "catalog:react18"
  },
  "devDependencies": {
    "vitest": "catalog:testing"
  }
}
```

## メリット

1. **単一の信頼できる情報源**: バージョンを 1 か所で更新できる
2. **整合性**: すべてのパッケージが同じバージョンを使用する
3. **アップグレードが容易**: 1 度バージョンを変更すれば workspace 全体に反映される
4. **型安全**: pnpm-workspace.yaml で TypeScript のサポートが効く

## Catalog と Overrides の比較

| 機能 | Catalogs | Overrides |
|---------|----------|-----------|
| 目的 | 直接依存のバージョンを定義 | 任意の依存のバージョンを強制 |
| スコープ | 直接依存のみ | 推移的依存も含むすべての依存 |
| 利用方法 | `"pkg": "catalog:"` | 自動適用 |
| オプトイン | package.json ごとに明示的 | workspace 全体にグローバル適用 |

## Catalog を使ったパッケージの公開

公開時、`catalog:` の参照は実バージョンに置換される。

```json
// 公開前 (ソース)
{
  "dependencies": {
    "react": "catalog:"
  }
}

// 公開後 (公開されるパッケージ)
{
  "dependencies": {
    "react": "^18.2.0"
  }
}
```

## Overrides からの移行

バージョン整合のために overrides を利用している場合は、

```yaml
# 移行前 (overrides を使用)
overrides:
  react: ^18.2.0
  react-dom: ^18.2.0
```

依存管理を整理するために catalog へ移行する。

```yaml
# 移行後 (catalog を使用)
catalog:
  react: ^18.2.0
  react-dom: ^18.2.0
```

そのうえで、各 package.json を `catalog:` 参照に置き換える。

## ベストプラクティス

1. **共有依存にはデフォルト catalog を使う**: 広く共有される依存に向く
2. **バージョンバリエーションには名前付き catalog を使う**: 例: React のバージョン違い
3. **catalog は最小限に保つ**: 共有される依存のみを載せる
4. **workspace protocol と併用する**: 内部パッケージは workspace protocol を使う

```yaml
catalog:
  # 共有される外部依存
  lodash: ^4.17.21
  zod: ^3.22.0

# 内部パッケージは代わりに workspace: プロトコルを使う
# "dependencies": { "@myorg/utils": "workspace:^" }
```

<!--
Source references:
- https://pnpm.io/catalogs
-->
