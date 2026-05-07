# 機微データの露出防止

## ロギング

機微情報（パスワード、トークン、カード番号、CVV、PII）は絶対にログに残さない。識別子（user ID、ハッシュ、last4 等）に置き換える。

```typescript
// FAIL: WRONG: Logging sensitive data
console.log('User login:', { email, password })
console.log('Payment:', { cardNumber, cvv })

// PASS: CORRECT: Redact sensitive data
console.log('User login:', { email, userId })
console.log('Payment:', { last4: card.last4, userId })
```

## エラーメッセージ

ユーザー向けには汎用メッセージ、内部ログには詳細を残す。スタックトレースや SQL エラーをそのまま返さない。

```typescript
// FAIL: WRONG: Exposing internal details
catch (error) {
  return NextResponse.json(
    { error: error.message, stack: error.stack },
    { status: 500 }
  )
}

// PASS: CORRECT: Generic error messages
catch (error) {
  console.error('Internal error:', error)
  return NextResponse.json(
    { error: 'An error occurred. Please try again.' },
    { status: 500 }
  )
}
```

## 検証ステップ

- [ ] ログにパスワード、トークン、シークレット、PII がない
- [ ] ユーザー向けエラーメッセージが汎用的である
- [ ] 詳細なエラーはサーバーログのみにある
- [ ] スタックトレースがユーザーに露出しない
- [ ] レスポンスに内部 ID やデバッグ情報が含まれていない
- [ ] CORS は許可されたオリジンのみに構成されている
