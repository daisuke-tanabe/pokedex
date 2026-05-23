---
name: vitest-configuration
description: vite.config.ts または vitest.config.ts で Vitest を設定する
---

# 設定

Vitest は `vitest.config.ts` または `vite.config.ts` から設定を読み込む。設定フォーマットは Vite と共通である。

## 基本セットアップ

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // test options
  },
})
```

## 既存の Vite Config と併用する

Vitest の型参照を追加し、`test` プロパティを利用する:

```ts
// vite.config.ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
  },
})
```

## Config のマージ

設定ファイルを分けている場合は `mergeConfig` を使う:

```ts
// vitest.config.ts
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(viteConfig, defineConfig({
  test: {
    environment: 'jsdom',
  },
}))
```

## よく使うオプション

```ts
defineConfig({
  test: {
    // describe, it, expect などのグローバル API をインポート無しで有効化
    globals: true,
    
    // テスト環境: 'node', 'jsdom', 'happy-dom'
    environment: 'node',
    
    // 各テストファイルの前に実行する setup ファイル
    setupFiles: ['./tests/setup.ts'],
    
    // テストファイルの include パターン
    include: ['**/*.{test,spec}.{js,ts,jsx,tsx}'],
    
    // 除外パターン
    exclude: ['**/node_modules/**', '**/dist/**'],
    
    // テストのタイムアウト (ms)
    testTimeout: 5000,
    
    // フックのタイムアウト (ms)
    hookTimeout: 10000,
    
    // watch モードをデフォルトで有効化
    watch: true,
    
    // カバレッジ設定
    coverage: {
      provider: 'v8', // or 'istanbul'
      reporter: ['text', 'html'],
      include: ['src/**/*.ts'],
    },
    
    // テストを隔離実行 (各ファイルを別プロセスで実行)
    isolate: true,
    
    // テスト実行用のプール: 'threads', 'forks', 'vmThreads'
    pool: 'threads',
    
    // スレッド数 / プロセス数
    poolOptions: {
      threads: {
        maxThreads: 4,
        minThreads: 1,
      },
    },
    
    // テスト間でモックを自動クリア
    clearMocks: true,
    
    // テスト間でモックを restore
    restoreMocks: true,
    
    // 失敗したテストをリトライ
    retry: 0,
    
    // 最初の失敗で停止
    bail: 0,
  },
})
```

## 条件付き設定

`mode` や `process.env.VITEST` を使ってテスト向けの設定を行う:

```ts
export default defineConfig(({ mode }) => ({
  plugins: mode === 'test' ? [] : [myPlugin()],
  test: {
    // test options
  },
}))
```

## Projects (モノレポ)

同一の Vitest プロセス内で複数の設定を実行する:

```ts
defineConfig({
  test: {
    projects: [
      'packages/*',
      {
        test: {
          name: 'unit',
          include: ['tests/unit/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        test: {
          name: 'integration',
          include: ['tests/integration/**/*.test.ts'],
          environment: 'jsdom',
        },
      },
    ],
  },
})
```

## 要点

- Vitest は Vite の変換パイプラインを利用するため、`resolve.alias` や plugin がそのまま機能する
- `vitest.config.ts` は `vite.config.ts` より優先される
- カスタム config パスを指定するには `--config` フラグを使う
- テスト実行中は `process.env.VITEST` が `true` に設定される
- テスト用設定は `test` プロパティに記述し、それ以外は Vite の config と共有する

<!-- 
Source references:
- https://vitest.dev/guide/#configuring-vitest
- https://vitest.dev/config/
-->
