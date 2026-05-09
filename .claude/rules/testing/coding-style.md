---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "**/*.spec.ts"
  - "**/*.spec.tsx"
  - "**/*.test.js"
  - "**/*.test.jsx"
  - "**/*.spec.js"
  - "**/*.spec.jsx"
---
# テスト コーディングスタイル

## テストの種類

- ユニット・統合テスト（関数・モジュール単位、振る舞いを検証）
- E2E テスト（クリティカルなユーザーフロー）

## テスト構造（AAA パターン）

Arrange / Act / Assert の 3 ブロックを明示的に分け、何を準備し、何を実行し、何を検証しているかを読み取れるようにする。

```typescript
test('calculates similarity correctly', () => {
  // Arrange
  const vector1 = [1, 0, 0]
  const vector2 = [0, 1, 0]

  // Act
  const similarity = calculateCosineSimilarity(vector1, vector2)

  // Assert
  expect(similarity).toBe(0)
})
```

## テスト名

期待する振る舞いと境界条件が伝わる説明的な名前にする。テスト名だけで何が起きるかわかることを目指す。

```typescript
// PASS: GOOD: 説明的なテスト名
test('returns empty array when no markets match query', () => { })
test('throws error when OpenAI API key is missing', () => { })
test('falls back to substring search when Redis unavailable', () => { })

// FAIL: BAD: 曖昧なテスト名
test('works', () => { })
test('test search', () => { })
```
