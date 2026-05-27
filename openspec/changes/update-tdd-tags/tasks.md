## 1. 検証手段の準備 (RED 検証用)

- [ ] 1.1 タグ無し Scenario の残存検出 grep コマンドを確認する: `grep -rE "^#### Scenario: " openspec/specs/` が **現状 208 件マッチする** ことを実行して記録する (RED 初期状態)
- [ ] 1.2 タグ形式の正規表現マッチを確認する grep コマンドを準備する: `grep -rE "^#### Scenario \[(unit|integration)\]: " openspec/specs/` が **現状 0 件マッチする** ことを実行して記録する (RED 初期状態)
- [ ] 1.3 振る舞い回帰なしの基準値を取る: `pnpm -r test 2>&1 | tail -20` を実行し、本 change 前のテスト結果サマリを記録する

## 2. config.yaml の規約追加

- [ ] 2.1 [Scenario 1 対応] `openspec/config.yaml` の `rules.specs` に 2 行追加する
  - `'Scenario 見出しには [unit] または [integration] タグを付与する (例: `#### Scenario [unit]: ...`)。'`
  - `'fetch / 外部 I/O / プロセス起動 / RSC レンダリング / DB アクセスを伴うものは [integration], それ以外は [unit] とする。'`
  - `rules.tasks` は変更しない
- [ ] 2.2 [Scenario 1 GREEN 検証] `openspec/config.yaml` を読み返し、Scenario 1 (config.yaml にタグ規約が記述されている) の WHEN/THEN を満たすことを目視確認する

## 3. 既存 6 spec のタグ付け

各 spec ごとに 1 コミット推奨 (レビュー粒度を保つため)。各 Scenario の判定は Decision 5 のトリガーワード (fetch / 外部 I/O / プロセス起動 / RSC レンダリング / DB アクセス) に従う。

- [ ] 3.1 `openspec/specs/monorepo-foundation/spec.md` の 23 Scenario すべてに `[unit]` または `[integration]` タグを付与する (見出し置換のみ、本文は不変)
- [ ] 3.2 `openspec/specs/api-foundation/spec.md` の 11 Scenario すべてに `[unit]` または `[integration]` タグを付与する
- [ ] 3.3 `openspec/specs/pokemon-api/spec.md` の 35 Scenario すべてに `[unit]` または `[integration]` タグを付与する
- [ ] 3.4 `openspec/specs/shared-contracts/spec.md` の 39 Scenario すべてに `[unit]` または `[integration]` タグを付与する
- [ ] 3.5 `openspec/specs/domain-schema/spec.md` の 61 Scenario すべてに `[unit]` または `[integration]` タグを付与する
- [ ] 3.6 `openspec/specs/domain-seed/spec.md` の 39 Scenario すべてに `[unit]` または `[integration]` タグを付与する

## 4. archive 不変性の確認

- [ ] 4.1 [Scenario 4 対応] `openspec/changes/archive/**` 配下のファイルが本 change で変更されていないことを `git status openspec/changes/archive/` で確認する (出力が空であること)

## 5. GREEN 検証

- [ ] 5.1 [Scenario 2 GREEN 検証] `grep -rE "^#### Scenario: " openspec/specs/` の結果が **0 件**になることを確認する (タグ無し Scenario の残存ゼロ)
- [ ] 5.2 [Scenario 3 GREEN 検証] `grep -rE "^#### Scenario " openspec/specs/` の **全マッチ行が** `^#### Scenario \[(unit|integration)\]: ` の正規表現に一致することを確認する (タグ形式の規約適合)
  - 検証コマンド例: `grep -rE "^#### Scenario " openspec/specs/ | grep -vE "^[^:]+:#### Scenario \[(unit|integration)\]: "` の結果が 0 件
- [ ] 5.3 [振る舞い回帰なし検証] `pnpm -r test 2>&1 | tail -20` を実行し、Task 1.3 で記録した本 change 前のテスト結果と同一であることを確認する

## 6. openspec 整合性検証

- [ ] 6.1 `openspec validate update-tdd-tags` が pass することを確認する
- [ ] 6.2 `openspec validate --strict` で全 spec が valid のままであることを確認する (タグ付け後に構文崩壊が無いこと)

## 7. リファクタ (任意)

- [ ] 7.1 タグ付け作業中に発見した既存 Scenario の誤字・冗長表現があれば、本 change のスコープ内で軽微修正する。**振る舞いを変える修正は本 change で行わず、別 change として切り出す**
