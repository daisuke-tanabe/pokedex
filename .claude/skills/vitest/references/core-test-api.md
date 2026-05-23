---
name: test-api
description: 修飾子付きでテストを定義する test / it 関数
---

# Test API

## 基本のテスト

```ts
import { expect, test } from 'vitest'

test('adds numbers', () => {
  expect(1 + 1).toBe(2)
})

// Alias: it
import { it } from 'vitest'

it('works the same', () => {
  expect(true).toBe(true)
})
```

## 非同期テスト

```ts
test('async test', async () => {
  const result = await fetchData()
  expect(result).toBeDefined()
})

// Promise は自動的に await される
test('returns promise', () => {
  return fetchData().then(result => {
    expect(result).toBeDefined()
  })
})
```

## テストオプション

```ts
// タイムアウト (デフォルト: 5000ms)
test('slow test', async () => {
  // ...
}, 10_000)

// オプションオブジェクトでも指定可能
test('with options', { timeout: 10_000, retry: 2 }, async () => {
  // ...
})
```

## テスト修飾子

### Skip

```ts
test.skip('skipped test', () => {
  // 実行されない
})

// 条件付き skip
test.skipIf(process.env.CI)('not in CI', () => {})
test.runIf(process.env.CI)('only in CI', () => {})

// context 経由で動的に skip
test('dynamic skip', ({ skip }) => {
  skip(someCondition, 'reason')
  // ...
})
```

### Focus

```ts
test.only('only this runs', () => {
  // ファイル内の他のテストはスキップされる
})
```

### Todo

```ts
test.todo('implement later')

test.todo('with body', () => {
  // 実行されないがレポートに表示される
})
```

### Failing

```ts
test.fails('expected to fail', () => {
  expect(1).toBe(2) // アサーションが失敗するためテストとしては成功
})
```

### Concurrent

```ts
// テストを並列実行
test.concurrent('test 1', async ({ expect }) => {
  // 並列テストでは context.expect を使う
  expect(await fetch1()).toBe('result')
})

test.concurrent('test 2', async ({ expect }) => {
  expect(await fetch2()).toBe('result')
})
```

### Sequential

```ts
// concurrent コンテキスト内で順次実行を強制する
test.sequential('must run alone', async () => {})
```

## パラメータ化テスト

### test.each

```ts
test.each([
  [1, 1, 2],
  [1, 2, 3],
  [2, 1, 3],
])('add(%i, %i) = %i', (a, b, expected) => {
  expect(a + b).toBe(expected)
})

// オブジェクト形式
test.each([
  { a: 1, b: 1, expected: 2 },
  { a: 1, b: 2, expected: 3 },
])('add($a, $b) = $expected', ({ a, b, expected }) => {
  expect(a + b).toBe(expected)
})

// テンプレートリテラル
test.each`
  a    | b    | expected
  ${1} | ${1} | ${2}
  ${1} | ${2} | ${3}
`('add($a, $b) = $expected', ({ a, b, expected }) => {
  expect(a + b).toBe(expected)
})
```

### test.for

`.each` よりも推奨される — 配列をスプレッドしない:

```ts
test.for([
  [1, 1, 2],
  [1, 2, 3],
])('add(%i, %i) = %i', ([a, b, expected], { expect }) => {
  // 第 2 引数は TestContext
  expect(a + b).toBe(expected)
})
```

## Test Context

第 1 引数で context ユーティリティを取得できる:

```ts
test('with context', ({ expect, skip, task }) => {
  console.log(task.name)   // テスト名
  skip(someCondition)      // 動的に skip
  expect(1).toBe(1)        // context にバインドされた expect
})
```

## カスタムテストと Fixtures

```ts
import { test as base } from 'vitest'

const test = base.extend({
  db: async ({}, use) => {
    const db = await createDb()
    await use(db)
    await db.close()
  },
})

test('query', async ({ db }) => {
  const users = await db.query('SELECT * FROM users')
  expect(users).toBeDefined()
})
```

## リトライ設定

```ts
test('flaky test', { retry: 3 }, async () => {
  // 失敗時に最大 3 回までリトライ
})

// 高度なリトライオプション
test('with delay', {
  retry: {
    count: 3,
    delay: 1000,
    condition: /timeout/i, // タイムアウト系のエラー時のみリトライ
  },
}, async () => {})
```

## タグ

```ts
test('database test', { tags: ['db', 'slow'] }, async () => {})

// 実行例: vitest --tags db
```

## 要点

- 本体を持たないテストは `todo` として扱われる
- `test.only` は CI で例外を投げる (`allowOnly: true` を設定しない限り)
- concurrent テストやスナップショットでは context の `expect` を使う
- 関数名は第 1 引数として渡された場合にテスト名として利用される

<!-- 
Source references:
- https://vitest.dev/api/test.html
-->
