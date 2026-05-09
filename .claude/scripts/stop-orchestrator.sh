#!/bin/bash
# =============================================================================
# stop-orchestrator.sh
# =============================================================================
# 【役割】
#   Stop hook で「対話中のメイン Claude」に AI レビュー指示を注入する。
#   メイン Claude が Agent ツールで subagent を起動し、レビュー結果に基づいて
#   修正までを 1 セッション内で完結させる構造。
#
# 【段階的導入】
#   現時点では typescript-reviewer のみ起動 (動作確認用)。
#   問題なければ他のレビュー agent (review-security 等) を順次追加していく。
#
# 【動作】
#   1. stop_hook_active=true ならスキップ (ループ防止)
#   2. apps/ または packages/ 配下の TS/JS 変更がなければスキップ
#   3. メイン Claude に「typescript-reviewer を Agent ツールで起動して
#      レビューせよ。Critical / Major は修正せよ」と指示
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
[stop-orchestrator] AI レビューを実行してください

Agent ツールで typescript-reviewer を起動し、変更ファイルをレビューさせる。
Critical / Major の指摘があれば Edit/Write で修正する。
Minor は情報共有のみで修正不要。

完了後、応答を終了。次の Stop は stop_hook_active で自動スキップされる。
EOF

exit 2
