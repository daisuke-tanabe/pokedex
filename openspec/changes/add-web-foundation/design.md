## Context

`apps/web` は現状 `package.json` と空の `src/index.ts` しか存在せず、ユーザに見せられる Web アプリケーションが無い。一方 `apps/api` は Hono ベースの REST API として動作しており、後続の検索 UI / 詳細 UI を実装するには「Next.js が起動し、`apps/api` に到達でき、テストが回る」という最小基盤が必要。本 change ではこの基盤を一括で立ち上げる。

事前 explore で技術選定の主要分岐 (Next.js 接続方式 / バージョン / UI / テスト / TDD タグ / データ取得層 / バリデーション / i18n / ディレクトリ構造) を議論し、すべての決定事項を本 design.md に Decision として記録する。検索 UI / 詳細 UI / Cache Components の本番適用 / TanStack Query / locale routing は本 change ではスコープ外とし、後続 change で扱う。

技術的制約として留意するもの:

- `apps/api` は別プロセスで動作し、`AppType` を `import type` で web 側に提供している (api-foundation spec で確定済み)
- `@pokedex/contracts` の Valibot schema / Envelope / Locale / ErrorCode はそのまま使い回す
- `pnpm-workspace.yaml` の `minimumReleaseAge: 4320` (3 日) ゲートにより、新しすぎる依存パッケージは install できない (Next.js 16.x / React 19.x は十分枯れている)
- Vitest + Next.js 16 + RSC レンダリング + MSW v2 の組み合わせは執筆時点で公式パスが完全に枯れているとは言えない (技術調査が必要、Open Questions に明記)

## Goals / Non-Goals

**Goals:**

- `pnpm --filter @pokedex/web dev` で Next.js 16 dev サーバが `port 3001` で起動する
- `pnpm --filter @pokedex/web test` で Vitest が起動し、ユニット / インテグレーションテストが実行できる
- `http://localhost:3001/api/health` を叩くと、内部で Hono の `/health` を呼んだ結果が `@pokedex/contracts` の envelope 形式で返る (200 success or 503 failure)
- `turbo run dev` でルートから `apps/api` + `apps/web` が並走で起動する
- 後続 change (`add-web-search-ui` 等) が「foundation が動く」前提で安心して着手できる状態を作る
- 規約 (ディレクトリ構造 / 命名 / バリデーション / Scenario タグ) を `design.md` に明文化し、後続 change で迷いを減らす

**Non-Goals:**

- 検索 UI / 詳細 UI / 一覧 page (別 change `add-web-search-ui` / `add-web-detail-ui`)
- Cache Components の本番適用 (`"use cache"` / `cacheLife` / `cacheTag`)
- TanStack Query / `QueryClientProvider` (Client fetch の場面が無いため別 change で導入)
- locale routing (`[locale]/` ディレクトリ / `middleware.ts`)
- CORS middleware (`hono/cors`)。本 change は RSC + Route Handler からの fetch のみ
- Hono 本番 host の確定 (デプロイ用 change で別途)
- 認証 / セッション / Cookie / SSR ヘッダ操作
- 404 / `error.tsx` のデザイン拡張

## Decisions

### Decision 1: Next.js と Hono は別プロセス、接続は HTTP fetch + hc<AppType>

**選択**: Next.js を独立した Node プロセスとして動かし、`apps/api` (Hono) には HTTP 越しに `hc<AppType>` クライアントで接続する。

**代替案**:

- (A) Hono を Next.js Route Handler の中で `app.fetch` 経由で呼ぶ (同一プロセス)
- (B) Repository 層を web から直 import し、Hono をスキップして DB に直アクセス

**選定理由**:

- `api-foundation` spec が「`AppType` を web/mobile から `import type` で参照」と明言済 → 別プロセス前提で設計されている
- mobile アプリが将来同じ API を叩く前提と整合 (mobile から in-process は無理)
- Hono / Drizzle / Repository 層 (real / mock の二層運用) を真実源として維持できる
- 本番形態 (web=Vercel, api=Hono on Cloud Run/Render/etc.) とローカル形態 (2 プロセス並走) が一致するため、デプロイ時の挙動ズレが起きにくい

**トレードオフ**: ローカル開発時に 2 プロセスを並走させる必要があるが、`turbo run dev` で自動化できるため負担は最小。SSR 1 リクエスト毎に web → api のネットワーク往復が走るが、Cache Components ベースの後続 change でほぼゼロに圧縮できる見込み。

### Decision 2: Next.js 16.x + Cache Components 対応の枠組みは入れるが、本 change では本番適用しない

**選択**: `next@^16` をインストールし、Cache Components が動かせる状態にする。ただし本 change の `app/page.tsx` / `app/layout.tsx` には `"use cache"` ディレクティブを使わず、検索 UI を作る後続 change で本番試用を開始する。

**代替案**:

- (A) `app/page.tsx` で軽く `"use cache"` を試す
- (B) Cache Components の入った Next.js 16 は使わず、Next.js 15.x で起動する
- (C) `/api/health` route の中で `fetch(..., { next: { revalidate: ... } })` を試す

**選定理由**:

- Cache Components は CWV と「初回表示の高速化」を担保する中核機能 (explore で合意済) → Next 16 が前提
- 一方で本 change では検索 UI / 一覧 page が無く、`"use cache"` を試せる「意味のあるデータ取得」が存在しない → 過剰試用は YAGNI
- ヘルスチェックは外部監視ツールが定期的に叩く dynamic endpoint であるべきで、`"use cache"` を付けるとセマンティクスが壊れる
- 検索 UI を作る change で `"use cache"` + `cacheLife("hours")` + `cacheTag(...)` を本番運用パターンとして深く設計する方が、design の質が高まる

**トレードオフ**: 本 change 完了時点では「Cache Components が動く証拠」が無い (依存だけ入った状態)。ただし Next 16 自体が安定リリース済み & Cache Components は stable 機能なので、後続 change で初回試用時に大きな詰まりは想定しない。

### Decision 3: UI 基盤は Tailwind + shadcn/ui (own code モデル)

**選択**: Tailwind CSS と shadcn/ui を採用。shadcn の CLI で初期化し、`components.json` を作成。`button.tsx` / `input.tsx` 等を `src/components/ui/` に出力する。

**代替案**:

- (A) Tailwind 単体 + 自前コンポーネント
- (B) CSS Modules + 完全自前
- (C) Mantine / MUI / Chakra UI 等の CSS-in-JS 系 UI ライブラリ

**選定理由**:

- shadcn は **own code** モデルなのでロックインが無く、コードが手元にあるため a11y や型を自由にカスタマイズできる
- ポケモン図鑑で必要になる UI (Input / Combobox / Sheet / Switch / Card) が shadcn にぴったり揃っている
- skill (`shadcn` / `accessibility` / `frontend-design` / `vercel-react-best-practices`) で運用ナレッジが既に整備済 → チーム再現性が高い (CLAUDE.md 原則と整合)
- Radix UI ベースで WCAG 2.2 AA がベースラインで担保される
- Tailwind config に集約されたデザイントークンは、将来 React Native (mobile) に持っていく余地がある

**トレードオフ**: 一部の Radix コンポーネント (Dialog / Sheet / Combobox) は `"use client"` 強制 → 検索フォーム / モーダルは Client Component として設計する必要がある。本 change では shadcn の `button.tsx` / `input.tsx` 等 2-3 個に絞り、Client / Server 境界の本格設計は検索 UI 改装で行う。

### Decision 4: テスト基盤は Vitest + @testing-library/react + jsdom + MSW v2、Integration は L3

**選択**: 

- フレームワーク: Vitest (catalog 経由、`apps/api` と同じバージョン)
- ライブラリ: `@testing-library/react` + `@testing-library/jest-dom` + `@testing-library/user-event` + `jsdom`
- HTTP モック: MSW v2 (`@mswjs/msw@^2`)
- Integration の境界: **L3 (fetch を MSW でモック + RSC レンダリング)** — Page 全結合 (L4) や Playwright (L5) は本 change のスコープ外
- Scenario タグ: `[unit]` / `[integration]` (update-tdd-tags で導入済の規約に従う)
- 判定基準: fetch / 外部 I/O / プロセス起動 / RSC レンダリング / DB アクセスを伴うなら `[integration]`、それ以外は `[unit]`

**代替案**:

- (A) Vitest browser mode (実ブラウザでテスト)
- (B) Jest + React Testing Library
- (C) Playwright Component Testing (CT) を Integration として使う

**選定理由**:

- `apps/api` と同じ Vitest を使うことで monorepo のテストランナーを統一できる (catalog の `vitest: 4.x` を流用)
- jsdom は軽量で CI でも安定 (browser mode は環境差分があり flaky になりやすい)
- MSW v2 は Service Worker / Node 両対応で、Vitest setup file から `setupServer` で簡単に起動できる
- RSC のテストは執筆時点で公式パスが安定していないが、`app/api/health/route.ts` (Route Handler) のテストは「Request を作って Handler に渡す」標準パターンで書けるため Integration テストとして実装可能
- Playwright Component Testing は Vitest + RTL より重く、CT の機能は今回不要

**トレードオフ**:

- RSC のレンダリングテスト (例: `app/page.tsx` を render して結果を assert) は本 change で技術調査タスクとして扱う。検索 UI 改装で本格採用する場合に確立する。
- MSW v2 + Vitest + Next 16 の組み合わせは執筆時点で公式 example が薄いため、setup でハマる可能性あり (Open Questions に明記)

### Decision 5: ヘルスチェックは Route Handler (`app/api/health/route.ts`) で実装

**選択**: ヘルスチェックを **Server Component (`app/health/page.tsx`)** ではなく **Route Handler (`app/api/health/route.ts`)** として実装する。`GET /api/health` で内部で `serverApiClient` 経由で Hono の `/health` を呼び、Hono に到達できれば 200 + `successEnvelope({ status: 'ok' })`、到達失敗なら 503 + `errorEnvelope('INTERNAL_ERROR', ...)` を返す。

**代替案**:

- (A) `app/health/page.tsx` (Server Component) で HTML として表示
- (B) `/api/health` を全く作らず、Vercel / 外部監視ツールの設定だけで health 監視する

**選定理由**:

- ヘルスチェックは「機械可読 (JSON) でかつ外部監視ツール (Vercel Monitoring / UptimeRobot 等) が叩ける」ものであるべき → Route Handler が筋
- Server Component で HTML を返してもブラウザで人間が見るだけになり、運用上の価値が薄い
- `@pokedex/contracts` の `envelopeSchema` を返すことで、API 側のレスポンス形式と整合する (web 側の Route Handler も「契約」に従う)
- `curl http://localhost:3001/api/health` で素早く健康診断ができ、開発体験も良い

**トレードオフ**: 本 change で `"use cache"` を試す場が無くなる (ヘルスチェックは dynamic であるべきなので cache 不可)。これは Decision 2 で「`"use cache"` の本番試用は検索 UI 改装で扱う」と整合済。

### Decision 6: データ取得層は Server=Next 標準 fetch / Client=TanStack Query。`hc<AppType>` を単一ソースとして両方で使う

**選択**:

- Server Component から API を呼ぶ場合: **Next.js 標準の `fetch` (`globalThis.fetch`)** を使う。`hc<AppType>` ラッパは内部で `fetch` を使うため互換あり。Cache 制御は `init.next.revalidate` / `init.next.tags` を `hc` の第二引数経由で渡す
- Client Component から API を呼ぶ場合: **TanStack Query (`@tanstack/react-query`)** を使い、`useQuery` / `useMutation` の `queryFn` 内で `hc` 経由で API を呼ぶ
- `lib/api-client.ts` に **`createApiClient(baseUrl)` factory** と **`serverApiClient` 既定インスタンス** を export。Server 用は `process.env.API_URL`、Client 用は将来 `NEXT_PUBLIC_API_URL` (本 change では未使用) を baseUrl とする
- 本 change では **TanStack Query は導入しない** (Client から fetch する page が無い)。`add-web-search-ui` で導入し、Server-side prefetch / hydration boundary を深く設計する

**代替案**:

- (A) Server / Client 両方で TanStack Query を使う (Server も `prefetchQuery` 経由)
- (B) Server / Client 両方で `swr` を使う
- (C) Server は素の `fetch` + 自前 URL 組み立て、Client は `hc<AppType>` (二重実装)
- (D) 本 change で `QueryClientProvider` だけ入れて future-proof にする

**選定理由**:

- Next.js は Server Component の `fetch` を deduplication + cache する標準機構を持っており、それに乗るのが最も素直
- TanStack Query は Client 側の「キャッシュ + リアルタイム更新 + フォーム送信」に強く、Server 側の prefetch とも統合できる (`dehydrate`/`hydrate`)。後続 change で力を発揮する
- `hc<AppType>` を single source として使うことで、HTTP path / method / body / response の型推論を Server / Client 両方で共有できる (DRY)
- 本 change で `QueryClientProvider` を入れても useQuery を使う page が無いため、動作確認できず YAGNI

**トレードオフ**: 本 change で `lib/api-client.ts` に `createApiClient` factory を作るが、本 change で実利用するのは `serverApiClient` (Route Handler の health から) のみ。`createApiClient` の export は将来準備として位置づける。

### Decision 7: URL パラメータバリデーションは Valibot 統一、shared-contracts の schema を web 側で再利用

**選択**:

- Server Component の `searchParams` (例: `?pokedex=paldea&types=fire,flying`): `v.safeParse(pokemonListQuerySchema, await searchParams)` で検証
- Route Handler の `Request.url`: `@hono/valibot-validator` を使う (本 change では `/api/health` はパラメータ無しなので未使用、後続 change で適用)
- 失敗時の挙動 (規約):
  - シンプルにフォールバック可能 (例: `limit` が範囲外) → defaults に倒す
  - 構造が壊れている / 存在しない slug → `next/navigation` の `notFound()` で 404
  - 予期しない例外 → `throw` して `error.tsx` で捕捉

**代替案**:

- (A) Zod で web 側独自に定義
- (B) バリデーションせず、`any` として扱う
- (C) 失敗を全部 `notFound()` で 404 にする (defaults フォールバックを省略)

**選定理由**:

- `@pokedex/contracts` の Valibot schema (`pokemonListQuerySchema` 等) を **single source** として使い回せる → api と web で検証ロジックが二重化しない
- Zod 追加はバンドル増 + 二重管理。既存依存 (Valibot) のみで完結する
- 失敗時の二段構え (フォールバック or notFound) は、UX を壊さず堅牢にする標準パターン

**トレードオフ**: 本 change ではバリデーションを **実装する場面が無い** (検索 page が無いため)。本 change では規約のみ design に明記し、実装は後続 change で行う。

### Decision 8: i18n routing (`[locale]/` ディレクトリ / `middleware.ts`) は本 change では入れない

**選択**: `app/layout.tsx` / `app/page.tsx` / `app/api/health/route.ts` はすべて `app/` 直下に置き、`[locale]/` prefix や `middleware.ts` は導入しない。`shared-contracts` の `Locale` enum も web 側では未使用とする。

**代替案**:

- (A) 本 change で `[locale]/` 構造を導入 (将来準備)
- (B) `middleware.ts` で `Accept-Language` ヘッダから locale を推定し redirect

**選定理由**:

- 本 change では `page.tsx` (Hello world) と `api/health/route.ts` (locale 無関係) しか作らないため、locale routing を入れても動作確認手段が薄い
- 最初の「ユーザに見せる page」(検索 page) を作る `add-web-search-ui` で `[locale]/` を導入する方が、UX 含めて深く議論できる
- 検索 page を作る change の時点で page 数はまだ少ないので、後から `[locale]/` 配下に移す移行コストもほぼゼロ

**トレードオフ**: 本 change 完了時点で i18n の枠組みが見えないが、後続 change で `[locale]/` を導入する設計余地は完全に残っている。

### Decision 9: ディレクトリ構造と命名規約

**選択** (ディレクトリ構造):

```
apps/web/
├── components.json              shadcn 設定 (出力先 / style)
├── tailwind.config.ts
├── postcss.config.mjs
├── next.config.ts
├── vitest.config.ts
├── vitest.setup.ts
├── package.json
├── tsconfig.json                既存 (paths: @/* → ./src/*)
└── src/
    ├── app/
    │   ├── layout.tsx           RSC, html/body + globals.css
    │   ├── page.tsx             RSC, 簡素な top page
    │   ├── globals.css          Tailwind directives
    │   └── api/
    │       └── health/
    │           └── route.ts     Route Handler (GET), dynamic
    ├── components/
    │   └── ui/                  shadcn 出力先 (own code)
    ├── lib/
    │   ├── api-client.ts        hc<AppType> ラッパ
    │   └── utils.ts             cn() (shadcn 規約)
    └── test/
        └── msw/
            ├── handlers.ts
            └── server.ts
```

**選択** (命名規約):

- React コンポーネント (.tsx): **kebab-case** (`pokemon-card.tsx`、shadcn 規約に揃える)
- 非コンポーネント utility (.ts): **camelCase** (`apiClient.ts` ではなく `api-client.ts` — シンプル統一のため最終的に kebab-case にする方針も検討。explore では「`.ts` は camelCase」としていたが shadcn / Next 慣習との整合性から `.tsx`/`.ts` ともに kebab-case に統一する方が読みやすい)
- hook (.ts): `use-*` prefix (`use-debounce.ts`)
- test ファイル: `*.test.ts(x)` (`testing-style` skill 準拠)
- 特殊ファイル: Next 規約 (`layout.tsx` / `page.tsx` / `route.ts` / `error.tsx`)
- alias: `@/* → ./src/*` (既存 `tsconfig.json` のまま)

**選定理由**:

- shadcn が `components/ui/` 配下を kebab-case で出力するため、全 `.tsx` を kebab-case にすると一貫性が高まる
- `.ts` も合わせて kebab-case にすることで「ファイル名は kebab-case」の単一ルールで判別が容易
- `app/` を `src/` 配下に置くのは Next.js 公式推奨の `src/` レイアウト (将来的なツール拡張で `src/` 配下を target にしやすい)
- `lib/` と `test/` を分けることで、本番コードとテストインフラ (MSW handlers) が明確に分離される

**トレードオフ**: `apps/api` の既存ファイル名 (`server.ts` / `pokemon.ts` / `pokemon.real.ts` 等) は camelCase 寄りで、web 側の kebab-case と命名規約が分かれる。これは「API は Node 慣習、Web は React/Next 慣習」と割り切る。後で必要なら別 change で統一する。

### Decision 10: ポート 3001 (web) / 3000 (api 既存) と環境変数 `API_URL` (非 public)

**選択**:

- **ポート**: api=3000 (既存 spec 維持) / web=3001 (Next.js dev で `--port 3001`)
- **環境変数**: `API_URL=http://localhost:3000` を `.env.development` に追記 (コミット対象、非機密)
- `NEXT_PUBLIC_API_URL` は **本 change では追加しない** (Client から fetch する場面が無いため)
- `API_URL` は **Server Component / Route Handler からのみ参照**。bundle に値が露出しないため、内部 API URL のセキュリティ的なリスクを抑える

**代替案**:

- (A) web=3000 (Next 慣習) / api=3001 に変更 → api-foundation spec 改修が必要
- (B) `NEXT_PUBLIC_API_URL` を最初から追加
- (C) `API_URL` を `.env.development` に置かず、各開発者が `.env.local` で個別設定

**選定理由**:

- api の既存 spec を変えないのが最小差分
- 内部 API URL を bundle に露出しないのは default で安全側に倒した方が良い
- ローカル既定値 (`http://localhost:3000`) は機密ではないので `.env.development` (コミット対象) に置くのが既存の方針と整合 (monorepo-foundation spec の「ローカル既定値の環境変数ファイル」Requirement に従う)

**トレードオフ**: web の dev URL が `localhost:3001` になり、Next.js のデフォルト 3000 と異なるが、`README.md` に明記すれば混乱は最小。

### Decision 11: CORS 対応 (`hono/cors`) は本 change のスコープ外

**選択**: 本 change では `hono/cors` middleware を `apps/api` に追加しない。

**代替案**: 

- (A) 将来の Client fetch に備えて、本 change で `hono/cors` を入れて Origin 許可を設定する

**選定理由**:

- 本 change のアクセスパスは「RSC / Route Handler (Node サーバ間通信) → Hono」のみ。サーバ間通信なので Origin ヘッダなし、CORS 不要
- Client Component から直接 Hono を叩く場面が出る change で `hono/cors` middleware を追加するのが最小差分

**トレードオフ**: なし。CORS が必要な時点で別 change で追加すれば良い (api-foundation spec の変更を伴うため、適切な change で扱うべき)。

## Risks / Trade-offs

- **[Risk] Vitest + Next 16 + RSC レンダリング + MSW v2 の組み合わせ確立度** → 執筆時点で公式 example が薄い。本 change のテスト基盤セットアップで詰まる可能性。技術調査タスクとして tasks.md に明記し、もし RSC レンダリングが安定しない場合は Route Handler テストのみで Integration を成立させる (foundation の責務は「テストが回ること」なので、RSC レンダリングは後続 change で確立しても OK)
- **[Risk] shadcn CLI の自動初期化と既存 tsconfig.json の整合** → shadcn CLI が `components.json` 生成時に `tsconfig.json` の paths を読みに行く。`@/*` alias が既存と一致していれば問題なし
- **[Risk] Tailwind 4 (alpha/beta) vs Tailwind 3 (stable)** → 執筆時点で Tailwind 4 は別アーキテクチャ (Lightning CSS ベース、postcss 不要)。shadcn の公式 setup が Tailwind 4 に追従しているか確認が必要。安定優先で **Tailwind 3** を採用、Tailwind 4 への移行は別 change
- **[Risk] Next 16 と React 19 の peer deps 整合** → Next 16 は React 19 を要求。`shared-contracts` (Valibot) や `apps/api` (Hono) には React 依存が無いため衝突しない
- **[Risk] `apps/web/src/index.ts` 削除によるツール側の混乱** → 既存ファイルは空の placeholder。削除しても他から import されていない (Read で確認済)
- **[Trade-off] foundation のみでユーザに見せられるものが「Hello world」と `/api/health` の JSON だけ** → 「動く foundation」を完成させることが目的なので許容。検索 UI が後続 change で出てくる

## Migration Plan

1. **依存追加** — `apps/web/package.json` に Next 16 / React 19 / Tailwind 3 / shadcn 関連 / Vitest 等を追加し `pnpm install`
2. **設定ファイル作成** — `next.config.ts` / `tailwind.config.ts` / `postcss.config.mjs` / `vitest.config.ts` / `vitest.setup.ts` / `components.json`
3. **App Router 初期構造** — `src/app/layout.tsx` / `src/app/page.tsx` / `src/app/globals.css` を作成、`src/index.ts` を削除
4. **shadcn 初期化** — `pnpm dlx shadcn@latest init` で components.json と `src/lib/utils.ts` (`cn()`) を生成、`button.tsx` / `input.tsx` 等 2-3 個を追加
5. **API クライアント** — `src/lib/api-client.ts` に `createApiClient` factory + `serverApiClient` を実装
6. **Route Handler ヘルスチェック** — `src/app/api/health/route.ts` を実装し、Hono の `/health` を呼び出してエンベロープで返す
7. **MSW セットアップ** — `src/test/msw/handlers.ts` (Hono `/health` 用 200 / 503 ハンドラ) + `src/test/msw/server.ts`
8. **テスト追加** — Route Handler の Integration テスト ([integration])、`createApiClient` / `cn()` の Unit テスト ([unit])
9. **環境変数** — `.env.development` に `API_URL=http://localhost:3000` を追記
10. **scripts 整備** — `apps/web/package.json` の `scripts` に `dev` (`next dev -p 3001`) / `build` / `test` / `typecheck` / `lint` / `format` / `format:check` を追加
11. **動作確認** — `pnpm install` → `pnpm --filter @pokedex/api dev` 起動 → `pnpm --filter @pokedex/web dev` 起動 → `curl http://localhost:3001/api/health` で 200 + envelope を確認
12. **テスト確認** — `pnpm --filter @pokedex/web test` で全テストが pass
13. **monorepo-foundation spec の更新** — apps/web 関連の Requirement を追加 (本 change の delta spec)

**ロールバック**: `apps/web/` 配下の追加ファイルを削除し `apps/web/package.json` を旧状態に戻すだけ。`apps/api` / `packages/contracts` には変更を加えないため、api 側の動作は保証される。

## Open Questions

- **RSC + Vitest + MSW v2 の組み合わせがどこまで動くか** → 本 change では `app/api/health/route.ts` の Route Handler テストで Integration を成立させる。`app/page.tsx` の RSC レンダリングテストは技術調査タスクとして tasks.md に積み、安定パターンが見つからなければ次 change に持ち越す
- **Tailwind 4 への移行タイミング** → 本 change では Tailwind 3 を採用。shadcn の公式が Tailwind 4 setup を完全サポートしたタイミングで別 change で移行
- **`API_URL` の本番値** → Hono の本番 host が確定したタイミング (デプロイ用 change) で `Vercel` 環境変数に注入する手順を spec 化する
- **`createApiClient` factory の Client 側使用** → 本 change では Server (`serverApiClient`) のみ使用。Client 側で hc<AppType> を使う最初の change で `NEXT_PUBLIC_API_URL` の導入とセットで設計する
