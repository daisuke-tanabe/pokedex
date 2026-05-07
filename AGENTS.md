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
