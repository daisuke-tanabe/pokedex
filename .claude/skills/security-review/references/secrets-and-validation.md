# シークレット管理と入力バリデーション

## シークレット管理

### FAIL: 絶対にやってはいけない

```typescript
const apiKey = "sk-proj-xxxxx"  // Hardcoded secret
const dbPassword = "password123" // In source code
```

### PASS: 常にこうする

```typescript
const apiKey = process.env.OPENAI_API_KEY
const dbUrl = process.env.DATABASE_URL

// Verify secrets exist
if (!apiKey) {
  throw new Error('OPENAI_API_KEY not configured')
}
```

### 検証ステップ

- [ ] ハードコードされた API キー、トークン、パスワードがない
- [ ] すべてのシークレットが環境変数にある
- [ ] `.env.local` が .gitignore にある
- [ ] git 履歴にシークレットがない
- [ ] 本番のシークレットがホスティングプラットフォーム（Vercel、Railway 等）にある

## 入力バリデーション

### スキーマで全入力を検証する

```typescript
import { z } from 'zod'

// Define validation schema
const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  age: z.number().int().min(0).max(150)
})

// Validate before processing
export async function createUser(input: unknown) {
  try {
    const validated = CreateUserSchema.parse(input)
    return await db.users.create(validated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.errors }
    }
    throw error
  }
}
```

### ファイルアップロードのバリデーション

サイズ・MIME タイプ・拡張子を多層チェックする。MIME タイプは詐称可能なので拡張子も併用する。

```typescript
function validateFileUpload(file: File) {
  // Size check (5MB max)
  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    throw new Error('File too large (max 5MB)')
  }

  // Type check
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type')
  }

  // Extension check
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif']
  const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0]
  if (!extension || !allowedExtensions.includes(extension)) {
    throw new Error('Invalid file extension')
  }

  return true
}
```

### 検証ステップ

- [ ] すべてのユーザー入力がスキーマでバリデートされている
- [ ] ファイルアップロードが制限されている（サイズ、タイプ、拡張子）
- [ ] クエリでのユーザー入力の直接利用がない
- [ ] ホワイトリストバリデーション（ブラックリストではない）
- [ ] エラーメッセージが機微情報を漏らさない
