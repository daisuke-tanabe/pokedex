---
name: database-migrations
description: PostgreSQL、MySQL、一般的な ORM (Prisma、Drizzle、Kysely、Django、TypeORM、golang-migrate) を対象とした、スキーマ変更・データ移行・ロールバック・ゼロダウンタイムデプロイのデータベースマイグレーションのベストプラクティス。
---

# データベースマイグレーションパターン

本番システム向けの安全で取り消し可能なデータベーススキーマ変更。

## 起動タイミング

- データベーステーブルを作成または変更するとき
- カラムやインデックスの追加・削除を行うとき
- データマイグレーションを実行するとき（バックフィル、変換）
- ゼロダウンタイムのスキーマ変更を計画するとき
- 新しいプロジェクトでマイグレーションツールをセットアップするとき

## コア原則

1. **すべての変更はマイグレーション** — 本番データベースを手動で変更しない
2. **本番では前進のみ** — ロールバックは新しい前進マイグレーションを使う
3. **スキーマとデータマイグレーションは分離** — 1 つのマイグレーションに DDL と DML を混ぜない
4. **本番サイズのデータでテストする** — 100 行で動くマイグレーションが 1000 万行でロックする可能性がある
5. **デプロイ済みマイグレーションは不変** — 本番で実行されたマイグレーションを編集しない

## マイグレーション安全チェックリスト

任意のマイグレーション適用前に:

- [ ] マイグレーションに UP と DOWN の両方があるか、明示的に「不可逆」と記されている
- [ ] 大きなテーブルへのフルテーブルロックがない（並行操作を使う）
- [ ] 新カラムにはデフォルトがあるかヌラブル（デフォルトなしで NOT NULL を追加しない）
- [ ] インデックスは並行作成（既存テーブルの CREATE TABLE インラインではない）
- [ ] データバックフィルはスキーマ変更とは別のマイグレーション
- [ ] 本番データのコピーに対してテスト済み
- [ ] ロールバック計画が文書化されている

## PostgreSQL のパターン

### カラムの安全な追加

```sql
-- GOOD: ヌラブルカラム、ロックなし
ALTER TABLE users ADD COLUMN avatar_url TEXT;

-- GOOD: デフォルト付きカラム（Postgres 11+ では即時、リライトなし）
ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

-- BAD: 既存テーブルにデフォルトなしの NOT NULL（フルリライトが必要）
ALTER TABLE users ADD COLUMN role TEXT NOT NULL;
-- これはテーブルをロックしてすべての行をリライトする
```

### ダウンタイムなしのインデックス追加

```sql
-- BAD: 大きなテーブルで書き込みをブロック
CREATE INDEX idx_users_email ON users (email);

-- GOOD: ノンブロッキング、並行書き込みを許可
CREATE INDEX CONCURRENTLY idx_users_email ON users (email);

-- 注意: CONCURRENTLY はトランザクションブロック内で実行できない
-- ほとんどのマイグレーションツールはこれに特別な処理が必要
```

### カラムのリネーム（ゼロダウンタイム）

本番で直接リネームしない。expand-contract パターンを使う:

```sql
-- Step 1: 新カラムを追加（migration 001）
ALTER TABLE users ADD COLUMN display_name TEXT;

-- Step 2: データをバックフィル（migration 002、データマイグレーション）
UPDATE users SET display_name = username WHERE display_name IS NULL;

-- Step 3: アプリコードを両カラムを read/write するよう更新
-- アプリ変更をデプロイ

-- Step 4: 旧カラムへの書き込みを停止、ドロップ（migration 003）
ALTER TABLE users DROP COLUMN username;
```

### カラムの安全な削除

```sql
-- Step 1: アプリのカラム参照をすべて削除
-- Step 2: カラム参照なしでアプリをデプロイ
-- Step 3: 次のマイグレーションでカラムをドロップ
ALTER TABLE orders DROP COLUMN legacy_status;

-- Django の場合: SeparateDatabaseAndState を使ってモデルから削除
-- DROP COLUMN を生成せず（次のマイグレーションでドロップ）
```

### 大規模なデータマイグレーション

```sql
-- BAD: 1 トランザクションで全行を更新（テーブルロック）
UPDATE users SET normalized_email = LOWER(email);

-- GOOD: 進捗付きバッチ更新
DO $$
DECLARE
  batch_size INT := 10000;
  rows_updated INT;
BEGIN
  LOOP
    UPDATE users
    SET normalized_email = LOWER(email)
    WHERE id IN (
      SELECT id FROM users
      WHERE normalized_email IS NULL
      LIMIT batch_size
      FOR UPDATE SKIP LOCKED
    );
    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    RAISE NOTICE 'Updated % rows', rows_updated;
    EXIT WHEN rows_updated = 0;
    COMMIT;
  END LOOP;
END $$;
```

## Prisma (TypeScript/Node.js)

### ワークフロー

```bash
# スキーマ変更からマイグレーションを作成
npx prisma migrate dev --name add_user_avatar

# 本番で保留中のマイグレーションを適用
npx prisma migrate deploy

# DB をリセット（dev のみ）
npx prisma migrate reset

# スキーマ変更後にクライアントを生成
npx prisma generate
```

### スキーマ例

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  avatarUrl String?  @map("avatar_url")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  orders    Order[]

  @@map("users")
  @@index([email])
}
```

### カスタム SQL マイグレーション

Prisma が表現できない操作（並行インデックス、データバックフィル）の場合:

```bash
# 空のマイグレーションを作成、その後 SQL を手動編集
npx prisma migrate dev --create-only --name add_email_index
```

```sql
-- migrations/20240115_add_email_index/migration.sql
-- Prisma は CONCURRENTLY を生成できないので手動で書く
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users (email);
```

## Drizzle (TypeScript/Node.js)

### ワークフロー

```bash
# スキーマ変更からマイグレーションを生成
npx drizzle-kit generate

# マイグレーションを適用
npx drizzle-kit migrate

# スキーマを直接プッシュ（dev のみ、マイグレーションファイルなし）
npx drizzle-kit push
```

### スキーマ例

```typescript
import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

## Kysely (TypeScript/Node.js)

### ワークフロー (kysely-ctl)

```bash
# 設定ファイル (kysely.config.ts) を初期化
kysely init

# 新しいマイグレーションファイルを作成
kysely migrate make add_user_avatar

# 保留中のマイグレーションをすべて適用
kysely migrate latest

# 最後のマイグレーションをロールバック
kysely migrate down

# マイグレーションステータスを表示
kysely migrate list
```

### マイグレーションファイル

```typescript
// migrations/2024_01_15_001_create_user_profile.ts
import { type Kysely, sql } from 'kysely'

// IMPORTANT: Always use Kysely<any>, not your typed DB interface.
// Migrations are frozen in time and must not depend on current schema types.
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('user_profile')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('email', 'varchar(255)', (col) => col.notNull().unique())
    .addColumn('avatar_url', 'text')
    .addColumn('created_at', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull()
    )
    .execute()

  await db.schema
    .createIndex('idx_user_profile_avatar')
    .on('user_profile')
    .column('avatar_url')
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('user_profile').execute()
}
```

### プログラム的なマイグレータ

```typescript
import { Migrator, FileMigrationProvider } from 'kysely'
import { promises as fs } from 'fs'
import * as path from 'path'
// ESM only — CJS can use __dirname directly
import { fileURLToPath } from 'url'
const migrationFolder = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  './migrations',
)

// `db` is your Kysely<any> database instance
const migrator = new Migrator({
  db,
  provider: new FileMigrationProvider({
    fs,
    path,
    migrationFolder,
  }),
  // WARNING: Only enable in development. Disables timestamp-ordering
  // validation, which can cause schema drift between environments.
  // allowUnorderedMigrations: true,
})

const { error, results } = await migrator.migrateToLatest()

results?.forEach((it) => {
  if (it.status === 'Success') {
    console.log(`migration "${it.migrationName}" executed successfully`)
  } else if (it.status === 'Error') {
    console.error(`failed to execute migration "${it.migrationName}"`)
  }
})

if (error) {
  console.error('migration failed', error)
  process.exit(1)
}
```

## Django (Python)

### ワークフロー

```bash
# モデル変更からマイグレーションを生成
python manage.py makemigrations

# マイグレーションを適用
python manage.py migrate

# マイグレーションステータスを表示
python manage.py showmigrations

# カスタム SQL 用に空のマイグレーションを生成
python manage.py makemigrations --empty app_name -n description
```

### データマイグレーション

```python
from django.db import migrations

def backfill_display_names(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    batch_size = 5000
    users = User.objects.filter(display_name="")
    while users.exists():
        batch = list(users[:batch_size])
        for user in batch:
            user.display_name = user.username
        User.objects.bulk_update(batch, ["display_name"], batch_size=batch_size)

def reverse_backfill(apps, schema_editor):
    pass  # データマイグレーション、逆方向不要

class Migration(migrations.Migration):
    dependencies = [("accounts", "0015_add_display_name")]

    operations = [
        migrations.RunPython(backfill_display_names, reverse_backfill),
    ]
```

### SeparateDatabaseAndState

カラムを Django モデルから削除しつつ、すぐに DB からはドロップしない:

```python
class Migration(migrations.Migration):
    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.RemoveField(model_name="user", name="legacy_field"),
            ],
            database_operations=[],  # DB はまだ触らない
        ),
    ]
```

## golang-migrate (Go)

### ワークフロー

```bash
# マイグレーションペアを作成
migrate create -ext sql -dir migrations -seq add_user_avatar

# 保留中のマイグレーションをすべて適用
migrate -path migrations -database "$DATABASE_URL" up

# 最後のマイグレーションをロールバック
migrate -path migrations -database "$DATABASE_URL" down 1

# バージョンを強制（dirty 状態を修正）
migrate -path migrations -database "$DATABASE_URL" force VERSION
```

### マイグレーションファイル

```sql
-- migrations/000003_add_user_avatar.up.sql
ALTER TABLE users ADD COLUMN avatar_url TEXT;
CREATE INDEX CONCURRENTLY idx_users_avatar ON users (avatar_url) WHERE avatar_url IS NOT NULL;

-- migrations/000003_add_user_avatar.down.sql
DROP INDEX IF EXISTS idx_users_avatar;
ALTER TABLE users DROP COLUMN IF EXISTS avatar_url;
```

## ゼロダウンタイムマイグレーション戦略

クリティカルな本番変更には expand-contract パターンに従う:

```
Phase 1: EXPAND
  - 新カラム/テーブルを追加（ヌラブルまたはデフォルト付き）
  - デプロイ: アプリは旧と新の両方に書き込む
  - 既存データをバックフィル

Phase 2: MIGRATE
  - デプロイ: アプリは新から読み、両方に書く
  - データ整合性を検証

Phase 3: CONTRACT
  - デプロイ: アプリは新のみを使う
  - 別マイグレーションで旧カラム/テーブルをドロップ
```

### タイムライン例

```
Day 1: マイグレーションが new_status カラムを追加（ヌラブル）
Day 1: アプリ v2 をデプロイ — status と new_status の両方に書く
Day 2: 既存行のバックフィルマイグレーションを実行
Day 3: アプリ v3 をデプロイ — new_status のみから読む
Day 7: マイグレーションが旧 status カラムをドロップ
```

## アンチパターン

| Anti-Pattern | Why It Fails | Better Approach |
|-------------|-------------|-----------------|
| 本番での手動 SQL | 監査証跡なし、再現不可 | 必ずマイグレーションファイルを使う |
| デプロイ済みマイグレーションの編集 | 環境間でドリフトする | 代わりに新規マイグレーションを作る |
| デフォルトなしの NOT NULL | テーブルをロック、全行をリライト | ヌラブルで追加、バックフィル、その後制約を追加 |
| 大きなテーブルでのインラインインデックス | ビルド中の書き込みをブロック | CREATE INDEX CONCURRENTLY |
| 1 マイグレーションでスキーマ + データ | ロールバック困難、長いトランザクション | マイグレーションを分ける |
| コード削除前のカラムドロップ | 欠落カラムでアプリエラー | 先にコードを削除、次デプロイでカラムをドロップ |
