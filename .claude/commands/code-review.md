---
description: コードレビュー — ローカルの未コミット変更、もしくはGitHub PR（PRモードはPR番号/URLを渡す）
argument-hint: [pr-number | pr-url | blank for local review]
---

# Code Review

> PRレビューモードはWirasm氏のPRPs-agentic-engから移植。PRPワークフローシリーズの一部。

**入力**: $ARGUMENTS

---

## モード選択

`$ARGUMENTS` にPR番号、PR URL、または `--pr` が含まれる場合：
→ 下記の **PR Review Mode** にジャンプ。

それ以外：
→ **Local Review Mode** を使う。

---

## ローカルレビューモード

未コミット変更に対する包括的なセキュリティ・品質レビュー。

### Phase 1 — GATHER

```bash
git diff --name-only HEAD
```

変更ファイルがなければ停止する: "Nothing to review."

### Phase 2 — REVIEW

各変更ファイルを完全に読む。次の項目を確認する：

**セキュリティ問題 (CRITICAL):**
- ハードコードされた認証情報・APIキー・トークン
- SQL injectionの脆弱性
- XSSの脆弱性
- 入力バリデーションの欠如
- 安全でない依存関係
- Path traversalリスク

**コード品質 (HIGH):**
- 関数が50行超
- ファイルが800行超
- ネスト深さが4レベル超
- エラーハンドリングの欠如
- console.log文
- TODO/FIXMEコメント
- 公開APIにJSDocがない

**ベストプラクティス (MEDIUM):**
- ミューテーションパターン（代わりにimmutableを使う）
- コード/コメント内の絵文字使用
- 新しいコードに対するテスト不足
- アクセシビリティ問題 (a11y)

### Phase 3 — REPORT

次の項目でレポートを生成する：
- Severity: CRITICAL, HIGH, MEDIUM, LOW
- ファイル位置と行番号
- 問題の説明
- 推奨される修正

CRITICALまたはHIGHの問題があればコミットをブロックする。
セキュリティ脆弱性のあるコードを承認してはならない。

---

## PRレビューモード

包括的なGitHub PRレビュー — diffを取得し、ファイル全文を読み、validationを実行し、レビューを投稿する。

### Phase 1 — FETCH

PRを判定するため入力をパースする：

| 入力 | アクション |
|---|---|
| 番号 (例 `42`) | PR番号として使用 |
| URL (`github.com/.../pull/42`) | PR番号を抽出 |
| ブランチ名 | `gh pr list --head <branch>` でPRを検索 |

```bash
gh pr view <NUMBER> --json number,title,body,author,baseRefName,headRefName,changedFiles,additions,deletions
gh pr diff <NUMBER>
```

PRが見つからなければエラーで停止する。後続フェーズのためPRメタデータを保存する。

### Phase 2 — CONTEXT

レビューコンテキストを構築する：

1. **プロジェクトルール** — `CLAUDE.md`、`.claude/docs/`、コントリビューションガイドラインを読む
2. **PRP成果物** — このPRに関連する実装コンテキストを `.claude/PRPs/reports/` および `.claude/PRPs/plans/` で確認する
3. **PRの意図** — PR descriptionからゴール・関連issue・テストプランをパースする
4. **変更ファイル** — 変更ファイルを列挙し、種別（source、test、config、docs）で分類する

### Phase 3 — REVIEW

各変更ファイルを**完全に**読む（diffハンクだけでなく — 周辺コンテキストが必要）。

PRレビューでは、PR head revisionでのファイル全文を取得する：
```bash
gh pr diff <NUMBER> --name-only | while IFS= read -r file; do
  gh api "repos/{owner}/{repo}/contents/$file?ref=<head-branch>" --jq '.content' | base64 -d
done
```

7つのカテゴリでレビューチェックリストを適用する：

| カテゴリ | チェック内容 |
|---|---|
| **Correctness** | ロジックエラー、off-by-one、null処理、エッジケース、レースコンディション |
| **Type Safety** | 型不一致、unsafeなcast、`any` の使用、genericsの欠如 |
| **Pattern Compliance** | プロジェクト規約との合致（命名、ファイル構造、エラーハンドリング、import） |
| **Security** | injection、認可の欠陥、シークレット露出、SSRF、path traversal、XSS |
| **Performance** | N+1クエリ、indexの欠如、無制限ループ、メモリリーク、巨大ペイロード |
| **Completeness** | テスト不足、エラーハンドリング不足、不完全なmigration、ドキュメント不足 |
| **Maintainability** | デッドコード、マジックナンバー、深いネスト、不明瞭な命名、型不足 |

各findingにseverityを割り当てる：

| Severity | 意味 | アクション |
|---|---|---|
| **CRITICAL** | セキュリティ脆弱性またはデータ損失リスク | マージ前に必ず修正 |
| **HIGH** | バグまたは問題を起こしうるロジックエラー | マージ前に修正すべき |
| **MEDIUM** | 品質問題またはベストプラクティスの欠落 | 修正推奨 |
| **LOW** | スタイル指摘または些細な提案 | 任意 |

### Phase 4 — VALIDATE

利用可能なvalidationコマンドを実行する：

設定ファイル（`package.json`、`Cargo.toml`、`go.mod`、`pyproject.toml` 等）からプロジェクト種別を検出し、適切なコマンドを実行する：

**Node.js / TypeScript** (`package.json` あり):
```bash
npm run typecheck 2>/dev/null || npx tsc --noEmit 2>/dev/null  # Type check
npm run lint                                                    # Lint
npm test                                                        # Tests
npm run build                                                   # Build
```

**Rust** (`Cargo.toml` あり):
```bash
cargo clippy -- -D warnings  # Lint
cargo test                   # Tests
cargo build                  # Build
```

**Go** (`go.mod` あり):
```bash
go vet ./...    # Lint
go test ./...   # Tests
go build ./...  # Build
```

**Python** (`pyproject.toml` / `setup.py` あり):
```bash
pytest  # Tests
```

検出したプロジェクト種別に該当するコマンドのみ実行する。各pass/failを記録する。

### Phase 5 — DECIDE

findingsに基づいて推奨事項を決定する：

| 条件 | 判定 |
|---|---|
| CRITICAL/HIGH 0件、validation pass | **APPROVE** |
| MEDIUM/LOWのみ、validation pass | **APPROVE** with comments |
| HIGHあり、またはvalidation失敗 | **REQUEST CHANGES** |
| CRITICALあり | **BLOCK** — マージ前に必ず修正 |

特殊ケース：
- Draft PR → 常に **COMMENT** を使う（approve/blockではない）
- ドキュメント/設定のみの変更 → 軽めのレビュー、correctness中心
- 明示的な `--approve` または `--request-changes` フラグ → 判定を上書き（ただし全findingは報告）

### Phase 6 — REPORT

`.claude/PRPs/reviews/pr-<NUMBER>-review.md` にレビュー成果物を作成する：

```markdown
# PR Review: #<NUMBER> — <TITLE>

**Reviewed**: <date>
**Author**: <author>
**Branch**: <head> → <base>
**Decision**: APPROVE | REQUEST CHANGES | BLOCK

## Summary
<1-2文の総合所見>

## Findings

### CRITICAL
<findings or "None">

### HIGH
<findings or "None">

### MEDIUM
<findings or "None">

### LOW
<findings or "None">

## Validation Results

| Check | Result |
|---|---|
| Type check | Pass / Fail / Skipped |
| Lint | Pass / Fail / Skipped |
| Tests | Pass / Fail / Skipped |
| Build | Pass / Fail / Skipped |

## Files Reviewed
<変更種別 (Added/Modified/Deleted) 付きファイル一覧>
```

### Phase 7 — PUBLISH

GitHubへレビューを投稿する：

```bash
# APPROVE の場合
gh pr review <NUMBER> --approve --body "<summary of review>"

# REQUEST CHANGES の場合
gh pr review <NUMBER> --request-changes --body "<summary with required fixes>"

# COMMENT のみ (draft PR または情報提供)
gh pr review <NUMBER> --comment --body "<summary>"
```

特定行へのインラインコメントは、GitHub review comments APIを使う：
```bash
gh api "repos/{owner}/{repo}/pulls/<NUMBER>/comments" \
  -f body="<comment>" \
  -f path="<file>" \
  -F line=<line-number> \
  -f side="RIGHT" \
  -f commit_id="$(gh pr view <NUMBER> --json headRefOid --jq .headRefOid)"
```

または、複数のインラインコメントを1つのレビューにまとめて投稿する：
```bash
gh api "repos/{owner}/{repo}/pulls/<NUMBER>/reviews" \
  -f event="COMMENT" \
  -f body="<overall summary>" \
  --input comments.json  # [{"path": "file", "line": N, "body": "comment"}, ...]
```

### Phase 8 — OUTPUT

ユーザーへ報告する：

```
PR #<NUMBER>: <TITLE>
Decision: <APPROVE|REQUEST_CHANGES|BLOCK>

Issues: <critical_count> critical, <high_count> high, <medium_count> medium, <low_count> low
Validation: <pass_count>/<total_count> checks passed

Artifacts:
  Review: .claude/PRPs/reviews/pr-<NUMBER>-review.md
  GitHub: <PR URL>

Next steps:
  - <判定に応じた文脈的提案>
```

---

## エッジケース

- **`gh` CLIなし**: ローカルのみのレビューにフォールバック（diffを読み、GitHubへの投稿はスキップ）。ユーザーに警告する。
- **乖離したブランチ**: レビュー前に `git fetch origin && git rebase origin/<base>` を提案する。
- **大規模PR (>50ファイル)**: レビュー範囲について警告する。まずsource、次にtests、最後にconfig/docsに集中する。
