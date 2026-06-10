# 状態管理

すべてを 1 箇所に集約せず、用途別にカテゴリ分けして管理する。

## state のカテゴリ

| State の種類       | 説明                                              | 解法                                                   |
| ------------------ | ------------------------------------------------- | ------------------------------------------------------ |
| Component State    | コンポーネントローカルで、props として子に伝播     | `useState`, `useReducer`                               |
| Application State  | グローバル UI 状態 (モーダル、通知、テーマ)        | Context + hooks, Zustand, Jotai, Redux Toolkit, XState |
| Server Cache State | クライアントにキャッシュされたリモートデータ       | TanStack Query, SWR, Apollo Client, URQL, RTK Query    |
| Form State         | フォーム入力、バリデーション、送信                 | React Hook Form, Formik, React Final Form              |
| URL State          | アドレスバーに含まれるデータ (params, query)       | React Router, URL search params                        |

## Component State

まずはコンポーネント内で state を定義する。他で必要になった時にだけ上位に巻き上げる。

```tsx
const [isOpen, setIsOpen] = useState(false);
```

1 つのアクションで複数の state を更新する場合は `useReducer` を使う。

## Application State

state は必要なコンポーネントの近くにできるだけローカライズする。早すぎるグローバル化を避ける。

良い選択肢:

- [Zustand](https://github.com/pmndrs/zustand) — 最小限、hooks ベース
- [Jotai](https://github.com/pmndrs/jotai) — アトミック、頻繁できめ細かな更新に強い
- [Redux Toolkit](https://redux-toolkit.js.org/) — 構造化されており DevTools が優秀
- [XState](https://xstate.js.org/) — 複雑なワークフロー向けのステートマシン
- React Context + hooks — 標準機能、更新頻度の低いデータ (テーマ、ユーザー情報) に最適

Context が性能ネックになる場合は [use-context-selector](https://github.com/dai-shi/use-context-selector) を使う (多くの state ライブラリは selector を内蔵している)。

## Server Cache State

query データを `useState` にコピーしてはいけない。query の結果を直接使う。

```tsx
// やってはいけない
const { data } = useUsers();
const [users, setUsers] = useState(data); // 古いコピーになる

// 正しい
const { data: users } = useUsers(); // 常に最新
```

良い選択肢:

- [TanStack Query](https://tanstack.com/query) — REST + GraphQL
- [SWR](https://swr.vercel.app/) — REST + GraphQL
- [Apollo Client](https://www.apollographql.com/) — GraphQL
- [URQL](https://formidable.com/open-source/urql/) — GraphQL
- [RTK Query](https://redux-toolkit.js.org/rtk-query) — REST

## Form State

ライブラリをラップした抽象化された `Form` と入力フィールドコンポーネントを用意する:

```tsx
// components/ui/form/form.tsx — React Hook Form をラップ
// components/ui/form/input.tsx — フォーム入力プリミティブをラップ
```

バリデーションは [Zod](https://github.com/colinhacks/zod) や [Yup](https://github.com/jquense/yup) と統合する。

フォームは [controlled / uncontrolled](https://react.dev/learn/sharing-state-between-components#controlled-and-uncontrolled-components) のどちらでも良い — 必要に応じて選ぶ。

## URL State

ルーティングソリューション経由で URL パラメータにアクセス・制御する:

```tsx
// /app/discussions/:id
const { id } = useParams();

// /app?page=2&sort=newest
const [searchParams] = useSearchParams();
```

URL state はフィルター、ページネーション、アクティブタブ、共有可能なビューに最適。

## 主要原則

- server state と client state を混在させない。
- ローカルから始め、必要になった時だけ巻き上げる。
- 焦って Context に手を出さない — まずは state の lift up やコンポジションを検討する。
- 高頻度更新には Context より atomic state ライブラリ (Jotai) を検討する。
