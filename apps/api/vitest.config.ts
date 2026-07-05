import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    // turbo dev/test の `dependsOn: ["^build"]` で `dist/` が自動生成されるため、
    // vitest が dist/**/*.test.js を拾わないように明示的に除外する。
    include: ['src/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
});
