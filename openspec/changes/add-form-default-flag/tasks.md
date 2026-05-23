## 1. forms スキーマ拡張

- [x] 1.1 [Test] `apps/api/src/db/schema/forms.test.ts` に「`forms.isDefault` 列が `notNull=true` かつ `default=false` で定義されている」smoke テストを追加する（赤）
- [x] 1.2 [Test] 同テストに「`forms.isDefault` が boolean 型である」型推論テストを追加する（赤）
- [x] 1.3 [Impl] `apps/api/src/db/schema/forms.ts` の `forms` テーブル定義に `isDefault: boolean('is_default').notNull().default(false)` 列を追加する
- [x] 1.4 [Impl] 同ファイルで部分 UNIQUE インデックスを `uniqueIndex('forms_species_id_default_unique').on(table.speciesId).where(sql\`is_default = true\`)` で定義する
- [x] 1.5 [Impl] `Form` / `NewForm` 型 export が `is_default` を含むことを確認する（`$inferSelect` / `$inferInsert` で自動派生）
- [x] 1.6 [Refactor] 列順序・JSDoc を整える（`is_default` の意味と「`category='normal'` と独立」の意図をコメント化）

## 2. シード用 valibot スキーマ拡張

- [x] 2.1 [Test] `apps/api/src/db/seed/schemas/index.ts` の `formRowSchema` に `isDefault: v.boolean()` 必須フィールドを追加した状態で、既存テスト (load-forms 系) が `isDefault` 欠落 JSON で v.parse 失敗することを確認する想定（赤）
- [x] 2.2 [Impl] `formRowSchema` に `isDefault: v.boolean()` を必須フィールドとして追加する
- [x] 2.3 [Impl] `FormSeed` 型に `isDefault` が含まれていることを `v.InferOutput` で自動派生する（型エクスポート確認）
- [x] 2.4 [Refactor] スキーマ命名・JSDoc を整える

## 3. シード JSON の全面更新

- [x] 3.1 [Impl] `apps/api/src/db/seed/data/forms.json` の全 27 エントリで `slug` を design.md の対応表に従って短縮形に書き換える
- [x] 3.2 [Impl] 各 species の通常フォーム (calculated by design Decision 4) に `"isDefault": true` を追加する
- [x] 3.3 [Impl] 非通常フォームに `"isDefault": false` を明示的に追加する（valibot で必須化されているため省略不可）
- [x] 3.4 [Impl] `apps/api/src/db/seed/data/pokedexes.json` の `entries[].formSlug` 参照を短縮形に追随する（`ogerpon-teal` → `teal`）
- [x] 3.5 [Test] `pnpm --filter @pokedex/api db:reset` を実行し、migration → seed → invariants まで exit 0 で完走することを実機検証する（緑想定）

## 4. seed.ts の seedForms 拡張

- [x] 4.1 [Test] seed 後の `forms` テーブルで `(speciesSlug='charizard', slug='charizard')` の行が `is_default = true` であることを確認するテストを `seed.test.ts` 系か invariants でカバーする
- [x] 4.2 [Impl] `apps/api/src/db/seed/seed.ts` の `seedForms` 関数で `forms` への insert 値に `isDefault: row.isDefault` を含める
- [x] 4.3 [Refactor] required() ヘルパーの呼び出しスタイルを既存と統一する

## 5. Invariant Test: 全 species に default 1 件

- [x] 5.1 [Test] `apps/api/src/db/seed/invariants.test.ts` に「全 species に default form が exactly 1 件存在する」シナリオを追加する（赤）
- [x] 5.2 [Impl] `apps/api/src/db/seed/invariants.ts` に `checkAllSpeciesHaveDefaultForm` 関数を追加し、`species LEFT JOIN forms ON forms.species_id = species.id AND forms.is_default = true` で `forms.id IS NULL` の行を集計、違反時に件数を含むエラーメッセージを返す
- [x] 5.3 [Impl] `collectInvariantViolations` の `Promise.all` に追加する
- [x] 5.4 [Refactor] エラーメッセージのフォーマットを既存 invariants と統一する

## 6. マイグレーション SQL の生成と検証

- [x] 6.1 [Impl] `cd apps/api && DATABASE_URL='...' npx drizzle-kit generate --name add_form_default_flag` を実行する
- [x] 6.2 [Impl] 生成された `supabase/migrations/0001_add_form_default_flag.sql` を目視レビューする
  - 想定: `ALTER TABLE "forms" ADD COLUMN "is_default" boolean DEFAULT false NOT NULL` と `CREATE UNIQUE INDEX ... ON "forms" ("species_id") WHERE "is_default" = true` の 2 文が含まれる
  - 既存の `0000_add_domain_schema.sql` には変更が入らないことを確認する
- [x] 6.3 [Test] `apps/api/src/db/__tests__/migrations.test.ts` に「生成 SQL に `is_default` 列と部分 UNIQUE インデックスが含まれる」シナリオを追加する
- [x] 6.4 [Test] 同テストの `readGeneratedSql()` が既に全 SQL ファイル結合検査になっているため、本 change で追加した制約が連結後の文字列に含まれることが自動的に担保される（Round 6 対応の効果）

## 7. 動作確認とドキュメント

- [x] 7.1 `pnpm --filter @pokedex/api typecheck` でゼロエラー
- [x] 7.2 `pnpm --filter @pokedex/api lint` でゼロ違反
- [x] 7.3 `pnpm --filter @pokedex/api format:check` でフォーマット差分なし
- [x] 7.4 `DATABASE_URL='...' pnpm --filter @pokedex/api test` で全テスト緑（既存 + 本 change で追加した新規テスト）
- [x] 7.5 `pnpm --filter @pokedex/api db:reset` を実行し、migration → seed → invariants が一連で exit 0 で完走する
- [x] 7.6 `openspec validate add-form-default-flag` で valid
- [x] 7.7 セルフレビュー: `typescript-reviewer` Agent を起動し、Critical / Major 指摘があれば修正する
- [x] 7.8 セルフレビュー: 設計判断 (`is_default` 列、部分 UNIQUE、slug 短縮形) が design.md と齟齬なく実装されているか確認する
- [x] 7.9 README または `docs/setup.md` に新言語追加手順と並んで「新フォーム追加時は `isDefault` を 1 件のみ true にする」運用注意を追記する（必要であれば）
