## ADDED Requirements

### Requirement: apps/web に必要なスクリプトが揃っている

`apps/web/package.json` は monorepo 共通スクリプトの完全セット (`dev`、`build`、`test`、`typecheck`、`lint`、`format`、`format:check`) を定義しなければならない（MUST）。`dev` は Next.js dev サーバを `port 3001` で起動するコマンド (例: `next dev -p 3001`) でなければならない（MUST）。`build` は Next.js の本番ビルドコマンド (例: `next build`) でなければならない（MUST）。`test` は Vitest を実行するコマンド (例: `vitest run`) でなければならない（MUST）。

#### Scenario [unit]: apps/web に 7 スクリプトすべてが揃っている

- **WHEN** `apps/web/package.json` の `scripts` を読む
- **THEN** `dev`、`build`、`test`、`typecheck`、`lint`、`format`、`format:check` の 7 スクリプトすべてがキーとして存在する

#### Scenario [unit]: dev スクリプトが port 3001 で起動する

- **WHEN** `apps/web/package.json` の `scripts.dev` を読む
- **THEN** `next dev` を含み、かつ `-p 3001` または `--port 3001` 相当の引数で 3001 番ポート指定が含まれる

#### Scenario [unit]: build スクリプトが Next.js ビルドを呼ぶ

- **WHEN** `apps/web/package.json` の `scripts.build` を読む
- **THEN** `next build` を含むコマンドが定義されている

#### Scenario [unit]: test スクリプトが vitest を呼ぶ

- **WHEN** `apps/web/package.json` の `scripts.test` を読む
- **THEN** `vitest run` を含むコマンドが定義されている

### Requirement: apps/web の vitest テスト基盤

`apps/web` は vitest 設定を持たなければならず（MUST）、`pnpm --filter @pokedex/web test` でユニットテスト / インテグレーションテストが実行できなければならない（MUST）。テスト環境は `jsdom` でなければならない（MUST）。

#### Scenario [integration]: apps/web でテストコマンドが動作する

- **WHEN** `apps/web` で `pnpm test` を実行する
- **THEN** vitest が起動し、`*.test.ts` / `*.test.tsx` パターンのテストファイルを収集して実行する

#### Scenario [unit]: apps/web に vitest.config.ts が存在する

- **WHEN** `apps/web/vitest.config.ts` をファイルシステムで確認する
- **THEN** ファイルが存在し、`environment: 'jsdom'` が `test` セクションに含まれる
