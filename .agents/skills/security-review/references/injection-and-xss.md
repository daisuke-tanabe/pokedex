# SQL インジェクション防止と XSS 対策

## SQL インジェクション防止

### FAIL: SQL を絶対に連結しない

```typescript
// DANGEROUS - SQL Injection vulnerability
const query = `SELECT * FROM users WHERE email = '${userEmail}'`
await db.query(query)
```

### PASS: 常にパラメータ化クエリを使う

```typescript
// Safe - parameterized query
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('email', userEmail)

// Or with raw SQL
await db.query(
  'SELECT * FROM users WHERE email = $1',
  [userEmail]
)
```

### 検証ステップ

- [ ] すべての DB クエリがパラメータ化クエリを使う
- [ ] SQL での文字列連結がない
- [ ] ORM／クエリビルダーが正しく使われている
- [ ] テンプレートリテラルへのユーザー入力直接埋め込みがない

## XSS 防止

### HTML をサニタイズする

ユーザー入力を `dangerouslySetInnerHTML` で描画する場合は、必ず DOMPurify でサニタイズする。

```typescript
import DOMPurify from 'isomorphic-dompurify'

// ALWAYS sanitize user-provided HTML
function renderUserContent(html: string) {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p'],
    ALLOWED_ATTR: []
  })
  return <div dangerouslySetInnerHTML={{ __html: clean }} />
}
```

### Content Security Policy

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      font-src 'self';
      connect-src 'self' https://api.example.com;
    `.replace(/\s{2,}/g, ' ').trim()
  }
]
```

### 検証ステップ

- [ ] ユーザー提供 HTML がサニタイズされている
- [ ] CSP ヘッダが設定されている
- [ ] 未検証の動的コンテンツレンダリングがない
- [ ] React のビルトイン XSS 保護を活用している（`{}` 経由のレンダリング）
