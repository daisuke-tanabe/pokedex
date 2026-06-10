# monorepo-foundation Specification

## Purpose

pnpm workspace と turbo で `apps/api` / `apps/web` / `apps/mobile` / `packages/contracts` を束ねる開発基盤を規定する。`dev` / `build` / `test` / `typecheck` / `lint` / `format` の各タスクが workspace ごとに実行できる状態、`.env.development` / `.env.local` の環境変数管理方針、Supabase ローカルスタックの起動手順 (asdf 経由の Supabase CLI を含む) を含む。
## Requirements
### Requirement: pnpm workspace に packages/* が含まれる

`pnpm-workspace.yaml` は `apps/*` に加え `packages/*` を workspace の対象として宣言しなければならない（MUST）。これにより `packages/contracts` 等の共有パッケージが workspace dependency として解決可能でなければならない（MUST）。

#### Scenario [unit]: pnpm-workspace.yaml に packages/* が含まれる

- **WHEN** リポジトリルートの `pnpm-workspace.yaml` を読む
- **THEN** `packages` 配列に `'apps/*'` と `'packages/*'` の両方が含まれる

#### Scenario [integration]: workspace dependency が解決できる

- **WHEN** `apps/api` の `package.json` に `"@pokedex/contracts": "workspace:*"` を追加して `pnpm install` を実行する
- **THEN** インストールが成功し、`apps/api/node_modules/@pokedex/contracts` がシンボリックリンクとして作成される

### Requirement: turbo タスクの整備

`turbo.json` は monorepo 全体で実行可能な共通タスクを定義しなければならない（MUST）。最低限 `dev`、`build`、`test`、`typecheck`、`lint`、`format`、`format:check` の 7 つを含まなければならない（MUST）。

#### Scenario [unit]: turbo.json に必要なタスクが揃っている

- **WHEN** リポジトリルートの `turbo.json` を読む
- **THEN** `tasks` 配下に `dev`、`build`、`test`、`typecheck`、`lint`、`format`、`format:check` の 7 タスクが定義されている

#### Scenario [unit]: dev タスクは永続プロセスとしてキャッシュされない

- **WHEN** `turbo.json` の `tasks.dev` の定義を読む
- **THEN** `cache: false` かつ `persistent: true` が設定されている

#### Scenario [unit]: build タスクが依存パッケージのビルドを先行する

- **WHEN** `turbo.json` の `tasks.build` の定義を読む
- **THEN** `dependsOn` に `^build` が含まれる

### Requirement: 各 app / package のスクリプト統一

`apps/*` と `packages/*` の package.json は `lint`、`format`、`format:check`、`typecheck` の 4 スクリプトを定義しなければならない（MUST）。`apps/api` と各 package には追加で `test` スクリプトを定義しなければならない（MUST）。`apps/api` には追加で `dev` と `build` スクリプトを定義しなければならない（MUST）。

#### Scenario [unit]: apps/api に必要なスクリプトが揃っている

- **WHEN** `apps/api/package.json` の `scripts` を読む
- **THEN** `dev`、`build`、`test`、`typecheck`、`lint`、`format`、`format:check` の 7 スクリプトすべてがキーとして存在する

#### Scenario [unit]: packages/contracts に必要なスクリプトが揃っている

- **WHEN** `packages/contracts/package.json` の `scripts` を読む
- **THEN** `test`、`typecheck`、`lint`、`format`、`format:check` の 5 スクリプトがキーとして存在する

### Requirement: ローカル Supabase 環境の整備

リポジトリは Supabase CLI で初期化された `supabase/` ディレクトリを含まなければならない（MUST）。開発者は `supabase start` のみでローカル PostgreSQL を含む Supabase スタックを起動できなければならない（MUST）。Supabase ローカルが提供する PostgreSQL の接続文字列は `.env.example` の `DATABASE_URL` と整合しなければならない（MUST）。

#### Scenario [unit]: supabase ディレクトリが repository に含まれる

- **WHEN** リポジトリルートを確認する
- **THEN** `supabase/config.toml` がコミット対象として存在する

#### Scenario [integration]: supabase start でローカル PostgreSQL が起動する

- **WHEN** `supabase start` を実行する
- **THEN** ローカル PostgreSQL が `54322` 番ポートで到達可能になり、`supabase status` の出力に DB URL が表示される

#### Scenario [unit]: .env.example の DATABASE_URL が Supabase ローカルと整合する

- **WHEN** `.env.example` の `DATABASE_URL` を読む
- **THEN** ホストは `127.0.0.1` または `localhost`、ポートは `54322`、データベース名は `postgres`、ユーザは `postgres` で構築された Supabase ローカル既定の接続文字列になっている

### Requirement: asdf による開発ツールバージョン固定

`.tool-versions` には Node、pnpm に加え `supabase` のバージョンを明記しなければならない（MUST）。これにより `asdf install` を実行すれば必要な CLI 一式が再現可能なバージョンで揃わなければならない（MUST）。

#### Scenario [unit]: .tool-versions に supabase の行がある

- **WHEN** リポジトリルートの `.tool-versions` を読む
- **THEN** `supabase ` で始まる行が 1 行以上存在し、特定のバージョンが指定されている

#### Scenario [integration]: asdf install で全ツールが揃う

- **WHEN** `asdf-supabase` plugin を追加した状態で `asdf install` を実行する
- **THEN** Node、pnpm、supabase の 3 ツールが `.tool-versions` で指定されたバージョンで shim 経由で利用可能になる

### Requirement: vitest テスト基盤

`apps/api` は vitest 設定を持たなければならず（MUST）、`pnpm --filter @pokedex/api test` でユニットテストが実行できなければならない（MUST）。`packages/contracts` も同様にテスト実行が可能でなければならない（MUST）。

#### Scenario [integration]: apps/api でテストコマンドが動作する

- **WHEN** `apps/api` で `pnpm test` を実行する
- **THEN** vitest が起動し、`__tests__/**/*.test.ts` パターンのテストファイルを収集して実行する

#### Scenario [integration]: packages/contracts でテストコマンドが動作する

- **WHEN** `packages/contracts` で `pnpm test` を実行する
- **THEN** vitest が起動し、テストファイルを収集して実行する

### Requirement: ローカル既定値の環境変数ファイル

リポジトリルートの `.env.development` には、開発環境で動作させるために必要な環境変数の **既定値** を記載しなければならない（MUST）。本 change では最低 `DATABASE_URL` を含まなければならず（MUST）、各変数には用途のコメントを付けなければならない（MUST）。`DATABASE_URL` の値は Supabase ローカル既定値でなければならない（MUST）。`.env.development` は **機密情報を含んではならない**（MUST NOT）。

#### Scenario [unit]: .env.development に DATABASE_URL が記載されている

- **WHEN** リポジトリルートの `.env.development` を読む
- **THEN** `DATABASE_URL=` で始まる行が 1 行以上存在する

#### Scenario [unit]: .env.development の DATABASE_URL は Supabase ローカル既定値

- **WHEN** リポジトリルートの `.env.development` を読む
- **THEN** `DATABASE_URL` の値が `postgres://postgres:postgres@127.0.0.1:54322/postgres` または同等の Supabase ローカル既定接続文字列になっている

#### Scenario [integration]: .env.development はコミット対象である

- **WHEN** `git ls-files .env.development` を実行する
- **THEN** `.env.development` がパスとして出力される（追跡対象として登録されている）

### Requirement: 機密上書きファイルの隔離

リポジトリには個人ごとの機密値を上書きするための `.env.local` ファイルを許容するが、これは **必ず** `.gitignore` 対象としなければならない（MUST）。本番値を表現する `.env` および `.env.production` も同様にコミット禁止としなければならない（MUST）。

#### Scenario [unit]: .env.local が gitignore に含まれる

- **WHEN** `.gitignore` を確認する
- **THEN** `.env.local` がパターンに含まれる

#### Scenario [unit]: .env が gitignore に含まれる

- **WHEN** `.gitignore` を確認する
- **THEN** `.env` がパターンに含まれる

#### Scenario [unit]: .env.production が gitignore に含まれる

- **WHEN** `.gitignore` を確認する
- **THEN** `.env.production` がパターンに含まれる

### Requirement: 本番値はリポジトリ外で管理

本番環境で使用する機密値（実 Supabase の接続文字列、サービスロールキー、外部 API キー等）はリポジトリ内のいかなるファイルにも保存してはならない（MUST NOT）。本番値はホスティングサービス（GitHub Secrets、Vercel 環境変数、Supabase Dashboard 等）で注入する方針を README に明記しなければならない（MUST）。

#### Scenario [unit]: README に本番値の管理方針が記載されている

- **WHEN** リポジトリの `README.md` を読む
- **THEN** 「本番値は GitHub Secrets / 各ホスティングサービスで管理し、リポジトリには置かない」旨の記述が含まれる

### Requirement: lint / format の対象拡張

既存の oxlint / oxfmt は `packages/*` も対象として扱えなければならない（MUST）。各 package は独自に `oxlint --type-aware .` / `oxfmt .` を呼び出すスクリプトを持たなければならず（MUST）、turbo 経由で全 package 一括実行できなければならない（MUST）。

#### Scenario [integration]: packages/contracts の lint がエラーなく完走する

- **WHEN** `pnpm --filter @pokedex/contracts lint` を実行する
- **THEN** oxlint が exit code 0 で終了する

#### Scenario [integration]: ルートからの一括 lint が全 package を対象にする

- **WHEN** リポジトリルートで `pnpm lint` を実行する
- **THEN** turbo が `apps/api`、`apps/web`、`apps/mobile`、`packages/contracts` の 4 パッケージで `lint` タスクを実行する

### Requirement: Spec の Scenario は test type タグを持つ

`openspec/specs/**/spec.md` 内のすべての Scenario 見出しは、テストレイヤを示すタグ `[unit]` または `[integration]` を持たなければならない（MUST）。書式はインライン形式とし、`#### Scenario [unit]: <name>` または `#### Scenario [integration]: <name>` のいずれかでなければならない（MUST）。タグ無しの `#### Scenario: <name>` 形式は許容してはならない（MUST NOT）。

判定基準は次のとおりとする（MUST）:

- 次のいずれかを伴う Scenario は `[integration]` を付与する: `fetch` / 外部 I/O / プロセス起動 / RSC レンダリング / DB アクセス
- 上記いずれにも該当しない Scenario は `[unit]` を付与する

本要求は `/opsx:propose` で新規 spec を起こす際にも適用され、`openspec/config.yaml` の `rules.specs` に同等の規約が記述されていなければならない（MUST）。

`openspec/changes/archive/**` 配下の change proposal および delta spec は本要求の対象外とする。当時の体裁の記録として残し、retroactive な書き換えは行わない。

#### Scenario [unit]: config.yaml にタグ規約が記述されている

- **WHEN** `openspec/config.yaml` の `rules.specs` を読む
- **THEN** Scenario 見出しへのタグ付与を MUST として求める文と、判定基準（fetch / 外部 I/O / プロセス起動 / RSC レンダリング / DB アクセスを伴うものは `[integration]`、それ以外は `[unit]`）を述べる文の両方が含まれる

#### Scenario [unit]: 現役 spec にタグ無し Scenario が残っていない

- **WHEN** `grep -E "^#### Scenario:" openspec/specs/**/spec.md` を実行する
- **THEN** マッチ件数が 0 件である（すべての Scenario 見出しに `[unit]` または `[integration]` タグが付与されている）

#### Scenario [unit]: 現役 spec のタグ形式が規約どおりである

- **WHEN** `grep -rE "^#### Scenario " openspec/specs/` を実行する
- **THEN** すべてのマッチ行が `^#### Scenario \[(unit|integration)\]: ` の正規表現に一致する（タグの値は `unit` または `integration` のいずれか、形式はインラインの角括弧表記）

#### Scenario [unit]: archive 配下は本要求の対象外

- **WHEN** `openspec/changes/archive/**/specs/**/spec.md` 内の Scenario 見出しを確認する
- **THEN** タグ無しの Scenario が残っていても本要求の違反にはならない（archive は当時の体裁のまま保持される）

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

