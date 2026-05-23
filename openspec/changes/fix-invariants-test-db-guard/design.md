## Context

`apps/api/src/db/seed/invariants.test.ts` は導入コミット `2691523` で「skipIf(DATABASE_URL 未設定) で CI でも壊れない形に組む」意図で作られたが、`./invariants.js` → `../client.js` の **静的 import チェーン** が `describe.skipIf` 評価前に走り、`client.ts` (api-foundation の Requirement で MUST 規定された fail-fast) が throw する。結果として `DATABASE_URL` 未設定環境では `pnpm -r test` が常に 1 file failed で赤になり、コミットメッセージの意図と実装が乖離している。

前段の `add-search-api` で同種の課題 (route テストが DB に依存しない / 統合テストは DB が必須) を **「dynamic import + `beforeAll`」パターン** で解決済み (`apps/api/src/repositories/pokemon.real.test.ts` および `apps/api/src/app-smoke.test.ts`)。本 change は同じテンプレートを `invariants.test.ts` にも適用して、コミットメッセージの意図通りに動かす。

## Goals / Non-Goals

**Goals:**

- `DATABASE_URL` 未設定環境でも `apps/api/src/db/seed/invariants.test.ts` がモジュールロード時に落ちず、`describe.skipIf` が想定通り describe ブロックを skip する
- `DATABASE_URL` 設定済み環境では従来通り `collectInvariantViolations()` を呼び全 invariant を検証する (振る舞い変更なし)
- リポジトリ内の「DB 依存テストの guard パターン」を 1 種類に統一する (`pokemon.real.test.ts` / `app-smoke.test.ts` と同テンプレート)

**Non-Goals:**

- `apps/api/src/db/client.ts` の fail-fast (`throw new Error('DATABASE_URL is required')`) の廃止
  - `openspec/specs/api-foundation/spec.md` の Requirement「DATABASE_URL が必須」で MUST 定義済み、修正は spec 違反になるため触らない
- vitest setup / `vitest.config.ts` の `env` で `DATABASE_URL` を強制設定
  - `apps/api/src/db/client.test.ts` が `delete process.env.DATABASE_URL` で fail-fast 自体をテストしているため、テスト全体に env を被せると壊れる
- 同種の他テスト基盤改善 (memory `project_fix_invariants_test_db_guard.md` に列挙された PR #102 Minor 1 の正規表現 `.` 改行不一致リスクなど)
  - 別 change として独立起票する
- `invariants.ts` 本体 (シード適用後 DB に対する 8 種の不変条件チェック) のロジック変更
  - 振る舞い保持のため触らない

## Decisions

### Decision 1: 「dynamic import + `beforeAll`」テンプレートで統一する

**選択**: `describe.skipIf(SHOULD_SKIP)` 配下の `beforeAll` 内で `await import('./invariants.js')` する形に書き換える。型は `typeof import('./invariants.js').collectInvariantViolations` で取り出す (`import type` 同等で実行時影響なし)。

```ts
const SHOULD_SKIP = process.env.DATABASE_URL === undefined;

describe.skipIf(SHOULD_SKIP)('domain invariants (seed 適用後)', () => {
  let collectInvariantViolations: typeof import('./invariants.js').collectInvariantViolations;

  beforeAll(async () => {
    ({ collectInvariantViolations } = await import('./invariants.js'));
  });

  it('全ての不変条件をパスする (...)', async () => {
    const violations = await collectInvariantViolations();
    expect(violations).toEqual([]);
  });
});
```

**理由**:

- `describe.skipIf` が SHOULD_SKIP=true のとき `beforeAll` と `it` をまるごと skip するため、`./invariants.js` → `./client.js` 連鎖の throw が発火しない
- 同じテンプレートが既に `apps/api/src/repositories/pokemon.real.test.ts` と `apps/api/src/app-smoke.test.ts` で動いており、リポジトリ内のパターンを 1 つに揃えられる
- `typeof import('...').sym` は **型注釈の文脈での import 式** で、実行時の値読み込みは発生しない (TS の型システム内で完結)。よって SHOULD_SKIP=true でも throw しない

**代替案**:

- **A**: `vi.mock('../client.js', () => ({ db: stub }))` で client を差し替える
  - 不採用。本テストは「seed 適用後の DB に対して invariant を検査する」のが目的で、`db` をモックすると意味が消える (= テスト無効化)
- **B**: `vitest.config.ts` の `env` で `DATABASE_URL` のデフォルトを設定
  - 不採用。`client.test.ts` が `delete process.env.DATABASE_URL` で fail-fast の挙動自体を検証しているので、テスト基盤レベルで env を被せると壊れる
- **C**: `client.ts` を遅延初期化 (`getDb()` factory) に変える
  - 不採用。`api-foundation/spec.md` の Requirement「`db/client.ts` を読み込む時点で `DATABASE_URL` 未設定なら例外」を変更することになり、本 change のスコープを大幅に超える

### Decision 2: spec は触らない

**選択**: `openspec/specs/domain-seed/spec.md` の Requirement「Invariant Tests による不変条件検証」を MODIFIED せず、proposal にも Modified Capabilities として記載しない。

**理由**:

- 当該 Requirement は「invariants.test.ts が以下の不変条件をすべて検証しなければならない (MUST)」と規定しており、**`DATABASE_URL` 未設定時の挙動には言及していない**
- 振る舞いは「設定時は全 invariant 検証 / 未設定時は skip」で変わらない (skip 挙動は元コミットの意図でもある)
- spec 変更なしで仕様準拠が保たれるため、proposal の Capabilities セクションを空に保てる

## Risks / Trade-offs

- **Risk**: `typeof import('...')` 構文を使ったことのない開発者が読むとパターンを誤解する可能性
  - **Mitigation**: コメントで「`typeof import('...')` は型注釈、実行時の値ロードはなし」を明記する (既に `pokemon.real.test.ts` のコメントで同様の説明を入れている)
- **Trade-off**: `beforeAll` での動的 import 1 回分のテストスタートアップオーバヘッドが入る (ms オーダ、計測不要レベル)
- **Risk**: 仮に将来 `invariants.ts` 側の import チェーンが `client.ts` を経由しなくなった場合、guard 自体が不要になる
  - **Mitigation**: 今この時点で必要、将来不要になったら撤去する (YAGNI)

## Migration Plan

1. `apps/api/src/db/seed/invariants.test.ts` を「dynamic import + `beforeAll`」テンプレートで書き換える
2. `DATABASE_URL` 未設定で `pnpm --filter @pokedex/api test`：当該 file が **skip** されることを確認 (1 file fail → 0 file fail)
3. `DATABASE_URL` 設定済み + Supabase ローカル起動 + シード投入で `pnpm --filter @pokedex/api test`：当該テストが緑であることを確認 (振る舞い保持)
4. `pnpm -r typecheck` / `pnpm lint` / `pnpm format:check` がすべて緑であることを確認
5. ロールバック: 1 ファイルの変更のため、不具合があれば `git revert` で即座に戻せる

## Open Questions

なし。
