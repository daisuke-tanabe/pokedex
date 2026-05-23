## Why

`apps/api/src/db/seed/invariants.test.ts` は導入時のコミット `2691523` のメッセージに「skipIf(DATABASE_URL 未設定) で CI でも壊れない形に組む」と明記されているが、実装では `./invariants.js` → `../client.js` の静的 import チェーンが `describe.skipIf` の評価より先に走り、`client.ts` の fail-fast (`throw new Error('DATABASE_URL is required')`) で **モジュールロード時に落ちる**。結果として `DATABASE_URL` 未設定のローカル環境で `pnpm -r test` が常に赤くなる。コミットメッセージの **意図** と実装が食い違っているだけで仕様の変更は不要。本 change はこの単一バグを最小差分で修正する。

## What Changes

- **`apps/api/src/db/seed/invariants.test.ts` のパターン変更**
  - 静的 import (`import { collectInvariantViolations } from './invariants.js'`) を廃止し、`describe.skipIf` 配下の `beforeAll` 内で動的 import する形式に揃える
  - `add-search-api` で導入した `pokemon.real.test.ts` / `app-smoke.test.ts` と同じ「dynamic import + `beforeAll`」テンプレートを採用 (一貫性確保)
- **派生効果**
  - `DATABASE_URL` 未設定環境で `pnpm -r test` がローカルでもグリーンになる (`describe.skipIf` が想定通り動く)
  - `DATABASE_URL` 設定済み環境では従来通り全 invariant を検証する (挙動変更なし)
- **触らないもの**
  - `apps/api/src/db/client.ts` の fail-fast 動作 (`api-foundation/spec.md` で MUST 定義済み、テスト側で迂回する)
  - `invariants.ts` 本体 (シード適用後の DB に対するチェックロジック)
  - 仕様ファイル (`openspec/specs/domain-seed/spec.md` には skip 挙動が規定されていない)

## Capabilities

### New Capabilities

なし。

### Modified Capabilities

なし。`openspec/specs/domain-seed/spec.md` の Requirement「Invariant Tests による不変条件検証」は MUST のセマンティクスを変えないため delta spec は不要 (テスト実装の置き換えのみ)。

## Impact

- **変更されるコード**
  - `apps/api/src/db/seed/invariants.test.ts` (1 ファイル、〜10 行差分)
- **追加・削除されるコード**: なし
- **既存仕様の更新**: なし
- **非ゴール (Non-Goals)**
  - `client.ts` の fail-fast 廃止 → spec 違反になるため触らない
  - vitest setup file / `vitest.config.ts` の `env` で `DATABASE_URL` を強制設定 → `client.test.ts` が `delete process.env.DATABASE_URL` でテストしている挙動を壊すため不採用
  - 同種の他テスト基盤改善 (PR #102 Minor 1 の正規表現 `.` 改行不一致リスクなど) → 別 change として独立起票する
- **テスト**
  - `DATABASE_URL` 未設定: 当該 describe が skip されることを確認 (`pnpm -r test` 緑)
  - `DATABASE_URL` 設定済み + Supabase ローカル起動: 既存 invariant が引き続き通ることを確認
- **依存パッケージ**: 追加なし
