# Barber Shop Deployment Guide

**Version:** 1.0  
**Status:** Production-Ready  
**Last Updated:** September 26, 2026

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Deployment Workflow](#deployment-workflow)
3. [Blue-Green Deployment](#blue-green-deployment)
4. [Canary Rollout Strategy](#canary-rollout-strategy)
5. [Smoke Tests](#smoke-tests)
6. [Monitoring During Deployment](#monitoring-during-deployment)
7. [Rollback Procedures](#rollback-procedures)
8. [Post-Deployment Verification](#post-deployment-verification)
9. [Common Issues & Solutions](#common-issues--solutions)

---

## Pre-Deployment Checklist

### Before Each Deployment

**1 Week Before:**
- [ ] Code review completed (at least 2 approvals)
- [ ] All tests passing (unit, integration, E2E)
- [ ] Performance testing completed (Lighthouse >= 90)
- [ ] Security audit passed (no critical vulnerabilities)
- [ ] Accessibility audit passed (WCAG 2.1 AA)
- [ ] Release notes drafted
- [ ] Rollback plan documented

**24 Hours Before:**
- [ ] Notify stakeholders (product, marketing, support)
- [ ] Schedule maintenance window (optional)
- [ ] Verify staging environment mirrors production
- [ ] Run full smoke test suite on staging
- [ ] Backup production database
- [ ] Verify on-call team is available

**2 Hours Before:**
- [ ] Check AWS service health dashboard
- [ ] Verify all team members are available
- [ ] Ensure CloudWatch dashboards are prepared
- [ ] Test VPN/SSH access to instances
- [ ] Verify CI/CD pipeline is healthy

### Environment Prerequisites

```bash
# Install required tools
aws --version                    # AWS CLI >= 2.0
terraform --version             # Terraform >= 1.5
git --version                   # Git >= 2.30
pnpm --version                  # pnpm >= 8.0

# Configure AWS credentials
aws configure
aws sts get-caller-identity      # Verify authentication

# Clone repository
git clone https://github.com/barber-shop/micro-frontend.git
cd micro-frontend

# Install dependencies
pnpm install
```

---

## Deployment Workflow

### Standard Deployment Process

```
1. Code Changes (Git)
   ↓
2. Feature Branch → Pull Request
   ↓
3. Automated Checks (CI/CD)
   ├─ Lint & Typecheck
   ├─ Unit Tests
   ├─ Integration Tests
   ├─ Security Scan
   └─ Performance Audit
   ↓
4. Code Review & Approval
   ↓
5. Merge to Main Branch
   ↓
6. Release Tag (v7.0.0)
   ↓
7. Build Artifacts
   ├─ Build MFEs (Shell, Services, Booking)
   ├─ Create Docker images
   ├─ Push to ECR
   └─ Generate release notes
   ↓
8. Deploy to Staging
   ├─ Deploy MFEs
   ├─ Run smoke tests
   ├─ Run integration tests
   └─ Performance testing
   ↓
9. Approval Gate (manual)
   ├─ QA sign-off
   ├─ Product sign-off
   └─ DevOps sign-off
   ↓
10. Deploy to Production
    ├─ Blue-green deployment
    ├─ Canary rollout (10% → 100%)
    ├─ Smoke tests
    ├─ Monitoring
    └─ Gradual traffic shift
    ↓
11. Post-Deployment Verification
    ├─ All health checks passing
    ├─ Error rate < 0.1%
    ├─ Performance metrics acceptable
    └─ User feedback positive
```

### Deployment Phases

#### Phase 1: Build (15 minutes)

```bash
cd apps/shell
pnpm build

cd ../services
pnpm build

cd ../booking
pnpm build

# Verify build artifacts
ls -la apps/*/dist/
```

#### Phase 2: Upload to S3 (5 minutes)

```bash
# Upload to release bucket (versioned)
aws s3 cp apps/shell/dist/ s3://barber-shop-releases/v7.0.0/shell/ --recursive
aws s3 cp apps/services/dist/ s3://barber-shop-releases/v7.0.0/services/ --recursive
aws s3 cp apps/booking/dist/ s3://barber-shop-releases/v7.0.0/booking/ --recursive

# Verify upload
aws s3 ls s3://barber-shop-releases/v7.0.0/
```

#### Phase 3: Update Infrastructure (10 minutes)

```bash
cd infrastructure/terraform

# Validate
terraform validate
terraform plan -var-file="environments/prod.tfvars" -out=tfplan

# Review plan output
terraform show tfplan

# Apply if changes are needed
terraform apply tfplan
```

#### Phase 4: Deploy to Staging (15 minutes)

```bash
# SSH to staging instances
ssh -i ~/.ssh/prod.pem ec2-user@staging-instance-1

# Pull new version
cd /opt/barber-shop
git fetch
git checkout v7.0.0
pnpm ci --production
pnpm build
sudo systemctl restart barber-shop

# Verify on all staging instances
curl -I https://staging.barber-shop.com/
```

#### Phase 5: Run Staging Tests (20 minutes)

```bash
# Smoke tests
pnpm test:smoke -- --config=staging

# Integration tests
pnpm test:integration -- --config=staging

# Performance tests
pnpm test:performance -- --config=staging

# Accessibility tests
pnpm test:a11y -- --config=staging
```

#### Phase 6: Approval Gate

- [ ] QA lead approves
- [ ] Product owner approves
- [ ] DevOps lead approves
- [ ] CTO/VP approves (for major releases)

#### Phase 7: Deploy to Production (30-45 minutes)

```bash
# Execute blue-green deployment
$env:ENVIRONMENT = 'prod'
$env:VERSION = 'v7.0.0'

.\infrastructure\deployment\blue-green-deploy.ps1 `
  -Environment prod `
  -Version v7.0.0 `
  -CanaryDuration 300 `
  -RollbackOnError $true `
  -ErrorRateThreshold 0.01 `
  -Verbose
```

---

## Blue-Green Deployment

### What is Blue-Green Deployment?

Two identical production environments:
- **Blue:** Current production (receiving 100% traffic)
- **Green:** New version (receiving 0% traffic)

**Advantages:**
- Zero-downtime deployment
- Easy rollback (switch back to blue)
- Test new version before traffic cutover
- Minimal user impact

### Blue-Green Process

```
┌─────────────────────────────────────────┐
│           Initial State                  │
│   Blue (100%)     Green (0%)            │
│   v6.0.0          inactive              │
│   ✓ Active        -                     │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│     Step 1: Deploy Green                │
│   Blue (100%)     Green (0%)            │
│   v6.0.0          v7.0.0                │
│   ✓ Active        ✓ Warming up          │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│     Step 2: Health Check Green          │
│   Blue (100%)     Green (0%)            │
│   v6.0.0          v7.0.0                │
│   ✓ Active        ✓ Healthy            │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│     Step 3: Smoke Tests Green           │
│   Blue (100%)     Green (0%)            │
│   v6.0.0          v7.0.0                │
│   ✓ Active        ✓ Tests Passed       │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│     Step 4: Canary (10% traffic)        │
│   Blue (90%)      Green (10%)           │
│   v6.0.0          v7.0.0                │
│   ✓ Active        ✓ Receiving traffic   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│     Step 5: Canary (25% traffic)        │
│   Blue (75%)      Green (25%)           │
│   v6.0.0          v7.0.0                │
│   ✓ Active        ✓ Increasing load     │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│     Step 6: Canary (50% traffic)        │
│   Blue (50%)      Green (50%)           │
│   v6.0.0          v7.0.0                │
│   ✓ Active        ✓ Full testing        │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│     Step 7: Finalize (100% traffic)     │
│   Blue (0%)       Green (100%)          │
│   v6.0.0          v7.0.0                │
│   -               ✓ Active              │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│     Step 8: Cleanup Blue                │
│   Blue (-)        Green (100%)          │
│   -               v7.0.0                │
│   -               ✓ Active              │
└─────────────────────────────────────────┘
```

### Triggering Blue-Green Deployment

```powershell
# Full deployment with all stages
.\infrastructure\deployment\blue-green-deploy.ps1 `
  -Environment prod `
  -Version v7.0.0 `
  -Verbose

# With custom canary duration (60 seconds per stage for testing)
.\infrastructure\deployment\blue-green-deploy.ps1 `
  -Environment prod `
  -Version v7.0.0 `
  -CanaryDuration 60 `
  -Verbose

# Disable automatic rollback (manual control)
.\infrastructure\deployment\blue-green-deploy.ps1 `
  -Environment prod `
  -Version v7.0.0 `
  -RollbackOnError $false `
  -Verbose
```

---

## Canary Rollout Strategy

### What is a Canary Deployment?

Gradually shift traffic from old version (blue) to new version (green):
- Minimize risk by limiting blast radius
- Monitor new version before full rollout
- Automatic rollback if errors detected

### Canary Stages

| Stage | Traffic | Duration | Success Criteria |
|-------|---------|----------|-----------------|
| 1 | 10% | 5 min | Error rate < 1%, Latency < 3s |
| 2 | 25% | 5 min | Error rate < 0.5%, Latency < 2.5s |
| 3 | 50% | 5 min | Error rate < 0.1%, Latency < 2.5s |
| 4 | 100% | 5 min | Error rate < 0.1%, Latency < 2.5s |

### Canary Monitoring

During each stage, monitor:

```bash
# Error rate
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name HTTPCode_Target_5XX_Count \
  --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Average

# Latency (p99)
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name TargetResponseTime \
  --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Maximum

# CPU utilization
aws cloudwatch get-metric-statistics \
  --namespace AWS/EC2 \
  --metric-name CPUUtilization \
  --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Average
```

### Canary Rollback

If error rate exceeds threshold (default: 1%):

```bash
# Automatic rollback (if enabled)
# → Traffic reverted to blue (100%)
# → Green environment terminated
# → Deployment marked as FAILED

# Manual rollback
aws elbv2 modify-rule \
  --rule-arn arn:aws:elasticloadbalancing:... \
  --forward-config "TargetGroups=[{TargetGroupArn=blue-arn,Weight=100}]"
```

---

## Smoke Tests

### What are Smoke Tests?

Quick tests to verify application is functional after deployment:
- Basic endpoints responding (HTTP 200)
- Core features working (booking, services, etc.)
- No obvious errors in logs

### Running Smoke Tests

```bash
# Manual smoke tests
curl -I https://barber-shop.com/           # Homepage
curl -I https://barber-shop.com/health     # Health check
curl https://barber-shop.com/services      # Services page

# Automated smoke test suite
pnpm test:smoke -- --environment=prod

# Smoke tests with screenshots
pnpm test:smoke -- --environment=prod --screenshots

# Specific smoke test
pnpm test:smoke -- --test "booking-flow" --environment=prod
```

### Smoke Test Scenarios

| Test | Endpoint | Expected | Timeout |
|------|----------|----------|---------|
| Homepage | GET / | 200 | 5s |
| Services | GET /services | 200 + list | 5s |
| Booking | POST /booking | 201 | 10s |
| Health | GET /health | 200 + JSON | 3s |
| API Gateway | GET /api/config | 200 + config | 5s |

---

## Monitoring During Deployment

### Real-Time Dashboard

Open CloudWatch Dashboard:
```bash
aws cloudwatch get-dashboard --dashboard-name barber-shop-prod-overview
```

### Key Metrics to Watch

**Every 30 seconds:**
1. **Error Rate** (target: < 0.1%)
   - ALB HTTPCode_Target_5XX_Count
   - Increase = Issue detected

2. **Response Latency** (target: p99 < 2.5s)
   - ALB TargetResponseTime
   - Spike = Performance degradation

3. **Request Count** (baseline: 100-500 req/min)
   - ALB RequestCount
   - Sudden drop = Traffic routing issue

4. **Target Health** (target: All healthy)
   - ALB HealthyHostCount vs UnhealthyHostCount
   - Any unhealthy = Instance issue

**Every 5 minutes:**
1. **CPU Utilization** (target: < 70%)
2. **Memory Usage** (target: < 80%)
3. **Database Connections** (target: < 80% of max)
4. **Cache Hit Rate** (target: > 80% for static assets)

### Alert Thresholds

```
Error Rate:
  WARNING: > 0.5%
  CRITICAL: > 1%
  ACTION: Immediate rollback

Latency:
  WARNING: p99 > 3s
  CRITICAL: p99 > 5s
  ACTION: Check database, network, instances

Availability:
  WARNING: < 99.5%
  CRITICAL: < 99%
  ACTION: Scale up instances, check logs
```

---

## Rollback Procedures

### Automatic Rollback

Triggered automatically if:
- Error rate > 1% during canary stage
- Latency p99 > 5 seconds
- Availability < 99%
- Smoke tests fail

```bash
# Automatic rollback happens:
1. Revert 100% traffic to blue
2. Deregister green instances
3. Delete green target group
4. Alert on-call team
5. Log incident
```

### Manual Rollback

```bash
# If automatic rollback didn't trigger or needs manual intervention

# Step 1: Verify current state
aws elbv2 describe-target-groups --names barber-shop-prod-blue barber-shop-prod-green

# Step 2: Get listener rule ARN
LISTENER_ARN=$(aws elbv2 describe-listeners \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --query "Listeners[0].ListenerArn" --output text)

RULE_ARN=$(aws elbv2 describe-rules \
  --listener-arn $LISTENER_ARN \
  --query "Rules[0].RuleArn" --output text)

# Step 3: Revert traffic to blue (100%)
aws elbv2 modify-rule \
  --rule-arn $RULE_ARN \
  --forward-config "TargetGroups=[{TargetGroupArn=arn:aws:elasticloadbalancing:.../targetgroup/barber-shop-prod-blue/abc123,Weight=100}]"

# Step 4: Verify traffic reverted
curl https://barber-shop.com/

# Step 5: Verify error rate decreased
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name HTTPCode_Target_5XX_Count \
  --start-time $(date -u -d '10 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Average

# Step 6: Decommission green
aws elbv2 delete-target-group --target-group-arn arn:aws:elasticloadbalancing:.../targetgroup/barber-shop-prod-green/abc123

# Step 7: Notify stakeholders
# Post in #deployments Slack channel
# Message: "Deployment of v7.0.0 rolled back. Error rate > 1%. Investigating..."
```

### Quick Rollback for Emergencies

```bash
# If deployment is critical issue and needs instant rollback

# SSH to any instance
ssh -i ~/.ssh/prod.pem ec2-user@prod-instance-1

# Restart with previous version
cd /opt/barber-shop
git fetch
git checkout v6.0.0  # Previous stable version
pnpm ci --production
pnpm build
sudo systemctl restart barber-shop

# Verify on all instances
for instance in prod-{1,2,3}; do
  echo "Checking $instance..."
  curl -I https://barber-shop.com/
done

# Notify team (in #incidents Slack)
# Message: "Emergency rollback complete. v6.0.0 restored. Investigation required."
```

---

## Post-Deployment Verification

### Immediate Verification (5 minutes after deployment)

```bash
# 1. Health check
curl -v https://barber-shop.com/health

# 2. Homepage loads
curl -v https://barber-shop.com/ | grep "<title>"

# 3. API responds
curl https://barber-shop.com/api/config | jq .

# 4. No 5xx errors in logs
aws logs tail /aws/alb/barber-shop-prod --follow | grep -i "5[0-9][0-9]"

# 5. CloudFront cache working
curl -I https://barber-shop.com/static/app.js | grep X-Cache
```

### Short-Term Monitoring (24 hours)

| Check | Frequency | Success Criteria |
|-------|-----------|-----------------|
| Error rate | Every 5 min | < 0.1% |
| Latency p99 | Every 5 min | < 2.5s |
| Availability | Every 15 min | > 99.9% |
| Database connections | Every 30 min | < 70% of max |
| CPU utilization | Every 30 min | < 70% |
| User bookings | Every hour | >= baseline |
| Support tickets | Every 2 hours | No spike |

### Long-Term Verification (Week 1)

- [ ] Error rate trending stable (< 0.05%)
- [ ] No memory leaks (memory usage stable)
- [ ] No database connection leaks
- [ ] Performance metrics within expectations
- [ ] User feedback positive (NPS >= 40)
- [ ] No major bugs reported
- [ ] All analytics funnels working
- [ ] Payment processing successful
- [ ] Email/SMS notifications working

---

## Common Issues & Solutions

### Issue: Deployment Hangs During Canary

**Symptom:** Stuck on "Canary Stage 1 of 4"

**Cause:** Instance health checks failing

**Solution:**
```bash
# SSH to instance
ssh -i ~/.ssh/prod.pem ec2-user@prod-instance-1

# Check application logs
tail -100 /var/log/barber-shop/app.log

# Check service status
sudo systemctl status barber-shop

# Restart service
sudo systemctl restart barber-shop

# Monitor health
curl -I http://localhost:3000/health
```

### Issue: High Error Rate During Canary

**Symptom:** Error rate jumps to > 1%

**Cause:** New code has bugs or incompatibility

**Solution:**
1. Automatic rollback triggers
2. Investigate failure:
   ```bash
   # View error logs
   aws logs filter-log-events \
     --log-group-name /aws/alb/barber-shop-prod \
     --start-time $(date -d '5 minutes ago' +%s)000

   # Check deployment log
   cat deployment-prod-v7.0.0-*.log
   ```
3. Fix code and retry

### Issue: Latency Spike After Deployment

**Symptom:** Response time p99 > 5 seconds

**Cause:** N+1 queries, missing indexes, memory pressure

**Solution:**
1. Check database slow query log
2. Review code changes for new queries
3. Add missing indexes
4. Scale up instances (vertical scaling)
5. Or revert to previous version

### Issue: CloudFront Cache Not Invalidating

**Symptom:** Old CSS/JS loaded after deployment

**Solution:**
```bash
# Manually invalidate cache
aws cloudfront create-invalidation \
  --distribution-id E123ABC \
  --paths "/*"

# Verify invalidation created
aws cloudfront list-invalidations --distribution-id E123ABC

# Monitor invalidation progress
aws cloudfront get-invalidation \
  --distribution-id E123ABC \
  --id I12345ABC
```

### Issue: Rollback Failed

**Symptom:** Manual rollback commands fail

**Solution:**
```bash
# Step 1: Verify target groups exist
aws elbv2 describe-target-groups

# Step 2: List all instances
aws ec2 describe-instances --filters "Name=tag:Environment,Values=prod"

# Step 3: Manual traffic revert via AWS console
# → ALB → Listeners → Edit forward rule → Change weights to 100% blue

# Step 4: Verify traffic shifted
curl -I https://barber-shop.com/
curl -I https://barber-shop.com/api/config

# Step 5: Contact AWS support if TG operations fail
aws support create-case --service-code general-guidance
```

---

## Deployment Runbook Summary

```bash
# Quick copy-paste for deployment:

# 1. Build
cd apps/shell && pnpm build && cd ../..
cd apps/services && pnpm build && cd ../..
cd apps/booking && pnpm build && cd ../..

# 2. Upload to S3
aws s3 cp apps/shell/dist/ s3://barber-shop-releases/v7.0.0/shell/ --recursive
aws s3 cp apps/services/dist/ s3://barber-shop-releases/v7.0.0/services/ --recursive
aws s3 cp apps/booking/dist/ s3://barber-shop-releases/v7.0.0/booking/ --recursive

# 3. Deploy staging
.\infrastructure\deployment\blue-green-deploy.ps1 -Environment staging -Version v7.0.0

# 4. Run staging tests
pnpm test:smoke --config=staging
pnpm test:integration --config=staging

# 5. Deploy production (after approval)
.\infrastructure\deployment\blue-green-deploy.ps1 -Environment prod -Version v7.0.0 -Verbose

# 6. Monitor
# → Watch CloudWatch dashboard
# → Monitor Slack alerts
# → Check error rate < 0.1%
# → Verify user bookings working
```

---

**Document Version:** 1.0  
**Last Updated:** September 26, 2026  
**Maintainer:** DevOps Team
