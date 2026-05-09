#!/bin/bash
# =============================================================================
# self-review.sh
# =============================================================================
# 【役割】
#   Stop hook で「対話中のメイン Claude」に AI レビュー指示を注入する。
#   メイン Claude が Agent ツールで subagent を起動し、レビュー結果に基づいて
#   修正までを 1 セッション内で完結させる構造。
#
# 【段階的導入】
#   現時点では typescript-reviewer と react-reviewer を並列起動。
#   問題なければ他のレビュー agent (review-security 等) を順次追加していく。
#
# 【動作】
#   1. stop_hook_active=true ならスキップ (ループ防止)
#   2. apps/ または packages/ 配下の TS/JS 変更がなければスキップ
#   3. メイン Claude に「typescript-reviewer と react-reviewer を Agent
#      ツールで並列起動 (1 メッセージ内で複数 Agent 呼び出し) し、両方の
#      結果を統合して Critical / Major を修正せよ」と指示
#   4. exit 2 で stderr が次プロンプトに注入される
#
# 【exit コード】
#   exit 0 : 変更なし、または再帰呼び出し
#   exit 2 : メイン Claude へ指示を注入
# =============================================================================

# stop_hook_active=true ならスキップ
input=$(cat)
case "$input" in
  *'"stop_hook_active":true'*) exit 0 ;;
esac

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT" || exit 0
[ ! -d .git ] && exit 0

# apps/ または packages/ 配下の TS/JS 変更があるか
src_changed=$(git status --porcelain --untracked-files=all 2>/dev/null \
  | awk '{print $NF}' \
  | grep -E '^(apps|packages)/' \
  | grep -E '\.(ts|tsx|js|jsx)$' || true)

[ -z "$src_changed" ] && exit 0

# メイン Claude に AI レビュー指示を注入
cat >&2 <<EOF
[self-review] AI レビューワークフローを実行してください

## Step 1: 並列レビュー (1 メッセージ内で 2 Agent 呼び出し)

Agent ツールを以下 2 つ、**1 つのアシスタント応答内で並列発行** する:

- typescript-reviewer: TS/JS 全般 (型 / 非同期 / 設計 / パフォーマンス / セキュリティ / テスタビリティ)
- react-reviewer: React / Next.js (Hooks / 再レンダリング / RSC 境界 / Cache Components / アクセシビリティ)

## Step 2: 結果の統合

両方の結果が返ったら、指摘を以下のルールで整理する:
- 同一箇所への重複指摘は最も具体的な提案を採用
- Critical / Major / Minor の重要度順に並べ替え
- 対象ファイルがない agent が "No issues" を返した場合はスキップ

## Step 3: 修正判断

- Critical / Major: Edit / Write で即座に修正する
- Minor: 情報共有のみ (このターンでは修正しない)

## Step 4: 完了

応答を終了する。次の Stop は stop_hook_active で自動スキップされる。
EOF

exit 2
