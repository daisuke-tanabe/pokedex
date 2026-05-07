---
name: tdd-workflow
description: 新機能の作成、バグ修正、コードのリファクタリング時にこのスキルを使用する。ユニットテスト・統合テスト・E2Eテストを含む80%以上のカバレッジで、テスト駆動開発を強制する。
---

# テスト駆動開発ワークフロー

このスキルは、すべてのコード開発が包括的なテストカバレッジを伴う TDD 原則に従うことを保証する。

## 起動タイミング

- 新機能や機能の作成
- バグや問題の修正
- 既存コードのリファクタリング
- API エンドポイントの追加
- 新コンポーネントの作成

## 中核原則

### 1. コードより先にテスト
必ずテストを先に書き、テストを通すように実装する。

### 2. カバレッジ要件
- 最低 80% のカバレッジ（ユニット + 統合 + E2E）
- すべてのエッジケースを網羅
- エラーシナリオをテスト
- 境界条件を検証

### 3. テストの種類

#### ユニットテスト
- 個別関数・ユーティリティ
- コンポーネントロジック
- 純粋関数
- ヘルパー・ユーティリティ

#### 統合テスト
- API エンドポイント
- データベース操作
- サービス間連携
- 外部 API 呼び出し

#### E2E テスト（Playwright）
- 重要なユーザーフロー
- 完全なワークフロー
- ブラウザ自動化
- UI 操作

### 4. Git チェックポイント
- リポジトリが Git 管理下にあるなら、各 TDD ステージ後にチェックポイントコミットを作成する
- ワークフロー完了までこれらのチェックポイントコミットを squash・rewrite しない
- 各チェックポイントコミットメッセージはステージと取得した正確なエビデンスを記述する
- 現タスクのアクティブブランチで作成されたコミットだけをカウントする
- 他ブランチのコミット、過去の無関係な作業、遠いブランチ履歴のコミットを有効なチェックポイントエビデンスと見なさない
- チェックポイントを満たしたと判断する前に、そのコミットがアクティブブランチの現在の `HEAD` から到達可能で、現タスクの一連に属することを検証する
- 推奨されるコンパクトなワークフロー：
  - 失敗テストを追加して RED を検証したコミット 1 つ
  - 最小限の修正を適用して GREEN を検証したコミット 1 つ
  - リファクタリング完了の任意コミット 1 つ
- テストコミットが明確に RED に対応し、修正コミットが明確に GREEN に対応するなら、別個のエビデンス専用コミットは不要

## TDD ワークフローのステップ

### Step 1: ユーザージャーニーを書く
```
As a [role], I want to [action], so that [benefit]

Example:
As a user, I want to search for markets semantically,
so that I can find relevant markets even without exact keywords.
```

### Step 2: テストケースを生成する
各ユーザージャーニーに対し、包括的なテストケースを作成する：

```typescript
describe('Semantic Search', () => {
  it('returns relevant markets for query', async () => {
    // Test implementation
  })

  it('handles empty query gracefully', async () => {
    // Test edge case
  })

  it('falls back to substring search when Redis unavailable', async () => {
    // Test fallback behavior
  })

  it('sorts results by similarity score', async () => {
    // Test sorting logic
  })
})
```

### Step 3: テストを実行する（失敗するはず）
```bash
npm test
# Tests should fail - we haven't implemented yet
```

このステップは必須であり、すべての本番コード変更に対する RED ゲートである。

ビジネスロジックや本番コードを変更する前に、次のいずれかの経路で有効な RED 状態を検証しなければならない：
- ランタイム RED：
  - 対象テストターゲットが正常にコンパイルされる
  - 新規・変更テストが実際に実行される
  - 結果が RED である
- コンパイルタイム RED：
  - 新しいテストがバグのあるコードパスを新たにインスタンス化、参照、実行する
  - コンパイル失敗そのものが意図された RED シグナルである
- いずれの場合も、失敗は意図したビジネスロジックのバグ、未定義動作、未実装によって引き起こされる
- 失敗が、関係のない構文エラー、壊れたテストセットアップ、依存関係の欠如、無関係な回帰のみによって引き起こされていない

書かれただけでコンパイル・実行されていないテストは RED とみなされない。

この RED 状態が確認されるまで、本番コードを編集しない。

リポジトリが Git 管理下にあるなら、このステージが検証された直後にチェックポイントコミットを作成する。
推奨コミットメッセージ形式：
- `test: add reproducer for <feature or bug>`
- 再現テストがコンパイルされ実行されて意図どおり失敗していれば、このコミットは RED 検証チェックポイントを兼ねる
- 続行前に、このチェックポイントコミットが現在のアクティブブランチ上にあることを検証する

### Step 4: コードを実装する
テストを通すための最小限のコードを書く：

```typescript
// Implementation guided by tests
export async function searchMarkets(query: string) {
  // Implementation here
}
```

リポジトリが Git 管理下にあるなら、最小限の修正をステージするが、Step 5 で GREEN が検証されるまでチェックポイントコミットは保留する。

### Step 5: テストを再度実行する
```bash
npm test
# Tests should now pass
```

修正後に同じ対象テストターゲットを再実行し、以前失敗していたテストが GREEN になっていることを確認する。

有効な GREEN 結果が得られたあとにのみ、リファクタリングに進める。

リポジトリが Git 管理下にあるなら、GREEN が検証された直後にチェックポイントコミットを作成する。
推奨コミットメッセージ形式：
- `fix: <feature or bug>`
- 同じ対象テストターゲットを再実行してパスしたなら、修正コミットは GREEN 検証チェックポイントを兼ねる
- 続行前に、このチェックポイントコミットが現在のアクティブブランチ上にあることを検証する

### Step 6: リファクタリング
テストをグリーンに保ったままコード品質を改善する：
- 重複の除去
- 命名の改善
- パフォーマンスの最適化
- 可読性の向上

リポジトリが Git 管理下にあるなら、リファクタリング完了かつテストが緑のままになった直後にチェックポイントコミットを作成する。
推奨コミットメッセージ形式：
- `refactor: clean up after <feature or bug> implementation`
- TDD サイクル完了とみなす前に、このチェックポイントコミットが現在のアクティブブランチ上にあることを検証する

### Step 7: カバレッジを検証する
```bash
npm run test:coverage
# Verify 80%+ coverage achieved
```

## テストパターン

### ユニットテストパターン（Jest/Vitest）
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './Button'

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click</Button>)

    fireEvent.click(screen.getByRole('button'))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
```

### API 統合テストパターン
```typescript
import { NextRequest } from 'next/server'
import { GET } from './route'

describe('GET /api/markets', () => {
  it('returns markets successfully', async () => {
    const request = new NextRequest('http://localhost/api/markets')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data)).toBe(true)
  })

  it('validates query parameters', async () => {
    const request = new NextRequest('http://localhost/api/markets?limit=invalid')
    const response = await GET(request)

    expect(response.status).toBe(400)
  })

  it('handles database errors gracefully', async () => {
    // Mock database failure
    const request = new NextRequest('http://localhost/api/markets')
    // Test error handling
  })
})
```

### E2E テストパターン（Playwright）
```typescript
import { test, expect } from '@playwright/test'

test('user can search and filter markets', async ({ page }) => {
  // Navigate to markets page
  await page.goto('/')
  await page.click('a[href="/markets"]')

  // Verify page loaded
  await expect(page.locator('h1')).toContainText('Markets')

  // Search for markets
  await page.fill('input[placeholder="Search markets"]', 'election')

  // Wait for debounce and results
  await page.waitForTimeout(600)

  // Verify search results displayed
  const results = page.locator('[data-testid="market-card"]')
  await expect(results).toHaveCount(5, { timeout: 5000 })

  // Verify results contain search term
  const firstResult = results.first()
  await expect(firstResult).toContainText('election', { ignoreCase: true })

  // Filter by status
  await page.click('button:has-text("Active")')

  // Verify filtered results
  await expect(results).toHaveCount(3)
})

test('user can create a new market', async ({ page }) => {
  // Login first
  await page.goto('/creator-dashboard')

  // Fill market creation form
  await page.fill('input[name="name"]', 'Test Market')
  await page.fill('textarea[name="description"]', 'Test description')
  await page.fill('input[name="endDate"]', '2025-12-31')

  // Submit form
  await page.click('button[type="submit"]')

  // Verify success message
  await expect(page.locator('text=Market created successfully')).toBeVisible()

  // Verify redirect to market page
  await expect(page).toHaveURL(/\/markets\/test-market/)
})
```

## テストファイルの構成

```
src/
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx          # Unit tests
│   │   └── Button.stories.tsx       # Storybook
│   └── MarketCard/
│       ├── MarketCard.tsx
│       └── MarketCard.test.tsx
├── app/
│   └── api/
│       └── markets/
│           ├── route.ts
│           └── route.test.ts         # Integration tests
└── e2e/
    ├── markets.spec.ts               # E2E tests
    ├── trading.spec.ts
    └── auth.spec.ts
```

## 外部サービスのモック

### Supabase モック
```typescript
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({
          data: [{ id: 1, name: 'Test Market' }],
          error: null
        }))
      }))
    }))
  }
}))
```

### Redis モック
```typescript
jest.mock('@/lib/redis', () => ({
  searchMarketsByVector: jest.fn(() => Promise.resolve([
    { slug: 'test-market', similarity_score: 0.95 }
  ])),
  checkRedisHealth: jest.fn(() => Promise.resolve({ connected: true }))
}))
```

### OpenAI モック
```typescript
jest.mock('@/lib/openai', () => ({
  generateEmbedding: jest.fn(() => Promise.resolve(
    new Array(1536).fill(0.1) // Mock 1536-dim embedding
  ))
}))
```

## テストカバレッジの検証

### カバレッジレポートの実行
```bash
npm run test:coverage
```

### カバレッジしきい値
```json
{
  "jest": {
    "coverageThresholds": {
      "global": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    }
  }
}
```

## テスト失敗時のトラブルシューティング

テストが失敗した場合は以下の順序で原因を切り分ける：

1. **テストの独立性を確認** — 他のテストが残した状態に依存していないか、共有ステート/グローバル変数のリークがないか（具体的なアンチパターン例は下記「避けるべきよくあるテストミス」参照）
2. **モックを確認** — 外部依存（DB / API / 時刻 / ランダム）のモック設定がテストの期待動作と一致しているか
3. **実装を修正する** — 修正対象は**実装側**（例外は下記 CRITICAL ブロックを参照）

### CRITICAL: テストをグリーンにするためにテストを書き換えない

これは TDD の根幹を破壊するアンチパターン。テストは仕様であり、実装が仕様に追従するべき。テストを書き換えてグリーンにした瞬間、テストは「実装の追認」になりバグ検出能力を失う。

仕様自体が変わった場合のみ、変更理由をコミットメッセージで明示してテストを更新する。

## 避けるべきよくあるテストミス

### FAIL: 実装詳細をテストする
```typescript
// Don't test internal state
expect(component.state.count).toBe(5)
```

### PASS: ユーザーが見える振る舞いをテストする
```typescript
// Test what users see
expect(screen.getByText('Count: 5')).toBeInTheDocument()
```

### FAIL: 壊れやすいセレクタ
```typescript
// Breaks easily
await page.click('.css-class-xyz')
```

### PASS: セマンティックなセレクタ
```typescript
// Resilient to changes
await page.click('button:has-text("Submit")')
await page.click('[data-testid="submit-button"]')
```

### FAIL: テスト独立性なし
```typescript
// Tests depend on each other
test('creates user', () => { /* ... */ })
test('updates same user', () => { /* depends on previous test */ })
```

### PASS: 独立したテスト
```typescript
// Each test sets up its own data
test('creates user', () => {
  const user = createTestUser()
  // Test logic
})

test('updates user', () => {
  const user = createTestUser()
  // Update logic
})
```

## 継続的テスト

### 開発中の Watch モード
```bash
npm test -- --watch
# Tests run automatically on file changes
```

### Pre-Commit Hook
```bash
# Runs before every commit
npm test && npm run lint
```

### CI/CD 統合
```yaml
# GitHub Actions
- name: Run Tests
  run: npm test -- --coverage
- name: Upload Coverage
  uses: codecov/codecov-action@v3
```

## ベストプラクティス

1. **テストを先に書く** — 常に TDD
2. **1テスト1アサート** — 単一の振る舞いに集中する
3. **説明的なテスト名** — 何をテストしているかを説明する
4. **Arrange-Act-Assert** — 明確なテスト構造
5. **外部依存をモックする** — ユニットテストを隔離する
6. **エッジケースをテストする** — null、undefined、空、巨大
7. **エラー経路をテストする** — ハッピーパスだけでない
8. **テストを高速に保つ** — ユニットテストは1件 50ms 未満
9. **テスト後にクリーンアップ** — 副作用を残さない
10. **カバレッジレポートをレビューする** — ギャップを特定する

## 成功指標

- 80% 以上のコードカバレッジを達成
- すべてのテストがパスしている（緑）
- スキップ・無効化されたテストがない
- テスト実行が高速（ユニットテストで 30 秒未満）
- E2E テストが重要なユーザーフローを網羅している
- テストが本番前にバグを捕捉している

---

**忘れるな**：テストはオプションではない。自信を持ってリファクタリングし、迅速に開発し、本番の信頼性を支えるセーフティネットである。
