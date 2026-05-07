---
name: design-system
description: デザインシステムの生成・監査、ビジュアル一貫性の確認、スタイリングを変更する PR レビューに使用する。
---

# デザインシステム — ビジュアルシステムを生成・監査する

## 起動タイミング

- デザインシステムが必要な新規プロジェクトを開始するとき
- 既存コードベースのビジュアル一貫性を監査するとき
- 再設計の前に — 現状を理解する
- UI が「何かおかしい」が、原因を特定できないとき
- スタイリングを変更する PR をレビューするとき

## 仕組み

### Mode 1: デザインシステムを生成する

コードベースを分析し、一貫性のあるデザインシステムを生成する:

```
1. Scan CSS/Tailwind/styled-components for existing patterns
2. Extract: colors, typography, spacing, border-radius, shadows, breakpoints
3. Research 3 competitor sites for inspiration (via browser MCP)
4. Propose a design token set (JSON + CSS custom properties)
5. Generate DESIGN.md with rationale for each decision
6. Create an interactive HTML preview page (self-contained, no deps)
```

出力: `DESIGN.md` + `design-tokens.json` + `design-preview.html`

### Mode 2: ビジュアル監査

UI を 10 軸でスコア化する(各 0〜10):

```
1. Color consistency — are you using your palette or random hex values?
2. Typography hierarchy — clear h1 > h2 > h3 > body > caption?
3. Spacing rhythm — consistent scale (4px/8px/16px) or arbitrary?
4. Component consistency — do similar elements look similar?
5. Responsive behavior — fluid or broken at breakpoints?
6. Dark mode — complete or half-done?
7. Animation — purposeful or gratuitous?
8. Accessibility — contrast ratios, focus states, touch targets
9. Information density — cluttered or clean?
10. Polish — hover states, transitions, loading states, empty states
```

各軸についてスコア・具体例・ファイル:行レベルの修正案を出す。

### Mode 3: AI Slop 検出

汎用的な AI 生成デザインパターンを検出する:

```
- Gratuitous gradients on everything
- Purple-to-blue defaults
- "Glass morphism" cards with no purpose
- Rounded corners on things that shouldn't be rounded
- Excessive animations on scroll
- Generic hero with centered text over stock gradient
- Sans-serif font stack with no personality
```

## 例

**SaaS アプリ向けに生成:**
```
/design-system generate --style minimal --palette earth-tones
```

**既存 UI を監査:**
```
/design-system audit --url http://localhost:3000 --pages / /pricing /docs
```

**AI slop をチェック:**
```
/design-system slop-check
```
