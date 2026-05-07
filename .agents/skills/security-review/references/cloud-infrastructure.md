| name | description |
|------|-------------|
| cloud-infrastructure-security | クラウドプラットフォームへのデプロイ、インフラ設定、IAM ポリシー管理、ロギング／監視のセットアップ、CI/CD パイプライン実装時に使うスキル。ベストプラクティスに準拠したクラウドセキュリティチェックリストを提供する。 |

# クラウド・インフラセキュリティ

このスキルは、クラウドインフラ、CI/CD パイプライン、デプロイ設定がセキュリティのベストプラクティスに従い、業界標準に準拠していることを保証する。

## 起動タイミング

- アプリケーションをクラウドプラットフォーム (AWS, Vercel, Railway, Cloudflare) にデプロイするとき
- IAM ロールと権限を設定するとき
- CI/CD パイプラインを構築するとき
- IaC (Terraform, CloudFormation) を実装するとき
- ロギングと監視を設定するとき
- クラウド環境でシークレットを管理するとき
- CDN とエッジセキュリティを設定するとき
- ディザスタリカバリとバックアップ戦略を実装するとき

## クラウドセキュリティチェックリスト

### 1. IAM & アクセス制御

#### 最小権限の原則

```yaml
# PASS: CORRECT: Minimal permissions
iam_role:
  permissions:
    - s3:GetObject  # Only read access
    - s3:ListBucket
  resources:
    - arn:aws:s3:::my-bucket/*  # Specific bucket only

# FAIL: WRONG: Overly broad permissions
iam_role:
  permissions:
    - s3:*  # All S3 actions
  resources:
    - "*"  # All resources
```

#### 多要素認証 (MFA)

```bash
# ALWAYS enable MFA for root/admin accounts
aws iam enable-mfa-device \
  --user-name admin \
  --serial-number arn:aws:iam::123456789:mfa/admin \
  --authentication-code1 123456 \
  --authentication-code2 789012
```

#### 検証ステップ

- [ ] 本番環境で root アカウントを使用していない
- [ ] すべての特権アカウントで MFA が有効
- [ ] サービスアカウントは長寿命の認証情報ではなくロールを使用
- [ ] IAM ポリシーが最小権限に従っている
- [ ] 定期的なアクセスレビューが実施されている
- [ ] 未使用の認証情報がローテーションまたは削除されている

### 2. シークレット管理

#### クラウド Secrets Manager

```typescript
// PASS: CORRECT: Use cloud secrets manager
import { SecretsManager } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManager({ region: 'us-east-1' });
const secret = await client.getSecretValue({ SecretId: 'prod/api-key' });
const apiKey = JSON.parse(secret.SecretString).key;

// FAIL: WRONG: Hardcoded or in environment variables only
const apiKey = process.env.API_KEY; // Not rotated, not audited
```

#### シークレットローテーション

```bash
# Set up automatic rotation for database credentials
aws secretsmanager rotate-secret \
  --secret-id prod/db-password \
  --rotation-lambda-arn arn:aws:lambda:region:account:function:rotate \
  --rotation-rules AutomaticallyAfterDays=30
```

#### 検証ステップ

- [ ] すべてのシークレットがクラウド Secrets Manager (AWS Secrets Manager, Vercel Secrets) に保存されている
- [ ] DB 認証情報の自動ローテーションが有効
- [ ] API キーが少なくとも四半期ごとにローテーションされている
- [ ] コード、ログ、エラーメッセージにシークレットがない
- [ ] シークレットアクセスに対する監査ログが有効

### 3. ネットワークセキュリティ

#### VPC とファイアウォール設定

```terraform
# PASS: CORRECT: Restricted security group
resource "aws_security_group" "app" {
  name = "app-sg"

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]  # Internal VPC only
  }

  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # Only HTTPS outbound
  }
}

# FAIL: WRONG: Open to the internet
resource "aws_security_group" "bad" {
  ingress {
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # All ports, all IPs!
  }
}
```

#### 検証ステップ

- [ ] データベースが公にアクセス可能でない
- [ ] SSH/RDP ポートが VPN/bastion のみに制限されている
- [ ] セキュリティグループが最小権限に従っている
- [ ] ネットワーク ACL が設定されている
- [ ] VPC フローログが有効

### 4. ロギング & 監視

#### CloudWatch／ロギング設定

```typescript
// PASS: CORRECT: Comprehensive logging
import { CloudWatchLogsClient, CreateLogStreamCommand } from '@aws-sdk/client-cloudwatch-logs';

const logSecurityEvent = async (event: SecurityEvent) => {
  await cloudwatch.putLogEvents({
    logGroupName: '/aws/security/events',
    logStreamName: 'authentication',
    logEvents: [{
      timestamp: Date.now(),
      message: JSON.stringify({
        type: event.type,
        userId: event.userId,
        ip: event.ip,
        result: event.result,
        // Never log sensitive data
      })
    }]
  });
};
```

#### 検証ステップ

- [ ] すべてのサービスで CloudWatch／ロギングが有効
- [ ] 認証失敗が記録されている
- [ ] 管理者アクションが監査されている
- [ ] ログ保持が設定されている (コンプライアンスのため 90 日以上)
- [ ] 不審な活動に対するアラートが設定されている
- [ ] ログが集約され改ざん不可能である

### 5. CI/CD パイプラインセキュリティ

#### 安全なパイプライン設定

```yaml
# PASS: CORRECT: Secure GitHub Actions workflow
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read  # Minimal permissions

    steps:
      - uses: actions/checkout@v4

      # Scan for secrets
      - name: Secret scanning
        uses: trufflesecurity/trufflehog@main

      # Dependency audit
      - name: Audit dependencies
        run: npm audit --audit-level=high

      # Use OIDC, not long-lived tokens
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789:role/GitHubActionsRole
          aws-region: us-east-1
```

#### サプライチェーンセキュリティ

```json
// package.json - Use lock files and integrity checks
{
  "scripts": {
    "install": "npm ci",  // Use ci for reproducible builds
    "audit": "npm audit --audit-level=moderate",
    "check": "npm outdated"
  }
}
```

#### 検証ステップ

- [ ] 長寿命の認証情報ではなく OIDC を使用している
- [ ] パイプラインでシークレットスキャンを行っている
- [ ] 依存関係の脆弱性スキャンを行っている
- [ ] コンテナイメージスキャンを行っている (該当時)
- [ ] ブランチ保護ルールが強制されている
- [ ] マージ前のコードレビューが必須
- [ ] 署名付きコミットが強制されている

### 6. Cloudflare & CDN セキュリティ

#### Cloudflare セキュリティ設定

```typescript
// PASS: CORRECT: Cloudflare Workers with security headers
export default {
  async fetch(request: Request): Promise<Response> {
    const response = await fetch(request);

    // Add security headers
    const headers = new Headers(response.headers);
    headers.set('X-Frame-Options', 'DENY');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    headers.set('Permissions-Policy', 'geolocation=(), microphone=()');

    return new Response(response.body, {
      status: response.status,
      headers
    });
  }
};
```

#### WAF ルール

```bash
# Enable Cloudflare WAF managed rules
# - OWASP Core Ruleset
# - Cloudflare Managed Ruleset
# - Rate limiting rules
# - Bot protection
```

#### 検証ステップ

- [ ] WAF が OWASP ルールで有効
- [ ] レート制限が設定されている
- [ ] Bot 保護がアクティブ
- [ ] DDoS 保護が有効
- [ ] セキュリティヘッダが設定されている
- [ ] SSL/TLS strict mode が有効

### 7. バックアップ & ディザスタリカバリ

#### 自動バックアップ

```terraform
# PASS: CORRECT: Automated RDS backups
resource "aws_db_instance" "main" {
  allocated_storage     = 20
  engine               = "postgres"

  backup_retention_period = 30  # 30 days retention
  backup_window          = "03:00-04:00"
  maintenance_window     = "mon:04:00-mon:05:00"

  enabled_cloudwatch_logs_exports = ["postgresql"]

  deletion_protection = true  # Prevent accidental deletion
}
```

#### 検証ステップ

- [ ] 自動日次バックアップが設定されている
- [ ] バックアップ保持がコンプライアンス要件を満たす
- [ ] ポイントインタイムリカバリが有効
- [ ] 四半期ごとにバックアップテストを実施している
- [ ] ディザスタリカバリ計画が文書化されている
- [ ] RPO と RTO が定義されテストされている

## デプロイ前クラウドセキュリティチェックリスト

本番クラウドデプロイの前には必ず:

- [ ] **IAM**: root アカウント未使用、MFA 有効、最小権限ポリシー
- [ ] **シークレット**: すべてのシークレットがクラウド Secrets Manager にあり、ローテーション付き
- [ ] **ネットワーク**: セキュリティグループが制限され、公開 DB がない
- [ ] **ロギング**: CloudWatch／ロギングが有効で保持期間が設定されている
- [ ] **監視**: 異常検知アラートが設定されている
- [ ] **CI/CD**: OIDC 認証、シークレットスキャン、依存関係監査
- [ ] **CDN/WAF**: Cloudflare WAF が OWASP ルールで有効
- [ ] **暗号化**: 保存時と通信時にデータが暗号化されている
- [ ] **バックアップ**: 自動バックアップとリカバリ動作確認
- [ ] **コンプライアンス**: GDPR/HIPAA 要件を満たしている (該当時)
- [ ] **ドキュメント**: インフラが文書化され、Runbook がある
- [ ] **インシデント対応**: セキュリティインシデント計画がある

## 一般的なクラウドセキュリティの設定ミス

### S3 バケットの露出

```bash
# FAIL: WRONG: Public bucket
aws s3api put-bucket-acl --bucket my-bucket --acl public-read

# PASS: CORRECT: Private bucket with specific access
aws s3api put-bucket-acl --bucket my-bucket --acl private
aws s3api put-bucket-policy --bucket my-bucket --policy file://policy.json
```

### RDS の公開アクセス

```terraform
# FAIL: WRONG
resource "aws_db_instance" "bad" {
  publicly_accessible = true  # NEVER do this!
}

# PASS: CORRECT
resource "aws_db_instance" "good" {
  publicly_accessible = false
  vpc_security_group_ids = [aws_security_group.db.id]
}
```

## リソース

- [AWS Security Best Practices](https://aws.amazon.com/security/best-practices/)
- [CIS AWS Foundations Benchmark](https://www.cisecurity.org/benchmark/amazon_web_services)
- [Cloudflare Security Documentation](https://developers.cloudflare.com/security/)
- [OWASP Cloud Security](https://owasp.org/www-project-cloud-security/)
- [Terraform Security Best Practices](https://www.terraform.io/docs/cloud/guides/recommended-practices/)

**心得**: クラウドの設定ミスはデータ侵害の主要原因だ。露出した S3 バケットや過度に許可された IAM ポリシーひとつで、インフラ全体が侵害され得る。常に最小権限の原則と多層防御に従え。
