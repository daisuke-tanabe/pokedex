---
description: 専門エージェントを使った包括的なPRレビュー
---

# Review PR

プルリクエストを多角的にレビューする。

## 使用法

`/review-pr [PR-number-or-URL] [--focus=comments|tests|errors|types|code|simplify]`

PRが指定されない場合、現在のブランチのPRをレビューする。focus が指定されない場合、全レビュースタックを実行する。

## ステップ

1. PRの特定：
   - `gh pr view` でPR詳細、変更ファイル、diffを取得する
2. プロジェクトのガイダンスを探す：
   - `CLAUDE.md`、lint設定、TypeScript設定、リポジトリ規約を探す
3. 専門レビューエージェントを実行：
   - `code-reviewer`
   - `comment-analyzer`
   - `pr-test-analyzer`
   - `silent-failure-hunter`
   - `type-design-analyzer`
   - `code-simplifier`
4. 結果を集約：
   - 重複する指摘を排除する
   - 重大度で順位付けする
5. 重大度ごとにグループ化して報告する

## 確信度ルール

確信度80以上の指摘のみ報告する：

- Critical: バグ、セキュリティ、データ損失
- Important: テスト不足、品質問題、スタイル違反
- Advisory: 明示的に求められた場合のみの提案
