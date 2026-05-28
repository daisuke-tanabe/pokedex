import { resolve } from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  test: {
    // api-client.ts などの static import は setupFiles より先に hoist されるため、
    // process.env への注入は setupFiles ではなく test.env で宣言的に行う
    env: {
      API_URL: process.env.API_URL ?? 'http://localhost:3000',
    },
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
