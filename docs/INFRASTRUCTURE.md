# Barber Shop Infrastructure as Code (IaC) Guide

**Version:** 1.0  
**Status:** Production-Ready  
**Last Updated:** September 26, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Infrastructure Components](#infrastructure-components)
4. [Terraform Organization](#terraform-organization)
5. [Deployment Procedures](#deployment-procedures)
6. [Multi-Environment Setup](#multi-environment-setup)
7. [State Management](#state-management)
8. [Security Best Practices](#security-best-practices)
9. [Cost Optimization](#cost-optimization)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The Barber Shop Micro Frontend platform uses Infrastructure as Code (IaC) with Terraform to provision and manage all AWS resources. This approach ensures:

- **Reproducibility:** Identical environments can be created consistently
- **Version Control:** Infrastructure changes are tracked in Git
- **Automation:** Automated deployments with zero manual steps
- **Scalability:** Easy to scale resources up/down based on demand
- **Disaster Recovery:** Infrastructure can be quickly recreated

**Infrastructure Stack:**
- **Compute:** AWS Lambda, EC2 (optional for custom workloads)
- **Storage:** Amazon S3 (static assets, logs)
- **CDN:** CloudFront (global content delivery)
- **Load Balancer:** Application Load Balancer (ALB) for API proxying
- **Networking:** VPC, Security Groups, subnets
- **Monitoring:** CloudWatch (logs, metrics, alarms)
- **DNS:** Route 53 (domain management)

---

## Architecture

### High-Level Infrastructure Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Internet (HTTPS)                         │
└────────┬──────────────────────────────────────────────┬──────┘
         │                                               │
         ▼                                               ▼
    [Route 53]                                    [Route 53]
    (barber-shop.com)                       (www.barber-shop.com)
         │                                               │
         └────────────┬───────────────────────────────┬─┘
                      │                               │
                      ▼                               ▼
              [CloudFront CDN]
              (Edge Locations)
              - Caching: Static assets (1 year TTL)
              - HTML: 5 min TTL (cache busting)
              - API: No cache (pass-through)
                      │
                      ▼
            [S3 Origin (Assets)]
            - barber-shop-prod-assets
            - Versioning enabled
            - Server-side encryption
            - CloudFront OAI access only
                      │
                      ▼
            [CloudFront Failover]
                      │
                      ▼
              [Application Load Balancer]
              (API Gateway proxy)
              - HTTPS termination
              - Health checks
              - Sticky sessions
                      │
         ┌─────┬──────┴──────┬─────┐
         │     │             │     │
         ▼     ▼             ▼     ▼
       [EC2 Instance 1]   [EC2 Instance 2]   [EC2 Instance 3]
       (us-east-1a)       (us-east-1b)       (us-east-1c)
       MFE Shell          MFE Services       MFE Booking
       Port 3000          Port 3002          Port 3003
         │     │             │     │
         └─────┴─────────────┴─────┘
                      │
         ┌────────────┼────────────┐
         │            │            │
         ▼            ▼            ▼
    [CloudWatch] [X-Ray Tracing] [SNS/SES]
    (Logs/Metrics) (Request Tracing) (Alerts)
         │            │             │
         └────────────┴─────────────┘
```

### Data Flow

1. **User Request:** Browser → CloudFront edge location (global caching)
2. **Static Assets:** CloudFront → S3 (via OAI, no public access)
3. **API Requests:** CloudFront → ALB → EC2 instances (no caching)
4. **Monitoring:** EC2 instances → CloudWatch Logs/Metrics
5. **Distributed Tracing:** EC2 instances → AWS X-Ray

---

## Infrastructure Components

### 1. S3 Buckets

**Assets Bucket (barber-shop-prod-assets)**
- Stores static files (HTML, JS, CSS, images)
- Versioning enabled for rollback capability
- Server-side encryption (AES-256)
- Lifecycle rules: Archive to Glacier after 90 days
- CORS enabled for cross-origin requests
- CloudFront access only (via OAI)

**Logs Bucket (barber-shop-prod-logs)**
- CloudFront access logs
- ALB access logs
- Lambda execution logs
- Lifecycle rule: Delete after 90 days

### 2. CloudFront Distribution

**Distribution Configuration:**
- **Domain:** barber-shop.com, www.barber-shop.com
- **Certificate:** ACM-managed SSL/TLS (auto-renewal)
- **Origin:** S3 assets bucket (via CloudFront Origin Access Identity)
- **Failover:** ALB as secondary origin
- **Caching:**
  - Static assets: 1 year TTL (cache busting via query string)
  - HTML files: 5 minutes TTL
  - API requests: No caching (pass-through to ALB)
- **Compression:** Enabled (gzip, brotli)
- **HTTP/3:** Enabled for modern clients
- **Security Headers:**
  - Strict-Transport-Security (HSTS)
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - X-XSS-Protection: 1; mode=block
  - Referrer-Policy: strict-origin-when-cross-origin
  - Permissions-Policy: Restrict geolocation, microphone, camera

### 3. Application Load Balancer (ALB)

**Configuration:**
- **Protocol:** HTTPS (TLS 1.2+)
- **Listener:** Port 443 (HTTPS), Port 80 (HTTP → HTTPS redirect)
- **Target Group:**
  - Health check: /health endpoint, 30s interval
  - Stickiness: Enabled (1 day duration)
  - Timeout: 5 seconds
  - Healthy threshold: 2 consecutive successes
  - Unhealthy threshold: 3 consecutive failures
- **Logging:** Enabled (S3 bucket)
- **Deletion Protection:** Enabled in production

### 4. VPC & Security Groups

**VPC Configuration:**
- CIDR: 10.0.0.0/16
- Subnets: 2 public subnets (multi-AZ)
- NAT Gateway: For private subnets (if needed)

**Security Group (ALB):**
- Inbound: HTTP (80), HTTPS (443) from 0.0.0.0/0
- Outbound: All traffic allowed

**Security Group (EC2 instances):**
- Inbound: HTTP (80), HTTPS (443) from ALB security group
- Inbound: SSH (22) from admin bastion (restricted)
- Outbound: All traffic allowed (for API calls, CDN, etc.)

### 5. IAM Roles & Policies

**Lambda Execution Role:**
- Basic Lambda execution (CloudWatch Logs)
- AWS X-Ray write access
- S3 read-only access (asset bucket)
- VPC execution (if Lambda connects to RDS)

**EC2 Instance Profile:**
- S3 read-only access (assets, configs)
- CloudWatch Logs, Metrics write access
- X-Ray write access
- Secrets Manager read (for API keys)

### 6. CloudWatch Monitoring

**Log Groups:**
- `/aws/lambda/barber-shop-prod-*` (Lambda logs, 30-day retention)
- `/aws/alb/barber-shop-prod-*` (ALB access logs, 30-day retention)
- `/aws/ec2/barber-shop-prod-*` (EC2 application logs, 7-day retention)

**Metrics:**
- ALB: Target health, request count, latency, status codes
- CloudFront: Requests, bytes transferred, cache hits/misses
- S3: Bucket size, request count
- Lambda: Duration, errors, throttles
- Custom: MFE load time, API latency, booking rate

---

## Terraform Organization

### Directory Structure

```
infrastructure/
├── terraform/
│   ├── main.tf              # Root configuration, providers, data sources
│   ├── variables.tf         # Input variables
│   ├── outputs.tf           # Output values
│   ├── modules/
│   │   ├── s3.tf            # S3 bucket module
│   │   ├── cloudfront.tf    # CloudFront distribution module
│   │   ├── alb.tf           # ALB module
│   │   ├── network.tf       # VPC, subnets, security groups
│   │   └── monitoring.tf    # CloudWatch configuration
│   ├── environments/
│   │   ├── dev.tfvars       # Development environment variables
│   │   ├── staging.tfvars   # Staging environment variables
│   │   └── prod.tfvars      # Production environment variables
│   └── .terraform/          # Terraform plugins (auto-generated)
├── deployment/
│   ├── blue-green-deploy.ps1        # Blue-green deployment orchestration
│   ├── smoke-tests.ts               # Post-deployment smoke tests
│   ├── rollback.ps1                 # Rollback script (integrated into deployment)
│   └── deployment-config.json       # Deployment configuration
├── monitoring/
│   ├── cloudwatch-dashboards.tf    # Dashboard definitions
│   ├── alarms.tf                   # Alert rules
│   ├── synthetics.ts               # Synthetic monitoring scripts
│   └── pagerduty-integration.tf    # PagerDuty webhook
├── scripts/
│   ├── init-terraform.sh            # Initialize Terraform backend
│   ├── validate-infrastructure.sh   # Validate configuration
│   ├── plan-deployment.sh           # Generate terraform plan
│   └── apply-deployment.sh          # Apply Terraform changes
└── docs/
    ├── INFRASTRUCTURE.md            # This file
    ├── DEPLOYMENT-GUIDE.md          # Deployment procedures
    └── RUNBOOK-*.md                 # Operational runbooks
```

### Module Dependencies

```
main.tf
├── module.s3_assets
│   └── module.cloudfront
│       ├── aws_cloudfront_origin_access_identity
│       └── aws_s3_bucket_policy
├── module.s3_logs
│   └── aws_cloudwatch_log_group
├── module.alb
│   ├── aws_security_group
│   └── aws_security_group_rule
└── aws_iam_role (Lambda execution)
    ├── aws_iam_role_policy_attachment (basic_execution)
    └── aws_iam_role_policy_attachment (xray_write)
```

---

## Deployment Procedures

### Initial Setup (First Time)

1. **Create AWS Resources Manually:**
   - VPC (if not using default)
   - Subnets (2+ in different AZs)
   - ACM certificate for HTTPS
   - S3 backend bucket for Terraform state

2. **Initialize Terraform:**
   ```bash
   cd infrastructure/terraform
   terraform init \
     -backend-config="bucket=barber-shop-tfstate-prod" \
     -backend-config="key=prod.tfstate" \
     -backend-config="dynamodb_table=terraform-lock"
   ```

3. **Validate Configuration:**
   ```bash
   terraform validate
   terraform fmt -recursive
   ```

4. **Plan Deployment:**
   ```bash
   terraform plan -var-file="environments/prod.tfvars" -out=tfplan
   ```

5. **Review & Apply:**
   ```bash
   terraform show tfplan
   terraform apply tfplan
   ```

### Deploying Application Updates

1. **Build MFE Applications:**
   ```bash
   pnpm install
   pnpm build
   ```

2. **Upload to S3:**
   ```bash
   aws s3 sync dist/ s3://barber-shop-prod-assets/ --delete
   ```

3. **Invalidate CloudFront Cache:**
   ```bash
   aws cloudfront create-invalidation \
     --distribution-id E123ABCD1234 \
     --paths "/*"
   ```

4. **Verify Deployment:**
   ```bash
   curl -I https://barber-shop.com/
   ```

### Blue-Green Deployment

1. **Run Deployment Script:**
   ```bash
   .\infrastructure\deployment\blue-green-deploy.ps1 `
     -Environment prod `
     -Version v7.0.0 `
     -Verbose
   ```

2. **Monitor Progress:**
   - Deployment log: `deployment-prod-v7.0.0-TIMESTAMP.log`
   - CloudWatch Logs: `/aws/alb/barber-shop-prod-*`
   - Canary metrics: Errors < 1%, Latency < 3s

3. **Verify Success:**
   - Health endpoint: `https://barber-shop.com/health`
   - Error rate in CloudWatch: < 0.1%
   - User feedback: No spike in support tickets

---

## Multi-Environment Setup

### Environment Tiers

| Environment | Purpose | Auto-Deploy | Backup Frequency |
|-------------|---------|------------|------------------|
| Dev         | Testing | Yes (on git push) | Daily         |
| Staging     | Pre-prod validation | Manual | Daily         |
| Prod        | Production | Manual (gated) | Hourly        |

### Environment Variables

```bash
# Development
terraform apply -var-file="environments/dev.tfvars"

# Staging
terraform apply -var-file="environments/staging.tfvars"

# Production
terraform apply -var-file="environments/prod.tfvars"
```

### Cross-Environment Promotion

```
Dev (✓ Deploy) → Staging (✓ Integration Tests) → Prod (⚠ Manual Gate)
```

---

## State Management

### Terraform State Backend

**Configuration:**
- **Backend Type:** S3 + DynamoDB
- **S3 Bucket:** `barber-shop-tfstate-prod`
- **State File:** `prod.tfstate`
- **DynamoDB Table:** `terraform-lock`
- **Encryption:** Server-side (KMS)
- **Versioning:** Enabled

### State Backup & Recovery

**Backup Strategy:**
- Automated: S3 versioning (keep last 30 versions)
- Manual: `terraform state pull > backup.tfstate` before major changes

**Recovery:**
```bash
# If state is corrupted
terraform state list
terraform state rm resource.id
terraform import resource.id actual_id
```

### State Lock

**Purpose:** Prevent concurrent modifications

**Lock Timeout:** 
- Normal: 30 seconds
- Stuck lock: `terraform force-unlock LOCK_ID`

### State Secrets

**⚠️ Do NOT commit state file to Git**

State may contain:
- Database passwords
- API keys
- S3 access credentials

**Protection:**
- Keep `.terraform/` in `.gitignore`
- Use `sensitive()` for secrets in Terraform
- Encrypt S3 backend (KMS)
- Restrict IAM access to state bucket

---

## Security Best Practices

### 1. Identity & Access Management (IAM)

**Principle of Least Privilege:**
- Lambda: S3 read-only, CloudWatch write-only
- EC2: Secrets Manager read, CloudWatch write
- ALB: No AWS permissions (CloudWatch via role)

**MFA & Credentials:**
- Enable MFA for AWS console access
- Use IAM roles instead of long-lived keys
- Rotate access keys every 90 days

### 2. Network Security

**VPC Configuration:**
- Private subnets for sensitive workloads
- NAT Gateway for outbound traffic
- Security groups: Principle of least privilege
- NACLs: Stateless rules (rarely needed with security groups)

**DDoS Protection:**
- CloudFront: Built-in DDoS protection
- ALB: AWS Shield Standard (free)
- AWS WAF: Optional (additional cost)

### 3. Data Encryption

**In Transit:**
- HTTPS everywhere (TLS 1.2+)
- CloudFront: Force HTTPS (no HTTP fallback)
- ALB: Redirect HTTP → HTTPS

**At Rest:**
- S3: Server-side encryption (AES-256)
- RDS: Encryption enabled
- Backup storage: Encrypted

### 4. Logging & Auditing

**Enabled Logging:**
- CloudTrail: AWS API calls
- CloudFront: Access logs
- ALB: Access logs
- VPC Flow Logs: Traffic analysis
- CloudWatch: Application logs

**Log Retention:**
- Development: 7 days
- Staging: 30 days
- Production: 90 days → Glacier

### 5. Secrets Management

**Store Secrets in AWS Secrets Manager:**
```bash
# Add secret
aws secretsmanager create-secret \
  --name barber-shop/prod/api-key \
  --secret-string "your-secret-value"

# Retrieve secret (in Lambda)
import boto3
client = boto3.client('secretsmanager')
secret = client.get_secret_value(SecretId='barber-shop/prod/api-key')
```

**Do NOT:**
- Hardcode secrets in Terraform
- Commit secrets to Git
- Expose secrets in CloudWatch logs
- Share secrets via email/Slack

---

## Cost Optimization

### 1. Reserved Capacity

**EC2 Reserved Instances:**
- Commit: 1 year (33% discount) or 3 years (54% discount)
- Savings Plans: Flexible across EC2 families

**RDS Reserved Capacity:**
- Database instances: Reserve capacity for 1-3 years

### 2. CloudFront Optimization

**Cache Strategy:**
- Static assets: Long TTL (1 year)
- HTML: Short TTL (5 minutes)
- API: No caching (0 seconds)

**Regional Edge Caches:** Reduce origin load

**Compression:** Reduce bandwidth costs (gzip, brotli)

### 3. S3 Optimization

**Storage Classes:**
- Standard: Frequently accessed files
- Intelligent-Tiering: Automatic based on access patterns
- Glacier: Archive old backups

**Lifecycle Rules:**
- 90 days → Intelligent-Tiering
- 365 days → Glacier
- 2555 days → Delete

### 4. Monitoring Costs

**AWS Cost Explorer:**
- View costs by service, tag, and time
- Set budget alerts
- Forecast future spending

**Example Cost Breakdown (Production):**
| Service | Monthly Cost | Optimization |
|---------|-------------|---|
| CloudFront | $800 | Increase cache TTL, use regional edge caches |
| S3 | $200 | Use Intelligent-Tiering lifecycle |
| ALB | $150 | N/A (fixed) |
| EC2 | $2,000 | Use Reserved Instances (-50%) |
| **Total** | **$3,150** | Target: $2,000/month |

---

## Troubleshooting

### Issue: Deployment Fails

**Symptom:** `terraform apply` fails with provider error

**Causes & Solutions:**
1. **AWS Credentials:** `aws sts get-caller-identity` → Refresh credentials
2. **Resource Quota:** AWS limit exceeded → Request limit increase
3. **Invalid Configuration:** `terraform validate` → Fix syntax/variables
4. **State Lock:** Stuck lock → `terraform force-unlock LOCK_ID`

### Issue: CloudFront Cache Not Updating

**Symptom:** Old content served after deployment

**Causes & Solutions:**
1. **Cache TTL Too High:** Reduce TTL for HTML files (5 min)
2. **Invalidation Not Run:** `aws cloudfront create-invalidation --paths "/*"`
3. **CloudFront Distribution ID Wrong:** Verify in AWS console

### Issue: ALB Health Check Failing

**Symptom:** Targets marked "unhealthy"

**Causes & Solutions:**
1. **Application Not Running:** SSH to instance, check service status
2. **Security Group Blocking:** Allow port 80 from ALB security group
3. **Health Endpoint Not Responding:** Check `/health` endpoint on instance
4. **Load too High:** Monitor CPU, memory, database connections

### Issue: High Latency

**Symptom:** Response time > 3 seconds

**Causes & Solutions:**
1. **CloudFront Cache Miss:** High origin hits → Increase cache TTL
2. **ALB Latency:** Slow EC2 instance → Check CPU/memory/database
3. **Geographic Distance:** Route traffic to nearest region
4. **Network Congestion:** Monitor VPC Flow Logs

---

## References

- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest)
- [AWS CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [AWS ALB Documentation](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/)
- [Terraform Best Practices](https://developer.hashicorp.com/terraform/cloud-docs/recommended-practices)

---

**Document Version:** 1.0  
**Last Updated:** September 26, 2026  
**Maintainer:** DevOps Team
