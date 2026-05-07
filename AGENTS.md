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

## コーディング規約

詳細ルールは `.agents/rules/` 配下に分割配置。
コード変更を伴うタスク開始時、以下のファイルを必ず読み込み内容に従うこと。

### 全タスク共通

@.agents/rules/common/coding-style.md
@.agents/rules/common/patterns.md
@.agents/rules/common/security.md

### TypeScript 作業時

@.agents/rules/typescript/coding-style.md
@.agents/rules/typescript/testing.md
@.agents/rules/typescript/patterns.md

`@` 構文を解釈しないエージェントは、対応する `.agents/rules/<path>.md` を Read tool で開いて参照すること。
