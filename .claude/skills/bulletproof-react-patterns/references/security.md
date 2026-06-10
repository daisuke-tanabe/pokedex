# セキュリティ

## 認証

クライアント側の認証は UX を高めサーバー側のセキュリティを補完する — どちらも必須。

### トークン保管

| 方式               | メリット                            | デメリット                  |
| ------------------ | ----------------------------------- | --------------------------- |
| アプリケーション state | 最も安全                            | リロードで消える            |
| `HttpOnly` cookie  | JS からアクセス不可、XSS 耐性あり    | サーバー側のセットアップが必要 |
| `localStorage`     | セッションをまたいで永続化          | XSS に対して脆弱            |

**推奨:** サーバーが設定する `HttpOnly` cookie にトークンを格納する。クライアントはトークンに直接アクセスしない。

### XSS 対策

ユーザー入力は表示前に必ずサニタイズする:

```tsx
import DOMPurify from "dompurify";

function MarkdownPreview({ content }: { content: string }) {
    const sanitized = DOMPurify.sanitize(content);
    return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
```

サニタイズしない限り `dangerouslySetInnerHTML` は使わない。React は JSX をデフォルトでエスケープするが、生 HTML 挿入はそれを迂回してしまう。

### ユーザーデータの管理

ユーザー情報はアプリ全体からアクセス可能なグローバル state として扱う。選択肢:

- TanStack Query (既に使っているなら) — [react-query-auth](https://github.com/alan2207/react-query-auth) 経由
- React Context + hooks
- サードパーティの state 管理 (Zustand, Redux)

ユーザーオブジェクトが存在すれば認証済みとみなす設計にする。

## 認可

### RBAC (Role-Based Access Control)

ユーザーロール (`ADMIN`, `USER` など) に基づいてアクセス制御する:

```tsx
function RBACGuard({ allowedRoles, children }: { allowedRoles: Role[]; children: React.ReactNode }) {
    const { user } = useAuth();
    if (!user || !allowedRoles.includes(user.role)) return null;
    return children;
}

// 使い方
<RBACGuard allowedRoles={["ADMIN"]}>
    <AdminPanel />
</RBACGuard>;
```

### PBAC (Permission-Based Access Control)

リソース所有権など、より粒度の細かい制御:

```tsx
function PBACGuard({ check, children }: { check: boolean; children: React.ReactNode }) {
    if (!check) return null;
    return children;
}

// コメントの著者だけが削除可能
<PBACGuard check={comment.authorId === currentUser.id}>
    <DeleteCommentButton commentId={comment.id} />
</PBACGuard>;
```

### 組み合わせて使う

同じ Guard コンポーネントで role / policy のどちらにも対応できる:

```tsx
// role ベース
<Authorization allowedRoles={["ADMIN"]}>
  <DeleteUserButton />
</Authorization>

// policy ベース
<Authorization policyCheck={comment.authorId === user.id}>
  <DeleteCommentButton />
</Authorization>
```

幅広いロールレベルのアクセス制御は RBAC、リソースレベルの所有権チェックは PBAC を使う。

## セキュリティ参考

クライアント側セキュリティリスクの全体像は [OWASP Top 10 Client-Side Security Risks](https://owasp.org/www-project-top-10-client-side-security-risks/) を参照。
