---
name: pnpm-store
description: pnpm を高速かつディスク効率に優れたものにするコンテンツアドレス指定ストレージ
---

# pnpm の Store

pnpm はコンテンツアドレス指定の store を用いて、ディスク容量を節約しインストールを高速化する。すべてのパッケージはグローバルに 1 度だけ保存され、プロジェクトの `node_modules` にハードリンクされる。

## 仕組み

1. **グローバル store**: パッケージは中央 store に 1 度だけダウンロードされる
2. **ハードリンク**: プロジェクトはファイルをコピーせず store にリンクする
3. **コンテンツアドレス指定**: コンテンツのハッシュをキーに保存され、同一ファイルが重複排除される

### ストレージのレイアウト

```
~/.pnpm-store/              # グローバル store (デフォルトの場所)
└── v3/
    └── files/
        └── <hash>/         # コンテンツハッシュごとに保存されたファイル

project/
└── node_modules/
    ├── .pnpm/              # 仮想 store (グローバル store へのハードリンク)
    │   ├── lodash@4.17.21/
    │   │   └── node_modules/
    │   │       └── lodash/
    │   └── express@4.18.2/
    │       └── node_modules/
    │           ├── express/
    │           └── <deps>/  # 依存関係のフラット構造
    ├── lodash -> .pnpm/lodash@4.17.21/node_modules/lodash
    └── express -> .pnpm/express@4.18.2/node_modules/express
```

## Store 系コマンド

```bash
# store の場所を表示
pnpm store path

# 参照されていないパッケージを削除
pnpm store prune

# store の整合性をチェック
pnpm store status

# インストールせずに store にパッケージを追加
pnpm store add <pkg>
```

## 設定

### Store の場所

```ini
# .npmrc
store-dir=~/.pnpm-store

# あるいは環境変数で指定
PNPM_HOME=~/.local/share/pnpm
```

### 仮想 store

仮想 store (`node_modules` 内の `.pnpm`) はグローバル store への symlink を含む。

```ini
# 仮想 store の場所をカスタマイズ
virtual-store-dir=node_modules/.pnpm

# 代替のフラットレイアウト
node-linker=hoisted
```

## ディスク容量のメリット

pnpm はディスク容量を大きく節約する。

- **重複排除**: 同一バージョンのパッケージはすべてのプロジェクトを通じて 1 度のみ保存
- **コンテンツ重複排除**: 異なるパッケージ間でも同一ファイルは 1 度のみ保存
- **ハードリンク**: コピーせず、リンクするだけ

### ディスク使用量の確認

```bash
# 実サイズと見かけ上のサイズの比較
du -sh node_modules        # 見かけ上のサイズ
du -sh --apparent-size node_modules  # ハードリンクを加味
```

## Node linker のモード

`node_modules` の構造を設定できる。

```ini
# デフォルト: symlink 構造 (推奨)
node-linker=isolated

# フラットな node_modules (npm 互換重視)
node-linker=hoisted

# PnP モード (実験的、Yarn PnP に類似)
node-linker=pnp
```

### isolated モード (デフォルト)

- 厳格な依存解決
- phantom dependency なし
- パッケージは宣言された依存のみアクセス可能

### hoisted モード

- npm と同様のフラットな `node_modules`
- symlink をサポートしないツールとの互換性のため
- strictness のメリットを失う

## 副作用キャッシュ

ネイティブモジュールのビルド成果物をキャッシュする。

```ini
# 副作用キャッシュを有効化
side-effects-cache=true

# 副作用をプロジェクト内に保存 (グローバル store ではなく)
side-effects-cache-readonly=true
```

## マシン間で store を共有

CI/CD では store を共有できる。

```yaml
# GitHub Actions の例
- uses: pnpm/action-setup@v4
  with:
    run_install: false

- name: Get pnpm store directory
  shell: bash
  run: echo "STORE_PATH=$(pnpm store path --silent)" >> $GITHUB_ENV

- uses: actions/cache@v4
  with:
    path: ${{ env.STORE_PATH }}
    key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
```

## トラブルシューティング

### Store が壊れた場合
```bash
# store を検査して修復
pnpm store status
pnpm store prune
```

### ハードリンクの問題 (ネットワークドライブ、Docker)
```ini
# ハードリンクの代わりにコピーを使用
package-import-method=copy
```

### パーミッションの問題
```bash
# store のパーミッションを修正
chmod -R u+w ~/.pnpm-store
```

<!--
Source references:
- https://pnpm.io/symlinked-node-modules-structure
- https://pnpm.io/cli/store
- https://pnpm.io/npmrc#store-dir
-->
