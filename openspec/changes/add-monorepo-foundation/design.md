## Context

pokedex リポジトリは pnpm + turbo の monorepo 雛形だけが整っており、`apps/api` / `apps/web` / `apps/mobile` の各 `src/` は空である。実際に起動するアプリは存在しない。OpenSpec の最初の change として、後続 4 つの change（DB スキーマ、検索 API、Web 一覧、Mobile 一覧）すべての土台になる「動く API サーバの最小基盤」と「全アプリで共有する契約パッケージ」を整備する。

過去のリポジトリでは「実装中立」を方針にしていたが、本リポジトリではブラッシュアップの一環として **具体的な技術スタックを確定** する: Hono + hRPC + Drizzle + PostgreSQL（postgres ドライバ）+ Valibot + vitest。Web は Next.js 15、Mobile は Expo（React Native）+ NativeWind。これらは事前の `/opsx:explore` セッションで決定済み。

開発者は `pnpm --filter @pokedex/api dev` で API を起動できれば、後続 change は段階的に積み上げ可能になる。

## Goals / Non-Goals

**Goals:**

- `apps/api` を Hono サーバとして起動可能にし、`GET /health` がエンベロープ形式の 200 を返す
- Drizzle + postgres ドライバの wiring を完了し、Supabase ローカル PostgreSQL に対する DB 接続クライアントをモジュールレベル singleton として export する
- `packages/contracts` を新規作成し、レスポンスエンベロープ・ドメイン定数・エラーコードを集約する
- monorepo の workspace 設定（`pnpm-workspace.yaml` への `packages/*` 追加、turbo タスク追加）を整える
- `supabase init` / `supabase start` でローカル Supabase スタック（PostgreSQL + Storage 含む）を起動できる状態にする
- `.tool-versions` に `supabase` を追加し、asdf 経由で CLI バージョンを固定する
- `apps/api` に vitest を導入し、TDD ワークフローのテスト基盤を確立する
- `apps/api` の Hono アプリを `AppType` として export し、後続 change で Web/Mobile から型のみ参照できる土台にする

**Non-Goals:**

- ドメインモデル（Pokemon / FormEntry / FormType / FormSprite / *Name 等）のテーブル定義 → `add-domain-schema`
- シードデータ・JSON ファイル・不変条件チェック → `add-domain-schema`
- 検索エンドポイント（`GET /pokemon` 等）・マスタ取得エンドポイント → `add-search-api`
- Web / Mobile の実装 → `add-web-listing` / `add-mobile-listing`
- CORS 設定（Web/Mobile から API を叩くようになる change で対応）
- 認証・認可（プロダクト全体で不要、Supabase Auth も使わない）
- Supabase Realtime / Edge Functions（本プロダクトで使う予定なし）
- Storage クライアント（`@supabase/supabase-js`）の wiring と画像 URL 解決ロジック（Web の change で実装）
- Drizzle スキーマ定義と実マイグレーション（`add-domain-schema` で扱う）
- 本番デプロイ構成・CI 設定（クラウド Supabase との接続切替も含む）

## Decisions

### Decision 1: API フレームワークは Hono + hRPC

**選定**: Hono を採用し、`hc<typeof app>` 経由で型安全クライアントを Web/Mobile に提供する。

**理由**:
- 軽量で Node / Edge どちらでも動く
- Drizzle、Valibot との連携アダプタ（`@hono/valibot-validator`）が公式に揃っている
- hRPC で `AppType` を export すれば Web/Mobile から型推論できる
- 後続 change の検索エンドポイントでも同じパターンで拡張できる

**代替案と却下理由**:
- **Fastify**: 安定だが TypeScript 第一級ではなく、hRPC 相当の機能は別途構築が必要
- **NestJS**: フルフレームワークで構造化されるが、本プロジェクトの規模に対して重い
- **tRPC**: Mobile 以外のクライアント（curl、外部連携）から叩きにくい

### Decision 2: ORM は Drizzle、ドライバは porsager/postgres

**選定**: Drizzle ORM を採用し、PostgreSQL ドライバは `postgres`（porsager）を使う。

**理由**:
- TypeScript ファースト、型生成が確実
- ランタイムが軽量で Hono との相性が良い
- SQL ライクな API で「生 SQL を直接組み立てない」という旧仕様の方針を満たしつつ、クエリの挙動が読みやすい
- `drizzle-valibot` で Drizzle スキーマから Valibot スキーマを生成できる

**代替案と却下理由**:
- **Prisma**: バイナリサイズが大きく、Edge での動作に制限。本 change では Edge は使わないが、後の Mobile/Edge 展開を考えて Drizzle を選択
- **Kysely**: 型安全だがマイグレーションは別ツール、エコシステムが Drizzle より小さい

### Decision 3: バリデーションは Valibot

**選定**: スキーマライブラリは Valibot を採用する。

**理由**:
- バンドルサイズが Zod より小さく、ツリーシェイク前提で書ける
- `@hono/valibot-validator`、`drizzle-valibot` の公式アダプタ存在
- API 型推論への影響は Zod とほぼ同等

**代替案と却下理由**:
- **Zod**: エコシステムは広いがバンドルサイズが大きい。今回は Mobile も視野なので Valibot を優先

### Decision 4: ディレクトリ構造

```
apps/
  api/
    src/
      index.ts            -- Hono アプリのエントリ。AppType を export
      routes/
        health.ts         -- ヘルスチェック
      db/
        client.ts         -- Drizzle クライアントの singleton
      lib/
        envelope.ts       -- エンベロープ生成ヘルパー
      __tests__/
        health.test.ts
    vitest.config.ts
    drizzle.config.ts     -- 後続 change で使うが雛形を置く
    tsconfig.json
    package.json

packages/
  contracts/
    src/
      schemas/
        envelope.ts       -- レスポンスエンベロープ Valibot スキーマ
        index.ts
      constants.ts        -- PAGE_SIZE / MAX_TYPES / DEFAULT_POKEDEX_SLUG
      errors.ts           -- ErrorCode enum
      index.ts            -- 全部 re-export
    tsconfig.json
    package.json
```

**理由**:
- 機能/ドメイン別にファイルを分け、1 ファイル 200〜400 行を目安にする
- `packages/contracts` の `src/index.ts` を単一エントリにし、apps からの import を簡潔にする

### Decision 5: レスポンスエンベロープの形

```typescript
type ApiResponse<T> =
  | { success: true;  data: T;          meta?: { total: number; page: number; limit: number } }
  | { success: false; error: { code: ErrorCode; message: string } }
```

**理由**:
- 旧仕様の `{ success, data?, error?, meta? }` を判別可能ユニオン型に整理し、TypeScript の型ガードを効きやすくする
- 成功時は必ず `data` が存在、失敗時は必ず `error` が存在する保証ができる
- `meta` は検索系エンドポイントでのみ使う想定で `optional`

### Decision 6: DB クライアントはモジュールレベル singleton

```typescript
// apps/api/src/db/client.ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is required')
}

const client = postgres(connectionString)
export const db = drizzle(client)
```

**理由**:
- Hono サーバはサーバ独立起動なので Next.js のような Hot Reload 多重インスタンス問題は起きない
- 起動時に `DATABASE_URL` 不在を fail-fast で検出する
- 後続 change のマイグレーション/シードからも同じインスタンスを使い回せる
- 開発環境では Supabase ローカルが提供する `postgres://postgres:postgres@127.0.0.1:54322/postgres` を `DATABASE_URL` として `.env` に書き、本番では実 Supabase の接続文字列に切り替える

### Decision 7: パッケージ依存の方向

```
@pokedex/contracts ← @pokedex/api  (workspace dependency)
                  ← @pokedex/web   (後続 change)
                  ← @pokedex/mobile (後続 change)

@pokedex/api 自体は AppType を export する。
後続 change で @pokedex/web / @pokedex/mobile が import type { AppType } する。
```

**理由**:
- 共通契約を `packages/contracts` に集約し、apps 間で循環依存を生まない
- AppType は型のみ参照なのでサーバ専用依存（drizzle、postgres）はランタイムに紛れない
- `tsconfig` の `isolatedModules: true` と `import type` で型のみ参照を強制可能

### Decision 8: 開発環境は Supabase ローカルスタックを採用する

ローカル開発は **Supabase CLI（`supabase start`）でスタック一式を起動** する。`supabase init` で生成される `supabase/` ディレクトリ（`config.toml` 等）を repository に含め、開発者は `supabase start` を実行するだけで PostgreSQL（54322 番）、Studio（54323 番）、Storage、Kong など必要サービスが立ち上がる。Supabase ローカル既定の `DATABASE_URL=postgres://postgres:postgres@127.0.0.1:54322/postgres` は **Decision 14** に従い `.env.development`（コミット対象）に記載する。

**理由**:
- プロダクトとして Supabase（本番でも採用予定）を使うため、ローカルから本番までスキーマと挙動を揃えやすい
- Storage を旧仕様の「スプライト画像はオブジェクトストレージから配信」の用途で使う前提があり、ローカルでも Storage が立ち上がる Supabase CLI と相性が良い
- 自前 docker-compose と異なり、Supabase 公式が PostgreSQL バージョン・各サービス間の整合性をメンテしてくれる
- Studio UI が同梱されるので、シード後の DB 確認が容易

**代替案と却下理由**:
- **自前 `docker-compose.yml`**: Postgres だけ立てるなら軽量だが、Storage を別建てするコストが重く、Supabase 本番との挙動差分のリスクが残る
- **クラウド Supabase のみ（ローカル起動しない）**: 開発のたびにクラウドへ接続する必要があり、複数開発者でデータが衝突する。オフライン作業も不可
- **DevContainer + Docker-in-Docker**: 環境統一は最も強いが個人開発で恩恵が薄く、Docker-in-Docker のオーバーヘッドが大きい

**ホスト前提**: 開発者ホストには Docker Desktop または Colima が必要（`supabase start` が内部で利用）。これは README に明記する。

### Decision 9: テストフレームワークは vitest

**選定**: ユニットテスト基盤は vitest。

**理由**:
- TypeScript ネイティブ、設定が少ない
- pokedex の `tdd-workflow` skill が想定するテストランナーと一致
- Hono のテストは `app.request()` を使うので Node だけで完結し、追加 DOM 環境は不要

### Decision 11: マイグレーションは Drizzle Kit が主、SQL を `supabase/migrations/` に出力する

`drizzle.config.ts` の `out` を `./supabase/migrations` に向け、`drizzle-kit generate` で生成される SQL を Supabase CLI が認識する形式（タイムスタンプ付きファイル名）に揃える。マイグレーションの適用は Supabase CLI 側のコマンド（`supabase db reset`、`supabase db push`、`supabase migration up`）を使う。

**理由**:
- Drizzle Kit の型一貫性（スキーマの TypeScript 定義から SQL を生成）と、Supabase CLI の管理体系（migration → deploy）の両方を活かせる
- 1 箇所に migration SQL を集約できるので、レビュー時に追える
- Supabase CLI の流儀に乗ることで、本番反映時も `supabase db push` だけで済む

**代替案と却下理由**:
- **Drizzle Kit 一本（`./drizzle/`）**: Supabase CLI の migration 体系を使えず、ローカル DB のリセットや本番反映で工夫が必要
- **Supabase CLI 一本（SQL を手書き）**: Drizzle のスキーマ定義 → SQL 生成という型安全のループが切れる。手書き SQL のメンテコストが大きい

**注意点**:
- 本 change では `drizzle.config.ts` の置き場所と `out` パスだけ確定する。実マイグレーションの生成・適用は `add-domain-schema` で初めて走る
- `supabase/migrations/` ディレクトリは `supabase init` 直後では空。Drizzle Kit の出力ファイル名フォーマット（`<timestamp>_<name>.sql`）が Supabase CLI の期待と一致することを `add-domain-schema` で確認する

### Decision 12: 開発環境は asdf に統一し、`.tool-versions` を真実の源とする

Node、pnpm に加え、`supabase` CLI も `.tool-versions` に記載して `asdf-supabase` plugin で管理する。DevContainer は今回採用しない。

**理由**:
- 既存の `.tool-versions`（Node 24.13.1 / pnpm 11.0.8）と同じ流儀で揃う
- 個人開発の現状では DevContainer のオーバーヘッドが恩恵を上回る
- 将来チームを増やすときも、DevContainer は後付けできる（asdf の流儀を壊さずに）

**代替案と却下理由**:
- **DevContainer フル**: VSCode 前提、Docker-in-Docker のオーバーヘッド、JetBrains 系 IDE と相性が弱い
- **DevContainer 軽量 + supabase はホスト**: コンテナ越しのポート共有が DevContainer の体験と微妙、構成が増えるわりに恩恵が薄い
- **README で個人裁量**: バージョンずれが起きやすく、再現性が下がる

**運用**:
- README に「`asdf plugin add supabase` → `asdf install`」の手順を明記する
- ホストには Docker Desktop / Colima のどちらかが必要（asdf 管理外、README に記載）

### Decision 13: turbo タスクの構成

`turbo.json` に以下を定義:

```
{
  "tasks": {
    "dev": { "cache": false, "persistent": true },
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "test": { "dependsOn": ["^build"] },
    "typecheck": { "dependsOn": ["^build"] },
    "lint": {},
    "format": {},
    "format:check": {}
  }
}
```

**理由**:
- `dev` は永続プロセスなのでキャッシュ無効
- `test` / `typecheck` は依存パッケージのビルド成果物が必要なので `^build` 依存
- `lint` / `format` は既存挙動を維持

### Decision 14: 環境変数は `.env.development` をコミット、`.env.local` を gitignore、本番は GitHub Secrets

**ファイル戦略**:

| ファイル | 用途 | git 扱い | 機密 |
| --- | --- | --- | --- |
| `.env.development` | ローカル動作の既定値（Supabase ローカル接続文字列など） | コミット対象 | **含めない** |
| `.env.local` | 個人の機密上書き（ローカルでの代替接続先など） | `.gitignore` 対象 | 含めてよい（個人責任） |
| `.env` | 使わない | `.gitignore` 対象（保険） | — |
| `.env.production` | 使わない（本番値はリポジトリに置かない） | コミット禁止 | — |

**本番値**: GitHub Secrets / Vercel 環境変数 / Supabase Dashboard などホスティング側で注入する。リポジトリには本番接続文字列・サービスロールキー・API キーなどの機密を **絶対に置かない**。

**読み込み手段**: Node.js 22.7+ の `--env-file` / `--env-file-if-exists` フラグを使用する。`apps/api` の dev コマンドは以下のように構成する:

```jsonc
// apps/api/package.json
"scripts": {
  "dev": "tsx watch --env-file=../../.env.development --env-file-if-exists=../../.env.local src/server.ts"
}
```

- `.env.development` が必須読込、`.env.local` は存在すれば後勝ちで上書き
- 既存の `.tool-versions` で Node 24 を固定しているので `--env-file-if-exists` は使える

**理由**:
- ファイル名で「コミットしてよいローカル既定値」と「個人の機密上書き」を明確に分離できる
- Next.js / Expo の env 命名慣習と衝突しない（`.env.local` を gitignore する流儀は両者と一致）
- 本番値をリポジトリに持ち込まないので、GitHub の secret scanning や誤コミット時のローテーションコストを避けられる
- 開発者は `git clone` → `asdf install` → `supabase start` → `pnpm install` → `pnpm dev` だけでローカル動作する（`.env.local` を作る必要なし）

**代替案と却下理由**:
- **`.env` をコミット + `.env.local` を gitignore（Next.js 慣習そのまま）**: `.env` というファイル名が「機密が入っているのでは」と読み手に誤読されやすい。`.env.development` の方が意図が明示的
- **`.env.local` をコミット + `.env` を gitignore**: Next.js 既定挙動（`.env.local` は機密として扱う）と逆転するため、Web change 時に混乱を招く
- **すべて GitHub Secrets**: ローカル開発でも secrets pull が必要になり、オフライン作業不可・onboarding コスト増

**運用ルール**:
- README に「`.env.development` には機密を書かない、`.env.local` に上書きする」と明記する
- pre-commit hook で `.env.development` が変更された場合に値の機密性レビューをリマインドする（実装は後続 change で検討）
- 本 change のスコープでは GitHub Secrets の wiring（GitHub Actions secrets の設定、CI からの読み込み）は行わない（CI/CD の change で扱う）

## Risks / Trade-offs

- **Valibot のドキュメント・サンプルが Zod に比べて少ない** → Hono / Drizzle の公式アダプタを基準に統一。社内サンプルを `apps/api` 内に小さく作って参照しやすくする。
- **`@pokedex/api` を後続で型のみ import する設計のため、サーバ専用依存（postgres / drizzle-orm）が import 経路に紛れ込むリスク** → `import type` を徹底し、tsconfig の `verbatimModuleSyntax: true` または `isolatedModules` で型のみ import を強制する。Web/Mobile の change で実際に試す。
- **`.tool-versions` の Node バージョン（24.13.1）が未インストールの開発者がいる** → `README` に asdf install 手順を記載。CI 用には `.tool-versions` を信頼源として使う。
- **Drizzle のマイグレーション基盤は本 change では設定だけで運用しない** → `drizzle.config.ts` は雛形を置くだけ。実マイグレーションは `add-domain-schema` で導入する。雛形と実運用のギャップが残るので、コメントで「次 change で使う」と明記。
- **Supabase CLI のバージョンドリフト** → `.tool-versions` で `supabase` を固定する。CLI のメジャー更新で `supabase/config.toml` のスキーマが変わる可能性があるため、バージョン更新は専用の change で扱う。
- **`asdf-supabase` plugin の安定性** → 公式 plugin ではなく community plugin。インストール失敗時は README に「`brew install supabase/tap/supabase` への切替手順」を記載しておく（フォールバック）。
- **Supabase ローカルが起動する Docker コンテナのリソース消費** → `supabase start` は 10 個前後のコンテナを起動する。低スペックマシンでメモリ逼迫の可能性。`supabase status` での確認、不要時は `supabase stop` を README に明記。
- **Drizzle Kit の生成 SQL と Supabase CLI の migration ファイル名フォーマットが不整合になるリスク** → 本 change では `out` を `./supabase/migrations` に向けるのみで実 SQL は生成しない。整合確認は `add-domain-schema` のスコープに含める。
- **`.env.development` への機密誤コミット** → README とコメントで「機密は `.env.local` か GitHub Secrets」と強調する。後続 change で pre-commit hook（gitleaks 等）の導入を検討。本 change ではドキュメントベースの規律のみ。
- **Node の `--env-file-if-exists` が動かない環境（古い Node）** → `.tool-versions` で Node 24.x を固定しているので問題ないが、`asdf install` を忘れた開発者が低 Node でつまずく可能性がある。README で「`asdf install` を必ず実行」と明記。
- **既存の oxlint/oxfmt と vitest の併用** → vitest 用ファイル（`*.test.ts`）も oxlint の対象になるので、既存の `.oxlintrc.json` で test glob を許容済みであることを確認する。

## Migration Plan

本 change はゼロから基盤を作るので「マイグレーション」は新規追加が中心になる。

1. `.tool-versions` に `supabase` を追記し、`asdf plugin add supabase` → `asdf install` で CLI を導入
2. リポジトリルートで `supabase init` を実行し、`supabase/` ディレクトリを生成（`config.toml`、`migrations/`、`seed.sql` 等）
3. `packages/contracts` を新規作成し、最小コンテンツを置く
4. `pnpm-workspace.yaml` に `packages/*` を追加
5. `apps/api` に依存追加（`hono`, `@hono/node-server`, `@hono/valibot-validator`, `drizzle-orm`, `drizzle-kit`, `postgres`, `valibot`, `vitest`, `@pokedex/contracts`）
6. `apps/api/src/` を実装し、`drizzle.config.ts` の `out` を `./supabase/migrations` に向ける
7. `.env.development` をリポジトリルートに追加（Supabase ローカル接続用 `DATABASE_URL`、機密ゼロ）
   `.gitignore` に `.env.local` と保険の `.env` / `.env.production` を追加
8. `turbo.json` を更新
9. README に開発手順（asdf install、`supabase start`、`pnpm install`、API 起動、ヘルスチェック確認）を追記

**ロールバック戦略**: 本 change は他の change が依存する基盤なので、archive 後の差し戻しは想定しない。万一作業途中で方針変更が必要になった場合は、`openspec/changes/add-monorepo-foundation/` を削除し、新しい change を起こす。

## Open Questions

- **Hono の起動ポート**: デフォルト 3000 で開始するが、Web を別ポート（例: 4000）にして衝突を避けるかどうかは Web の change で再検討する。本 change では `process.env.PORT ?? 3000`。
- **`drizzle.config.ts` の置き場所**: `apps/api/drizzle.config.ts` で進める。実マイグレーションを始める `add-domain-schema` で必要なら見直す。
- **vitest のカバレッジ閾値**: `tdd-workflow` skill が 80% 以上を目標とするが、本 change はコード量が少ないので閾値設定は次の change（実コードが乗る `add-domain-schema`）で導入する。本 change ではカバレッジ収集の設定だけ入れる。
