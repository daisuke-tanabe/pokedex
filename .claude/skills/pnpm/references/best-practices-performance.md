---
name: pnpm-performance-optimization
description: より高速にインストールしパフォーマンスを高めるためのコツとテクニック
---

# pnpm のパフォーマンス最適化

pnpm はデフォルトでも高速だが、以下の最適化でさらに速くできる。

## インストールの最適化

### Frozen lockfile を使う

lockfile が存在する場合は解決処理をスキップする。

```bash
pnpm install --frozen-lockfile
```

解決フェーズを丸ごと省略できるため高速になる。

### オフラインを優先

利用可能ならキャッシュ済みパッケージを使う。

```bash
pnpm install --prefer-offline
```

グローバル設定にもできる。
```ini
# .npmrc
prefer-offline=true
```

### Optional 依存をスキップ

optional 依存が不要なら、

```bash
pnpm install --no-optional
```

### スクリプトをスキップ

CI やスクリプトが不要な場面で、

```bash
pnpm install --ignore-scripts
```

**注意:** 一部のパッケージは postinstall スクリプトに依存する。

### 特定依存だけビルド

特定パッケージのみビルドスクリプトを実行する。

```ini
# .npmrc
onlyBuiltDependencies[]=esbuild
onlyBuiltDependencies[]=sharp
onlyBuiltDependencies[]=@swc/core
```

不要な依存についてはビルドを完全に無効化することもできる。

```json
{
  "pnpm": {
    "neverBuiltDependencies": ["fsevents", "cpu-features"]
  }
}
```

## Store の最適化

### 副作用キャッシュ

ネイティブモジュールのビルド結果をキャッシュする。

```ini
# .npmrc
side-effects-cache=true
```

postinstall スクリプトの結果がキャッシュされ、次回以降のインストールが高速化する。

### Store を共有

すべてのプロジェクトで単一の store を使う (デフォルトの挙動)。

```ini
# .npmrc
store-dir=~/.pnpm-store
```

メリット:
- パッケージは全プロジェクトで 1 度だけダウンロード
- ハードリンクでディスク容量を節約
- キャッシュからのインストールが速い

### Store のメンテナンス

未使用パッケージは定期的に整理する。

```bash
# 参照されていないパッケージを削除
pnpm store prune

# store の整合性をチェック
pnpm store status
```

## Workspace の最適化

### 並列実行

workspace のスクリプトを並列実行する。

```bash
pnpm -r --parallel run build
```

並列度を制御する。
```ini
# .npmrc
workspace-concurrency=8
```

### 出力をストリーム

リアルタイムに出力を確認する。

```bash
pnpm -r --stream run build
```

### 変更パッケージに絞る

変更があったパッケージだけビルドする。

```bash
# main ブランチ以降に変更されたパッケージをビルド
pnpm --filter "...[origin/main]" run build
```

### トポロジカル順

依存される側を先にビルドする。

```bash
pnpm -r run build
# 自動的にトポロジカル順で実行される
```

明示的に順次ビルドする場合は、
```bash
pnpm -r --workspace-concurrency=1 run build
```

## ネットワークの最適化

### レジストリの設定

近く・速いレジストリを使う。

```ini
# .npmrc
registry=https://registry.npmmirror.com/
```

### HTTP 設定

ネットワーク設定をチューニングする。

```ini
# .npmrc
fetch-retries=3
fetch-retry-mintimeout=10000
fetch-retry-maxtimeout=60000
network-concurrency=16
```

### プロキシ設定

```ini
# .npmrc
proxy=http://proxy.company.com:8080
https-proxy=http://proxy.company.com:8080
```

## Lockfile の最適化

### 単一の lockfile (Monorepo)

全パッケージで lockfile を共有する (デフォルト)。

```ini
# .npmrc
shared-workspace-lockfile=true
```

メリット:
- 単一の信頼できる情報源
- 解決処理が速くなる
- workspace 全体でバージョンが一貫する

### Lockfile のみ更新するモード

インストールはせずに lockfile だけ更新する。

```bash
pnpm install --lockfile-only
```

## ベンチマーク

### インストール時間の比較

```bash
# クリーンインストール
rm -rf node_modules pnpm-lock.yaml
time pnpm install

# キャッシュ済み (lockfile あり)
rm -rf node_modules
time pnpm install --frozen-lockfile

# store キャッシュ併用
time pnpm install --frozen-lockfile --prefer-offline
```

### 解決処理のプロファイリング

インストールが遅い場合のデバッグ。

```bash
# 詳細ログ
pnpm install --reporter=append-only

# デバッグモード
DEBUG=pnpm:* pnpm install
```

## 設定まとめ

パフォーマンス最適化向けの `.npmrc`:

```ini
# インストール挙動
prefer-offline=true
auto-install-peers=true

# ビルド最適化
side-effects-cache=true
# 必要なものだけビルド
onlyBuiltDependencies[]=esbuild
onlyBuiltDependencies[]=@swc/core

# ネットワーク
fetch-retries=3
network-concurrency=16

# Workspace
workspace-concurrency=4
```

## クイックリファレンス

| シナリオ | コマンド/設定 |
|----------|-----------------|
| CI でのインストール | `pnpm install --frozen-lockfile` |
| オフライン開発 | `--prefer-offline` |
| ネイティブビルドのスキップ | `neverBuiltDependencies` |
| workspace の並列実行 | `pnpm -r --parallel run build` |
| 変更分のみビルド | `pnpm --filter "...[origin/main]" build` |
| store の整理 | `pnpm store prune` |

<!--
Source references:
- https://pnpm.io/npmrc
- https://pnpm.io/cli/install
- https://pnpm.io/filtering
-->
