## 1. 事前準備とベースライン

- [x] 1.1 `pnpm --filter @pokedex/web test` / `typecheck` / `build` (API_URL=http://localhost:3000 付き) がすべて green であることをベースラインとして確認する（test 8/8 / typecheck green / build green）
- [x] 1.2 `grep -rn "components/ui/button" apps/web/src/` で button.tsx の利用箇所が 0 件であることを確認する（0 件）
- [x] 1.3 現状の `apps/web/components.json` の `style` フィールドを確認する（`"default"`、Open Question Q1 の準備）

## 2. shadcn CLI で button.tsx を置換

各タスクは design.md Decision 1 (CLI 採用) に対応する。

- [x] 2.1 `apps/web` で `pnpm dlx shadcn@latest add button --overwrite` を実行する（初回は `style: "default"` で旧テンプレが取れた）
- [x] 2.2 CLI 実行後の差分を `git diff -- apps/web/` で確認する。期待: `button.tsx` 全文置換、`package.json` に `radix-ui` 追加、`pnpm-lock.yaml` 更新
- [x] 2.3 想定外の差分を `git restore` で除外する（`tailwind-merge` の 2.6.1→3.6.0 major bump と不要な `@radix-ui/react-slot` を手動で元に戻した）
- [x] 2.4 `style: "default"` のままで `new-york-v4` の button が取れるか確認する → **取れなかった**ため `components.json` の `style` を `"new-york"` に変更し、`pnpm dlx shadcn@latest add button --overwrite` を再実行。結果として `radix-ui` import / `data-slot` / `asChild` / size variants 拡張をすべて含む公式 v4 が生成された

## 3. 依存とロックファイルの整理

各タスクは design.md Decision 2-3 に対応する。

- [x] 3.1 `apps/web/package.json` の `dependencies` に `radix-ui` が追加されていることを確認する（`"radix-ui": "1.5.0"`）
- [x] 3.2 `radix-ui` のバージョンが exact-version 規約に従っていることを確認し、`^1.5.0` から `1.5.0` に修正
- [x] 3.3 `pnpm install` を実行し、`pnpm-lock.yaml` を再生成する。`minimumReleaseAge: 4320` ゲートで弾かれる依存が無いことを確認する
- [x] 3.4 [Verify] [Scenario [unit]: radix-ui が依存に含まれる] `jq '.dependencies."radix-ui"' apps/web/package.json` が `"1.5.0"` を返すことを確認

## 4. button.tsx の置換結果検証

各タスクは web-foundation の Requirement「UI 基盤」の追加 Scenario に対応する。

- [x] 4.1 [Verify] [Scenario [unit]: button.tsx に data-slot="button" 属性が含まれる] `grep -cE 'data-slot=.button.' apps/web/src/components/ui/button.tsx` が 1 を返すことを確認
- [x] 4.2 [Verify] [Scenario [unit]: button.tsx が asChild prop を提供する] `grep -cE 'asChild' apps/web/src/components/ui/button.tsx` が 3 を返すことを確認（props 型 / デフォルト引数 / 条件分岐）
- [x] 4.3 [Verify] `grep -E "from .radix-ui." apps/web/src/components/ui/button.tsx` で `import { Slot } from "radix-ui"` の行を確認

## 5. 型・lint・format・test・build の通過

- [x] 5.1 `pnpm --filter @pokedex/web typecheck` を実行し、エラーが無いことを確認（`asChild` prop と `radix-ui` Slot の型推論が成立）
- [x] 5.2 `pnpm --filter @pokedex/web lint` を実行し、エラーが無いことを確認
- [x] 5.3 `pnpm --filter @pokedex/web format:check` を実行し、フォーマット崩れが無いことを確認（`pnpm format` で oxfmt が CLI 生成の double quote 等を正規化）
- [x] 5.4 `pnpm --filter @pokedex/web test` を実行し、既存テスト (8/8) が pass することを確認
- [x] 5.5 `API_URL=http://localhost:3000 pnpm --filter @pokedex/web build` を実行し、`apps/web/.next/` が生成されることを確認

## 6. ブラウザでの動作確認

各タスクは design.md Migration Plan の手動確認ステップに対応する。

- [x] 6.1 `pnpm --filter @pokedex/web dev` で開発サーバを起動する（既存 dev サーバ PID 13857 を再利用）
- [x] 6.2 `apps/web/src/app/page.tsx` に各 variant (default / destructive / outline / secondary / ghost / link) と新 size variants (xs / sm / default / lg / icon / icon-xs / icon-sm / icon-lg) の Button、および `<Button asChild><a href="#asChild-target">As Anchor</a></Button>` を一時配置
- [x] 6.3 Playwright で `http://localhost:3001/` の full-page スクショを取得し、6 variant / 8 size すべてが公式テンプレ通りに描画されることを確認
- [x] 6.4 `browser_evaluate` で `<Button asChild>` の DOM を直接検証: `tagName: "A"` / `href: "#asChild-target"` / `data-slot: "button"` / `data-variant: "default"` / classes に button のスタイル群が伝播していることを確認
- [x] 6.5 一時配置した Button を削除し、`page.tsx` を元の状態に戻す

## 7. openspec validate と最終 GREEN

- [x] 7.1 `openspec validate update-shadcn-button-to-v4-template --strict` を実行し pass することを確認
- [x] 7.2 `pnpm -r typecheck` / `pnpm -r lint` / `pnpm -r format:check` をルートで実行し、全 package で green を確認
- [x] 7.3 `pnpm -r test` をルートで実行し、`apps/api` / `apps/web` / `packages/contracts` すべてのテストが緑であることを確認（apps/web 8/8 / apps/api 全 pass / contracts 全 pass）

## 8. セルフレビュー

- [x] 8.1 button.tsx は shadcn CLI 生成物 + components.json は 1 単語の `style` 変更のみ + package.json の依存差し替えは規約に従った手動修正。CLAUDE.md の「機械的な小修正はレビュー対象外」ルールに従い、reviewer agent 起動は省略。実質的な手書きコードは page.tsx の一時配置 (検証後に削除) のみで残存しない

## 9. リファクタ (任意)

- [x] 9.1 実装中に発見した重複や命名の改善は無し（CLI 生成ファイル / 設定ファイル / 依存差し替えのみで、リファクタ対象の手書きコードが存在しない）
