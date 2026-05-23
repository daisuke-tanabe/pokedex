---
name: concurrency-parallelism
description: concurrent テスト、並列実行、シャーディング
---

# 並列実行と並行性

## ファイル単位の並列化

デフォルトでは Vitest はワーカー間でテストファイルを並列実行する:

```ts
defineConfig({
  test: {
    // ファイルを並列実行 (デフォルト: true)
    fileParallelism: true,
    
    // ワーカースレッド数
    maxWorkers: 4,
    minWorkers: 1,
    
    // プールの種類: 'threads', 'forks', 'vmThreads'
    pool: 'threads',
  },
})
```

## Concurrent テスト

ファイル内のテストを並列実行する:

```ts
// 個別の concurrent テスト
test.concurrent('test 1', async ({ expect }) => {
  expect(await fetch1()).toBe('result')
})

test.concurrent('test 2', async ({ expect }) => {
  expect(await fetch2()).toBe('result')
})

// スイート内の全テストを concurrent
describe.concurrent('parallel suite', () => {
  test('test 1', async ({ expect }) => {})
  test('test 2', async ({ expect }) => {})
})
```

**重要:** concurrent テストでは context の `{ expect }` を使う。

## Concurrent コンテキスト内の sequential

順次実行を強制する:

```ts
describe.concurrent('mostly parallel', () => {
  test('parallel 1', async () => {})
  test('parallel 2', async () => {})
  
  test.sequential('must run alone 1', async () => {})
  test.sequential('must run alone 2', async () => {})
})

// スイート全体を sequential にする
describe.sequential('sequential suite', () => {
  test('first', () => {})
  test('second', () => {})
})
```

## 最大並列数

concurrent テストの上限を指定する:

```ts
defineConfig({
  test: {
    maxConcurrency: 5, // ファイルあたりの最大並列テスト数
  },
})
```

## 隔離

各ファイルはデフォルトで隔離された環境で実行される:

```ts
defineConfig({
  test: {
    // 高速化のため隔離を無効化する (安全性は低下)
    isolate: false,
  },
})
```

## シャーディング

テストを複数マシンに分割する:

```bash
# Machine 1
vitest run --shard=1/3

# Machine 2
vitest run --shard=2/3

# Machine 3
vitest run --shard=3/3
```

### CI の例 (GitHub Actions)

```yaml
jobs:
  test:
    strategy:
      matrix:
        shard: [1, 2, 3]
    steps:
      - run: vitest run --shard=${{ matrix.shard }}/3 --reporter=blob
      
  merge:
    needs: test
    steps:
      - run: vitest --merge-reports --reporter=junit
```

### レポートのマージ

```bash
# 各シャードが blob を出力
vitest run --shard=1/3 --reporter=blob --coverage
vitest run --shard=2/3 --reporter=blob --coverage

# すべての blob をマージ
vitest --merge-reports --reporter=json --coverage
```

## テストの実行順

テスト順序を制御する:

```ts
defineConfig({
  test: {
    sequence: {
      // テストをランダム順で実行
      shuffle: true,
      
      // 再現性のあるシャッフル用シード
      seed: 12345,
      
      // フックの実行順
      hooks: 'stack', // 'stack', 'list', 'parallel'
      
      // デフォルトで全テストを concurrent に
      concurrent: true,
    },
  },
})
```

## テストのシャッフル

隠れた依存関係を発見するためにランダム化する:

```ts
// CLI から
vitest --sequence.shuffle

// スイートごと
describe.shuffle('random order', () => {
  test('test 1', () => {})
  test('test 2', () => {})
  test('test 3', () => {})
})
```

## プールオプション

### Threads (デフォルト)

```ts
defineConfig({
  test: {
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 8,
        minThreads: 2,
        isolate: true,
      },
    },
  },
})
```

### Forks

隔離が強いが遅い:

```ts
defineConfig({
  test: {
    pool: 'forks',
    poolOptions: {
      forks: {
        maxForks: 4,
        isolate: true,
      },
    },
  },
})
```

### VM Threads

ファイルごとに完全な VM 隔離:

```ts
defineConfig({
  test: {
    pool: 'vmThreads',
  },
})
```

## 失敗時の停止 (bail)

最初の失敗で停止する:

```bash
vitest --bail 1    # 1 件失敗で停止
vitest --bail      # 最初の失敗で停止 (--bail 1 と同等)
```

## 要点

- ファイルはデフォルトで並列実行される
- ファイル内で並列実行するには `.concurrent` を使う
- concurrent テストでは必ず context の `expect` を使う
- シャーディングで CI マシン間にテストを分割できる
- シャード結果の結合には `--merge-reports` を使う
- 隠れた依存関係を見つけるためにテストをシャッフルする

<!-- 
Source references:
- https://vitest.dev/guide/features.html#running-tests-concurrently
- https://vitest.dev/guide/improving-performance.html
-->
