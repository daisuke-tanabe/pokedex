---
name: pnpm-hooks
description: pnpmfile の hook でパッケージ解決と依存挙動をカスタマイズする
---

# pnpm の Hooks

pnpm は `.pnpmfile.cjs` を通じて、パッケージ解決やメタデータ処理を上書きできる hook を提供する。

## セットアップ

workspace ルートに `.pnpmfile.cjs` を作成する。

```js
// .pnpmfile.cjs
function readPackage(pkg, context) {
  // パッケージのメタデータを編集
  return pkg
}

function afterAllResolved(lockfile, context) {
  // lockfile を編集
  return lockfile
}

module.exports = {
  hooks: {
    readPackage,
    afterAllResolved
  }
}
```

## readPackage hook

解決前にすべてのパッケージに対して呼び出される。依存の編集、不足する peer dependency の追加、壊れたパッケージの修正に使う。

### 不足する peer dependency を追加

```js
function readPackage(pkg, context) {
  if (pkg.name === 'some-broken-package') {
    pkg.peerDependencies = {
      ...pkg.peerDependencies,
      react: '*'
    }
    context.log(`Added react peer dep to ${pkg.name}`)
  }
  return pkg
}
```

### 依存バージョンを上書き

```js
function readPackage(pkg, context) {
  // すべての lodash バージョンを修正
  if (pkg.dependencies?.lodash) {
    pkg.dependencies.lodash = '^4.17.21'
  }
  if (pkg.devDependencies?.lodash) {
    pkg.devDependencies.lodash = '^4.17.21'
  }
  return pkg
}
```

### 不要な依存を削除

```js
function readPackage(pkg, context) {
  // 問題を起こす optional dependency を削除
  if (pkg.optionalDependencies?.fsevents) {
    delete pkg.optionalDependencies.fsevents
  }
  return pkg
}
```

### パッケージを置換

```js
function readPackage(pkg, context) {
  // 非推奨パッケージを置き換え
  if (pkg.dependencies?.['old-package']) {
    pkg.dependencies['new-package'] = pkg.dependencies['old-package']
    delete pkg.dependencies['old-package']
  }
  return pkg
}
```

### 壊れたパッケージを修正

```js
function readPackage(pkg, context) {
  // exports フィールドの誤りを修正
  if (pkg.name === 'broken-esm-package') {
    pkg.exports = {
      '.': {
        import: './dist/index.mjs',
        require: './dist/index.cjs'
      }
    }
  }
  return pkg
}
```

## afterAllResolved hook

lockfile 生成後に呼び出される。解決後の修正に使う。

```js
function afterAllResolved(lockfile, context) {
  // 解決されたすべてのパッケージをログ出力
  context.log(`Resolved ${Object.keys(lockfile.packages || {}).length} packages`)

  // 必要に応じて lockfile を編集
  return lockfile
}
```

## Context オブジェクト

`context` オブジェクトはユーティリティを提供する。

```js
function readPackage(pkg, context) {
  // メッセージをログ出力
  context.log('Processing package...')

  return pkg
}
```

## TypeScript との併用

型ヒントには JSDoc を使う。

```js
// .pnpmfile.cjs

/**
 * @param {import('type-fest').PackageJson} pkg
 * @param {{ log: (msg: string) => void }} context
 * @returns {import('type-fest').PackageJson}
 */
function readPackage(pkg, context) {
  return pkg
}

module.exports = {
  hooks: {
    readPackage
  }
}
```

## よくあるパターン

### パッケージ名で条件分岐

```js
function readPackage(pkg, context) {
  switch (pkg.name) {
    case 'package-a':
      pkg.dependencies.foo = '^2.0.0'
      break
    case 'package-b':
      delete pkg.optionalDependencies.bar
      break
  }
  return pkg
}
```

### 全パッケージに適用

```js
function readPackage(pkg, context) {
  // すべての optional fsevents を除去
  if (pkg.optionalDependencies) {
    delete pkg.optionalDependencies.fsevents
  }
  return pkg
}
```

### 解決処理のデバッグ

```js
function readPackage(pkg, context) {
  if (process.env.DEBUG_PNPM) {
    context.log(`${pkg.name}@${pkg.version}`)
    context.log(`  deps: ${Object.keys(pkg.dependencies || {}).join(', ')}`)
  }
  return pkg
}
```

## Hooks と Overrides の比較

| 機能 | Hooks (.pnpmfile.cjs) | Overrides |
|---------|----------------------|-----------|
| 複雑さ | JavaScript ロジックを利用可能 | 宣言的のみ |
| スコープ | パッケージメタデータ全般 | バージョンのみ |
| 用途 | 複雑な修正、条件分岐 | 単純なバージョン固定 |

**単純なバージョン修正は overrides を優先**する。**hooks は次のような場合に使う**:
- 条件分岐ロジックが必要
- バージョン以外の修正 (exports、peer dependency 等)
- ログ出力やデバッグ

## トラブルシューティング

### hook が実行されない

1. ファイル名が `.pnpmfile.cjs` であることを確認する (`.js` ではない)
2. workspace ルートに置かれていることを確認する
3. `pnpm install` を実行して hook をトリガーする

### hook をデバッグ

```bash
# hook のログを確認
pnpm install --reporter=append-only
```

<!--
Source references:
- https://pnpm.io/pnpmfile
-->
