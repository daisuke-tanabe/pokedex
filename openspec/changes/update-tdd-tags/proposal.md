## Why

`apps/web` をこれから立ち上げるにあたり、ユーザ要望として「テスト → 実装」フェーズに **ユニットテストだけでなくインテグレーションテストも明示的に挟みたい**。現状の `openspec/config.yaml` の `rules.specs` は Scenario の粒度と WHEN/THEN 形式までしか規定しておらず、各 Scenario が「unit / integration のどちらに該当するか」を読み手・実装者・レビュアーが暗黙裡に判断している。この曖昧さを早期に固めておかないと、web 側の change で Scenario が増えるたびにテストレイヤが場当たり的に決まり、整合性が崩れる。

加えて、`api` 側は既に「mock repo によるユニット + real DB の `skipIf` による統合」の二層運用が定着しており、規約として明文化するだけで現状と一致する。今が最も低コストで導入できる時期。

## What Changes

- **`openspec/config.yaml` の `rules.specs` に 2 行を追加**
  - Scenario 見出しへの `[unit]` / `[integration]` タグ付与を必須化（例: `#### Scenario [integration]: ...`）
  - 判定基準を明文化：fetch / 外部 I/O / プロセス起動 / RSC レンダリング / DB アクセスを伴うものは `[integration]`、それ以外は `[unit]`
  - `rules.tasks` は変更しない（既存の「テスト → 実装 → リファクタ」3 段階フローは維持）
- **既存 `openspec/specs/**/spec.md` の Scenario 見出しを retroactive に置換**
  - 対象 6 spec / 計 208 Scenario すべてに `[unit]` または `[integration]` タグを付与
  - 内訳: `monorepo-foundation` 23 件, `api-foundation` 11 件, `pokemon-api` 35 件, `shared-contracts` 39 件, `domain-schema` 61 件, `domain-seed` 39 件
  - **本文 (Requirement テキスト・WHEN/THEN・Purpose) は一切変更しない**。見出し置換のみ
- **触らないもの**
  - `.claude/skills/tdd-workflow/SKILL.md`（既に "ユニット / 統合 / E2E" の分類を持っており、追加指示なしでも Scenario タグを読み取って判断できる）
  - `openspec/changes/archive/**`（履歴改竄を避ける。新規 change から規約を強制し、archive は当時の体裁のまま残す）
  - `apps/api` 配下のテストコード（既存テスト挙動は変えない）

## Capabilities

### New Capabilities

なし。

### Modified Capabilities

- `monorepo-foundation`: リポジトリ全体の開発基盤規約に「spec の Scenario はテストレイヤを示すタグを必ず持つ」要求を ADDED で追加する。既存 Requirement の MUST/SHALL 文や WHEN/THEN ステップは変更しない。

> 注: `monorepo-foundation` 以外の 5 spec (`api-foundation` / `pokemon-api` / `shared-contracts` / `domain-schema` / `domain-seed`) も Scenario 見出しのタグ置換は発生するが、これは新規 Requirement (`monorepo-foundation` 側の ADDED) を満たすための **適合作業**であり、各 capability 自身の振る舞いは変えない。よって Modified Capabilities には列挙しない。

## Impact

- **変更されるファイル**
  - `openspec/config.yaml`（+2 行、`rules.specs` 配下）
  - `openspec/specs/monorepo-foundation/spec.md`（23 Scenario 見出し置換）
  - `openspec/specs/api-foundation/spec.md`（11 Scenario 見出し置換）
  - `openspec/specs/pokemon-api/spec.md`（35 Scenario 見出し置換）
  - `openspec/specs/shared-contracts/spec.md`（39 Scenario 見出し置換）
  - `openspec/specs/domain-schema/spec.md`（61 Scenario 見出し置換）
  - `openspec/specs/domain-seed/spec.md`（39 Scenario 見出し置換）
- **追加・削除されるファイル**: なし
- **依存関係**: 追加なし
- **非ゴール (Non-Goals)**
  - `tdd-workflow` skill の改修 → 暗黙の連動で動くため不要。必要が出た時点で別 change で対応
  - archive 内の change proposal / delta spec の retroactive 書き換え → 履歴改竄を避ける
  - 後続 change (`add-web-foundation` 等) で導入される MSW / RSC テスト基盤の整備 → 本 change のスコープ外。本 change は規約のみ
  - E2E (Playwright) レイヤのタグ付与 → 現状のコードベースに E2E が存在しないため対象外。`add-e2e-foundation` 起票時に `[e2e]` タグの追加可否を判断
- **後続 change への影響**
  - `add-web-foundation` 以降、新規 spec の Scenario はすべて `[unit]` / `[integration]` タグ付きで生成される
  - `/opsx:propose` 実行時、`openspec instructions` 経由で本 change 後の `rules.specs` が読まれ、Claude が自動的にタグ付きで spec を起こす
- **テスト**
  - 機械的検証: `grep -E "^#### Scenario:" openspec/specs/**/spec.md` の結果が 0 件であること（タグ無し Scenario の残存検出）
  - 振る舞いに変化はないため、`pnpm -r test` の結果は本 change 前後で同一
