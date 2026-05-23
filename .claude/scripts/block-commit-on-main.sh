#!/bin/bash
# =============================================================================
# block-commit-on-main.sh
# =============================================================================
# 【役割】
#   main / master ブランチ上で `git commit` を実行しようとした場合に
#   コミットをブロックする。GitHub Flow を採用しているため、コミットは
#   常に作業ブランチで行うことを強制する。
#
# 【呼ばれるタイミング】
#   settings.json の hooks.PreToolUse (matcher: Bash) に登録され、
#   Claude が Bash ツールを呼び出すたびにコマンド実行前に評価される。
#
# 【入力】
#   stdin に Claude が渡す JSON。jq で tool_input.command を抽出。
#
# 【検出方法】
#   1. コマンドに `git commit` (porcelain) を含むか
#      - `git commit-tree` 等の plumbing は対象外
#   2. 現在のブランチが main / master なら exit 2
#      - detached HEAD の場合は symbolic-ref が失敗するため通過
#
# 【exit コード】
#   exit 0 : 通過 (git commit でない / 作業ブランチ上 / detached HEAD)
#   exit 2 : ブロック (main または master 上での commit) - stderr を Claude にフィードバック
# =============================================================================

set -euo pipefail

CMD=$(cat | jq -r '.tool_input.command // empty')

# `git commit` (porcelain) を含まないなら通過。`git commit-tree` 等は対象外。
if ! grep -qE '(^|[[:space:];&|])git[[:space:]]+commit([[:space:]]|$)' <<< "$CMD"; then
  exit 0
fi

# 現在のブランチを取得。detached HEAD なら symbolic-ref が失敗するので通す。
BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null || true)

if [[ -z "$BRANCH" ]]; then
  exit 0
fi

if [[ "$BRANCH" == "main" || "$BRANCH" == "master" ]]; then
  cat <<MSG >&2
[block-commit-on-main] 現在 '${BRANCH}' ブランチにいるため commit をブロックしました。
GitHub Flow の方針に従い、作業ブランチを切ってから commit してください。

例:
  git switch -c <type>/<short-description>
  git commit ...

意図して main を直接更新する必要がある場合は、hook を一時的に無効化するか
作業内容を再検討してください。
MSG
  exit 2
fi

exit 0
