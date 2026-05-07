---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
---
# TypeScript/JavaScript テスト

> TDD の手順とパターンは `tdd-workflow` skill を参照。このファイルは TypeScript/JavaScript 固有のフレームワーク選択を補足する。

## テストフレームワーク

- **ユニット・統合テスト**：`vitest`（Viteエコシステムと統一、Jest互換API）
- **E2Eテスト**：`Playwright`（重要なユーザーフロー）

## エージェントサポート

- **e2e-runner** - Playwright E2Eテストスペシャリスト