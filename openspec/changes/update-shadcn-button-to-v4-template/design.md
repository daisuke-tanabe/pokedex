## Context

`apps/web/src/components/ui/button.tsx` は `add-web-foundation` (PR #128) で `pnpm dlx shadcn@latest add button` により生成された旧テンプレ由来。`migrate-tailwind-v4-and-shadcn-tokens` (PR #155) で Tailwind v4 + shadcn 公式トークン構成へ移行したが、button.tsx は最小修正 (`text-destructive-foreground` → `text-white`) のみで、shadcn 現行公式 v4 テンプレ (`new-york-v4` registry の button.tsx) との間に大きな差分が残っている。

explore で確認した一次ソース:

- shadcn 公式 v4 button.tsx (`https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/button.tsx`): `import { Slot } from "radix-ui"` を採用、base クラスで `outline-none` + `aria-invalid:*` + SVG ハンドリング、size variants が拡張、`data-slot` / `data-variant` / `data-size` 属性追加、`asChild` prop 対応
- `radix-ui` monorepo パッケージ (npm `radix-ui` 1.5.0, 2026-06-06 release): `@radix-ui/*` 個別パッケージを束ねた新しい配布形式。`Slot` は `import { Slot } from "radix-ui"` で取得可能

本 change の動機は **次の `add-web-search-ui` で input / card / dialog 等を `shadcn add` で導入する際に、button だけ旧テンプレ由来というズレを残さない**ことにある。レビューでも PR #155 のスコープ外として記録済 (memory `shadcn-button-modernize-followup`)。

## Goals / Non-Goals

**Goals:**

- `apps/web/src/components/ui/button.tsx` を shadcn 現行公式 v4 テンプレ (`new-york-v4`) と完全一致させる
- `radix-ui` (monorepo) を `apps/web` の依存に追加し、`asChild` prop を実装の選択肢として提供する
- 既存テスト・型・lint・format・build を全て green に維持する
- 後続 `add-web-search-ui` で `shadcn add input` 等を実行した時、生成されるコンポーネントと button.tsx の整合性が取れている状態を作る

**Non-Goals:**

- input / card / dialog / dropdown-menu 等の追加 shadcn コンポーネント導入 → `add-web-search-ui`
- dark mode toggle UI 実装 → 別 change
- ブランドカラー定義 (ポケモンタイプ別カラー等) → 別 change
- `pnpm-workspace.yaml` の `radix-ui` catalog 化 → 必要になった時に別 change
- button.tsx のクラス文字列 / API を spec の Requirement で規定すること → 実装詳細として spec レベルでは扱わない方針 (proposal で記載)

## Decisions

### Decision 1: 置換戦略は `pnpm dlx shadcn@latest add button --overwrite` (CLI 経由)

**Why**: shadcn CLI は `components.json` の `style` / `baseColor` / `cssVariables` / `aliases` 等の設定を参照して、プロジェクトに整合した button.tsx を生成する。`--overwrite` で既存ファイルを上書きし、`radix-ui` の `dependencies` 追加も CLI が自動で行うため、依存追加漏れリスクが極小化する。手動で raw URL からコピペするよりも、CLI の挙動に追従する方が再現性・公式整合性ともに高い。

**Alternatives considered**:

- A) 手動で button.tsx を `https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/button.tsx` から取得して全文置換
  - メリット: CLI に依存しない、git diff が一致確認しやすい
  - デメリット: 依存追加 (`radix-ui`) を手動で行う必要、shadcn 規約の細部 (aliases や utils 整合) を見落とすリスク
- B) 部分的に手動で base クラスのみ更新
  - メリット: 差分が小さい
  - デメリット: shadcn 公式と継続的に乖離するため将来の更新追従コスト高、本 change の目的に反する

**Outcome**: `apps/web` 配下で `pnpm dlx shadcn@latest add button --overwrite` を実行 → 差分を `git diff` で確認 → 意図しない scope 外の変更 (例: `src/lib/utils.ts` の改変) があれば `git restore` で除外。

### Decision 2: 新規依存は `radix-ui@1.5.0` (monorepo パッケージ)

**Why**: shadcn 公式 v4 button.tsx は `import { Slot } from "radix-ui"` を使用している。`@radix-ui/react-slot` 個別パッケージを使う旧式と異なり、`radix-ui` monorepo パッケージは Slot / Dialog / Dropdown / Accordion 等すべての primitive を束ねた配布形式で、後続の `add-web-search-ui` で追加コンポーネントを入れる際にも依存追加が 1 度で済む。memory `prefer-reusable-structure` (YAGNI より将来再利用性) の方針に合致する。

`radix-ui@1.5.0` は 2026-06-06 リリースで `pnpm-workspace.yaml` の `minimumReleaseAge: 4320` (3 日) を 5 日経過でクリアしている。

**Alternatives considered**:

- A) `@radix-ui/react-slot` 個別パッケージのみ追加 (1.2.5)
  - メリット: 依存サイズが最小
  - デメリット: 後で dialog / dropdown 等を追加するたびに `@radix-ui/react-dialog` 等を増やす必要、shadcn 公式 v4 の import 文を `from "@radix-ui/react-slot"` に書き換える必要、公式テンプレから逸脱

**Outcome**: `radix-ui@1.5.0` を `apps/web` の `dependencies` に追加。`pnpm install` で lockfile 再生成。exact-version 規約に従い `^` プレフィクスは除去する。

### Decision 3: `radix-ui` は `apps/web` の直接依存、catalog 化しない

**Why**: 現状 `radix-ui` を必要とするのは `apps/web` のみ。`apps/mobile` は React Native + Expo で別系統 (Radix UI は web primitives)、`apps/api` は backend で UI 依存なし、`packages/contracts` は schema のみ。今 catalog 化しても利用箇所が増えないため YAGNI 違反になる。将来 `apps/web2` 等を追加する時に catalog 化する判断で十分。

**Outcome**: `apps/web/package.json` の `dependencies` に直接追記。`pnpm-workspace.yaml` は無変更。

### Decision 4: テスト追加なし

**Why**: button.tsx は shadcn 公式テンプレの直接コピーで、振る舞いはライブラリ側の責任。プロジェクト固有の組み合わせ (例: 検索フォームで button を使うケース) のテストは `add-web-search-ui` で利用側コンポーネントに対して書かれる際に間接的にカバーされる。本 change で button 単体のテストを書くと「公式テンプレの内部実装をテストする」形になり、テストとしての価値が低い。

**Outcome**: 新規テストファイル追加なし。既存テスト (`api-client.test.ts` / `route.test.ts`) は button 非依存のため影響なし。

### Decision 5: spec は最小限の MODIFIED Scenario のみ追加する

**Why**: 当初「spec 変更なし」を志向したが、本 change の意図 (「button.tsx を shadcn 公式 v4 と整合させる」) を spec に残さないと、後続 change で button.tsx が再び旧テンプレ化した時に CI / レビューで検知できない。一方、button.tsx のクラス文字列・size variants 列挙まで Scenario 化すると shadcn 公式テンプレ更新のたびに spec 更新が必要になり保守コスト高。

そこで折衷案として、shadcn v4 規約として **普遍的かつ観測しやすい** ポイントだけを Scenario 化する。具体的には:

- `data-slot="button"` 属性の存在 (shadcn v4 共通規約)
- `asChild` prop の export (radix-ui Slot 連携の証跡)
- `apps/web/package.json` の `dependencies` に `radix-ui` が含まれる

クラス文字列・size variants 列挙・属性値の詳細は規定せず、shadcn 公式の細かい仕様変更には影響を受けないようにする。

**Outcome**: `openspec/changes/update-shadcn-button-to-v4-template/specs/web-foundation/spec.md` に **MODIFIED Requirement「UI 基盤 (Tailwind + shadcn/ui)」** を作成し、既存 Scenario を全て保持したうえで 3 つの新規 Scenario を追記する。Requirement 本文は最小限の追記 (`asChild` prop 提供 / `radix-ui` 依存) のみ。

## Risks / Trade-offs

- **[Risk] shadcn CLI 実行時の scope 外変更**: registry 追従で `src/lib/utils.ts` や `components.json` が更新される可能性 → Mitigation: `git diff` で全変更を確認し、button.tsx / package.json / pnpm-lock.yaml 以外の変更は `git restore` で除外。意図する変更だけをコミットに含める
- **[Risk] `components.json` の `style: "default"` で CLI が new-york-v4 を取れない可能性**: shadcn の `add` コマンドは `style` に基づいて registry を選ぶ → Mitigation: 試行時に明示的に `--registry` フラグや `style` 切替を検討。試行結果次第で `components.json` の `style` 変更を本 change に含めるか判断する (含める場合は本 change のスコープ内、ファイル 1 つ修正)
- **[Risk] `radix-ui` monorepo パッケージと既存の `@radix-ui/*` パッケージとの依存衝突**: 現状 `apps/web` には他の `@radix-ui/*` パッケージは入っていない (確認済) → 衝突リスクなし
- **[Risk] `asChild` prop 導入による既存利用箇所への影響**: 現状 button.tsx の利用箇所は 0 件 (`grep -rn "components/ui/button" apps/web/src/` で確認済) → 下流影響なし、安全に置換可能
- **[Trade-off] button.tsx の差分が大きい**: base クラス / variants / sizes / Component 構造すべて変更されるため、git diff が大きい。レビューでは「shadcn 公式 v4 のコピーである」ことを確認すれば十分で、各クラスの精査は不要

## Migration Plan

1. feature ブランチ (`feat/update-shadcn-button-to-v4-template`) で作業 (済)
2. ベースライン確認: `pnpm test` / `typecheck` / `build` (API_URL 付き) が green
3. `apps/web` で `pnpm dlx shadcn@latest add button --overwrite` を実行
4. 差分を `git diff` で確認、scope 外の変更があれば `git restore`
5. `radix-ui` が `apps/web/package.json` に追加されているか確認、exact-version 規約 (`^` プレフィクス除去) に整合
6. `pnpm install` で lockfile 再生成
7. `pnpm typecheck` / `lint` / `format:check` / `test` で全 green を確認
8. `pnpm dev` を起動し、`page.tsx` に各 variant / size の Button を一時配置 → Playwright で描画確認 (variants: default / destructive / outline / secondary / ghost / link、sizes: default / sm / lg / icon / xs / icon-xs / icon-sm / icon-lg、asChild: `<Button asChild><a href="#">Link</a></Button>` の hreflink 動作確認)
9. `page.tsx` を元に戻す
10. `openspec validate update-shadcn-button-to-v4-template --strict` で artifact 整合性確認
11. セルフレビュー (typescript-reviewer + react-reviewer) → 必要なら修正
12. PR 作成

Rollback: 本 change が原因で問題発生時は PR を revert する。`button.tsx` は利用箇所 0 件のため、revert で意図しない影響は出ない。

## Open Questions

- **Q1**: `components.json` の `style: "default"` のままで `pnpm dlx shadcn@latest add button` が `new-york-v4` の button を取れるか?
  - 取れる場合: そのまま CLI 実行で完了
  - 取れない場合: `style` を `"new-york"` に変更する判断が必要 (本 change のスコープに含めて対応)
  - 実装時 (apply フェーズ) に検証する。propose 段階では判断保留
