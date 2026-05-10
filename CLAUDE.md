# CLAUDE.md

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
