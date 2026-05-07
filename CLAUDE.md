# CLAUDE.md

@AGENTS.md

## Claude Code 固有

### 機能実装ワークフロー

新機能・アーキテクチャ変更は `/opsx:propose` から OpenSpec の change として起こす（コマンド一覧は `.claude/commands/opsx/`）。実装中の TDD は `tdd-workflow` skill に従う。
