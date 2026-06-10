## Why

`migrate-tailwind-v4-and-shadcn-tokens` (PR #155) で Tailwind v4 + shadcn 公式トークン構成へ移行したが、`apps/web/src/components/ui/button.tsx` は `add-web-foundation` 時の旧 shadcn テンプレ由来のまま残っている。PR #155 のレビューでも「`text-destructive-foreground` 未定義」問題を最小修正 (`text-white` への置換) で凌いだだけで、shadcn 現行公式 v4 テンプレ (`new-york-v4` registry) との整合は取れていない。次の `add-web-search-ui` で button を実利用する直前に foundation として揃えることで、検索 UI 着手時に追加コンポーネント (input / card / dialog 等) を v4 公式テンプレで一貫導入でき、再修正の二重コストを避けられる。

## What Changes

- `apps/web/src/components/ui/button.tsx` を shadcn 現行公式 v4 (`apps/v4/registry/new-york-v4/ui/button.tsx`) で完全置換
  - base クラス: `outline-none` + `focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50` / `aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40` / `[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4`
  - variant 別追加: destructive の `dark:bg-destructive/60` 系、outline の `shadow-xs` + dark mode 対応、ghost の `dark:hover:bg-accent/50`
  - size variants 拡張: `xs` / `icon-xs` / `icon-sm` / `icon-lg` 追加、`has-[>svg]:` 系のレスポンシブ padding
  - data 属性追加: `data-slot="button"` / `data-variant` / `data-size`
  - `asChild` prop 対応 (radix-ui の `Slot` 使用)
- `apps/web/package.json` の `dependencies` に `radix-ui@1.5.0` を追加 (monorepo パッケージ、shadcn 公式 v4 が採用)
- `components.json` の `style` フィールドの調整が必要かどうかは design.md の Open Questions で扱う（現状 `"default"`、`new-york` への変更要否を検証）

## Capabilities

### New Capabilities

（なし）

### Modified Capabilities

- `web-foundation`: Requirement「UI 基盤 (Tailwind + shadcn/ui)」を MODIFIED で更新し、`apps/web/src/components/ui/button.tsx` が shadcn 現行公式 v4 (`new-york-v4` registry) と整合する旨を Scenario として規定する。具体的なクラス文字列や size variants の列挙までは spec で縛らず、`data-slot="button"` 属性 / `asChild` prop / `radix-ui` 依存といった shadcn v4 普遍的な観測点のみ Scenario 化する方針

## Impact

- **コード**: `apps/web/src/components/ui/button.tsx` を完全置換（手書きではなく `pnpm dlx shadcn@latest add button --overwrite` で再生成）。本 change の時点で button は利用箇所 0 件のため、置換による下流影響なし
- **依存**: `apps/web/package.json` に `radix-ui@1.5.0` を追加。`apps/web/pnpm-lock.yaml` の再生成。`pnpm-workspace.yaml` の `minimumReleaseAge: 4320` ゲートを 1.5.0 (2026-06-06 release、5 日経過) はクリア
- **テスト**: 新規テスト追加なし。`button.tsx` は公式コピー、振る舞いテストは間接的に `add-web-search-ui` の利用側コンポーネントテストでカバーする方針
- **後続 change**: `add-web-search-ui` で input / card 等を `pnpm dlx shadcn@latest add` で追加する際、v4 公式テンプレ前提で一貫導入できる foundation が整う
- **Out of scope**: 新規 shadcn コンポーネント追加 (input / card / dialog) → `add-web-search-ui`、dark mode toggle UI → 別 change、ブランドカラー定義 → 別 change、`pnpm-workspace.yaml` の `radix-ui` catalog 化 → 必要になった時に別 change
