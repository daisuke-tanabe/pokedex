## MODIFIED Requirements

### Requirement: App Router の最小構造

`apps/web` は Next.js 16 の App Router を採用し、`apps/web/src/app/` 配下に App Router の root を持たなければならない（MUST）。`src/app/layout.tsx`（root layout）、`src/app/page.tsx`（top page）、`src/app/globals.css`（Tailwind v4 のエントリーポイントを含む）の 3 ファイルを持たなければならない（MUST）。`layout.tsx` と `page.tsx` は React Server Component として実装され、`"use client"` ディレクティブを持ってはならない（MUST NOT）。

#### Scenario [unit]: src/app/layout.tsx が存在する

- **WHEN** `apps/web/src/app/layout.tsx` をファイルシステムで確認する
- **THEN** ファイルが存在し、`html` / `body` 要素を返す React コンポーネントを default export している

#### Scenario [unit]: src/app/page.tsx が存在する

- **WHEN** `apps/web/src/app/page.tsx` をファイルシステムで確認する
- **THEN** ファイルが存在し、React コンポーネントを default export している

#### Scenario [unit]: layout.tsx と page.tsx が Server Component である

- **WHEN** `apps/web/src/app/layout.tsx` と `apps/web/src/app/page.tsx` のファイル先頭を読む
- **THEN** いずれも `"use client"` ディレクティブで始まっていない（Server Component として扱われる）

#### Scenario [unit]: globals.css が Tailwind v4 のエントリーを含む

- **WHEN** `apps/web/src/app/globals.css` を読む
- **THEN** `@import "tailwindcss";` 相当の行が含まれる（Tailwind v4 の標準エントリー構文、quote 種別はリポジトリのフォーマッタ規約に従う）

### Requirement: UI 基盤 (Tailwind + shadcn/ui)

`apps/web` は Tailwind CSS v4 によるユーティリティクラスベースのスタイリングと、shadcn/ui の own code モデルによる UI コンポーネントを提供しなければならない（MUST）。`apps/web/components.json`（shadcn 設定）、`apps/web/src/lib/utils.ts`（`cn()` ヘルパ）、`apps/web/postcss.config.mjs`（PostCSS 設定）が存在しなければならない（MUST）。shadcn が出力する UI コンポーネントは `apps/web/src/components/ui/` 配下に配置されなければならない（MUST）。本 capability の時点で最低 1 つの shadcn コンポーネント（例: `button.tsx`）が `src/components/ui/` 配下に存在しなければならない（MUST）。`components.json` は `cssVariables: true` と `baseColor: "neutral"` を採用しなければならない（MUST）。色トークンは shadcn 現行公式の OKLCH ベース変数を `src/app/globals.css` の `:root` と `.dark` で定義し、`@theme inline` ブロックで Tailwind 側の `--color-*` 名前空間にマッピングしなければならない（MUST）。dark variant は CSS の `@custom-variant dark (&:is(.dark *));` で定義しなければならない（MUST）。アニメーション基盤として `tw-animate-css` パッケージを `dependencies` に含め、`globals.css` で `@import "tw-animate-css";` しなければならない（MUST）。PostCSS パイプラインは `@tailwindcss/postcss` プラグイン単体で構成しなければならず（MUST）、`autoprefixer` および `tailwindcss-animate` は `apps/web/package.json` の `dependencies` / `devDependencies` から削除されなければならない（MUST NOT 含む）。`apps/web/tailwind.config.ts` は存在してはならない（MUST NOT、v4 の config-less + CSS-based config 方針に従う）。

#### Scenario [unit]: components.json が存在する

- **WHEN** `apps/web/components.json` を読む
- **THEN** JSON として valid であり、`tailwind` / `aliases` などの shadcn 設定キーを持つ

#### Scenario [unit]: components.json の cssVariables が true である

- **WHEN** `apps/web/components.json` を読む
- **THEN** `tailwind.cssVariables` の値が `true` である

#### Scenario [unit]: components.json の baseColor が neutral である

- **WHEN** `apps/web/components.json` を読む
- **THEN** `tailwind.baseColor` の値が `"neutral"` である

#### Scenario [unit]: tailwind.config.ts が存在しない

- **WHEN** `apps/web/tailwind.config.ts` および `apps/web/tailwind.config.js` をファイルシステムで確認する
- **THEN** いずれのファイルも存在しない

#### Scenario [unit]: cn() ヘルパが lib/utils.ts から export される

- **WHEN** `apps/web/src/lib/utils.ts` を読む
- **THEN** `cn` という名前で関数が export されている（`clsx` + `tailwind-merge` を組み合わせた shadcn 規約の実装）

#### Scenario [unit]: src/components/ui/ に最低 1 つの shadcn コンポーネントが存在する

- **WHEN** `apps/web/src/components/ui/` ディレクトリを列挙する
- **THEN** 最低 1 つ以上の `.tsx` ファイルが存在する（例: `button.tsx`）

#### Scenario [unit]: globals.css に @custom-variant dark が含まれる

- **WHEN** `apps/web/src/app/globals.css` を読む
- **THEN** `@custom-variant dark (&:is(.dark *));` という行が含まれる

#### Scenario [unit]: globals.css に @theme inline ブロックが含まれる

- **WHEN** `apps/web/src/app/globals.css` を読む
- **THEN** `@theme inline {` で始まるブロックが存在し、その中に `--color-background: var(--background);` および `--color-primary: var(--primary);` のような Tailwind 名前空間へのマッピングが含まれる

#### Scenario [unit]: globals.css の :root に OKLCH 色変数が含まれる

- **WHEN** `apps/web/src/app/globals.css` を読む
- **THEN** `:root {` ブロックが存在し、その中に `--background:` / `--foreground:` / `--primary:` の 3 変数が最低限定義され、いずれも `oklch(` で始まる値を持つ

#### Scenario [unit]: globals.css の .dark に OKLCH 色変数が含まれる

- **WHEN** `apps/web/src/app/globals.css` を読む
- **THEN** `.dark {` ブロックが存在し、その中に `--background:` / `--foreground:` / `--primary:` の 3 変数が最低限定義され、いずれも `oklch(` で始まる値を持つ

#### Scenario [unit]: postcss.config.mjs に @tailwindcss/postcss プラグインが設定されている

- **WHEN** `apps/web/postcss.config.mjs` を読む
- **THEN** `plugins` セクションに `'@tailwindcss/postcss'` という文字列キーが含まれる

#### Scenario [unit]: tw-animate-css が依存に含まれ globals.css で import される

- **WHEN** `apps/web/package.json` の `dependencies` および `apps/web/src/app/globals.css` を読む
- **THEN** `dependencies` に `tw-animate-css` が含まれ、`globals.css` に `@import "tw-animate-css";` 相当の行が含まれる（quote 種別はリポジトリのフォーマッタ規約に従う）

#### Scenario [unit]: tailwindcss-animate が依存から削除されている

- **WHEN** `apps/web/package.json` の `dependencies` および `devDependencies` を読む
- **THEN** いずれにも `tailwindcss-animate` が含まれない

#### Scenario [unit]: autoprefixer が依存から削除されている

- **WHEN** `apps/web/package.json` の `dependencies` および `devDependencies` を読む
- **THEN** いずれにも `autoprefixer` が含まれない
