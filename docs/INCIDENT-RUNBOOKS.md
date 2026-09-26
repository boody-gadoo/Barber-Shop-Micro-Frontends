# Barber Shop Incident Runbooks

**Version:** 1.0  
**Status:** Production-Ready  
**Last Updated:** September 26, 2026

---

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Incident Response Process](#incident-response-process)
3. [Critical Incidents](#critical-incidents)
4. [Operational Incidents](#operational-incidents)
5. [Post-Incident Review](#post-incident-review)

---

## Quick Reference

### Escalation Matrix

| Severity | Response Time | Escalation | On-Call |
|----------|---------------|------------|---------|
| P1 (Critical) | 5 min | Page on-call immediately | Engineering Lead |
| P2 (High) | 15 min | Notify on-call team | DevOps Lead |
| P3 (Medium) | 1 hour | Notify team in #incidents | Team Lead |
| P4 (Low) | 24 hours | Create ticket | Team |

### Key Contacts

- **On-Call Engineer:** `@on-call-platform` (Slack)
- **Engineering Lead:** engineering-lead@barber-shop.com
- **DevOps Lead:** devops-lead@barber-shop.com
- **PagerDuty:** [escalation-policy-url]

### Useful Commands

```bash
# Check service health
curl -I https://barber-shop.com/health

# View recent errors
aws logs tail /aws/alb/barber-shop-prod --follow

# View CloudWatch dashboard
aws cloudwatch get-dashboard --dashboard-name barber-shop-prod-overview

# SSH to instance (for inspection)
aws ssm start-session --target i-xxxxxxxxx

# Check deployment status
git log --oneline -5
```

---

## Incident Response Process

### Phase 1: Detection (0 min)

**Who:** Alert system or user report  
**What:** Incident is detected via monitoring or user feedback

**Actions:**
1. [ ] Alert fires (CloudWatch, PagerDuty, etc.)
2. [ ] On-call engineer acknowledges alert
3. [ ] Incident channel created: `#incident-TIMESTAMP`
4. [ ] Timeline started in incident tracking

**Communication:**
```
[Slack #incidents]
🚨 P1 INCIDENT: High error rate detected
- Alert: ErrorRate > 1%
- Started: 2026-09-26 10:30:00 UTC
- Status: INVESTIGATING
- Owner: @on-call-engineer
```

### Phase 2: Triage (5-15 min)

**Who:** On-call engineer + responders  
**What:** Determine severity, scope, and initial response

**Actions:**
1. [ ] Connect to war room (Slack + Zoom)
2. [ ] Verify incident (check monitoring dashboards)
3. [ ] Determine severity (P1/P2/P3/P4)
4. [ ] Identify affected services (Shell/Services/Booking/API)
5. [ ] Initial hypothesis: Database? API? Network? Code?
6. [ ] Page additional engineers if needed

**Questions to Answer:**
- How many users affected?
- What services are down/degraded?
- How long has this been happening?
- Is it getting worse?
- What changed recently?

**Communication:**
```
[Slack #incident-TIMESTAMP]
✓ TRIAGE COMPLETE
- Severity: P1 (Critical)
- Scope: Booking service down (3 instances unhealthy)
- Last deployment: 2 hours ago (v7.0.0)
- Hypothesis: Memory leak from new booking code
- Actions: Rolling back deployment
- ETA: 5 minutes
```

### Phase 3: Response (15-60 min)

**Who:** Incident commander + specialists  
**What:** Take action to restore service

**Actions depend on incident type (see below)**

### Phase 4: Recovery (varies)

**Who:** On-call engineer + team  
**What:** Restore service to normal operation

**Actions:**
1. [ ] Service restored to normal
2. [ ] Monitor error rate, latency, availability
3. [ ] Verify no cascading failures
4. [ ] Confirm user traffic returning to normal

**Success Criteria:**
- Error rate < 0.1%
- Latency p99 < 2.5s
- All instances healthy
- No new alerts firing

### Phase 5: Post-Incident (24 hours)

**Who:** Incident commander + team  
**What:** Review incident and prevent recurrence

**Actions:**
1. [ ] Root cause analysis
2. [ ] Action items assigned
3. [ ] Timeline documented
4. [ ] Learning shared with team

---

## Critical Incidents

### Incident: High Error Rate (>1%)

**Severity:** P1  
**Time to Restore:** Target < 15 min  
**Typical Causes:**
- Code bug in recent deployment
- Database connectivity issue
- API rate limiting / quota exceeded
- External service dependency down

**Investigation Steps:**

```bash
# 1. Check error rate trend
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name HTTPCode_Target_5XX_Count \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Average

# 2. View error logs
aws logs filter-log-events \
  --log-group-name /aws/alb/barber-shop-prod \
  --filter-pattern "ERROR" \
  --start-time $(date -d '15 minutes ago' +%s)000 | head -50

# 3. Check recent deployments
git log --oneline -10

# 4. Check if specific service affected
aws logs filter-log-events \
  --log-group-name /aws/alb/barber-shop-prod \
  --filter-pattern "services" \
  --start-time $(date -d '15 minutes ago' +%s)000

# 5. Check database connections
aws rds describe-db-instances --query "DBInstances[0].PendingModifiedValues"
```

**Response Decision Tree:**

```
High Error Rate Detected
│
├─ Error started after deployment?
│  ├─ YES → Rollback deployment (see DEPLOYMENT-GUIDE.md)
│  └─ NO → Continue investigation
│
├─ Check specific services
│  ├─ Shell errors? → Check CDN, assets
│  ├─ Services errors? → Check database, API
│  ├─ Booking errors? → Check payment gateway, database
│  └─ API errors? → Check downstream services
│
├─ Check infrastructure
│  ├─ Unhealthy instances? → Restart instances
│  ├─ High CPU? → Scale up, check for leaks
│  ├─ Database slow? → Kill long queries, optimize
│  └─ Network issues? → Check security groups, NACLs
│
└─ If no root cause found
   └─ Page on-call architect for deep dive
```

**Response Actions:**

```bash
# Option 1: Rollback deployment
./infrastructure/deployment/blue-green-deploy.ps1 `
  -Environment prod `
  -Version v6.0.0 `
  -Verbose

# Option 2: Restart unhealthy instances
for instance in prod-{1,2,3}; do
  aws ec2 reboot-instances --instance-ids $instance
done

# Option 3: Scale up ASG (if applicable)
aws autoscaling set-desired-capacity \
  --auto-scaling-group-name barber-shop-prod-asg \
  --desired-capacity 6  # Increase from current

# Option 4: Kill slow database queries
aws rds describe-db-instances \
  --query "DBInstances[0].Endpoint.Address"
# SSH to RDS instance and run:
# SELECT * FROM INFORMATION_SCHEMA.PROCESSLIST WHERE TIME > 300;
# KILL QUERY process_id;
```

**Communication Template:**

```
[UPDATE] Error rate > 1%
- Started: 2026-09-26 10:30 UTC
- Affected: Booking service (20% of requests failing)
- Root cause: Memory leak in booking service
- Action: Restarting booking instances
- ETA: 5 minutes to recover
- Workaround: None available
```

---

### Incident: Service Completely Down

**Severity:** P1  
**Time to Restore:** Target < 10 min  
**Typical Causes:**
- All instances crashed / unhealthy
- Load balancer misconfiguration
- Database completely unavailable
- Network partition

**Investigation Steps:**

```bash
# 1. Check target health
aws elbv2 describe-target-health \
  --target-group-arn arn:aws:elasticloadbalancing:... \
  --query "TargetHealthDescriptions[].[Target.Id,TargetHealth.State]"

# 2. Check ALB health
aws elbv2 describe-load-balancers \
  --names barber-shop-prod \
  --query "LoadBalancers[0].[State.Code,Scheme]"

# 3. Check instance status
aws ec2 describe-instance-status \
  --filters "Name=tag:Environment,Values=prod" \
  --query "InstanceStatuses[].[InstanceId,InstanceState.Name,SystemStatus.Status]"

# 4. Check database connectivity
# From a functioning instance:
mysql -h database.rds.amazonaws.com -u admin -p database_name -e "SELECT 1"
```

**Response Actions:**

```bash
# Option 1: Restart all instances
aws ec2 reboot-instances \
  --instance-ids $(aws ec2 describe-instances \
    --filters "Name=tag:Environment,Values=prod" \
    --query "Reservations[*].Instances[*].InstanceId" \
    --output text)

# Option 2: Recreate instances (if corrupted)
terraform apply -var-file="environments/prod.tfvars" -replace="aws_instance.barber_shop"

# Option 3: Force new ALB target deployment
aws elbv2 deregister-targets \
  --target-group-arn arn:aws:elasticloadbalancing:... \
  --targets Id=instance-1

# Wait for health check recovery
aws elbv2 wait target-in-service \
  --target-group-arn arn:aws:elasticloadbalancing:...
```

---

### Incident: High Latency (p99 > 5s)

**Severity:** P2  
**Time to Restore:** Target < 30 min  
**Typical Causes:**
- Database N+1 queries
- External API slow response
- Network congestion
- Resource exhaustion (CPU/memory)

**Investigation Steps:**

```bash
# 1. Check latency trend
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name TargetResponseTime \
  --start-time $(date -u -d '30 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Average,Maximum

# 2. Check which endpoints are slow
aws logs filter-log-events \
  --log-group-name /aws/alb/barber-shop-prod \
  --filter-pattern "[... duration > 3000]" | head -20

# 3. Check database query performance
# From database instance:
SHOW PROCESSLIST;  # Long-running queries
SHOW ENGINE INNODB STATUS;  # Database state

# 4. Check X-Ray service map
aws xray get-service-graph --start-time $(date -d '30 minutes ago' +%s) --end-time $(date +%s)

# 5. Check CPU/memory
aws cloudwatch get-metric-statistics \
  --namespace AWS/EC2 \
  --metric-name CPUUtilization \
  --start-time $(date -u -d '30 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Average,Maximum
```

**Response Actions:**

```bash
# Option 1: Scale up instances
aws autoscaling set-desired-capacity \
  --auto-scaling-group-name barber-shop-prod-asg \
  --desired-capacity 8

# Option 2: Kill slow queries (if database is bottleneck)
# Connect to database and run:
SELECT * FROM INFORMATION_SCHEMA.PROCESSLIST WHERE TIME > 60;

# Option 3: Clear cache (if cache is stale/hot)
# In application code, trigger cache invalidation

# Option 4: Scale database read replicas (if read-heavy)
aws rds create-db-instance-read-replica \
  --db-instance-identifier barber-shop-prod-read-replica \
  --source-db-instance-identifier barber-shop-prod
```

---

## Operational Incidents

### Incident: Memory Leak Detected

**Severity:** P2  
**Time to Resolve:** Target < 1 hour

**Symptoms:**
- Memory usage increasing over time
- Garbage collection happening more frequently
- Latency increasing as memory fills up
- Eventually OOM (Out of Memory) errors

**Investigation:**

```bash
# 1. Check memory trend
aws cloudwatch get-metric-statistics \
  --namespace BarberShop \
  --metric-name MemoryUsage \
  --start-time $(date -u -d '2 hours ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average

# 2. SSH to instance and check memory
free -h
ps aux --sort=-%mem | head -20

# 3. Check for unfinished requests
lsof -p <pid> | grep -c "socket"

# 4. Check application logs for clues
tail -100 /var/log/barber-shop/app.log | grep -i "memory\|leak\|gc"
```

**Response:**

```bash
# Option 1: Restart affected instances
sudo systemctl restart barber-shop

# Option 2: Disable caching (temporary while investigating)
# In application config

# Option 3: Increase memory if available
# Scale instance type up

# Option 4: Enable debug logging to find leak
# Update log level to DEBUG
# Capture logs for 30 minutes
# Analyze for patterns
```

---

### Incident: Database Connection Pool Exhausted

**Severity:** P2  
**Time to Restore:** Target < 10 min

**Symptoms:**
- "Connection refused" errors
- API latency spikes
- Some requests timeout

**Investigation:**

```bash
# 1. Check connection count
SHOW STATUS LIKE 'Threads_connected';
SELECT * FROM INFORMATION_SCHEMA.PROCESSLIST;

# 2. Check for idle connections
SELECT ID, USER, HOST, TIME, STATE FROM INFORMATION_SCHEMA.PROCESSLIST WHERE COMMAND = 'Sleep' AND TIME > 300;

# 3. Check connection pool config
grep -i "pool\|connection" /opt/barber-shop/config.yml
```

**Response:**

```bash
# Option 1: Increase connection pool size
# Update config and restart

# Option 2: Kill idle connections
SELECT 'KILL ' + CAST(ID AS CHAR) + ';'
FROM INFORMATION_SCHEMA.PROCESSLIST
WHERE TIME > 300 AND COMMAND = 'Sleep'

# Option 3: Add connection pool read replicas
# Distribute queries across replicas
```

---

## Post-Incident Review

### Incident Report Template

```markdown
# Incident Report

## Summary
- **Title:** [Brief description]
- **Date:** [Date time]
- **Duration:** [Start] - [End] (XX minutes)
- **Severity:** P1/P2/P3
- **Impact:** [What broke, how many users affected]

## Timeline
- T+0m: [Event] → [Detection method]
- T+5m: [Action taken]
- T+15m: [Root cause identified]
- T+20m: [Fix implemented]
- T+25m: [Service recovered]

## Root Cause
[Detailed explanation of what went wrong]

## Impact Assessment
- Users affected: ~[X]K
- Revenue impact: ~$[X]K
- Data loss: None / [description]
- SLA breached: Yes / No

## Contributing Factors
1. [Factor 1]
2. [Factor 2]
3. [Factor 3]

## Remediation
- [Action] by [Owner] by [Date]
- [Action] by [Owner] by [Date]

## Prevention
[How to prevent this in the future]

## Learning
[What we learned]
```

### Creating Action Items

**Good Action Items:**
- [ ] Add database connection pool monitoring (Owner: Platform, Due: 1 week)
- [ ] Implement circuit breaker for external API (Owner: Services Team, Due: 2 weeks)
- [ ] Add N+1 query detection in CI (Owner: QA, Due: 3 days)

**Bad Action Items:**
- [ ] "Improve monitoring" (Too vague)
- [ ] "Fix the issue" (Already done)
- [ ] "Be more careful" (Not actionable)

---

## Related Documents

- [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md) - Rollback procedures
- [OBSERVABILITY-GUIDE.md](./OBSERVABILITY-GUIDE.md) - Monitoring dashboards
- [INFRASTRUCTURE.md](./INFRASTRUCTURE.md) - Infrastructure overview

---

**Document Version:** 1.0  
**Last Updated:** September 26, 2026  
**Maintainer:** DevOps & SRE Team
