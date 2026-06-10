# テスト

信頼性を最大化するため integration / e2e テストに重点を置く。unit テストは共有コンポーネントや単一コンポーネントの複雑なロジックに有効だが、本当の価値は「組み合わさった時にどう動くか」を検証することにある。

## テストの種類

### Unit テスト

個々の部品を独立してテストする。共有コンポーネント、ユーティリティ関数、単一コンポーネント内の複雑なロジックに最適。

```tsx
// components/ui/dialog/confirmation-dialog/__tests__/confirmation-dialog.test.tsx
test("renders confirmation dialog with message", () => {
    render(<ConfirmationDialog title="Delete?" confirmButton={<Button>Yes</Button>} />);
    expect(screen.getByText("Delete?")).toBeInTheDocument();
});
```

### Integration テスト

アプリケーションの各部品が連携して動くかをテストする。テスト工数の大半はここに割く。

```tsx
// app/routes/app/discussions/__tests__/discussion.test.tsx
test("user can create and view a discussion", async () => {
    render(<DiscussionPage />);

    await userEvent.click(screen.getByRole("button", { name: /create/i }));
    await userEvent.type(screen.getByLabelText(/title/i), "New Discussion");
    await userEvent.click(screen.getByRole("button", { name: /submit/i }));

    expect(await screen.findByText("New Discussion")).toBeInTheDocument();
});
```

### End-to-End (E2E) テスト

フロントエンド + バックエンドを含めたアプリ全体を、実際のユーザー操作をシミュレートして評価する。

```typescript
// e2e/tests/smoke.spec.ts
test("user can log in and view dashboard", async ({ page }) => {
    await page.goto("/");
    await page.fill('[name="email"]', "user@example.com");
    await page.fill('[name="password"]', "password");
    await page.click('button:has-text("Sign in")');
    await expect(page.locator("h1")).toContainText("Dashboard");
});
```

## テスト戦略

| レイヤー    | ツール                | 何をテストするか                                |
| ----------- | --------------------- | ----------------------------------------------- |
| Components  | Testing Library       | レンダリング結果、ユーザー操作、a11y            |
| Hooks       | renderHook            | state 変化、副作用                              |
| API         | MSW                   | リクエスト/レスポンスのハンドリング、エラー状態 |
| Integration | Testing Library + MSW | 機能フロー全体 (render → 操作 → 検証)           |
| E2E         | Playwright            | クリティカルなユーザージャーニー                |

## 推奨ツール

### Vitest

Jest に似た強力なテストフレームワーク。モダンなツール (Vite) と相性が良く、カスタマイズ性と柔軟性が高い。

### Testing Library

実際のユーザー操作と同じ方法でアプリをテストする — 実装詳細ではなくレンダリング結果を検証する。内部の state 管理をリファクタしても、UI の振る舞いが変わらなければテストは通る。

### Playwright

E2E テストを自動化するために使う:

- **Browser モード** — 可視化ツール付きで実ブラウザを起動。ローカル開発時に使う。
- **Headless モード** — UI なしで実行。CI/CD のデプロイごとに使う。

### MSW (Mock Service Worker)

service worker 内でネットワークレベルの API モックを行う。HTTP リクエストを intercept し、handler に基づいて任意のレスポンスを返す。

```typescript
// testing/mocks/handlers/auth.ts
import { http, HttpResponse } from "msw";

export const authHandlers = [
    http.post("/api/login", async ({ request }) => {
        const { email } = await request.json();
        return HttpResponse.json({ user: { email, role: "USER" } });
    }),
];
```

メリット:

- コンポーネントにレスポンスデータをハードコードしなくて済む
- テストでも実際の HTTP 呼び出しを使える
- バックエンドなしでフロントエンドのプロトタイピングが可能
- handler で API エンドポイントとビジネスロジックを設計できる

### データモデル

一貫したテストデータのためにモックデータモデルを定義する:

```typescript
// testing/mocks/db.ts
import { factory, primaryKey } from "@mswjs/data";

export const db = factory({
    user: {
        id: primaryKey(String),
        email: String,
        role: () => "USER",
    },
    discussion: {
        id: primaryKey(String),
        title: String,
        body: String,
    },
});
```

## テストの原則

- 実装ではなく振る舞いをテストする。
- フック / コンポーネントレベルではなくネットワーク境界 (MSW) でモックする。
- テストファイルは対象コードとコロケーションする。
- 一貫したテストデータ生成には test factory を使う。
