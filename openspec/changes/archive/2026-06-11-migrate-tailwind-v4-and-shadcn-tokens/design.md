## Context

`apps/web` は `add-web-foundation` (PR #128) で Tailwind 3.4.17 + shadcn 旧テンプレ (`cssVariables: false` / `baseColor: slate` / `tailwindcss-animate`) を採用したが、`globals.css` に CSS 変数を未定義のまま着地させたため `button.tsx` の `bg-primary` 等が無効化された placeholder 状態になっている。同 change の `design.md` Decision 3 で「Tailwind v4 への移行は別 change」と既に合意済みで、現行 shadcn 公式テンプレ (Tailwind v4 + `cssVariables: true` + OKLCH + `tw-animate-css`) との二重移行コストを避けるためにも本 change で一気に揃える必要がある。後続 `add-web-search-ui` のブロッカー解消が直接の動機。

一次ソースを explore で確認済み:

- Tailwind v4 公式 upgrade guide (`tailwindcss.com/docs/upgrade-guide`): `npx @tailwindcss/upgrade` codemod、`@tailwindcss/postcss` 統合、`@import "tailwindcss"` 構文、`@custom-variant dark` 構文、Node.js 20+、Safari 16.4+ / Chrome 111+ / Firefox 128+、`!class → class!` 構文変更
- shadcn theming docs (`ui.shadcn.com/docs/theming`): `:root` / `.dark` の OKLCH 32 変数定義、`@theme inline` での `--color-*: var(--*)` マッピング、`@layer base` の border / outline / bg / text 設定、現行 `baseColor` 選択肢 (Neutral / Stone / Zinc / Mauve / Olive / Mist / Taupe → `slate` は legacy)

## Goals / Non-Goals

**Goals:**

- `apps/web` の Tailwind を v4 にアップグレードし、shadcn 構成を現行公式に揃える
- 既存 `button.tsx` がコード変更なしで色付きで動作する状態にする
- `tw-animate-css` を foundation として導入し、次の change でのコンポーネント追加コストを下げる
- 既存テスト・型・lint・build が全て green を維持する

**Non-Goals:**

- 新規 shadcn コンポーネント追加 (input / card / dialog / dropdown など) → `add-web-search-ui`
- dark mode toggle UI 実装 → 別 change
- カスタムブランドカラー定義 → 別 change
- mobile (`apps/mobile`) や api (`apps/api`) への波及 → スコープ外
- README へのブラウザ要件追記 → Risks で扱うが本 change 内では行わない

## Decisions

### Decision 1: 公式 codemod `npx @tailwindcss/upgrade` を採用

**Why**: Tailwind 公式が "upgrade tool will automate the entire migration process including updating your dependencies, migrating your configuration file to CSS, and handling any changes to your template files" と明記し、new branch での実行を推奨している。手動移行は文法差分 (`!class` → `class!` 等) の漏れリスクが高く、確実性で codemod が勝る。

**Alternatives considered**:

- 手動で `package.json` / `postcss.config.mjs` / `globals.css` を書き換える → 工数・漏れリスク双方で codemod に劣る
- 部分的に手動 + 部分 codemod → 一貫性が出にくい

**Outcome**: codemod を `apps/web` 配下で実行 → 出力 diff をレビュー → 必要な手動補完を行う方針。具体的には codemod は `globals.css` の Tailwind v3 directives を `@import "tailwindcss"` に変換するが、shadcn 現行公式テンプレ（`@import "tw-animate-css"` / `@custom-variant dark` / `@theme inline { ... }` / `:root` / `.dark` の OKLCH トークン / `@layer base`）への置換は手動で行う。

### Decision 2: `apps/web/tailwind.config.ts` を完全削除する

**Why**: v4 は config-less + CSS-based config (`@theme inline`) を標準とし、shadcn 現行テンプレも `tailwind.config.ts` を含まない。`darkMode: ['class']` は CSS の `@custom-variant dark (&:is(.dark *));` で代替、`content` 配列は v4 の auto-detection で不要、`theme.extend` は `@theme inline` で代替、`plugins: [tailwindcss-animate]` は `@import "tw-animate-css";` で代替できるため、`tailwind.config.ts` を残す積極的理由が無い。

**Alternatives considered**:

- 空の `tailwind.config.ts` を残す → v4 では自動検出されず、`@config "./tailwind.config.ts";` の明示ロードも増える。冗長
- `@config` で v3 config を保持しつつ部分的に v4 移行 → 二重定義になりトークン解決が複雑化

**Outcome**: `tailwind.config.ts` を git rm し、`components.json` の `tailwind.config` キーは空文字列 (`""`) にする (shadcn 現行 components.json テンプレに準拠)。

### Decision 3: `components.json` の `baseColor` を `slate` → `neutral` に変更する

**Why**: explore で `ui.shadcn.com/docs/theming` を WebFetch した結果、現行 base color 選択肢は `Neutral / Stone / Zinc / Mauve / Olive / Mist / Taupe` であり `slate` が存在しない。`add-web-foundation` 時の `slate` は legacy。memory `tailwind-v4-shadcn-tokens-followup` でも `neutral` を指定している。Pokedex ドメインで特定ブランドカラーがまだ未決のため、最も中立な `neutral` が初期値として妥当。

**Alternatives considered**:

- `stone` / `zinc` 等の他の neutral 系 → 暖色 / 寒色のニュアンス差はあるが本 change では選択する根拠が薄い。後続 change でブランド色定義する際に置換する余地は残す
- `slate` のまま (legacy) → 公式 docs に無い構成を維持するコスト高、後続で必ず置換することになる

**Outcome**: `baseColor: "neutral"` に固定。ブランドカラー定義は別 change で扱う。

### Decision 4: `tw-animate-css` を導入する（YAGNI ではなく将来再利用性を選ぶ）

**Why**: 現在 `apps/web/src/` で `animate-*` クラスを使うコードは 0 件だが、次の change `add-web-search-ui` で shadcn の `dialog` / `dropdown-menu` / `accordion` 等を追加する見込みが高く、これらは animate を実利用する。memory `prefer-reusable-structure` (「YAGNI より将来の再利用性。インライン化を再利用が無いから、だけで強く推さない」) に従い、shadcn 現行公式テンプレへの整合性を優先する。

**Alternatives considered**:

- 入れずに後の change で必要になったら追加 → globals.css の構成変更とロックファイル更新が再度発生、現行公式 diff から逸れる期間が長くなる
- `tailwindcss-animate` を v4 互換のままアップデートで継続 → 公式テンプレが `tw-animate-css` に置き換わっており、メンテ追従コストが高い

**Outcome**: `package.json` の `dependencies` に `tw-animate-css` を追加し、`globals.css` 先頭で `@import "tw-animate-css";` する。`tailwindcss-animate` は削除する。

### Decision 5: `postcss.config.mjs` を `@tailwindcss/postcss` 単体構成にする

**Why**: Tailwind v4 公式が "imports and vendor prefixing is now handled for you automatically" と明記し、`postcss-import` / `autoprefixer` を不要にしている。`@tailwindcss/postcss` プラグイン 1 個に統合する。

**Outcome**: `postcss.config.mjs` を以下に書き換える。

```js
export default {
  plugins: { '@tailwindcss/postcss': {} },
};
```

`autoprefixer` を `package.json` から削除する。

### Decision 6: ブラウザ要件 (Safari 16.4+ / Chrome 111+ / Firefox 128+) は README に明記しない

**Why**: 本 change はインフラ整備で UI 追加なし、エンドユーザー向けリリースもまだ無い段階。README にブラウザ要件を書くタイミングは初回パブリック公開時 (=検索 UI 着地後) が自然。今書くと UI 未提供のまま要件だけが先行する不自然さがある。

**Outcome**: 本 change では README 変更しない。Tailwind v4 のブラウザ要件は proposal の Impact セクションに記録するに留める。`add-web-search-ui` または公開 change で README に記載する。

## Risks / Trade-offs

- **[Risk] codemod が想定外の差分を出す** → Mitigation: 既に feature branch 上で作業中なので codemod 実行後に `git diff` をレビューし、`globals.css` の手動置換と整合性が取れていることを確認。CI の typecheck / lint / build / test を必ず通す
- **[Risk] `!important` 構文変更 (`!class` → `class!`)** → Mitigation: 現状 `apps/web/src/` に `!` プレフィクス利用は 0 件 (grep 確認済)。codemod 実行後にも再確認
- **[Risk] Safari 16.4 未満のブラウザ非対応化** → Mitigation: 開発段階で公開ユーザーが居ないため実害なし。公開時に README で告知することを `add-web-search-ui` 以降の宿題として残す
- **[Risk] `tw-animate-css` が現状未使用なのに依存追加** → Mitigation: Decision 4 で記載した通り将来再利用性を優先。次の change で必ず利用されるため、デッドコード期間は短い
- **[Risk] `components.json` の `tailwind.config: ""` で shadcn CLI が動かない可能性** → Mitigation: shadcn 現行公式 `components.json` 例 (`/docs/installation/manual` で WebFetch 確認) が `"config": ""` を採用しているため、CLI 側もこの形式に対応していると判断。万が一 `shadcn add` 実行時に問題が出れば設定値を見直す
- **[Risk] Renovate PR #139 (`tailwindcss-monorepo v3.4.19`) の競合** → Mitigation: 本 change マージ後に PR #139 を close する。本 change のブランチではこの PR をマージしない

## Migration Plan

1. feature ブランチ (`feat/migrate-tailwind-v4-and-shadcn-tokens`) で作業 (済)
2. `apps/web` で `npx @tailwindcss/upgrade` を実行し、生成 diff を確認
3. codemod が触らなかった `globals.css` / `components.json` / `tailwind.config.ts` (削除) / `package.json` (依存差し替え) を手動で書き換え
4. `pnpm install` で lockfile を再生成
5. `pnpm --filter @pokedex/web typecheck` / `test` / `build` で動作確認
6. `pnpm --filter @pokedex/web dev` を起動してブラウザで button に色が出ることを確認
7. lint / format:check を全 package で実行
8. `openspec validate migrate-tailwind-v4-and-shadcn-tokens --strict` で artifact 整合性確認
9. セルフレビュー後 PR 作成。マージ後に Renovate PR #139 を close、`openspec archive` を別 PR で実行

Rollback: 本 change が原因で問題発生時は PR を revert する。`apps/web/.next` は再ビルドで再生成されるため副作用なし。

## Open Questions

なし。Decision 1〜6 で必要な技術選択は確定済み。実装時に新たな論点が出たら design.md に追記する。
