import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // monorepo の workspace パッケージ (`@pokedex/contracts` / `@pokedex/api`) は ESM NodeNext で
  // `.js` 拡張子付き import (`export * from './constants.js'` 等) を持つ TS ソースをそのまま配信している。
  // 型限定 import (`import type`) なら問題ないが、runtime value (POKEDEX_SLUG_VALUES 等) を import する場合、
  // Turbopack に transpilePackages として明示しないと `.js` 拡張子の解決に失敗する。
  transpilePackages: ['@pokedex/contracts', '@pokedex/api'],
};

export default nextConfig;
