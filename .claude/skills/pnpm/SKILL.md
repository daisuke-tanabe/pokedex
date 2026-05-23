---
name: pnpm
description: 厳格な依存解決を備えた Node.js のパッケージマネージャ。pnpm 固有のコマンド実行、workspace の設定、catalog / patch / override を用いた依存管理を行う際に使用する。
metadata:
  author: Anthony Fu
  version: "2026.1.28"
  source: Generated from https://github.com/pnpm/pnpm, scripts located at https://github.com/antfu/skills
---

pnpm は高速かつディスク効率に優れたパッケージマネージャである。コンテンツアドレス指定の store を用いてマシン上のすべてのプロジェクト間でパッケージを重複排除し、ディスク容量を大幅に節約する。pnpm はデフォルトで厳格な依存解決を強制し、phantom dependency（ファントム依存）を防止する。設定は pnpm 固有の項目を `pnpm-workspace.yaml` に配置することが望ましい。

**重要:** pnpm プロジェクトを扱う際、エージェントは `pnpm-workspace.yaml` と `.npmrc` を確認し、workspace 構成と設定を把握すること。CI 環境では常に `--frozen-lockfile` を使用する。

> 本スキルは pnpm 10.x をベースに、2026-01-28 時点で生成されたものである。

## コア

| トピック | 説明 | リファレンス |
|-------|-------------|-----------|
| CLI コマンド | install、add、remove、update、run、exec、dlx、workspace 系コマンド | [core-cli](references/core-cli.md) |
| 設定 | pnpm-workspace.yaml、.npmrc の設定、package.json のフィールド | [core-config](references/core-config.md) |
| Workspaces | フィルタリング、workspace protocol、共有 lockfile を備えた monorepo サポート | [core-workspaces](references/core-workspaces.md) |
| Store | コンテンツアドレス指定ストレージ、ハードリンク、ディスク効率 | [core-store](references/core-store.md) |

## 機能

| トピック | 説明 | リファレンス |
|-------|-------------|-----------|
| Catalogs | workspace 向けの依存バージョンの一元管理 | [features-catalogs](references/features-catalogs.md) |
| Overrides | 推移的依存も含めた特定バージョンの強制適用 | [features-overrides](references/features-overrides.md) |
| Patches | サードパーティパッケージへの独自パッチ適用 | [features-patches](references/features-patches.md) |
| Aliases | npm: プロトコルによるカスタム名でのパッケージインストール | [features-aliases](references/features-aliases.md) |
| Hooks | .pnpmfile.cjs の hook による解決処理のカスタマイズ | [features-hooks](references/features-hooks.md) |
| Peer Dependencies | 自動インストール、strict モード、依存ルール | [features-peer-deps](references/features-peer-deps.md) |

## ベストプラクティス

| トピック | 説明 | リファレンス |
|-------|-------------|-----------|
| CI/CD セットアップ | GitHub Actions、GitLab CI、Docker、キャッシュ戦略 | [best-practices-ci](references/best-practices-ci.md) |
| マイグレーション | npm/Yarn からの移行、phantom dependency への対応、monorepo の移行 | [best-practices-migration](references/best-practices-migration.md) |
| パフォーマンス | インストール最適化、store キャッシュ、workspace の並列化 | [best-practices-performance](references/best-practices-performance.md) |
