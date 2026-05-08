#!/bin/bash
# =============================================================================
# lint-typecheck-workspaces.sh
# =============================================================================
# 【役割】
#   git status から変更があった apps/<workspace> を検出し、
#   その workspace に対して turbo 経由で lint（type-aware）と typecheck を実行する。
#   品質ゲートとして使い、失敗時は exit 1 で呼び出し元に通知する。
#
# 【呼ばれるタイミング】
#   settings.json の hooks.Stop に登録され、Claude が応答を完了する直前に実行。
#
# 【入力】
#   stdin に Claude が渡す JSON。本スクリプトは内容を使わず git status を参照する。
#
# 【検出ロジック】
#   `git status --porcelain` の出力から `apps/<name>/` の変更を抽出し、
#   変更があった workspace のみ pnpm --filter で lint + typecheck を走らせる。
#   apps/ 配下の変更が無い場合はスキップ（無音）。
#
# 【exit コードの意味】
#   exit 0 : チェックが通った、または変更なしでスキップした
#   exit 1 : lint / typecheck で失敗 → Claude に再考を促す
#
# 【パフォーマンス】
#   変更があった workspace のみに絞ることで、type-aware lint の重さを軽減する。
#   turbo の cache が効くので、未変更分は cache hit で即終了する。
# =============================================================================

# stdin を捨てる（Stop フックでは使用しない）
cat >/dev/null

# リポジトリルートを特定
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT" || exit 0

# git リポジトリでなければ何もしない
[ ! -d .git ] && exit 0

# 変更があった apps/<name> を抽出（重複除去、ソート）
# --untracked-files=all で未追跡ファイルも個別展開（apps/ 1 行に集約されるのを防ぐ）
CHANGED_WORKSPACES=$(
  git status --porcelain --untracked-files=all 2>/dev/null \
    | awk '{print $NF}' \
    | grep -oE '^apps/[^/]+' \
    | sort -u \
    | sed 's|^apps/||'
)

# apps/ 配下に変更が無ければスキップ（無音）
[ -z "$CHANGED_WORKSPACES" ] && exit 0

# turbo --filter 用の引数を組み立て
FILTERS=()
for ws in $CHANGED_WORKSPACES; do
  FILTERS+=(--filter="@pokedex/$ws")
done

# 進捗表示（stderr に流して Claude / user に見せる）
WORKSPACES_DISPLAY=$(echo "$CHANGED_WORKSPACES" | tr '\n' ' ')
echo "[lint-typecheck-workspaces] running lint + typecheck for: ${WORKSPACES_DISPLAY}" >&2

# turbo で lint + typecheck を一括実行（並列、cache あり）
if ! pnpm exec turbo run lint typecheck "${FILTERS[@]}" >&2; then
  echo "[lint-typecheck-workspaces] FAILED: lint or typecheck has issues, please fix before stopping." >&2
  exit 1
fi

echo "[lint-typecheck-workspaces] OK" >&2
exit 0
