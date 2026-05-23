---
name: pnpm-ci-cd-setup
description: 継続的インテグレーション・デプロイのワークフロー向けに pnpm を最適化する
---

# pnpm の CI/CD セットアップ

CI/CD 環境で pnpm を高速かつ信頼できる形で使うためのベストプラクティスをまとめる。

## GitHub Actions

### 基本セットアップ

```yaml
name: CI

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile
      - run: pnpm test
      - run: pnpm build
```

### Store キャッシュを併用

規模の大きいプロジェクトでは pnpm の store をキャッシュする。

```yaml
- uses: pnpm/action-setup@v4
  with:
    version: 9

- name: Get pnpm store directory
  shell: bash
  run: |
    echo "STORE_PATH=$(pnpm store path --silent)" >> $GITHUB_ENV

- uses: actions/cache@v4
  name: Setup pnpm cache
  with:
    path: ${{ env.STORE_PATH }}
    key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
    restore-keys: |
      ${{ runner.os }}-pnpm-store-

- run: pnpm install --frozen-lockfile
```

### マトリクスでのテスト

```yaml
jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node: [18, 20, 22]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm test
```

## GitLab CI

```yaml
image: node:20

stages:
  - install
  - test
  - build

variables:
  PNPM_HOME: /root/.local/share/pnpm
  PATH: $PNPM_HOME:$PATH

before_script:
  - corepack enable
  - corepack prepare pnpm@latest --activate

cache:
  key: ${CI_COMMIT_REF_SLUG}
  paths:
    - .pnpm-store

install:
  stage: install
  script:
    - pnpm config set store-dir .pnpm-store
    - pnpm install --frozen-lockfile

test:
  stage: test
  script:
    - pnpm test

build:
  stage: build
  script:
    - pnpm build
```

## Docker

### マルチステージビルド

```dockerfile
# ビルドステージ
FROM node:20-slim AS builder

# pnpm を使うため corepack を有効化
RUN corepack enable

WORKDIR /app

# レイヤーキャッシュのため、package ファイルを先にコピー
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/*/package.json ./packages/

# 依存をインストール
RUN pnpm install --frozen-lockfile

# ソースをコピーしてビルド
COPY . .
RUN pnpm build

# 本番ステージ
FROM node:20-slim AS runner

RUN corepack enable
WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./

# 本番向けインストール
RUN pnpm install --frozen-lockfile --prod

CMD ["node", "dist/index.js"]
```

### Monorepo に最適化した構成

```dockerfile
FROM node:20-slim AS builder
RUN corepack enable
WORKDIR /app

# workspace 設定をコピー
COPY pnpm-lock.yaml pnpm-workspace.yaml ./

# 構造を保ったまま package.json をコピー
COPY packages/core/package.json ./packages/core/
COPY packages/api/package.json ./packages/api/

# すべての依存をインストール
RUN pnpm install --frozen-lockfile

# ソースをコピー
COPY . .

# 特定パッケージのみビルド
RUN pnpm --filter @myorg/api build
```

## CI で重要なフラグ

### --frozen-lockfile

**CI では必ず使う。** `pnpm-lock.yaml` が更新されないと失敗する。

```bash
pnpm install --frozen-lockfile
```

### --prefer-offline

利用可能ならキャッシュ済みパッケージを使う。

```bash
pnpm install --frozen-lockfile --prefer-offline
```

### --ignore-scripts

ライフサイクルスクリプトをスキップしてインストールを高速化する (慎重に)。

```bash
pnpm install --frozen-lockfile --ignore-scripts
```

## Corepack との連携

Corepack を使って pnpm のバージョンを管理する。

```json
// package.json
{
  "packageManager": "pnpm@9.0.0"
}
```

```yaml
# GitHub Actions
- run: corepack enable
- run: pnpm install --frozen-lockfile
```

## Monorepo の CI 戦略

### 変更されたパッケージのみビルド

```yaml
- name: Build changed packages
  run: |
    pnpm --filter "...[origin/main]" build
```

### パッケージごとに並列ジョブ

```yaml
jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      packages: ${{ steps.changes.outputs.packages }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - id: changes
        run: |
          echo "packages=$(pnpm --filter '...[origin/main]' list --json | jq -c '[.[].name]')" >> $GITHUB_OUTPUT

  test:
    needs: detect-changes
    if: needs.detect-changes.outputs.packages != '[]'
    runs-on: ubuntu-latest
    strategy:
      matrix:
        package: ${{ fromJson(needs.detect-changes.outputs.packages) }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter ${{ matrix.package }} test
```

## ベストプラクティスまとめ

1. **CI では必ず `--frozen-lockfile` を使う**
2. **pnpm の store をキャッシュ**して高速化する
3. **Corepack を使う**ことで pnpm のバージョンを揃える
4. **package.json の `packageManager` を指定**する
5. **monorepo では `--filter` を使う**ことで変更箇所のみビルドする
6. **Docker のマルチステージビルド**でイメージサイズを抑える

<!--
Source references:
- https://pnpm.io/continuous-integration
- https://github.com/pnpm/action-setup
-->
