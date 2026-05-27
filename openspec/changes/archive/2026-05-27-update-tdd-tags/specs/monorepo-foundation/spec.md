## ADDED Requirements

### Requirement: Spec の Scenario は test type タグを持つ

`openspec/specs/**/spec.md` 内のすべての Scenario 見出しは、テストレイヤを示すタグ `[unit]` または `[integration]` を持たなければならない（MUST）。書式はインライン形式とし、`#### Scenario [unit]: <name>` または `#### Scenario [integration]: <name>` のいずれかでなければならない（MUST）。タグ無しの `#### Scenario: <name>` 形式は許容してはならない（MUST NOT）。

判定基準は次のとおりとする（MUST）:

- 次のいずれかを伴う Scenario は `[integration]` を付与する: `fetch` / 外部 I/O / プロセス起動 / RSC レンダリング / DB アクセス
- 上記いずれにも該当しない Scenario は `[unit]` を付与する

本要求は `/opsx:propose` で新規 spec を起こす際にも適用され、`openspec/config.yaml` の `rules.specs` に同等の規約が記述されていなければならない（MUST）。

`openspec/changes/archive/**` 配下の change proposal および delta spec は本要求の対象外とする。当時の体裁の記録として残し、retroactive な書き換えは行わない。

#### Scenario [unit]: config.yaml にタグ規約が記述されている

- **WHEN** `openspec/config.yaml` の `rules.specs` を読む
- **THEN** Scenario 見出しへのタグ付与を MUST として求める文と、判定基準（fetch / 外部 I/O / プロセス起動 / RSC レンダリング / DB アクセスを伴うものは `[integration]`、それ以外は `[unit]`）を述べる文の両方が含まれる

#### Scenario [unit]: 現役 spec にタグ無し Scenario が残っていない

- **WHEN** `grep -E "^#### Scenario:" openspec/specs/**/spec.md` を実行する
- **THEN** マッチ件数が 0 件である（すべての Scenario 見出しに `[unit]` または `[integration]` タグが付与されている）

#### Scenario [unit]: 現役 spec のタグ形式が規約どおりである

- **WHEN** `grep -rE "^#### Scenario " openspec/specs/` を実行する
- **THEN** すべてのマッチ行が `^#### Scenario \[(unit|integration)\]: ` の正規表現に一致する（タグの値は `unit` または `integration` のいずれか、形式はインラインの角括弧表記）

#### Scenario [unit]: archive 配下は本要求の対象外

- **WHEN** `openspec/changes/archive/**/specs/**/spec.md` 内の Scenario 見出しを確認する
- **THEN** タグ無しの Scenario が残っていても本要求の違反にはならない（archive は当時の体裁のまま保持される）
