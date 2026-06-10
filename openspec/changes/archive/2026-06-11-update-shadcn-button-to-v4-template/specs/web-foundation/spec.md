## MODIFIED Requirements

### Requirement: UI 基盤 (Tailwind + shadcn/ui)

`apps/web` は Tailwind CSS v4 によるユーティリティクラスベースのスタイリングと、shadcn/ui の own code モデルによる UI コンポーネントを提供しなければならない（MUST）。`apps/web/components.json`（shadcn 設定）、`apps/web/src/lib/utils.ts`（`cn()` ヘルパ）、`apps/web/postcss.config.mjs`（PostCSS 設定）が存在しなければならない（MUST）。shadcn が出力する UI コンポーネントは `apps/web/src/components/ui/` 配下に配置されなければならない（MUST）。本 capability の時点で最低 1 つの shadcn コンポーネント（例: `button.tsx`）が `src/components/ui/` 配下に存在しなければならない（MUST）。`components.json` は `cssVariables: true` と `baseColor: "neutral"` を採用しなければならない（MUST）。色トークンは shadcn 現行公式の OKLCH ベース変数を `src/app/globals.css` の `:root` と `.dark` で定義し、`@theme inline` ブロックで Tailwind 側の `--color-*` 名前空間にマッピングしなければならない（MUST）。dark variant は CSS の `@custom-variant dark (&:is(.dark *));` で定義しなければならない（MUST）。アニメーション基盤として `tw-animate-css` パッケージを `dependencies` に含め、`globals.css` で `@import "tw-animate-css";` しなければならない（MUST）。PostCSS パイプラインは `@tailwindcss/postcss` プラグイン単体で構成しなければならず（MUST）、`autoprefixer` および `tailwindcss-animate` は `apps/web/package.json` の `dependencies` / `devDependencies` から削除されなければならない（MUST NOT 含む）。`apps/web/tailwind.config.ts` は存在してはならない（MUST NOT、v4 の config-less + CSS-based config 方針に従う）。`src/components/ui/` 配下に存在する shadcn コンポーネントは shadcn 現行公式 v4 (`new-york-v4` registry) で生成されたものでなければならず（MUST）、`asChild` prop を介した polymorphic な要素差し替えと `data-slot` 属性ベースの styling フックを提供しなければならない（MUST）。これらの polymorphic / Slot 機能を実現するため、`apps/web/package.json` の `dependencies` に `radix-ui` (monorepo パッケージ) が含まれなければならない（MUST）。

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

#### Scenario [unit]: button.tsx に data-slot="button" 属性が含まれる

- **WHEN** `apps/web/src/components/ui/button.tsx` を読む
- **THEN** レンダリングされる要素に `data-slot="button"` 相当の属性付与が含まれている（shadcn v4 `new-york-v4` registry の規約）

#### Scenario [unit]: button.tsx が asChild prop を提供する

- **WHEN** `apps/web/src/components/ui/button.tsx` を読む
- **THEN** Button コンポーネントの props 型に `asChild?: boolean` 相当が含まれ、`asChild` が真のときに `radix-ui` の `Slot` を介して子要素に props と styling を委譲する実装が存在する

#### Scenario [unit]: radix-ui が依存に含まれる

- **WHEN** `apps/web/package.json` の `dependencies` を読む
- **THEN** `radix-ui` が含まれている（個別 `@radix-ui/*` パッケージではなく monorepo 統合パッケージ、shadcn v4 公式 import 文 `import { Slot } from "radix-ui"` への整合）
