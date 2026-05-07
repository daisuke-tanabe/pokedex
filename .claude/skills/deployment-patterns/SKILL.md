---
name: deployment-patterns
description: Web アプリケーション向けのデプロイメントワークフロー、CI/CD パイプラインパターン、Docker コンテナ化、ヘルスチェック、ロールバック戦略、本番準備チェックリスト。
---

# デプロイメントパターン

本番デプロイメントのワークフローと CI/CD のベストプラクティス。

## 起動タイミング

- CI/CD パイプラインを構築するとき
- アプリケーションを Dockerize するとき
- デプロイメント戦略(blue-green、canary、rolling)を計画するとき
- ヘルスチェックや readiness プローブを実装するとき
- 本番リリースを準備するとき
- 環境ごとの設定を構成するとき

## デプロイメント戦略

### Rolling Deployment(デフォルト)

インスタンスを段階的に置き換える。ロールアウト中は新旧バージョンが同時稼働する。

```
Instance 1: v1 → v2  (update first)
Instance 2: v1        (still running v1)
Instance 3: v1        (still running v1)

Instance 1: v2
Instance 2: v1 → v2  (update second)
Instance 3: v1

Instance 1: v2
Instance 2: v2
Instance 3: v1 → v2  (update last)
```

**利点:** ダウンタイムゼロ、段階的なロールアウト
**欠点:** 2 バージョンが同時稼働するため、後方互換な変更が必須
**用途:** 標準的なデプロイ、後方互換な変更

### Blue-Green Deployment

同一構成の 2 環境を稼働させ、トラフィックをアトミックに切り替える。

```
Blue  (v1) ← traffic
Green (v2)   idle, running new version

# After verification:
Blue  (v1)   idle (becomes standby)
Green (v2) ← traffic
```

**利点:** 即時ロールバック(blue へ戻す)、クリーンな切り替え
**欠点:** デプロイ中はインフラを 2 倍必要とする
**用途:** クリティカルなサービス、障害許容ゼロ

### Canary Deployment

少量のトラフィックだけを新バージョンへ先行ルーティングする。

```
v1: 95% of traffic
v2:  5% of traffic  (canary)

# If metrics look good:
v1: 50% of traffic
v2: 50% of traffic

# Final:
v2: 100% of traffic
```

**利点:** 全面ロールアウト前に実トラフィックで問題を検出できる
**欠点:** トラフィック分割インフラとモニタリングが必要
**用途:** 高トラフィックサービス、リスクの高い変更、フィーチャーフラグ

## Docker

### Multi-Stage Dockerfile (Node.js)

```dockerfile
# Stage 1: Install dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --production=false

# Stage 2: Build
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
RUN npm prune --production

# Stage 3: Production image
FROM node:22-alpine AS runner
WORKDIR /app

RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001
USER appuser

COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
COPY --from=builder --chown=appuser:appgroup /app/package.json ./

ENV NODE_ENV=production
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/server.js"]
```

### Multi-Stage Dockerfile (Go)

```dockerfile
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /server ./cmd/server

FROM alpine:3.19 AS runner
RUN apk --no-cache add ca-certificates
RUN adduser -D -u 1001 appuser
USER appuser

COPY --from=builder /server /server

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:8080/health || exit 1
CMD ["/server"]
```

### Multi-Stage Dockerfile (Python/Django)

```dockerfile
FROM python:3.12-slim AS builder
WORKDIR /app
RUN pip install --no-cache-dir uv
COPY requirements.txt .
RUN uv pip install --system --no-cache -r requirements.txt

FROM python:3.12-slim AS runner
WORKDIR /app

RUN useradd -r -u 1001 appuser
USER appuser

COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY . .

ENV PYTHONUNBUFFERED=1
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health/')" || exit 1
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "4"]
```

### Docker のベストプラクティス

```
# GOOD practices
- Use specific version tags (node:22-alpine, not node:latest)
- Multi-stage builds to minimize image size
- Run as non-root user
- Copy dependency files first (layer caching)
- Use .dockerignore to exclude node_modules, .git, tests
- Add HEALTHCHECK instruction
- Set resource limits in docker-compose or k8s

# BAD practices
- Running as root
- Using :latest tags
- Copying entire repo in one COPY layer
- Installing dev dependencies in production image
- Storing secrets in image (use env vars or secrets manager)
```

## CI/CD パイプライン

### GitHub Actions(標準パイプライン)

```yaml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test -- --coverage
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage
          path: coverage/

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v5
        with:
          push: true
          tags: ghcr.io/${{ github.repository }}:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - name: Deploy to production
        run: |
          # Platform-specific deployment command
          # Railway: railway up
          # Vercel: vercel --prod
          # K8s: kubectl set image deployment/app app=ghcr.io/${{ github.repository }}:${{ github.sha }}
          echo "Deploying ${{ github.sha }}"
```

### パイプラインのステージ

```
PR opened:
  lint → typecheck → unit tests → integration tests → preview deploy

Merged to main:
  lint → typecheck → unit tests → integration tests → build image → deploy staging → smoke tests → deploy production
```

## ヘルスチェック

### ヘルスチェックエンドポイント

```typescript
// Simple health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Detailed health check (for internal monitoring)
app.get("/health/detailed", async (req, res) => {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    externalApi: await checkExternalApi(),
  };

  const allHealthy = Object.values(checks).every(c => c.status === "ok");

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || "unknown",
    uptime: process.uptime(),
    checks,
  });
});

async function checkDatabase(): Promise<HealthCheck> {
  try {
    await db.query("SELECT 1");
    return { status: "ok", latency_ms: 2 };
  } catch (err) {
    return { status: "error", message: "Database unreachable" };
  }
}
```

### Kubernetes プローブ

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 30
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 10
  failureThreshold: 2

startupProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 0
  periodSeconds: 5
  failureThreshold: 30    # 30 * 5s = 150s max startup time
```

## 環境設定

### Twelve-Factor App パターン

```bash
# All config via environment variables — never in code
DATABASE_URL=postgres://user:pass@host:5432/db
REDIS_URL=redis://host:6379/0
API_KEY=${API_KEY}           # injected by secrets manager
LOG_LEVEL=info
PORT=3000

# Environment-specific behavior
NODE_ENV=production          # or staging, development
APP_ENV=production           # explicit app environment
```

### 設定のバリデーション

```typescript
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "staging", "production"]),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

// Validate at startup — fail fast if config is wrong
export const env = envSchema.parse(process.env);
```

## ロールバック戦略

### 即時ロールバック

```bash
# Docker/Kubernetes: point to previous image
kubectl rollout undo deployment/app

# Vercel: promote previous deployment
vercel rollback

# Railway: redeploy previous commit
railway up --commit <previous-sha>

# Database: rollback migration (if reversible)
npx prisma migrate resolve --rolled-back <migration-name>
```

### ロールバックチェックリスト

- [ ] 直前のイメージ・アーティファクトが利用可能でタグ付けされている
- [ ] DB マイグレーションが後方互換である(破壊的変更なし)
- [ ] フィーチャーフラグでデプロイなしに新機能を無効化できる
- [ ] エラーレート急増のアラートが設定されている
- [ ] 本番リリース前にステージングでロールバックを検証済み

## 本番準備チェックリスト

本番デプロイ前に必ず確認する:

### アプリケーション
- [ ] すべてのテスト(unit、integration、E2E)が通る
- [ ] コードや設定ファイルにシークレットがハードコードされていない
- [ ] エラー処理がすべてのエッジケースを網羅している
- [ ] ロギングが構造化(JSON)されており PII を含まない
- [ ] ヘルスチェックエンドポイントが意味のあるステータスを返す

### インフラ
- [ ] Docker イメージが再現可能にビルドされる(バージョン固定)
- [ ] 環境変数が文書化されており起動時にバリデーションされる
- [ ] リソース制限(CPU、メモリ)が設定されている
- [ ] 水平スケーリング(min/max instances)が設定されている
- [ ] すべてのエンドポイントで SSL/TLS が有効

### モニタリング
- [ ] アプリケーションメトリクス(リクエスト数、レイテンシ、エラー)が出力される
- [ ] エラーレートが閾値超過した場合のアラートが設定されている
- [ ] ログ集約が構成されている(構造化ログ、検索可能)
- [ ] ヘルスエンドポイントの稼働監視がある

### セキュリティ
- [ ] 依存関係の CVE スキャンを実施
- [ ] CORS は許可されたオリジンのみに構成
- [ ] 公開エンドポイントにレート制限を有効化
- [ ] 認証・認可を検証
- [ ] セキュリティヘッダー(CSP、HSTS、X-Frame-Options)を設定

### 運用
- [ ] ロールバック計画が文書化・検証済み
- [ ] DB マイグレーションを本番規模データで検証済み
- [ ] よくある障害シナリオの runbook がある
- [ ] オンコールローテーションとエスカレーション経路が定義されている
