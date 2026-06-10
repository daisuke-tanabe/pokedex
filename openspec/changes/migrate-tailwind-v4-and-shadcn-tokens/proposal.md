## Why

`add-web-foundation` (PR #128) で `apps/web` の Tailwind を 3.4.17 + shadcn 旧テンプレ (`cssVariables: false` / `baseColor: slate`) で着地させたため、`button.tsx` の `bg-primary` 等のクラスが**色トークン未定義で意味を持たない** placeholder 状態になっている。同 change の `design.md` Decision 3 で「Tailwind v4 への移行は別 change」と既に合意済。次の `add-web-search-ui` で button / input / card 等を実利用する前に解消する必要があり、Tailwind 3 用の旧構成 (HSL) を完成させると公式現行 (Tailwind v4 + OKLCH) への二重移行コストが発生するため、本 change で一気に現行公式に揃える。

## What Changes

- **BREAKING**: `apps/web` の Tailwind を 3.4.17 → ^4 へ upgrade する（PostCSS 構成 / globals.css 構文 / config 方式が変わる）
- `@tailwindcss/postcss` ^4 を新規追加し、`postcss.config.mjs` を `@tailwindcss/postcss` 単体構成へ書き換える
- `autoprefixer` / `tailwindcss-animate` を依存から削除する（v4 では autoprefixer 不要、`tailwindcss-animate` は `tw-animate-css` に置換）
- `apps/web/tailwind.config.ts` を完全削除する（v4 は config-less + CSS-based config）
- `components.json` を `cssVariables: true` / `baseColor: neutral` に切り替える
- `tw-animate-css` を依存追加する（shadcn 現行公式テンプレが要求）
- `apps/web/src/app/globals.css` を shadcn 現行公式テンプレに置換する（`@import "tailwindcss"` + `@import "tw-animate-css"` + `@custom-variant dark` + `@theme inline` で `--color-*` を `var(--*)` にマッピング + `:root` / `.dark` の OKLCH 色変数 + `@layer base` の border-border / outline-ring/50 / bg-background / text-foreground）
- 既存 `apps/web/src/components/ui/button.tsx` はコード変更なし（トークン整備の結果として色が出る状態になる）

## Capabilities

### New Capabilities

（なし）

### Modified Capabilities

- `web-foundation`: 「App Router の最小構造」と「UI 基盤 (Tailwind + shadcn/ui)」の Requirement を v4 + 現行 shadcn 公式構成へ整合させる。具体的には globals.css の Tailwind directives Scenario を v4 構文 (`@import "tailwindcss"`) に確定し、tailwind.config.ts 必須の Scenario を削除、`@custom-variant dark` / `@theme inline` / `:root` / `.dark` の OKLCH 変数、`components.json` の `cssVariables: true` / `baseColor: neutral`、`postcss.config.mjs` の `@tailwindcss/postcss` plugin、`tw-animate-css` の依存追加 + import、`autoprefixer` / `tailwindcss-animate` の削除を Scenario で規定する

## Impact

- **コード**: `apps/web/{package.json, postcss.config.mjs, tailwind.config.ts (削除), components.json, src/app/globals.css}` を変更。`button.tsx` は無変更
- **依存**: `tailwindcss` (3→4 major bump、BREAKING)、`@tailwindcss/postcss` 追加、`autoprefixer` 削除、`tailwindcss-animate` 削除、`tw-animate-css` 追加。`pnpm-lock.yaml` 再生成
- **ブラウザ要件**: Tailwind v4 は Safari 16.4+ / Chrome 111+ / Firefox 128+ を要求（v3 より狭まる）。README への明示要否は design.md で判断
- **CI**: Node.js 24.16.0 で実行中（v4 要求の 20+ をクリア、`.tool-versions` 変更不要）
- **Renovate**: PR #139 (`tailwindcss-monorepo v3.4.19`) は本 change マージ後に close する
- **後続 change**: `add-web-search-ui` のブロッカーが解消される
- **Out of scope**: 新規 shadcn コンポーネント (input / card / dialog) は `add-web-search-ui`、dark mode toggle UI は別 change、ブランドカラー定義は別 change
