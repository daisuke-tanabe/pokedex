/**
 * `server-only` パッケージの vitest (jsdom) 用 stub。
 *
 * 本物の `server-only` は Server Component 以外から import されると常に throw する設計だが、
 * vitest 環境では bundler 特例が効かないので vitest.config.ts の alias でこの no-op stub に差し替える。
 * 実行時の Client / Server 分離は Next.js dev/build 時のみ保証される。
 */
export const serverOnlyStub = true;
