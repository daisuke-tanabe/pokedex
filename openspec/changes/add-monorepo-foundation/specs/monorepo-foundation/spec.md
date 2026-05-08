## ADDED Requirements

### Requirement: pnpm workspace に packages/* が含まれる

`pnpm-workspace.yaml` は `apps/*` に加え `packages/*` を workspace の対象として宣言しなければならない（MUST）。これにより `packages/contracts` 等の共有パッケージが workspace dependency として解決可能でなければならない（MUST）。

#### Scenario: pnpm-workspace.yaml に packages/* が含まれる

- **WHEN** リポジトリルートの `pnpm-workspace.yaml` を読む
- **THEN** `packages` 配列に `'apps/*'` と `'packages/*'` の両方が含まれる

#### Scenario: workspace dependency が解決できる

- **WHEN** `apps/api` の `package.json` に `"@pokedex/contracts": "workspace:*"` を追加して `pnpm install` を実行する
- **THEN** インストールが成功し、`apps/api/node_modules/@pokedex/contracts` がシンボリックリンクとして作成される

### Requirement: turbo タスクの整備

`turbo.json` は monorepo 全体で実行可能な共通タスクを定義しなければならない（MUST）。最低限 `dev`、`build`、`test`、`typecheck`、`lint`、`format`、`format:check` の 7 つを含まなければならない（MUST）。

#### Scenario: turbo.json に必要なタスクが揃っている

- **WHEN** リポジトリルートの `turbo.json` を読む
- **THEN** `tasks` 配下に `dev`、`build`、`test`、`typecheck`、`lint`、`format`、`format:check` の 7 タスクが定義されている

#### Scenario: dev タスクは永続プロセスとしてキャッシュされない

- **WHEN** `turbo.json` の `tasks.dev` の定義を読む
- **THEN** `cache: false` かつ `persistent: true` が設定されている

#### Scenario: build タスクが依存パッケージのビルドを先行する

- **WHEN** `turbo.json` の `tasks.build` の定義を読む
- **THEN** `dependsOn` に `^build` が含まれる

### Requirement: 各 app / package のスクリプト統一

`apps/*` と `packages/*` の package.json は `lint`、`format`、`format:check`、`typecheck` の 4 スクリプトを定義しなければならない（MUST）。`apps/api` と各 package には追加で `test` スクリプトを定義しなければならない（MUST）。`apps/api` には追加で `dev` と `build` スクリプトを定義しなければならない（MUST）。

#### Scenario: apps/api に必要なスクリプトが揃っている

- **WHEN** `apps/api/package.json` の `scripts` を読む
- **THEN** `dev`、`build`、`test`、`typecheck`、`lint`、`format`、`format:check` の 7 スクリプトすべてがキーとして存在する

#### Scenario: packages/contracts に必要なスクリプトが揃っている

- **WHEN** `packages/contracts/package.json` の `scripts` を読む
- **THEN** `test`、`typecheck`、`lint`、`format`、`format:check` の 5 スクリプトがキーとして存在する

### Requirement: ローカル開発用 PostgreSQL の docker-compose

リポジトリルートに `docker-compose.yml` を配置しなければならない（MUST）。`docker compose up -d` のみでローカル開発用 PostgreSQL コンテナが起動できなければならない（MUST）。PostgreSQL のメジャーバージョンは固定されなければならず（MUST）、`.env.example` の `DATABASE_URL` と整合しなければならない（MUST）。

#### Scenario: docker compose で PostgreSQL が起動する

- **WHEN** `docker compose up -d` を実行する
- **THEN** `pokedex` という名前のデータベースを持つ PostgreSQL コンテナが起動し、`5432` 番ポートが host から到達可能になる

#### Scenario: .env.example の DATABASE_URL が docker-compose と整合する

- **WHEN** `.env.example` の `DATABASE_URL` と `docker-compose.yml` のユーザ・パスワード・データベース名・ポートを比較する
- **THEN** 4 要素（user / password / database / port）すべてが一致する

#### Scenario: PostgreSQL のメジャーバージョンが固定されている

- **WHEN** `docker-compose.yml` の PostgreSQL イメージタグを確認する
- **THEN** `latest` ではなく明示的なメジャーバージョンタグ（例: `postgres:17-alpine`）が指定されている

### Requirement: vitest テスト基盤

`apps/api` は vitest 設定を持たなければならず（MUST）、`pnpm --filter @pokedex/api test` でユニットテストが実行できなければならない（MUST）。`packages/contracts` も同様にテスト実行が可能でなければならない（MUST）。

#### Scenario: apps/api でテストコマンドが動作する

- **WHEN** `apps/api` で `pnpm test` を実行する
- **THEN** vitest が起動し、`__tests__/**/*.test.ts` パターンのテストファイルを収集して実行する

#### Scenario: packages/contracts でテストコマンドが動作する

- **WHEN** `packages/contracts` で `pnpm test` を実行する
- **THEN** vitest が起動し、テストファイルを収集して実行する

### Requirement: 環境変数テンプレート

リポジトリルートの `.env.example` には開発に必要な環境変数を網羅的に記載しなければならない（MUST）。本 change では最低 `DATABASE_URL` を含まなければならず（MUST）、各変数には用途のコメントを付けなければならない（MUST）。

#### Scenario: .env.example に DATABASE_URL が記載されている

- **WHEN** リポジトリルートの `.env.example` を読む
- **THEN** `DATABASE_URL=` で始まる行が 1 行以上存在する

#### Scenario: .env は git 追跡対象外

- **WHEN** `.gitignore` を確認する
- **THEN** `.env` がパターンに含まれる

### Requirement: lint / format の対象拡張

既存の oxlint / oxfmt は `packages/*` も対象として扱えなければならない（MUST）。各 package は独自に `oxlint --type-aware .` / `oxfmt .` を呼び出すスクリプトを持たなければならず（MUST）、turbo 経由で全 package 一括実行できなければならない（MUST）。

#### Scenario: packages/contracts の lint がエラーなく完走する

- **WHEN** `pnpm --filter @pokedex/contracts lint` を実行する
- **THEN** oxlint が exit code 0 で終了する

#### Scenario: ルートからの一括 lint が全 package を対象にする

- **WHEN** リポジトリルートで `pnpm lint` を実行する
- **THEN** turbo が `apps/api`、`apps/web`、`apps/mobile`、`packages/contracts` の 4 パッケージで `lint` タスクを実行する
