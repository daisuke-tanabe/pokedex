# テストの失敗対応とアンチパターン

## テスト失敗時のトラブルシューティング

テストが失敗した場合は以下の順序で原因を切り分ける:

1. **テストの独立性を確認** — 他のテストが残した状態に依存していないか、共有ステート／グローバル変数のリークがないか
2. **モックを確認** — 外部依存（DB / API / 時刻 / ランダム）のモック設定がテストの期待動作と一致しているか
3. **実装を修正する** — 修正対象は **実装側**。例外は下記 CRITICAL を参照

## CRITICAL: テストをグリーンにするためにテストを書き換えない

これは TDD の根幹を破壊するアンチパターン。テストは仕様であり、実装が仕様に追従するべき。テストを書き換えてグリーンにした瞬間、テストは「実装の追認」になり **バグ検出能力を失う**。

仕様自体が変わった場合のみ、変更理由をコミットメッセージで明示してテストを更新する。

## 避けるべきよくあるテストミス

### 実装詳細をテストする

```typescript
// FAIL: Don't test internal state
expect(component.state.count).toBe(5)

// PASS: Test what users see
expect(screen.getByText('Count: 5')).toBeInTheDocument()
```

内部状態をテストすると、リファクタの度にテストが壊れる。ユーザーが観測できる振る舞いをテストする。

### 壊れやすいセレクタ

```typescript
// FAIL: Breaks easily on style changes
await page.click('.css-class-xyz')

// PASS: Resilient semantic / data attribute selectors
await page.click('button:has-text("Submit")')
await page.click('[data-testid="submit-button"]')
```

### テスト独立性の欠如

```typescript
// FAIL: Tests depend on each other
test('creates user', () => { /* ... */ })
test('updates same user', () => { /* depends on previous test */ })

// PASS: Each test sets up its own data
test('creates user', () => {
  const user = createTestUser()
  // Test logic
})

test('updates user', () => {
  const user = createTestUser()
  // Update logic
})
```

各テストは独立して実行可能でなければならない。順序依存はテストランナーの並列実行で破綻する。

### その他のスメル

- **過度なモック** — 自分のコードまでモックすると、テストが何も検証していない状態になる
- **過小なアサーション** — 関数が走り抜けるだけで pass するテスト（実際には何も保証されていない）
- **巨大なテスト** — 1 テストで 10 個のことを検証している。失敗時の原因特定が困難
- **「テストを書き直す」リファクタ** — 仕様が変わっていないのにテストを大幅変更するのは仕様逆走の兆候
