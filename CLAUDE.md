# CLAUDE.md

- 読んでいないファイルは編集しない
- 調査・確認を最優先し、推測で作業しない
- シークレットはコードに書かず環境変数または secret manager を使う (詳細な脆弱性レビューは `security-reviewer` agent に委譲)

## 開発フロー

- GitHub Flow を採用
- コミットメッセージ: Conventional Commits 形式
- コミットメッセージ・PR 本文・ドキュメントは原則日本語

### セルフレビュー

- `git commit` を打つ前に必ず Agent ツールを活用してコードレビューを行う
- 設定ファイル / ドキュメント (`*.json` `*.yml` `*.toml` `*.md`) のみのコミットは省略可
- 機械的な小修正 (Dependabot 等) や同一変更の再コミット (review 後の修正、`--amend`) はレビュー対象外
- レビュー結果は妥当性を判断したうえで反映する (機械的な全修正は避ける)

#### 1. 並列レビュー

Agent ツールを 1 つのアシスタント応答内で並列発行する。

- `.ts` / `.js` / `.cjs` / `.mjs` を変更: `typescript-reviewer`
- `.tsx` / `.jsx` を変更: `typescript-reviewer` + `react-reviewer`

#### 2. 判断と修正

並列レビューの結果を統合し、以下のルールで判定する。

- Critical/Major: 妥当性を確認のうえ修正する
- Minor/Info: 情報共有のみ、修正不要

#### 3. コミット

修正があれば `git add` でステージしてから `git commit` を実行する

### PR 作成

`gh pr create` を実行する際は以下に従う。

- 本文 (`--body`) は必ず `.github/pull_request_template.md` の構造に従う
- セクションは **変更内容（What） / 動機・背景（Why） / 実装のポイント（How） / テスト / チェックリスト** の順で過不足なく揃える
- テンプレに無いセクション (Summary / Test plan 等の Claude Code 内蔵デフォルト) を勝手に追加しない
- チェックリストはテンプレの項目をそのままコピーし、完了済みは `[x]` / 未完了は `[ ]` で示す
- 本文は HEREDOC (`--body "$(cat <<'EOF' ... EOF)"`) または `--body-file` で渡す。PreToolUse hook (`.claude/scripts/check-pr-template.sh`) が違反検出に必要なため
- PR 作成前に `.github/pull_request_template.md` を Read で読み込み、最新の構造に追従する

## プロジェクト前提

このリポジトリは **Claude Code を利用できる複数人のメンバーが編集する前提** で運用する。提案や設計判断は次の点を踏まえる。

- `.claude/`, `CLAUDE.md`, `.github/`, `pnpm-workspace.yaml` などの設定ファイルは **チームで共有される資産** として扱う
- ワークフロー / hook / ルール / agent / command は個人最適ではなく、**チーム全体で再現可能なもの** を選ぶ
- 「自分の環境だけで動く」運用 (個人マシンのパス前提、外部ツール依存等) は避け、リポジトリ内で完結する手順を優先する
- 個人プロジェクトであっても、実務での再利用を見据えてナレッジ蓄積する
