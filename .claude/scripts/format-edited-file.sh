#!/bin/bash
# =============================================================================
# format-edited-file.sh
# =============================================================================
# 【役割】
#   Edit / Write / MultiEdit で変更された 1 ファイルを oxfmt で整形する。
#   ルートの .oxfmtrc.json を使い、対象 1 件だけ書き換える（軽量）。
#   Claude が次にそのファイルを読むときに整形済みコードを見られる。
#
# 【呼ばれるタイミング】
#   settings.json の hooks.PostToolUse (matcher: Edit|Write|MultiEdit) に登録され、
#   それらのツールが完了した直後に実行される。
#
# 【入力】
#   stdin に Claude が渡す JSON が流れてくる。
#   tool_input.file_path に整形対象ファイルの絶対パスが入っている。
#
# 【処理対象】
#   oxfmt がサポートする拡張子のみ整形する：
#     .ts / .tsx / .js / .jsx / .mjs / .cjs / .mts / .cts / .json / .md
#
# 【スキップ条件】
#   - file_path が空 / ファイルが存在しない（削除）
#   - リポジトリ外のファイル
#   - node_modules / .turbo / dist / .next / build / .claude 配下
#   - 拡張子が oxfmt 対応外
#
# 【exit コードの意味】
#   常に exit 0（hook は次のステップをブロックしない）。
#   整形に失敗しても stderr に警告を出すだけで処理を継続する。
# =============================================================================

# stdin の JSON から file_path を取り出す
FILE_PATH=$(cat | jq -r '.tool_input.file_path // empty')

# file_path が空ならスキップ
[ -z "$FILE_PATH" ] && exit 0

# ファイルが存在しない（削除など）ならスキップ
[ ! -f "$FILE_PATH" ] && exit 0

# リポジトリルートを特定（このスクリプトは .claude/scripts/ 配下にある）
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# リポジトリ外のファイルはスキップ
case "$FILE_PATH" in
  "$REPO_ROOT"/*) ;;
  *) exit 0 ;;
esac

# ビルド成果物 / 依存 / 内部ディレクトリはスキップ
case "$FILE_PATH" in
  */node_modules/*|*/.turbo/*|*/dist/*|*/.next/*|*/build/*|*/.claude/*|*/.codex/*|*/openspec/*)
    exit 0
    ;;
esac

# oxfmt がサポートする拡張子のみ整形対象
case "$FILE_PATH" in
  *.ts|*.tsx|*.js|*.jsx|*.mjs|*.cjs|*.mts|*.cts|*.json|*.md) ;;
  *) exit 0 ;;
esac

# リポジトリルートに移動して oxfmt 実行（root の .oxfmtrc.json を使うため）
cd "$REPO_ROOT" || exit 0

# 単一ファイルを整形（成功時は無音、失敗時は stderr に警告）
if ! pnpm exec oxfmt "$FILE_PATH" >/dev/null 2>&1; then
  echo "[format-edited-file] oxfmt failed for: $FILE_PATH" >&2
fi

exit 0
