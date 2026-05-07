---
name: seo
description: テクニカルSEO、オンページ最適化、構造化データ、Core Web Vitals、コンテンツ戦略にわたってSEO改善を監査・計画・実装する。検索可視性の向上、SEOの是正、スキーママークアップ、サイトマップ・robotsの作業、キーワードマッピングを行う際に使用する。
---

# SEO

小手先の手法ではなく、技術的な正しさ、パフォーマンス、コンテンツの関連性によって検索可視性を高める。

## 起動タイミング

このスキルを使用するのは次の場合：
- クロール可能性、インデックス可能性、canonical、リダイレクトを監査する
- title タグ、meta description、見出し構造を改善する
- 構造化データを追加または検証する
- Core Web Vitals を改善する
- キーワードリサーチを行い、キーワードを URL にマッピングする
- 内部リンクやサイトマップ／robots の変更を計画する

## 仕組み

### 原則

1. コンテンツ最適化の前に、技術的な障害を解消する。
2. 1ページにつき、明確な主要検索インテントは1つにする。
3. 操作的な手法より、長期的な品質シグナルを優先する。
4. インデックスはモバイルファーストなので、モバイルファーストの前提が重要である。
5. 推奨事項はページ単位で具体的かつ実装可能でなければならない。

### テクニカルSEOチェックリスト

#### クロール可能性

- `robots.txt` は重要なページを許可し、価値の低い領域をブロックすること
- 重要なページが意図せず `noindex` になっていないこと
- 重要なページは浅いクリック深度で到達可能であること
- 2ホップを超えるリダイレクトチェーンを避けること
- canonical タグは自己整合的かつループしないこと

#### インデックス可能性

- 推奨URL形式が一貫していること
- 多言語ページでは hreflang を使う場合は正しく設定すること
- サイトマップは公開対象を反映していること
- canonical 制御なしに重複URLが競合しないこと

#### パフォーマンス

- LCP < 2.5s
- INP < 200ms
- CLS < 0.1
- 一般的な対処：ヒーロー画像のプリロード、レンダーブロックの削減、レイアウト領域の確保、重い JS の削減

#### 構造化データ

- ホームページ：適切なら organization または business スキーマ
- 編集系ページ：`Article` / `BlogPosting`
- 商品ページ：`Product` と `Offer`
- 内部ページ：`BreadcrumbList`
- Q&A セクション：内容が本当に一致する場合のみ `FAQPage`

### オンページのルール

#### title タグ

- およそ50〜60文字を目安にする
- 主要キーワードまたはコンセプトを前方に配置する
- ボット向けに詰め込まず、人が読める文にする

#### meta description

- およそ120〜160文字を目安にする
- ページを正直に説明する
- 主題を自然に含める

#### 見出し構造

- 明確な `H1` を1つ
- `H2` と `H3` は実際のコンテンツ階層を反映させる
- 見た目のスタイル目的だけで構造を飛ばさない

### キーワードマッピング

1. 検索インテントを定義する
2. 現実的なキーワードのバリエーションを集める
3. インテント一致、想定価値、競合度で優先順位をつける
4. 1つの主要キーワード／テーマを1つの URL にマッピングする
5. カニバリゼーションを検出して回避する

### 内部リンク

- 強いページから順位を上げたいページへリンクする
- 説明的なアンカーテキストを使う
- より具体的なものが可能なら、汎用アンカーを避ける
- 新しいページから関連する既存ページへ補強リンクを張る

## 例

### title の式

```text
Primary Topic - Specific Modifier | Brand
```

### meta description の式

```text
Action + topic + value proposition + one supporting detail
```

### JSON-LD の例

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Page Title Here",
  "author": {
    "@type": "Person",
    "name": "Author Name"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Brand Name"
  }
}
```

### 監査出力の形

```text
[HIGH] Duplicate title tags on product pages
Location: src/routes/products/[slug].tsx
Issue: Dynamic titles collapse to the same default string, which weakens relevance and creates duplicate signals.
Fix: Generate a unique title per product using the product name and primary category.
```

## アンチパターン

| アンチパターン | 対処 |
| --- | --- |
| キーワードの詰め込み | まずユーザー向けに書く |
| 薄いほぼ重複ページ | 統合するか差別化する |
| 実在しないコンテンツ向けのスキーマ | スキーマを実態に一致させる |
| 実ページを確認しないコンテンツ提案 | まず実ページを読む |
| 汎用的な「SEOを改善」アウトプット | すべての推奨をページまたはアセットに紐付ける |
