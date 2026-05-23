---
name: test-context-fixtures
description: テスト context と test.extend によるカスタム fixture
---

# Test Context と Fixtures

## 組み込み context

各テストは第 1 引数に context を受け取る:

```ts
test('context', ({ task, expect, skip }) => {
  console.log(task.name)  // テスト名
  expect(1).toBe(1)       // context にバインドされた expect
  skip()                  // 動的にテストを skip
})
```

### Context のプロパティ

- `task` - テストメタデータ (name、file など)
- `expect` - 当該テストにバインドされた expect (concurrent テストで重要)
- `skip(condition?, message?)` - テストを skip する
- `onTestFinished(fn)` - テスト後のクリーンアップ
- `onTestFailed(fn)` - 失敗時にのみ実行

## test.extend によるカスタム fixture

再利用可能なテストユーティリティを作成する:

```ts
import { test as base } from 'vitest'

// fixture 型を定義
interface Fixtures {
  db: Database
  user: User
}

// 拡張した test を作成
export const test = base.extend<Fixtures>({
  // setup / teardown を備えた fixture
  db: async ({}, use) => {
    const db = await createDatabase()
    await use(db)           // テストに提供
    await db.close()        // クリーンアップ
  },
  
  // 他の fixture に依存する fixture
  user: async ({ db }, use) => {
    const user = await db.createUser({ name: 'Test' })
    await use(user)
    await db.deleteUser(user.id)
  },
})
```

fixture を使う:

```ts
test('query user', async ({ db, user }) => {
  const found = await db.findUser(user.id)
  expect(found).toEqual(user)
})
```

## fixture の初期化

fixture はアクセスされたときにのみ初期化される:

```ts
const test = base.extend({
  expensive: async ({}, use) => {
    console.log('initializing')  // 当該テストが使用するときだけ実行される
    await use('value')
  },
})

test('no fixture', () => {})           // expensive は呼ばれない
test('uses fixture', ({ expensive }) => {}) // expensive が呼ばれる
```

## 自動 fixture

すべてのテストで fixture を実行する:

```ts
const test = base.extend({
  setup: [
    async ({}, use) => {
      await globalSetup()
      await use()
      await globalTeardown()
    },
    { auto: true }  // 常に実行
  ],
})
```

## スコープ付き fixture

### ファイルスコープ

ファイルにつき 1 回だけ初期化:

```ts
const test = base.extend({
  connection: [
    async ({}, use) => {
      const conn = await connect()
      await use(conn)
      await conn.close()
    },
    { scope: 'file' }
  ],
})
```

### ワーカースコープ

ワーカーにつき 1 回だけ初期化:

```ts
const test = base.extend({
  sharedResource: [
    async ({}, use) => {
      await use(globalResource)
    },
    { scope: 'worker' }
  ],
})
```

## 注入された fixture (設定から)

project ごとに fixture を上書きする:

```ts
// テストファイル
const test = base.extend({
  apiUrl: ['/default', { injected: true }],
})

// vitest.config.ts
defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'prod',
          provide: { apiUrl: 'https://api.prod.com' },
        },
      },
    ],
  },
})
```

## スイート単位のスコープ値

特定のスイート向けに fixture を上書きする:

```ts
const test = base.extend({
  environment: 'development',
})

describe('production tests', () => {
  test.scoped({ environment: 'production' })
  
  test('uses production', ({ environment }) => {
    expect(environment).toBe('production')
  })
})

test('uses default', ({ environment }) => {
  expect(environment).toBe('development')
})
```

## 拡張テストのフック

fixture に対応した型付きフック:

```ts
const test = base.extend<{ db: Database }>({
  db: async ({}, use) => {
    const db = await createDb()
    await use(db)
    await db.close()
  },
})

// フックは fixture を認識する
test.beforeEach(({ db }) => {
  db.seed()
})

test.afterEach(({ db }) => {
  db.clear()
})
```

## fixture の合成

拡張済みテストからさらに拡張する:

```ts
// base-test.ts
export const test = base.extend<{ db: Database }>({
  db: async ({}, use) => { /* ... */ },
})

// admin-test.ts
import { test as dbTest } from './base-test'

export const test = dbTest.extend<{ admin: User }>({
  admin: async ({ db }, use) => {
    const admin = await db.createAdmin()
    await use(admin)
  },
})
```

## 要点

- `{ }` のデストラクチャリングで fixture にアクセスする
- fixture は遅延評価される - アクセスされた時のみ初期化される
- fixture からクリーンアップ関数を返す
- セットアップ用の fixture には `{ auto: true }` を使う
- 高コストな共有リソースには `{ scope: 'file' }` を使う
- fixture は合成可能 - 拡張済みテストからさらに拡張できる

<!-- 
Source references:
- https://vitest.dev/guide/test-context.html
-->
