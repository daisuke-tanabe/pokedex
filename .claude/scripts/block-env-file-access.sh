#!/bin/bash
# =============================================================================
# block-env-file-access.sh
# =============================================================================
# 【役割】
#   Bash コマンドが .env ファイル（.env.example などのサンプルを除く）に
#   アクセスしようとする場合に実行をブロックする。
#   Claude が誤って .env の内容を読んだり漏洩させるリスクを防ぐセーフガード。
#
# 【呼ばれるタイミング】
#   settings.json の hooks.PreToolUse (matcher: Bash) に登録され、
#   Claude が Bash ツールを呼び出すたびにコマンド実行前に評価される。
#
# 【入力】
#   stdin に Claude が渡す JSON が流れてくる。
#   jq で tool_input.command を取り出してコマンド文字列を得る。
#
# 【ブロック対象】
#   コマンドを区切り文字（空白 / `;` / `|` / `&` / リダイレクト / 括弧 等）で
#   分割した各トークンに対し、basename が `.env` で始まる、または `.env` を含む
#   ファイル名（例: .env / .env.local / path/.env.production / .envrc）を
#   含む場合にブロック（exit 2）。
#
# 【許可する例外】
#   basename が .env.example / .env.sample / .env.template に厳密一致する
#   トークンは安全なサンプルファイルなので許可。
#   例: cat .env.example         → OK
#       cat .env                 → ブロック
#       cat .env.local           → ブロック
#       cat .env.example.bak     → ブロック (厳密一致ではない)
#       cat .env.example .env    → ブロック (.env が混在)
#
# 【exit コードの意味】
#   exit 2 : Claude Code がコマンド実行をブロックし、エラーとして扱う
#   exit 0 : 問題なし、コマンドをそのまま実行させる
#
# 【注意】
#   このガードは完全ではなく、あくまでうっかりミスを防ぐためのもの。
#   意図的な回避（変数経由でパスを組み立てるなど）には対応しない。
# =============================================================================

set -euo pipefail

# stdin の JSON からコマンド文字列を取り出す
CMD=$(cat | jq -r '.tool_input.command // empty')

# コマンドをシェル区切り文字でトークン化（厳密ではないが実用上十分）
tokens=$(tr '[:space:];&|<>(){}`' '\n' <<< "$CMD")

while IFS= read -r token; do
  # 前後のクォートを 1 段剥がす
  token="${token#\'}"; token="${token%\'}"
  token="${token#\"}"; token="${token%\"}"

  # .env を含まないトークンはスキップ
  [[ "$token" == *.env* ]] || continue

  # basename を取り出して判定（path/.env.example の path 部分のマッチを避ける）
  filename="${token##*/}"

  # 安全なサンプル名は厳密一致でのみ許可
  case "$filename" in
    .env.example|.env.sample|.env.template)
      continue
      ;;
  esac

  # basename に .env を含むなら漏洩リスクとしてブロック
  if [[ "$filename" == *.env* ]]; then
    echo "Blocked: .env access is not allowed: $token (in: $CMD)" >&2
    exit 2
  fi
done <<< "$tokens"

exit 0
