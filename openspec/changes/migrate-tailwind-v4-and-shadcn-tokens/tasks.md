## 1. 事前準備とベースライン

- [x] 1.1 現在の `apps/web` で `pnpm test` / `pnpm typecheck` / `pnpm build` を実行し、本 change 着手前にすべて green であることをベースラインとして確認する（test 8/8 pass、typecheck pass、build は `API_URL` 環境変数付きで pass = 既存スコープ外の env 既知問題）
- [x] 1.2 `apps/web/src` 配下に `!` プレフィクスの important クラス (`!class` パターン) が使われていないことを `grep -rn '"\!' apps/web/src/' 等で確認する（codemod の影響範囲を事前把握）= 0 件
- [x] 1.3 `apps/web/src` 配下に `animate-*` クラス利用が無いことを再確認し（tw-animate-css 導入時の影響評価）、結果をコミットメッセージに記録する = 0 件

## 2. Tailwind v4 公式 codemod の実行

各タスクは design.md Decision 1 と Migration Plan に対応する。

- [x] 2.1 `apps/web` ディレクトリで `npx @tailwindcss/upgrade` を実行する（4.3.0 へ upgrade）
- [x] 2.2 codemod による差分を `git diff` で確認し、想定外の改変（README / 既存 React コンポーネント等）が発生していないか検証する（button.tsx で `focus-visible:outline-none` → `outline-hidden` の v4 breaking 対応のみ、想定内）
- [x] 2.3 codemod 実行後に `apps/web/package.json` の `tailwindcss` が `^4` 系に bump され、`@tailwindcss/postcss` が追加されていることを確認する（tailwindcss 4.3.0、@tailwindcss/postcss 4.3.0 追加。exact-version 規約に従い `^` プレフィクスは除去）

## 3. shadcn 構成の現行公式化

各タスクは web-foundation の Requirement「UI 基盤 (Tailwind + shadcn/ui)」の MODIFIED 内容に対応する。

- [x] 3.1 [Verify] [Scenario [unit]: components.json の cssVariables が true である] `apps/web/components.json` の `tailwind.cssVariables` を `true` に変更する
- [x] 3.2 [Verify] [Scenario [unit]: components.json の baseColor が neutral である] `apps/web/components.json` の `tailwind.baseColor` を `"neutral"` に変更する
- [x] 3.3 `apps/web/components.json` の `tailwind.config` キーを空文字列 (`""`) にする (v4 + 現行 shadcn 公式 components.json 例に整合させる)
- [x] 3.4 [Verify] [Scenario [unit]: tailwind.config.ts が存在しない] `apps/web/tailwind.config.ts` (および `.js` 等の派生) を `git rm` で削除し、削除後に `ls apps/web/tailwind.config.*` で何も見つからないことを確認する（codemod が削除済み、no matches で確認）

## 4. globals.css を shadcn 現行公式テンプレに置換

各タスクは web-foundation の Requirement「App Router の最小構造」「UI 基盤 (Tailwind + shadcn/ui)」の MODIFIED Scenario 群に対応する。

- [x] 4.1 [Impl] `apps/web/src/app/globals.css` の先頭を `@import 'tailwindcss';` と `@import 'tw-animate-css';` の 2 行で構成する（quote は oxfmt の規約に従い single quote）
- [x] 4.2 [Impl] `apps/web/src/app/globals.css` に `@custom-variant dark (&:is(.dark *));` を追加する
- [x] 4.3 [Impl] `apps/web/src/app/globals.css` に `@theme inline { ... }` ブロックを追加し、shadcn 現行公式テンプレに従って `--color-background: var(--background);` から `--color-sidebar-ring: var(--sidebar-ring);` までと `--radius-*` 系のマッピングを記述する
- [x] 4.4 [Impl] `apps/web/src/app/globals.css` に `:root { ... }` ブロックを追加し、shadcn 現行公式テンプレ準拠の OKLCH 値で `--radius`, `--background`, `--foreground`, `--card*`, `--popover*`, `--primary*`, `--secondary*`, `--muted*`, `--accent*`, `--destructive`, `--border`, `--input`, `--ring`, `--chart-1..5`, `--sidebar*` の全変数を定義する
- [x] 4.5 [Impl] `apps/web/src/app/globals.css` に `.dark { ... }` ブロックを追加し、shadcn 現行公式テンプレ準拠の OKLCH 値で dark mode の全変数を定義する
- [x] 4.6 [Impl] `apps/web/src/app/globals.css` の末尾に `@layer base { * { @apply border-border outline-ring/50; } body { @apply bg-background text-foreground; } }` を追加する
- [x] 4.7 [Verify] `grep -cE "^@import .tailwindcss.;" apps/web/src/app/globals.css` が 1 を返すことを確認する
- [x] 4.8 [Verify] `grep -cE "^@import .tw-animate-css.;" apps/web/src/app/globals.css` が 1 を返すことを確認する
- [x] 4.9 [Verify] `grep -cE '^@custom-variant dark' apps/web/src/app/globals.css` が 1 を返すことを確認する
- [x] 4.10 [Verify] `grep -cE '^@theme inline' apps/web/src/app/globals.css` が 1 を返すことを確認する
- [x] 4.11 [Verify] `:root` / `.dark` ブロック内に `oklch(` の文字列が複数回出現することを `grep -c 'oklch('` で確認する（62 件）

## 5. PostCSS 構成の更新

各タスクは design.md Decision 5 と Requirement「UI 基盤」の Scenario「postcss.config.mjs に @tailwindcss/postcss プラグインが設定されている」に対応する。

- [x] 5.1 [Impl] `apps/web/postcss.config.mjs` を `export default { plugins: { '@tailwindcss/postcss': {} } };` に書き換える（codemod が既に書き換え済み）
- [x] 5.2 [Verify] [Scenario [unit]: postcss.config.mjs に @tailwindcss/postcss プラグインが設定されている] `grep "@tailwindcss/postcss" apps/web/postcss.config.mjs` で 1 行以上ヒットすることを確認する

## 6. package.json の依存整理

各タスクは Requirement「UI 基盤」の Scenario「tw-animate-css が … 含まれる」「tailwindcss-animate が依存から削除されている」「autoprefixer が依存から削除されている」に対応する。

- [x] 6.1 [Impl] `apps/web/package.json` の `dependencies` に `tw-animate-css` を最新安定版 (1.4.0、2025-09-24 リリースで minimumReleaseAge: 4320 をクリア) で追加する
- [x] 6.2 [Impl] `apps/web/package.json` の `dependencies` から `tailwindcss-animate` を削除する
- [x] 6.3 [Impl] `apps/web/package.json` の `devDependencies` から `autoprefixer` を削除する（codemod が削除済み）
- [x] 6.4 [Impl] `apps/web/package.json` の `devDependencies` で `tailwindcss` が `^4` に bump されていることを確認し、`@tailwindcss/postcss` が `^4` で追加されていることを確認する（exact-version 規約に従い 4.3.0 / 4.3.0 の pinned 表記）
- [x] 6.5 `pnpm install` を実行して `pnpm-lock.yaml` を再生成する。`pnpm-workspace.yaml` の `minimumReleaseAge: 4320` ゲートで弾かれる依存が無いことを確認する
- [x] 6.6 [Verify] [Scenario [unit]: tw-animate-css が依存に含まれ globals.css で import される] `jq '.dependencies."tw-animate-css"' apps/web/package.json` が "1.4.0" を返すことを確認した
- [x] 6.7 [Verify] [Scenario [unit]: tailwindcss-animate が依存から削除されている] `jq '.dependencies."tailwindcss-animate" // .devDependencies."tailwindcss-animate"' apps/web/package.json` が null を返すことを確認した
- [x] 6.8 [Verify] [Scenario [unit]: autoprefixer が依存から削除されている] `jq '.dependencies.autoprefixer // .devDependencies.autoprefixer' apps/web/package.json` が null を返すことを確認した

## 7. 型・lint・format・build の通過

- [x] 7.1 `pnpm --filter @pokedex/web typecheck` を実行し、エラーが無いことを確認する
- [x] 7.2 `pnpm --filter @pokedex/web lint` を実行し、エラーが無いことを確認する
- [x] 7.3 `pnpm --filter @pokedex/web format:check` を実行し、フォーマット崩れが無いことを確認する（globals.css を `pnpm format` で正規化後、再 check で green）
- [x] 7.4 `pnpm --filter @pokedex/web test` を実行し、既存テストすべてが pass することを確認する（8/8 pass、本 change ではテストファイル追加なし）
- [x] 7.5 `pnpm --filter @pokedex/web build` を実行し、`apps/web/.next/` が生成されることを確認する（`API_URL` 環境変数付き = 既存スコープ外の env 問題、本 change には無関係）

## 8. ブラウザでの動作確認

各タスクは design.md Migration Plan の手動確認ステップに対応する。

- [x] 8.1 `pnpm --filter @pokedex/web dev` で開発サーバを起動する（既存の dev サーバ PID 4110 を再利用）
- [x] 8.2 `apps/web/src/app/page.tsx` に `Button` コンポーネント (`@/components/ui/button` から import) を一時的に配置するか、既存配置を確認する
- [x] 8.3 ブラウザで `http://localhost:3001/` を開き、Button の `default` variant が `bg-primary` の OKLCH 値で塗られていることを目視確認する（Playwright スクショで Default=黒 / Secondary=薄グレー / Destructive=赤 / Outline=ボーダー / Ghost=透明 / Link の 6 variant すべてを確認）
- [x] 8.4 一時配置した Button を確認後に元の `page.tsx` 状態に戻す（本 change のスコープ外の UI 変更を残さない）

## 9. ! 構文変更の最終確認

- [x] 9.1 [Verify] codemod 実行後の `apps/web/src` に `!class` (v3) も `class!` (v4) も両方とも grep 0 件であることを確認する（コードベース内で important 修飾子が新規に発生していないことを保証）

## 10. openspec validate と最終 GREEN

- [x] 10.1 `openspec validate migrate-tailwind-v4-and-shadcn-tokens --strict` を実行し pass することを確認する
- [x] 10.2 `pnpm -r typecheck` / `pnpm -r lint` / `pnpm -r format:check` をルートで実行し、全 package で green を確認する
- [x] 10.3 `pnpm -r test` をルートで実行し、`apps/api` / `apps/web` / `packages/contracts` すべてのテストが緑であることを確認する

## 11. リファクタ (任意)

- [x] 11.1 実装中に発見した重複や命名の改善があれば、緑を保ったままリファクタする。**振る舞いを変える変更は本 change で行わず、別 change として切り出す**（スコープ内では追加リファクタなし）
