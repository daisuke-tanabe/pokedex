# pokedex

## Setup

```bash
pnpm install
```

`postinstall` で `lefthook install` が走り、git hooks (`pre-commit`, `pre-push`) が
自動的にセットアップされる。手動操作不要。

## 品質チェックの構成

```
PostToolUse (Claude)   oxfmt + oxlint --fix + 残違反フィードバック (ファイル単位)
pre-commit             oxfmt + oxlint --fix (stage_fixed) + typecheck (workspace)
pre-push               AI Worker 並列レビュー (Worker-Aggregator パターン)
```

設定:

- `lefthook.yml` ... pre-commit / pre-push の定義
- `.claude/settings.json` ... PostToolUse / PreToolUse hook
- `.claude/scripts/` ... hook 本体
- `.claude/agents/review-*.md` ... AI Worker (read-only エージェント)
