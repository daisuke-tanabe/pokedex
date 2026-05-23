---
name: snapshot-testing
description: ファイル、インライン、ファイルスナップショットによるスナップショットテスト
---

# スナップショットテスト

スナップショットテストでは出力をキャプチャし、保存された参照と比較する。

## 基本のスナップショット

```ts
import { expect, test } from 'vitest'

test('snapshot', () => {
  const result = generateOutput()
  expect(result).toMatchSnapshot()
})
```

初回実行時に `.snap` ファイルが作成される:

```js
// __snapshots__/test.spec.ts.snap
exports['snapshot 1'] = `
{
  "id": 1,
  "name": "test"
}
`
```

## インラインスナップショット

テストファイル内に直接保存される:

```ts
test('inline snapshot', () => {
  const data = { foo: 'bar' }
  expect(data).toMatchInlineSnapshot()
})
```

Vitest がテストファイルを更新する:

```ts
test('inline snapshot', () => {
  const data = { foo: 'bar' }
  expect(data).toMatchInlineSnapshot(`
    {
      "foo": "bar",
    }
  `)
})
```

## ファイルスナップショット

明示的なファイルと比較する:

```ts
test('render html', async () => {
  const html = renderComponent()
  await expect(html).toMatchFileSnapshot('./expected/component.html')
})
```

## スナップショットのヒント

説明的なヒントを追加できる:

```ts
test('multiple snapshots', () => {
  expect(header).toMatchSnapshot('header')
  expect(body).toMatchSnapshot('body content')
  expect(footer).toMatchSnapshot('footer')
})
```

## オブジェクト形状のマッチング

部分構造でマッチする:

```ts
test('shape snapshot', () => {
  const data = { 
    id: Math.random(), 
    created: new Date(),
    name: 'test' 
  }
  
  expect(data).toMatchSnapshot({
    id: expect.any(Number),
    created: expect.any(Date),
  })
})
```

## エラーのスナップショット

```ts
test('error message', () => {
  expect(() => {
    throw new Error('Something went wrong')
  }).toThrowErrorMatchingSnapshot()
})

test('inline error', () => {
  expect(() => {
    throw new Error('Bad input')
  }).toThrowErrorMatchingInlineSnapshot(`[Error: Bad input]`)
})
```

## スナップショットの更新

```bash
# すべてのスナップショットを更新
vitest -u
vitest --update

# watch モードでは 'u' を押すと失敗したスナップショットを更新
```

## カスタムシリアライザー

スナップショットのフォーマットをカスタマイズする:

```ts
expect.addSnapshotSerializer({
  test(val) {
    return val && typeof val.toJSON === 'function'
  },
  serialize(val, config, indentation, depth, refs, printer) {
    return printer(val.toJSON(), config, indentation, depth, refs)
  },
})
```

config 経由でも指定可能:

```ts
// vitest.config.ts
defineConfig({
  test: {
    snapshotSerializers: ['./my-serializer.ts'],
  },
})
```

## スナップショットのフォーマットオプション

```ts
defineConfig({
  test: {
    snapshotFormat: {
      printBasicPrototype: false, // Array / Object のプロトタイプを出力しない
      escapeString: false,
    },
  },
})
```

## Concurrent テストのスナップショット

context の expect を使う:

```ts
test.concurrent('concurrent 1', async ({ expect }) => {
  expect(await getData()).toMatchSnapshot()
})

test.concurrent('concurrent 2', async ({ expect }) => {
  expect(await getOther()).toMatchSnapshot()
})
```

## スナップショットファイルの場所

デフォルト: `__snapshots__/<test-file>.snap`

カスタマイズ:

```ts
defineConfig({
  test: {
    resolveSnapshotPath: (testPath, snapExtension) => {
      return testPath.replace('__tests__', '__snapshots__') + snapExtension
    },
  },
})
```

## 要点

- スナップショットファイルはバージョン管理にコミットする
- コードレビューでスナップショットの変更を確認する
- 1 つのテストで複数のスナップショットを使うときはヒントを付ける
- 大きな出力 (HTML、JSON) には `toMatchFileSnapshot` を使う
- インラインスナップショットはテストファイル内で自動更新される
- concurrent テストでは context の `expect` を使う

<!-- 
Source references:
- https://vitest.dev/guide/snapshot.html
- https://vitest.dev/api/expect.html#tomatchsnapshot
-->
