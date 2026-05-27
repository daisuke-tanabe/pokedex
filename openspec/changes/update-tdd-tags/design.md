## Context

`openspec/config.yaml` の `rules.specs` は現在 2 項目のみで、Scenario の粒度と WHEN/THEN 形式を規定している。一方、テストレイヤ（unit / integration）の判定は明文化されておらず、`apps/api` 側では「mock repo によるユニット + real DB の `skipIf` による統合」という実態が暗黙運用されている。`apps/web` 立ち上げ前のタイミングで規約を固める。

検討した実装経路は openspec/changes の探索フェーズで以下を網羅した:

- タグ形式: インライン見出し vs Scenario 直下 1 行 vs YAML フロントマター
- 規約の置き場所: `openspec/config.yaml` vs `tdd-workflow` skill
- 適用範囲: 現役 specs のみ vs archive 含む全体 vs 今後の change のみ
- 適用対象: 全 capability vs web のみ
- skill 同時更新: する vs しない

ライフサイクル上、`/opsx:propose` が `openspec instructions` 経由で `rules.specs` を参照する点を踏まえると、規約は `config.yaml` 側に置かないと spec 著作時に強制できない。skill は TDD 実行時にしか読まれないので、規約の主体は `config.yaml`、skill は補助という位置づけになる。

## Goals / Non-Goals

**Goals:**

- 全 Scenario が `[unit]` / `[integration]` のタグを持ち、レイヤ判定の暗黙裡な揺らぎをなくす
- `/opsx:propose` で新規 spec を起こす時点で、Claude がタグ規約を強制適用する状態を作る
- 既存 spec のテスト可能な振る舞いを変えずに、表現形式だけを段階的に揃える
- 後続の `add-web-foundation` 以降で「unit / integration の境界をどう書くか」のたびに迷わない土台を提供する

**Non-Goals:**

- `tdd-workflow` skill の改修。skill は既に「ユニット / 統合 / E2E」の test type 分類を持っており、spec.md に書かれたタグを Claude が読み取って統合テストを書くフローは現状でも成立する
- archive 内の change proposal / delta spec の書き換え。当時の体裁を残し、履歴を改竄しない
- E2E (Playwright) の `[e2e]` タグ導入。現コードベースに E2E が無いため対象外
- `apps/api` の既存テスト挙動の変更。実装は触らず、spec 側のタグ付与のみ

## Decisions

### Decision 1: タグ形式は Scenario 見出しへのインライン記述

**選択**: `#### Scenario [unit]: <name>` の形式で、Scenario タイトル行に直接タグを埋め込む。

**代替案**:

- (A) Scenario 直下に `**Test type**: integration` を別行で書く
- (B) Scenario 見出しの末尾 `(unit)` のような括弧記法
- (C) YAML フロントマターで Scenario と分離して管理

**選定理由**:

- 208 Scenario のタグ付け作業を考えると、置換が 1 行で完結する形式が最も低コスト
- `grep -E "^#### Scenario \[(unit|integration)\]:"` のような正規表現での機械検証がしやすい
- spec.md を読む人が「タイトルだけ」でテストレイヤを把握できる（別行を見に行く必要がない）
- Markdown の構造としては Scenario 見出しの一部に見えるが、`####` のレベルは保たれるので `instructions` の「Scenarios MUST use exactly 4 hashtags」要件を破らない

**トレードオフ**: 将来「test type 以外のメタ情報」を Scenario に付けたくなった場合、(A) や (C) の方が拡張余地が広い。ただし現状そのような需要は見えておらず、必要が出た時点で再検討する（YAGNI）。

### Decision 2: 規約は `openspec/config.yaml` の `rules.specs` に置く（skill は触らない）

**選択**: `config.yaml` の `rules.specs` に 2 行追加（タグ規約 1 行 + 判定基準 1 行）。`tdd-workflow` skill は変更しない。

**代替案**:

- (A) `tdd-workflow` skill (リポジトリ内 override) の SKILL.md にタグ規約を追記し、`config.yaml` は触らない
- (B) `config.yaml` と skill の両方に書く（規約と TDD 実行挙動を二重に明示）
- (C) `CLAUDE.md` のルートに規約を書く

**選定理由**:

- `/opsx:propose` は `openspec instructions` 経由で `rules.specs` を読む。skill は TDD 実行時にしか読まれないため、skill だけに書いてもタグ付き spec は生成されず、目的を達成できない（半 No）
- (B) は二重管理になり、片方を変えてもう片方を忘れる事故が起きる。skill が現状すでに「unit / 統合 / E2E」分類を持っているため、追加情報なしでも spec のタグを読み取ってテストを書ける（暗黙連動で十分）
- (C) は CLAUDE.md がプロジェクト全般の方針を扱う場所であり、Scenario タグ規約のような「特定の artifact 形式」をここに置くと CLAUDE.md が肥大化する

**トレードオフ**: skill 側に「タグを尊重しろ」と明示しないため、将来のメンバーや別 AI が `tdd-workflow` を読んだだけでは規約の存在を知らない可能性が残る。これは「skill のディレクトリ構造を辿って `config.yaml` まで読みに行く」前提に依存する。実害が出た時点で Decision 2 を見直し、skill にも 1 行追加する。

### Decision 3: archive は触らず、現役 `openspec/specs/**/spec.md` のみ更新

**選択**: 変更対象は `openspec/config.yaml` と `openspec/specs/{monorepo-foundation,api-foundation,pokemon-api,shared-contracts,domain-schema,domain-seed}/spec.md` の計 7 ファイル。`openspec/changes/archive/**` は変更しない。

**代替案**:

- (A) archive 内の delta spec も完全 retroactive に書き換え、履歴全体を新形式で揃える
- (B) 今後の change のみ規約を強制し、既存の現役 specs もタグなしのまま放置

**選定理由**:

- archive は「その時点で何が提案されたか」の記録であり、後から書き換えると履歴の意味が薄れる
- 現役 specs は「いま参照される真実源」なので、新形式に揃える価値がある（新規 change を書く時に既存 spec をコピペで参考にする運用と整合）
- (A) のコスト（archive 配下の数百 Scenario を再度判定）に見合うリターンが無い

**トレードオフ**: archive を辿った人が「現役 specs と書式が違う」と感じる可能性はあるが、archive ヘッダで「これは change 当時の提案」と読めば十分。

### Decision 4: 全 capability に必須化（api / web / mobile すべて）

**選択**: 規約は全 capability に適用する。web 限定にはしない。

**代替案**:

- (A) web 側のみ必須化し、api / mobile / contracts は推奨に留める

**選定理由**:

- api 側は既に「mock repo (unit) + real DB skipIf (integration)」の二層運用が定着しており、タグ付けは現状の追認にすぎない（テスト書き換え不要）
- 後続で `add-mobile-foundation` 等を起票したとき、規約が capability ごとに分岐していると判断軸が増える
- 「常に必須」のシンプルなルールの方が、`/opsx:propose` 時の Claude の振る舞いも安定する

**トレードオフ**: なし。api 側に追加負荷が発生しない（既に分類できる実態がある）。

### Decision 5: 判定基準は「I/O または RSC レンダリングを伴うか」の 1 行ルール

**選択**: 「fetch / 外部 I/O / プロセス起動 / RSC レンダリング / DB アクセスを伴うものは `[integration]`、それ以外は `[unit]`」を `rules.specs` に 1 行で書く。

**代替案**:

- (A) ツール別の詳細ガイド（vitest 単体は unit、MSW を使うと integration 等）を箇条書きで列挙
- (B) 「内部結合の有無」のような抽象基準のみ示す

**選定理由**:

- (A) はツール選定が変わるたびに規約が陳腐化する。ツール非依存の振る舞いベースの基準のほうが寿命が長い
- (B) は判定が人によってブレる。具体的なトリガーワード（fetch / I/O / プロセス起動 / RSC レンダリング / DB アクセス）を 5 つ並べることで、迷いを減らす

**トレードオフ**: 列挙したトリガー以外のエッジケース（例: 純粋関数だが乱数を使う、time-dependent な処理）は判定が曖昧になる可能性。実運用で迷う事例が複数出た時点でルール改訂を検討する。

## Risks / Trade-offs

- **[Risk] タグ判定のブレ** → 規約 1 行で全てカバーできず、判定が人によって揺らぐ可能性。Decision 5 のトリガーワード列挙で軽減し、ブレた事例が出たら issue / change で追記する運用にする
- **[Risk] skill 側の暗黙連動への依存** → Decision 2 の通り `tdd-workflow` skill は変更しない。skill だけ読んだ AI / 人が規約を見落とすリスク。`openspec/config.yaml` を必ず読む `/opsx:propose` の動線が主経路である限り問題は出ないが、別経路でテストを書き始めると逸脱しうる。実害が出た時点で skill に 1 行追加
- **[Risk] archive と現役 specs の体裁不一致** → Decision 3 の意図的な選択。archive を「当時の体裁の記録」として位置づければ問題は出ないが、`openspec/changes/archive/**` を `openspec/specs/**` と同じテンプレートで読もうとすると違和感が出る。README やプロジェクト前提への明記は不要レベル（自然に区別される）
- **[Trade-off] 208 件の機械的置換 vs 振る舞い変更ゼロ** → 物理的な diff は大きいが、意味的な変更は config.yaml の 2 行のみ。レビュー観点では「タグ判定が妥当か」のみを見れば足り、Requirement 本文や WHEN/THEN は読まなくてよい

## Migration Plan

1. **`openspec/config.yaml` 更新** — `rules.specs` に 2 行追加（タグ規約 + 判定基準）
2. **6 spec のタグ付与** — 上から順に `monorepo-foundation` → `api-foundation` → `pokemon-api` → `shared-contracts` → `domain-schema` → `domain-seed`。各 spec ごとに 1 コミット推奨（レビュー粒度を保つため）
3. **機械検証** — `grep -E "^#### Scenario:" openspec/specs/**/spec.md` の結果が 0 件であることを確認（タグ無し Scenario の残存検出）
4. **挙動回帰なし確認** — `pnpm -r test` を実行し、本 change 前と同じ結果になることを確認（タグ付与だけなのでテストは全件 pass のはず）
5. **archive 化** — `/opsx:archive` で `openspec/changes/archive/<date>-update-tdd-tags/` に移動

**ロールバック**: `git revert` で全変更を一括取り消し可能。コードへの影響は無いため安全。

## Open Questions

- `add-web-foundation` 起票時、web の page / RSC レンダリングを伴う Scenario が `[integration]` に分類されるはずだが、Vitest での RSC レンダリング手段が執筆時点で確定していない。本 change ではタグ規約のみ確定し、テスト基盤の選定は次 change の `design.md` で扱う
- `[e2e]` タグの導入時期。現状 E2E コードが存在しないため本 change では対象外としたが、`add-e2e-foundation` 起票時に `rules.specs` の判定基準を 1 行追加するかどうかを再検討する
