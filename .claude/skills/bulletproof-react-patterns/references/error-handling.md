# エラーハンドリング

## API エラー

API クライアントに interceptor を実装し、エラーを集中管理する:

- ユーザー向けエラーは通知トーストで提示する
- 401 (unauthorized) はログアウト処理を行う
- トークンを自動リフレッシュする
- 生のエラーオブジェクトをユーザーに露出させない

```typescript
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        const status = error.response?.status;
        const message = error.response?.data?.message || error.message;

        if (status === 401) {
            // ログアウト or トークンリフレッシュ
        }

        // ユーザーフレンドリーな通知を出す
        addNotification({ type: "error", title: "Error", message });

        return Promise.reject(error);
    },
);
```

## エラーバウンダリ

アプリ全体を 1 つで覆うのではなく、複数のエラーバウンダリを階層的に配置する。エラー発生時にローカルで封じ込められ、アプリ全体を巻き込まずに済む。

### エラー階層

```
App Error Boundary          → 回復不能なクラッシュを捕捉
  └── Route Error Boundary     → ルート単位の失敗を捕捉、リトライ UI を出す
        └── Feature Error Boundary   → 機能固有のエラーを捕捉
```

### 使い方のパターン

```tsx
<ErrorBoundary fallback={<FeatureError />}>
    <Suspense fallback={<FeatureSkeleton />}>
        <UserDashboard />
    </Suspense>
</ErrorBoundary>
```

各ルートと主要な機能セクションを独自のエラーバウンダリで包み、意味のある fallback UI を用意する。

## エラートラッキング

本番エラーの追跡には [Sentry](https://sentry.io/) のようなツールを使う。自前で組まず専用ツールに乗ることで、以下が得られる:

- プラットフォーム / ブラウザのコンテキスト
- source map と対応付いたスタックトレース
- エラーのグルーピングと重複排除
- アラートとダッシュボード

source map を Sentry にアップロードすると、ソースコード上で発生位置を正確に把握できる。

## 型付きエラーレスポンス

一貫したエラーレスポンス型を定義する:

```typescript
type ApiError = {
    message: string;
    statusCode: number;
    errors?: Record<string, string[]>;
};
```

これらの型をエラー処理で使うことで、構造化されたユーザーフレンドリーなメッセージを提供できる。
