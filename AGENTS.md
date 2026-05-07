# AGENTS.md

このファイルは `AGENTS.md` を自動コンテキストとして読み込むエージェント（Codex / Aider / Cline / Sourcegraph Amp 等）向けのプロジェクトガイドです。

## このプロジェクトについて

- リポジトリ: `pokedex`
- ブランチ戦略: GitHub Flow（`main` を統合ブランチとし、PR 経由でマージ）
- コミットメッセージ: Conventional Commits
- 言語ポリシー: コミットメッセージ・PR 本文・ドキュメントは原則日本語

## Git 運用

- `main` への直接コミット禁止、必ず PR 経由
- 作業ブランチは `main` から切り、PR でマージ
- コミットは Conventional Commits（`feat: ...` / `fix: ...` / `chore: ...` 等）
- PR は単一目的・<500 行が理想

## 詳細パターン・プレイブック

`.agents/skills/<name>/SKILL.md` 配下に再利用可能な skill を配置しています。タスクに該当しそうな skill があれば、まず該当 `SKILL.md` を読み、必要に応じて同ディレクトリの `references/<topic>.md` で詳細を取得してください。

- 利用可能な skill 一覧: `ls .agents/skills/`
- 各 skill の用途とトリガー条件: 各 `SKILL.md` の frontmatter `description` を参照
- 各 SKILL.md は 500 行以下に圧縮されており、詳細パターン・コード例は `references/` 配下に分割されています

### 参照しないもの

`.claude/skills/openspec-*` 配下の OpenSpec 系 skill は、Claude Code 固有のツール（`AskUserQuestion` / `Task` / `Skill`）とスラッシュコマンド（`/opsx:*`）に依存しているため、他エージェントから直接利用できません。OpenSpec ワークフローが必要な場合は Claude Code から実行してください。
