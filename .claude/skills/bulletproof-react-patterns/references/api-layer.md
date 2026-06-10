# API レイヤー

## 単一の API クライアントインスタンス

アプリ全体で 1 つの設定済み API クライアントインスタンスを使い回す。native fetch、axios、graphql-request、apollo-client などで構築できる。

```typescript
// src/lib/api-client.ts
import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        const message = error.response?.data?.message || error.message;
        // 通知トーストを発火
        // 401 はログアウト
        return Promise.reject(error);
    },
);

export { api };
```

## リクエスト宣言パターン

API リクエスト宣言は以下の 3 要素で構成する:

1. **型とバリデーションスキーマ** — リクエスト / レスポンスのデータ用
2. **fetcher 関数** — API クライアント経由でエンドポイントを呼ぶ
3. **フック** — react-query や swr などで fetcher を消費する

### Query の例

```typescript
// features/discussions/api/get-discussions.ts
import { useQuery, type QueryConfig } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

type Discussion = {
    id: string;
    title: string;
    body: string;
    createdAt: string;
};

type GetDiscussionsParams = {
    teamId: string;
};

function getDiscussions(params: GetDiscussionsParams): Promise<Discussion[]> {
    return api.get("/discussions", { params });
}

type UseDiscussionsOptions = {
    params: GetDiscussionsParams;
    queryConfig?: QueryConfig<typeof getDiscussions>;
};

export function useDiscussions({ params, queryConfig }: UseDiscussionsOptions) {
    return useQuery({
        queryKey: ["discussions", params],
        queryFn: () => getDiscussions(params),
        ...queryConfig,
    });
}
```

### Mutation の例

```typescript
// features/discussions/api/create-discussion.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

type CreateDiscussionInput = {
    title: string;
    body: string;
    teamId: string;
};

function createDiscussion(data: CreateDiscussionInput): Promise<Discussion> {
    return api.post("/discussions", data);
}

export function useCreateDiscussion() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createDiscussion,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["discussions"] });
        },
    });
}
```

## ファイル構成

```
features/users/api/
├── get-users.ts       # useUsers query フック + API 関数
├── get-user.ts        # useUser query フック + API 関数
├── create-user.ts     # useCreateUser mutation フック + API 関数
├── update-user.ts     # useUpdateUser mutation フック + API 関数
└── index.ts           # 全フックの re-export
```

ケースによっては、features 配下ではなくトップレベルの `api/` フォルダに共有 API 呼び出しを置くほうが実用的なこともある。

## 主要原則

- API 関数は純粋に保つ — フレームワーク依存なしで Promise を返す。
- 全てのレスポンスを型付けし、アプリ内で型を伝播させて型安全性を担保する。
- エラー処理は API クライアントの interceptor で集中管理する。
- API 宣言は利用する features の側にコロケーションする。
