import { resolve } from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Next.js は tsconfig で `jsx: preserve` を要求するため tsc では JSX を残すが、
  // vitest 4 (oxc transformer) は jsx 設定を明示しないと .tsx のテストファイルを
  // transform できない。runtime: 'automatic' (React 19 標準) で動かす。
  oxc: {
    jsx: { runtime: 'automatic' },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      // `server-only` パッケージは Server Component 以外から import されると常に throw する仕組み
      // (Next.js bundler の magic に依存)。jsdom 環境では bundler の特例が効かないため、
      // テスト時は無害な empty module に差し替える。
      'server-only': resolve(__dirname, './src/test/server-only-stub.ts'),
    },
  },
  test: {
    // api-client.ts などの static import は setupFiles より先に hoist されるため、
    // process.env への注入は setupFiles ではなく test.env で宣言的に行う
    env: {
      API_URL: process.env.API_URL ?? 'http://localhost:3000',
    },
    environment: 'jsdom',
    // Client 側 (`createApiClient('').api.pokemon.$get`) が生成する相対 URL `/api/pokemon` を
    // jsdom 上で API_URL と同一オリジンに解決させ、MSW handlers (`${apiUrl}/api/pokemon`) で
    // 一発マッチさせるため、jsdom のベース URL を API_URL に揃える。
    // (本番の Client → Next.js Route Handler proxy → upstream の 2 hop 経路は route.test.ts で検証する)
    environmentOptions: {
      jsdom: {
        url: process.env.API_URL ?? 'http://localhost:3000',
      },
    },
    globals: false,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
