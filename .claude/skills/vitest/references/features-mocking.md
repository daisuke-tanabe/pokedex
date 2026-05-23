---
name: mocking
description: vi ユーティリティで関数・モジュール・タイマー・日時をモックする
---

# モック

## モック関数

```ts
import { expect, vi } from 'vitest'

// モック関数の作成
const fn = vi.fn()
fn('hello')

expect(fn).toHaveBeenCalled()
expect(fn).toHaveBeenCalledWith('hello')

// 実装付き
const add = vi.fn((a, b) => a + b)
expect(add(1, 2)).toBe(3)

// 戻り値のモック
fn.mockReturnValue(42)
fn.mockReturnValueOnce(1).mockReturnValueOnce(2)
fn.mockResolvedValue({ data: true })
fn.mockRejectedValue(new Error('fail'))

// 実装のモック
fn.mockImplementation((x) => x * 2)
fn.mockImplementationOnce(() => 'first call')
```

## オブジェクトのスパイ

```ts
const cart = {
  getTotal: () => 100,
}

const spy = vi.spyOn(cart, 'getTotal')
cart.getTotal()

expect(spy).toHaveBeenCalled()

// 実装をモックする
spy.mockReturnValue(200)
expect(cart.getTotal()).toBe(200)

// 元の実装に戻す
spy.mockRestore()
```

## モジュールのモック

```ts
// vi.mock はファイル先頭に hoist される
vi.mock('./api', () => ({
  fetchUser: vi.fn(() => ({ id: 1, name: 'Mock' })),
}))

import { fetchUser } from './api'

test('mocked module', () => {
  expect(fetchUser()).toEqual({ id: 1, name: 'Mock' })
})
```

### 部分モック

```ts
vi.mock('./utils', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    specificFunction: vi.fn(),
  }
})
```

### スパイ付きの自動モック

```ts
// 実装を保ちつつ呼び出しを記録する
vi.mock('./calculator', { spy: true })

import { add } from './calculator'

test('spy on module', () => {
  const result = add(1, 2) // 実際の実装
  expect(result).toBe(3)
  expect(add).toHaveBeenCalledWith(1, 2)
})
```

### 手動モック (__mocks__)

```
src/
  __mocks__/
    axios.ts      # 'axios' をモック
  api/
    __mocks__/
      client.ts   # './client' をモック
    client.ts
```

```ts
// factory なしで vi.mock を呼ぶだけ
vi.mock('axios')
vi.mock('./api/client')
```

## 動的モック (vi.doMock)

hoist されない - 動的 import 向け:

```ts
test('dynamic mock', async () => {
  vi.doMock('./config', () => ({
    apiUrl: 'http://test.local',
  }))
  
  const { apiUrl } = await import('./config')
  expect(apiUrl).toBe('http://test.local')
  
  vi.doUnmock('./config')
})
```

## タイマーのモック

```ts
import { afterEach, beforeEach, vi } from 'vitest'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

test('timers', () => {
  const fn = vi.fn()
  setTimeout(fn, 1000)
  
  expect(fn).not.toHaveBeenCalled()
  
  vi.advanceTimersByTime(1000)
  expect(fn).toHaveBeenCalled()
})

// その他のタイマーメソッド
vi.runAllTimers()           // 保留中の全タイマーを実行
vi.runOnlyPendingTimers()   // 現在保留中のタイマーのみ実行
vi.advanceTimersToNextTimer() // 次のタイマーまで進める
```

### 非同期のタイマーメソッド

```ts
test('async timers', async () => {
  vi.useFakeTimers()
  
  let resolved = false
  setTimeout(() => Promise.resolve().then(() => { resolved = true }), 100)
  
  await vi.advanceTimersByTimeAsync(100)
  expect(resolved).toBe(true)
})
```

## 日時のモック

```ts
vi.setSystemTime(new Date('2024-01-01'))
expect(new Date().getFullYear()).toBe(2024)

vi.useRealTimers() // 元に戻す
```

## グローバルのモック

```ts
vi.stubGlobal('fetch', vi.fn(() => 
  Promise.resolve({ json: () => ({ data: 'mock' }) })
))

// 元に戻す
vi.unstubAllGlobals()
```

## 環境変数のモック

```ts
vi.stubEnv('API_KEY', 'test-key')
expect(import.meta.env.API_KEY).toBe('test-key')

// 元に戻す
vi.unstubAllEnvs()
```

## モックのクリア

```ts
const fn = vi.fn()
fn()

fn.mockClear()       // 呼び出し履歴をクリア
fn.mockReset()       // 履歴 + 実装をクリア
fn.mockRestore()     // 元の実装に戻す (spy 向け)

// グローバル
vi.clearAllMocks()
vi.resetAllMocks()
vi.restoreAllMocks()
```

## Config による自動リセット

```ts
// vitest.config.ts
defineConfig({
  test: {
    clearMocks: true,    // 各テスト前にクリア
    mockReset: true,     // 各テスト前にリセット
    restoreMocks: true,  // 各テスト後に restore
    unstubEnvs: true,    // 環境変数を元に戻す
    unstubGlobals: true, // グローバルを元に戻す
  },
})
```

## モック用の Hoisted 変数

```ts
const mockFn = vi.hoisted(() => vi.fn())

vi.mock('./module', () => ({
  getData: mockFn,
}))

import { getData } from './module'

test('hoisted mock', () => {
  mockFn.mockReturnValue('test')
  expect(getData()).toBe('test')
})
```

## 要点

- `vi.mock` は hoist される - import より前に呼び出される
- 動的かつ hoist されないモックには `vi.doMock` を使う
- テスト間の汚染を避けるため必ずモックを restore する
- 実装を保ちつつ呼び出しを追跡したい場合は `{ spy: true }` を使う
- `vi.hoisted` で mock factory 内から変数を参照できる

<!-- 
Source references:
- https://vitest.dev/guide/mocking.html
- https://vitest.dev/api/vi.html
-->
