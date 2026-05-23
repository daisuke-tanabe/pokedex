---
name: migration-to-pnpm
description: npm/Yarn から pnpm へ摩擦を抑えて移行する
---

# pnpm への移行

既存プロジェクトを npm または Yarn から pnpm に移行するためのガイド。

## 手早い移行

### npm から

```bash
# npm の lockfile と node_modules を削除
rm -rf node_modules package-lock.json

# pnpm でインストール
pnpm install
```

### Yarn から

```bash
# Yarn の lockfile と node_modules を削除
rm -rf node_modules yarn.lock

# pnpm でインストール
pnpm install
```

### 既存 lockfile をインポート

pnpm は既存の lockfile をインポートできる。

```bash
# npm や yarn の lockfile からインポート
pnpm import

# 以下から pnpm-lock.yaml を生成する:
# - package-lock.json (npm)
# - yarn.lock (yarn)
# - npm-shrinkwrap.json (npm)
```

## よくある問題への対処

### Phantom dependency

pnpm は依存の宣言に厳しい。`package.json` に無いパッケージを import するコードは失敗する。

**問題:**
```js
// npm では動くが (hoist によって解決される)、pnpm では失敗する
import lodash from 'lodash' // dependencies に無く、別パッケージ経由で入っている
```

**解決策:** 不足している依存を明示的に追加する。
```bash
pnpm add lodash
```

### Peer dependency の不足

pnpm はデフォルトで peer dependency の問題を警告する。

**選択肢 1:** pnpm に自動インストールさせる。
```ini
# .npmrc (pnpm v8 以降のデフォルト)
auto-install-peers=true
```

**選択肢 2:** 手動でインストールする。
```bash
pnpm add react react-dom
```

**選択肢 3:** 許容できるなら警告を抑制する。
```json
{
  "pnpm": {
    "peerDependencyRules": {
      "ignoreMissing": ["react"]
    }
  }
}
```

### Symlink の問題

symlink に対応しないツールがある場合は hoisted モードを使う。

```ini
# .npmrc
node-linker=hoisted
```

特定のパッケージのみを hoist することもできる。

```ini
public-hoist-pattern[]=*eslint*
public-hoist-pattern[]=*babel*
```

### ネイティブモジュールの再ビルド

ネイティブモジュールが失敗する場合は次を試す。

```bash
# すべてのネイティブモジュールを再ビルド
pnpm rebuild

# あるいは再インストール
rm -rf node_modules
pnpm install
```

## Monorepo の移行

### npm workspaces から

1. `pnpm-workspace.yaml` を作成する:
   ```yaml
   packages:
     - 'packages/*'
   ```

2. 内部依存を workspace protocol に変更する:
   ```json
   {
     "dependencies": {
       "@myorg/utils": "workspace:^"
     }
   }
   ```

3. インストールする:
   ```bash
   rm -rf node_modules packages/*/node_modules package-lock.json
   pnpm install
   ```

### Yarn workspaces から

1. Yarn 固有ファイルを削除する:
   ```bash
   rm yarn.lock .yarnrc.yml
   rm -rf .yarn
   ```

2. `package.json` の `workspaces` に合わせて `pnpm-workspace.yaml` を作成する:
   ```yaml
   packages:
     - 'packages/*'
   ```

3. `package.json` を整理する。必要なければ Yarn の workspace 設定を削除する:
   ```json
   {
     // 必要なら "workspaces" フィールドを残す (任意。pnpm は pnpm-workspace.yaml を使う)
   }
   ```

4. workspace 参照を変換する:
   ```json
   // Yarn の場合
   "@myorg/utils": "*"

   // pnpm の場合
   "@myorg/utils": "workspace:*"
   ```

### Lerna から

ほとんどのユースケースでは pnpm が Lerna を置き換えられる。

```bash
# Lerna: 全パッケージでスクリプト実行
lerna run build

# pnpm の等価コマンド
pnpm -r run build

# Lerna: 特定パッケージで実行
lerna run build --scope=@myorg/app

# pnpm の等価コマンド
pnpm --filter @myorg/app run build

# Lerna: 公開
lerna publish

# pnpm: 代わりに changesets を使う
pnpm add -Dw @changesets/cli
pnpm changeset
pnpm changeset version
pnpm publish -r
```

## 設定の移行

### .npmrc の設定

npm/Yarn の設定の多くは pnpm の `.npmrc` でそのまま動作する。

```ini
# レジストリ設定 (npm と同じ)
registry=https://registry.npmjs.org/
@myorg:registry=https://npm.myorg.com/

# 認証トークン (npm と同じ)
//registry.npmjs.org/:_authToken=${NPM_TOKEN}

# pnpm 固有の追加設定
auto-install-peers=true
strict-peer-dependencies=false
```

### スクリプトの移行

多くのスクリプトは変更不要。pnpm 固有のパターンに合わせる。

```json
{
  "scripts": {
    // npm: 全 workspace でスクリプト実行
    "build:all": "npm run build --workspaces",
    // pnpm: -r フラグを使う
    "build:all": "pnpm -r run build",

    // npm: 特定 workspace で実行
    "dev:app": "npm run dev -w packages/app",
    // pnpm: --filter を使う
    "dev:app": "pnpm --filter @myorg/app run dev"
  }
}
```

## CI/CD の移行

CI 設定を更新する。

```yaml
# 移行前 (npm)
- run: npm ci

# 移行後 (pnpm)
- uses: pnpm/action-setup@v4
- run: pnpm install --frozen-lockfile
```

Corepack 用に `package.json` に追記する。
```json
{
  "packageManager": "pnpm@9.0.0"
}
```

## 段階的な移行

大規模プロジェクトでは段階的に移行する。

1. **CI から始める**: CI のみ pnpm を使い、ローカルは npm/yarn のまま
2. **pnpm-lock.yaml を追加**: `pnpm import` で lockfile を作成
3. **十分に検証**: pnpm でビルドが動くことを確認
4. **ドキュメントを更新**: README、CONTRIBUTING を更新
5. **古いファイルを削除**: チーム全体が移行できたら旧 lockfile を削除

## ロールバック計画

移行で問題が発生した場合は、

```bash
# pnpm のファイルを削除
rm -rf node_modules pnpm-lock.yaml pnpm-workspace.yaml

# npm に戻す
npm install

# あるいは Yarn に戻す
yarn install
```

ロールバックを容易にするため、旧 lockfile を git 履歴に残しておく。

<!--
Source references:
- https://pnpm.io/installation
- https://pnpm.io/cli/import
- https://pnpm.io/limitations
-->
