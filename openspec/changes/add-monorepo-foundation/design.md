## Context

pokedex リポジトリは pnpm + turbo の monorepo 雛形だけが整っており、`apps/api` / `apps/web` / `apps/mobile` の各 `src/` は空である。実際に起動するアプリは存在しない。OpenSpec の最初の change として、後続 4 つの change（DB スキーマ、検索 API、Web 一覧、Mobile 一覧）すべての土台になる「動く API サーバの最小基盤」と「全アプリで共有する契約パッケージ」を整備する。

過去のリポジトリでは「実装中立」を方針にしていたが、本リポジトリではブラッシュアップの一環として **具体的な技術スタックを確定** する: Hono + hRPC + Drizzle + PostgreSQL（postgres ドライバ）+ Valibot + vitest。Web は Next.js 15、Mobile は Expo（React Native）+ NativeWind。これらは事前の `/opsx:explore` セッションで決定済み。

開発者は `pnpm --filter @pokedex/api dev` で API を起動できれば、後続 change は段階的に積み上げ可能になる。

## Goals / Non-Goals

**Goals:**

- `apps/api` を Hono サーバとして起動可能にし、`GET /health` がエンベロープ形式の 200 を返す
- Drizzle + postgres ドライバの wiring を完了し、DB 接続クライアントをモジュールレベル singleton として export する
- `packages/contracts` を新規作成し、レスポンスエンベロープ・ドメイン定数・エラーコードを集約する
- monorepo の workspace 設定（`pnpm-workspace.yaml` への `packages/*` 追加、turbo タスク追加）を整える
- ローカル開発用の PostgreSQL を `docker-compose.yml` で起動できる状態にする
- `apps/api` に vitest を導入し、TDD ワークフローのテスト基盤を確立する
- `apps/api` の Hono アプリを `AppType` として export し、後続 change で Web/Mobile から型のみ参照できる土台にする

**Non-Goals:**

- ドメインモデル（Pokemon / FormEntry / FormType / FormSprite / *Name 等）のテーブル定義 → `add-domain-schema`
- シードデータ・JSON ファイル・不変条件チェック → `add-domain-schema`
- 検索エンドポイント（`GET /pokemon` 等）・マスタ取得エンドポイント → `add-search-api`
- Web / Mobile の実装 → `add-web-listing` / `add-mobile-listing`
- CORS 設定（Web/Mobile から API を叩くようになる change で対応）
- 認証・認可（プロダクト全体で不要）
- 本番デプロイ構成・CI 設定

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

### Decision 8: 開発 DB は docker-compose で起動

`docker-compose.yml`（リポジトリルート）に PostgreSQL コンテナを定義し、`docker compose up -d` で起動可能にする。`.env.example` に `DATABASE_URL=postgres://pokedex:pokedex@localhost:5432/pokedex` を記載。

**理由**:
- 開発者の OS（macOS / Linux）に依存しない
- 後続 change で他のサービス（例: pgAdmin）を増やすときも同じファイルで追加可能

### Decision 9: テストフレームワークは vitest

**選定**: ユニットテスト基盤は vitest。

**理由**:
- TypeScript ネイティブ、設定が少ない
- pokedex の `tdd-workflow` skill が想定するテストランナーと一致
- Hono のテストは `app.request()` を使うので Node だけで完結し、追加 DOM 環境は不要

### Decision 10: turbo タスクの構成

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

## Risks / Trade-offs

- **Valibot のドキュメント・サンプルが Zod に比べて少ない** → Hono / Drizzle の公式アダプタを基準に統一。社内サンプルを `apps/api` 内に小さく作って参照しやすくする。
- **`@pokedex/api` を後続で型のみ import する設計のため、サーバ専用依存（postgres / drizzle-orm）が import 経路に紛れ込むリスク** → `import type` を徹底し、tsconfig の `verbatimModuleSyntax: true` または `isolatedModules` で型のみ import を強制する。Web/Mobile の change で実際に試す。
- **`.tool-versions` の Node バージョン（24.13.1）が未インストールの開発者がいる** → `README` に asdf install 手順を記載。CI 用には `.tool-versions` を信頼源として使う。
- **Drizzle のマイグレーション基盤は本 change では設定だけで運用しない** → `drizzle.config.ts` は雛形を置くだけ。実マイグレーションは `add-domain-schema` で導入する。雛形と実運用のギャップが残るので、コメントで「次 change で使う」と明記。
- **docker-compose の PostgreSQL バージョン固定** → `postgres:17-alpine` のような明示タグで固定し、ローカル/CI で同一バージョンを使う。バージョン更新は別 change で扱う。
- **既存の oxlint/oxfmt と vitest の併用** → vitest 用ファイル（`*.test.ts`）も oxlint の対象になるので、既存の `.oxlintrc.json` で test glob を許容済みであることを確認する。

## Migration Plan

本 change はゼロから基盤を作るので「マイグレーション」は新規追加が中心になる。

1. `packages/contracts` を新規作成し、最小コンテンツを置く
2. `pnpm-workspace.yaml` に `packages/*` を追加
3. `apps/api` に依存追加（`hono`, `@hono/node-server`, `@hono/valibot-validator`, `drizzle-orm`, `drizzle-kit`, `postgres`, `valibot`, `vitest`, `@pokedex/contracts`）
4. `apps/api/src/` を実装
5. `docker-compose.yml` と `.env.example` をリポジトリルートに追加
6. `turbo.json` を更新

**ロールバック戦略**: 本 change は他の change が依存する基盤なので、archive 後の差し戻しは想定しない。万一作業途中で方針変更が必要になった場合は、`openspec/changes/add-monorepo-foundation/` を削除し、新しい change を起こす。

## Open Questions

- **Hono の起動ポート**: デフォルト 3000 で開始するが、Web を別ポート（例: 4000）にして衝突を避けるかどうかは Web の change で再検討する。本 change では `process.env.PORT ?? 3000`。
- **`drizzle.config.ts` の置き場所**: `apps/api/drizzle.config.ts` で進める。実マイグレーションを始める `add-domain-schema` で必要なら見直す。
- **vitest のカバレッジ閾値**: `tdd-workflow` skill が 80% 以上を目標とするが、本 change はコード量が少ないので閾値設定は次の change（実コードが乗る `add-domain-schema`）で導入する。本 change ではカバレッジ収集の設定だけ入れる。
