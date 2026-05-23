## ADDED Requirements

### Requirement: invariants.test.ts は DATABASE_URL 未設定で安全に skip する

`apps/api/src/db/seed/invariants.test.ts` は `DATABASE_URL` 未設定の環境でモジュールロード時に例外をスローしてはならない（MUST NOT）。当該テストファイルは `describe.skipIf` で `DATABASE_URL` 未設定時の skip を宣言し、`apps/api/src/db/seed/invariants.ts` (および間接的に `apps/api/src/db/client.ts`) の値の読み込みは `beforeAll` などの **遅延 import** で囲んで実行されなければならない（MUST）。これにより `pnpm -r test` を `DATABASE_URL` 未設定環境で実行しても当該ファイルがロード時に落ちず、describe ブロックがまるごと skip される。`DATABASE_URL` 設定済み環境では従来通り全 invariant を検証しなければならない（MUST）。

#### Scenario: DATABASE_URL 未設定で test ファイルがロードに失敗しない

- **WHEN** `DATABASE_URL` 環境変数を未設定にして `pnpm --filter @pokedex/api test` を実行する
- **THEN** `apps/api/src/db/seed/invariants.test.ts` がモジュールロード段階で例外を投げず、当該 describe が skip 扱いになる (テストファイルが "failed" にならない)

#### Scenario: DATABASE_URL 設定済みで invariant 検証が走る

- **WHEN** `DATABASE_URL` を Supabase ローカル既定値 (`postgres://postgres:postgres@127.0.0.1:54322/postgres`) に設定し、シード適用後に `pnpm --filter @pokedex/api test` を実行する
- **THEN** `collectInvariantViolations()` が呼ばれ、違反 0 件のとき当該テストが緑になる
