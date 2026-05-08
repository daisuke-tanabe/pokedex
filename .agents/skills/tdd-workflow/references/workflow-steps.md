# TDD ワークフローの 7 ステップ

## Step 1: ユーザージャーニーを書く

```
As a [role], I want to [action], so that [benefit]

Example:
As a user, I want to search for items semantically,
so that I can find relevant items even without exact keywords.
```

## Step 2: テストケース候補を列挙し、最初の 1 つを書く

各ユーザージャーニーに対し、ハッピーパス・エッジケース・フォールバック・ソート等のテスト候補を**列挙**する（この時点ではコードは書かない）。

```
Semantic Search のテスト候補:
- ハッピーパス: クエリに対して関連アイテムが返る
- エッジケース: 空クエリでもエラーにならず空配列が返る
- フォールバック: キャッシュ不可時に substring 検索に切り替わる
- ソート: 結果が類似度スコア順になる
```

候補リストから **最初の 1 つだけ** を実コードとして書く。最初はハッピーパスを選び、エンドツーエンドの経路を確認するのが定石:

```typescript
describe('Semantic Search', () => {
  it('returns relevant items for query', async () => {
    const results = await searchItems('foo')
    expect(results).toContainEqual(expect.objectContaining({ name: 'foo-bar' }))
  })
})
```

残りの候補は Step 5 で GREEN を確認した後、Step 2 → 3 → 4 → 5 のサイクルを反復しながら **1 つずつ** 書く。すべてを先に書いてから一気に実装する「水平スライシング」はアンチパターン。詳細は `anti-patterns.md`。

## Step 3: テストを実行する（失敗するはず）

```bash
npm test
# Tests should fail - we haven't implemented yet
```

このステップは必須であり、すべての本番コード変更に対する **RED ゲート**。

ビジネスロジックや本番コードを変更する前に、次のいずれかの経路で有効な RED 状態を検証する:

- **ランタイム RED**:
  - 対象テストターゲットが正常にコンパイルされる
  - 新規・変更テストが実際に実行される
  - 結果が RED である
- **コンパイルタイム RED**:
  - 新しいテストがバグのあるコードパスを新たにインスタンス化、参照、実行する
  - コンパイル失敗そのものが意図された RED シグナル
- いずれの場合も、失敗は **意図したビジネスロジックのバグ／未実装** によって引き起こされる
- 失敗が、関係のない構文エラー、壊れたテストセットアップ、依存関係の欠如、無関係な回帰のみによって引き起こされていないこと

書かれただけでコンパイル・実行されていないテストは RED とみなさない。RED 状態が確認されるまで本番コードを編集しない。

リポジトリが Git 管理下なら、このステージが検証された直後にチェックポイントコミットを作成する:

```
test: add reproducer for <feature or bug>
```

再現テストがコンパイルされ実行されて意図どおり失敗していれば、このコミットは RED 検証チェックポイントを兼ねる。続行前に、このコミットが現在のアクティブブランチ上にあることを検証する。

## Step 4: コードを実装する

テストを通すための **最小限のコード**を書く。

```typescript
// Implementation guided by tests
export async function searchItems(query: string) {
  // Implementation here
}
```

最小限の修正をステージするが、Step 5 で GREEN が検証されるまでチェックポイントコミットは保留する。

## Step 5: テストを再度実行する

```bash
npm test
# Tests should now pass
```

修正後に同じ対象テストターゲットを再実行し、以前失敗していたテストが GREEN になっていることを確認する。

GREEN が得られた直後にチェックポイントコミット:

```
fix: <feature or bug>
```

同じ対象テストターゲットを再実行してパスしていれば、修正コミットは GREEN 検証チェックポイントを兼ねる。

## Step 6: リファクタリング

テストをグリーンに保ったままコード品質を改善する:
- 重複の除去
- 命名の改善
- パフォーマンスの最適化
- 可読性の向上

リファクタリング完了かつテストが緑のまま保たれた直後にチェックポイントコミット:

```
refactor: clean up after <feature or bug> implementation
```

## Step 7: カバレッジを検証する

```bash
npm run test:coverage
# Verify 80%+ coverage achieved
```

## Git チェックポイントの原則

- リポジトリが Git 管理下なら、各 TDD ステージ後にチェックポイントコミットを作成する
- ワークフロー完了までこれらのチェックポイントコミットを squash・rewrite しない
- 各コミットメッセージはステージと取得した正確なエビデンスを記述する
- **現タスクのアクティブブランチで作成されたコミットだけ**を有効と見なす（他ブランチや過去の無関係な作業はカウントしない）
- チェックポイントを満たしたと判断する前に、そのコミットがアクティブブランチの現在の `HEAD` から到達可能であることを検証する
- **推奨される最小構成**: RED 検証 1 / GREEN 検証 1 / リファクタ完了任意 1
- テストコミットが明確に RED に対応し、修正コミットが明確に GREEN に対応するなら、別個のエビデンス専用コミットは不要
