#!/bin/bash
# =============================================================================
# pre-push-review.sh
# =============================================================================
# 【役割】
#   pre-push hook (lefthook) で、push しようとしているコミット範囲の変更を
#   AI Worker で並列レビューする。Worker-Aggregator パターン。
#
# 【動作】
#   1. push 範囲の差分を git diff で取得 (upstream..HEAD)
#   2. 変更ファイル種別で起動する Worker を選定
#   3. 各 Worker を並列起動 (claude CLI 非対話、Haiku)
#   4. 結果を集約、CRITICAL 検出で push を block (exit 1)
#
# 【exit コード】
#   exit 0 : レビュー OK、または対象ファイルなし
#   exit 1 : CRITICAL 検出 → push を block
# =============================================================================

set -e

REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"

# push 範囲の決定
# upstream が設定されていればそれと HEAD の差分、なければ直近 10 コミット
upstream=$(git rev-parse --abbrev-ref --symbolic-full-name '@{upstream}' 2>/dev/null || echo "")
if [ -n "$upstream" ]; then
  diff_range="${upstream}..HEAD"
else
  diff_range="HEAD~10..HEAD"
fi

# 変更ファイル一覧 (apps/ または packages/ 配下のソース)
src_changed=$(git diff --name-only --diff-filter=ACMR "$diff_range" 2>/dev/null \
  | grep -E '^(apps|packages)/' \
  | grep -E '\.(ts|tsx|js|jsx)$' || true)

if [ -z "$src_changed" ]; then
  exit 0
fi

if ! command -v claude >/dev/null 2>&1; then
  echo "[pre-push-review] claude CLI なし、AI レビューをスキップ" >&2
  exit 0
fi

# 起動 Worker の選定
ts_changed=$(echo "$src_changed" | grep -cE '\.(ts|tsx)$' || true)
ui_changed=$(echo "$src_changed" | grep -cE '^(apps/web|apps/mobile)/.*\.tsx$' || true)
api_security_changed=$(echo "$src_changed" | grep -cE '^apps/api/src/(auth|routes|middleware)/' || true)

supabase_changed=$(git diff --name-only --diff-filter=ACMR "$diff_range" 2>/dev/null \
  | grep -cE '^(supabase/|apps/api/src/db/)' || true)

workers=()
workers+=("review-silent-failures") # エラー握り潰し、常時 (機械的検出が困難なため AI 必須)
[ "$ts_changed" -gt 0 ] && workers+=("review-typescript")
[ "$ui_changed" -gt 0 ] && workers+=("review-a11y")
[ "$api_security_changed" -gt 0 ] && workers+=("review-security")
[ "$supabase_changed" -gt 0 ] && workers+=("review-supabase")

echo "[pre-push-review] 起動 Worker (${#workers[@]} 体): ${workers[*]}" >&2
echo "[pre-push-review] 変更ファイル数: $(echo "$src_changed" | wc -l | tr -d ' ')" >&2

# 並列実行用一時ディレクトリ
tmp_dir=$(mktemp -d)
trap 'rm -rf "$tmp_dir"' EXIT

# 各 Worker を並列起動
for agent in "${workers[@]}"; do
  prompt="push 範囲 (${diff_range}) の変更を ${agent} エージェントの指針に従って横断的にレビューしてください。

変更ファイル:
$src_changed

確信度 80% 超の問題のみ報告。JSON 形式で {\"agent\": \"${agent}\", \"findings\": [...]} を返してください。"

  (
    timeout 180 claude -p \
      --agent "$agent" \
      --model haiku \
      --tools "Read,Grep,Glob,Bash" \
      --no-session-persistence \
      --max-budget-usd 0.5 \
      "$prompt" 2>/dev/null > "$tmp_dir/$agent.json" \
      || echo "{\"agent\":\"$agent\",\"findings\":[],\"error\":\"timeout or failure\"}" > "$tmp_dir/$agent.json"
  ) &
done

wait

# 結果集約
echo "" >&2
echo "[pre-push-review] === レビュー結果 ===" >&2

has_critical=0
total_findings=0
for agent in "${workers[@]}"; do
  result=$(cat "$tmp_dir/$agent.json" 2>/dev/null || echo "{}")
  echo "" >&2
  echo "--- $agent ---" >&2
  echo "$result" >&2

  if echo "$result" | grep -qiE '"severity":\s*"CRITICAL"'; then
    has_critical=1
  fi
done

echo "" >&2
if [ "$has_critical" -eq 1 ]; then
  echo "[pre-push-review] BLOCK: CRITICAL な問題あり。修正してから再 push してください。" >&2
  exit 1
fi

echo "[pre-push-review] OK" >&2
exit 0
