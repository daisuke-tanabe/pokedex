# React Best Practices

エージェントや LLM 向けに最適化された React Best Practices を作成・メンテナンスするための構造化リポジトリ。

## 構成

- `rules/` - 個別のルールファイル（1 ルール 1 ファイル）
  - `_sections.md` - セクションのメタデータ（タイトル、影響度、説明）
  - `_template.md` - 新規ルール作成用のテンプレート
  - `area-description.md` - 個別のルールファイル
- `src/` - ビルドスクリプトとユーティリティ
- `metadata.json` - ドキュメントのメタデータ（バージョン、組織、要約）
- __`AGENTS.md`__ - コンパイル後の出力（生成物）
- __`test-cases.json`__ - LLM 評価用のテストケース（生成物）

## 始め方

1. 依存関係をインストール:
   ```bash
   pnpm install
   ```

2. ルールから AGENTS.md をビルド:
   ```bash
   pnpm build
   ```

3. ルールファイルを検証:
   ```bash
   pnpm validate
   ```

4. テストケースを抽出:
   ```bash
   pnpm extract-tests
   ```

## 新しいルールを作成する

1. `rules/_template.md` を `rules/area-description.md` にコピーする
2. 適切な領域プレフィックスを選ぶ:
   - `async-` - ウォーターフォールの排除（セクション 1）
   - `bundle-` - バンドルサイズ最適化（セクション 2）
   - `server-` - サーバーサイドパフォーマンス（セクション 3）
   - `client-` - クライアントサイドのデータ取得（セクション 4）
   - `rerender-` - 再レンダリング最適化（セクション 5）
   - `rendering-` - レンダリングパフォーマンス（セクション 6）
   - `js-` - JavaScript パフォーマンス（セクション 7）
   - `advanced-` - 高度なパターン（セクション 8）
3. frontmatter と本文を埋める
4. 例には明確な解説を添える
5. `pnpm build` を実行して AGENTS.md と test-cases.json を再生成する

## ルールファイルの構造

各ルールファイルは次の構造に従う:

```markdown
---
title: Rule Title Here
impact: MEDIUM
impactDescription: Optional description
tags: tag1, tag2, tag3
---

## Rule Title Here

ルールの簡単な説明と、なぜ重要なのか。

**Incorrect (description of what's wrong):**

```typescript
// Bad code example
```

**Correct (description of what's right):**

```typescript
// Good code example
```

例の後に補足説明を入れてもよい。

Reference: [Link](https://example.com)

## ファイル命名規約

- `_` で始まるファイルは特殊扱い（ビルド対象外）
- ルールファイル: `area-description.md`（例: `async-parallel.md`）
- セクションはファイル名のプレフィックスから自動推論される
- 各セクション内ではタイトル順にアルファベット順でソートされる
- ID（例: 1.1, 1.2）はビルド時に自動生成される

## 影響度レベル

- `CRITICAL` - 最優先、大きなパフォーマンス向上
- `HIGH` - 顕著なパフォーマンス改善
- `MEDIUM-HIGH` - 中〜高程度の改善
- `MEDIUM` - 中程度のパフォーマンス改善
- `LOW-MEDIUM` - 低〜中程度の改善
- `LOW` - 漸進的な改善

## スクリプト

- `pnpm build` - ルールを AGENTS.md にコンパイルする
- `pnpm validate` - すべてのルールファイルを検証する
- `pnpm extract-tests` - LLM 評価用のテストケースを抽出する
- `pnpm dev` - ビルドと検証

## コントリビュート

ルールを追加・修正する際は以下に従う:

1. セクションに対応した正しいファイル名プレフィックスを使う
2. `_template.md` の構造に従う
3. 良い例／悪い例を解説付きで明示する
4. 適切なタグを付ける
5. `pnpm build` を実行して AGENTS.md と test-cases.json を再生成する
6. ルールはタイトルで自動ソートされる — 番号管理は不要

## 謝辞

[Vercel](https://vercel.com) の [@shuding](https://x.com/shuding) が当初作成。
