# Next.js のセルフホスティング

Vercel 以外の環境にも自信を持って Next.js をデプロイする。

## クイックスタート: Standalone Output

Docker やコンテナ化された環境向けには standalone output を使う。

```js
// next.config.js
module.exports = {
  output: 'standalone',
};
```

これにより、本番の依存関係だけを含む最小限の `standalone` フォルダが作られる:

```
.next/
├── standalone/
│   ├── server.js          # エントリポイント
│   ├── node_modules/      # 本番依存のみ
│   └── .next/             # ビルド出力
└── static/                # 別途コピーする必要がある
```

## Docker デプロイ

### Dockerfile

```dockerfile
FROM node:20-alpine AS base

# 依存関係のインストール
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ビルド
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 本番
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# 非 root ユーザーの作成
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# standalone output をコピー
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## PM2 でのデプロイ

従来型のサーバー向け:

```js
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'nextjs',
    script: '.next/standalone/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
  }],
};
```

```bash
npm run build
pm2 start ecosystem.config.js
```

## ISR とキャッシュハンドラ

### 問題点

ISR (Incremental Static Regeneration) は既定でファイルシステムキャッシュを使う。これは **マルチインスタンス環境では破綻** する:

- インスタンス A がページを再生成 → 自分のディスクに保存
- インスタンス B が古いページを返す → A のキャッシュを認識できない
- ロードバランサがランダムにインスタンスを振り分ける → コンテンツが一貫しない

### 解決策: カスタムキャッシュハンドラ

Next.js 14 以降は共有ストレージ用のカスタムキャッシュハンドラをサポートする:

```js
// next.config.js
module.exports = {
  cacheHandler: require.resolve('./cache-handler.js'),
  cacheMaxMemorySize: 0, // インメモリキャッシュを無効化
};
```

#### Redis キャッシュハンドラの例

```js
// cache-handler.js
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL);
const CACHE_PREFIX = 'nextjs:';

module.exports = class CacheHandler {
  constructor(options) {
    this.options = options;
  }

  async get(key) {
    const data = await redis.get(CACHE_PREFIX + key);
    if (!data) return null;

    const parsed = JSON.parse(data);
    return {
      value: parsed.value,
      lastModified: parsed.lastModified,
    };
  }

  async set(key, data, ctx) {
    const cacheData = {
      value: data,
      lastModified: Date.now(),
    };

    // revalidate オプションに応じて TTL を設定
    if (ctx?.revalidate) {
      await redis.setex(
        CACHE_PREFIX + key,
        ctx.revalidate,
        JSON.stringify(cacheData)
      );
    } else {
      await redis.set(CACHE_PREFIX + key, JSON.stringify(cacheData));
    }
  }

  async revalidateTag(tags) {
    // タグベースの invalidate を実装する
    // どのキーにどのタグが付いているかを追跡する必要がある
  }
};
```

#### S3 キャッシュハンドラの例

```js
// cache-handler.js
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({ region: process.env.AWS_REGION });
const BUCKET = process.env.CACHE_BUCKET;

module.exports = class CacheHandler {
  async get(key) {
    try {
      const response = await s3.send(new GetObjectCommand({
        Bucket: BUCKET,
        Key: `cache/${key}`,
      }));
      const body = await response.Body.transformToString();
      return JSON.parse(body);
    } catch (err) {
      if (err.name === 'NoSuchKey') return null;
      throw err;
    }
  }

  async set(key, data, ctx) {
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: `cache/${key}`,
      Body: JSON.stringify({
        value: data,
        lastModified: Date.now(),
      }),
      ContentType: 'application/json',
    }));
  }
};
```

## そのまま動くもの / 追加設定が必要なもの

| Feature | 単一インスタンス | マルチインスタンス | 補足 |
|---------|----------------|----------------|-------|
| SSR | Yes | Yes | 特別な設定は不要 |
| SSG | Yes | Yes | デプロイ時にビルドされる |
| ISR | Yes | キャッシュハンドラが必要 | ファイルシステムキャッシュは破綻する |
| Image Optimization | Yes | Yes | CPU 負荷が高い。CDN の利用を検討 |
| Middleware | Yes | Yes | Node.js 上で動く |
| Edge Runtime | 限定的 | 限定的 | 一部機能は Node.js 限定 |
| `revalidatePath/Tag` | Yes | キャッシュハンドラが必要 | キャッシュ共有が前提 |
| `next/font` | Yes | Yes | ビルド時にフォントがバンドルされる |
| Draft Mode | Yes | Yes | cookie ベース |

## 画像最適化

Next.js の画像最適化はそのまま動くが、CPU 負荷が高い。

### 選択肢 1: 組み込み（シンプル）

自動で動くが、次を考慮する:

- バリエーション数を制限するため、config で `deviceSizes` と `imageSizes` を設定する
- 再生成を抑えるため `minimumCacheTTL` を設定する

```js
// next.config.js
module.exports = {
  images: {
    minimumCacheTTL: 60 * 60 * 24, // 24 時間
    deviceSizes: [640, 750, 1080, 1920], // サイズを制限
  },
};
```

### 選択肢 2: 外部ローダー（スケールを見据えるなら推奨）

Cloudinary や Imgix などにオフロードする:

```js
// next.config.js
module.exports = {
  images: {
    loader: 'custom',
    loaderFile: './lib/image-loader.js',
  },
};
```

```js
// lib/image-loader.js
export default function cloudinaryLoader({ src, width, quality }) {
  const params = ['f_auto', 'c_limit', `w_${width}`, `q_${quality || 'auto'}`];
  return `https://res.cloudinary.com/demo/image/upload/${params.join(',')}${src}`;
}
```

## 環境変数

### ビルドタイム vs ランタイム

```js
// ビルドタイムのみ利用可能（バンドルに焼き込まれる）
NEXT_PUBLIC_API_URL=https://api.example.com

// ランタイムで利用可能（server 側のみ）
DATABASE_URL=postgresql://...
API_SECRET=...
```

### ランタイム設定

本当に動的な設定が欲しいなら `NEXT_PUBLIC_*` を使わない。代わりに:

```tsx
// app/api/config/route.ts
export async function GET() {
  return Response.json({
    apiUrl: process.env.API_URL,
    features: process.env.FEATURES?.split(','),
  });
}
```

## OpenNext: Vercel を使わないサーバーレス

[OpenNext](https://open-next.js.org/) は Next.js を AWS Lambda、Cloudflare Workers などに適合させる。

```bash
npx create-sst@latest
# or
npx @opennextjs/aws build
```

サポート対象:

- AWS Lambda + CloudFront
- Cloudflare Workers
- Netlify Functions
- Deno Deploy

## ヘルスチェックエンドポイント

ロードバランサ用に必ずヘルスチェックを用意する:

```tsx
// app/api/health/route.ts
export async function GET() {
  try {
    // 任意: DB 接続のチェック
    // await db.$queryRaw`SELECT 1`;

    return Response.json({ status: 'healthy' }, { status: 200 });
  } catch (error) {
    return Response.json({ status: 'unhealthy' }, { status: 503 });
  }
}
```

## デプロイ前チェックリスト

1. **まずローカルでビルド**: `npm run build` でデプロイ前にエラーを潰す
2. **standalone output をテスト**: `node .next/standalone/server.js`
3. **Docker なら `output: 'standalone'` を設定**
4. **マルチインスタンスの ISR には cache handler を設定**
5. **コンテナ向けに `HOSTNAME="0.0.0.0"` を設定**
6. **`public/` と `.next/static/` をコピー** - standalone には含まれない
7. **ヘルスチェックエンドポイントを追加**
8. **デプロイ後に ISR の revalidation をテスト**
9. **メモリ使用量を監視** - Node.js のデフォルト値はチューニングが必要なことがある

## キャッシュハンドラのテスト

**重要**: Next.js をアップグレードするたびにキャッシュハンドラをテストする:

```bash
# 複数インスタンスを起動
PORT=3001 node .next/standalone/server.js &
PORT=3002 node .next/standalone/server.js &

# ISR の revalidation をトリガー
curl http://localhost:3001/api/revalidate?path=/posts

# 両インスタンスが更新を認識しているか確認
curl http://localhost:3001/posts
curl http://localhost:3002/posts
# 同じ内容が返るはず
```
