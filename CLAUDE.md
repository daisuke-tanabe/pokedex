# CLAUDE.md

## 機能実装ワークフロー

新機能・アーキテクチャ変更は `/opsx:propose` から OpenSpec の change として起こす（コマンド一覧は `.claude/commands/opsx/`）。実装中の TDD は `tdd-workflow` skill に従う。

## Git運用

- ブランチ戦略: GitHub Flow ベース、`main` を統合ブランチとする
- 作業ブランチは `main` から切り、PR 経由で `main` にマージ
- `main` への直接コミット禁止
- コミットメッセージ: Conventional Commits
- 詳細な git ベストプラクティスは `git-workflow` skill を参照
