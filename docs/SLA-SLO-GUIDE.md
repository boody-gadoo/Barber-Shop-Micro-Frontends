# Barber Shop SLA, SLO, and Error Budget Guide

**Version:** 1.0  
**Status:** Production-Ready  
**Last Updated:** September 26, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Service Level Objectives (SLOs)](#service-level-objectives-slos)
3. [Service Level Agreements (SLAs)](#service-level-agreements-slas)
4. [Error Budgets](#error-budgets)
5. [Measurement & Monitoring](#measurement--monitoring)
6. [Response Times & Escalation](#response-times--escalation)

---

## Overview

### SLO vs SLA

**SLO (Service Level Objective):**
- Internal target we aim for
- Stricter than SLA (buffer for mistakes)
- Example: 99.95% uptime (internal goal)

**SLA (Service Level Agreement):**
- External commitment to customers
- Legal obligation with credits if breached
- Example: 99.9% uptime (customer promise)

### SLO/SLA Strategy

```
Target SLA: 99.9% uptime (43.2 minutes downtime/month)
Target SLO: 99.95% uptime (21.6 minutes downtime/month)
Error Budget: 0.05% (26 minutes/month) for maintenance & experiments
```

---

## Service Level Objectives (SLOs)

### Availability SLOs

| Service | SLO | Error Budget/Month |
|---------|-----|-------------------|
| **Shell MFE** | 99.95% | 21.6 min |
| **Services MFE** | 99.95% | 21.6 min |
| **Booking MFE** | 99.98% | 8.6 min |
| **API Gateway** | 99.99% | 4.3 min |
| **Database** | 99.99% | 4.3 min |
| **Overall Platform** | 99.9% | 43.2 min |

### Performance SLOs

| Metric | Target | Calculation |
|--------|--------|-------------|
| **Homepage Load (p99)** | < 2.5s | Time to interactive (LCP + FID) |
| **Services List (p99)** | < 2.0s | API latency + render time |
| **Booking Form (p99)** | < 3.0s | Includes form validation |
| **API Response (p95)** | < 500ms | Server processing time |
| **Search Results (p99)** | < 1.5s | Search + render |
| **Payment Processing** | < 3.0s | Payment gateway + confirmation |

### Error Rate SLOs

| Service | Target | Threshold |
|---------|--------|-----------|
| **HTTP 5xx Errors** | < 0.1% | Alert at 0.05% |
| **API Errors** | < 0.05% | Alert at 0.02% |
| **Booking Failures** | < 0.5% | Alert at 0.3% |
| **Payment Errors** | < 0.01% | Alert at 0.005% |
| **Database Errors** | < 0.001% | Alert at 0.0005% |

---

## Service Level Agreements (SLAs)

### Uptime Commitment

```
Monthly Uptime (%)  Credit (% of Monthly Fee)
99.9% - 99.99%      5%
99% - 99.89%        10%
95% - 98.99%        25%
< 95%               50%
```

### Calculation

**Monthly Uptime % = (Minutes in Month - Downtime) / Minutes in Month × 100**

Example:
- September 2026: 43,200 minutes
- Downtime: 50 minutes (incident at 10 AM, resolved by 10:50 AM)
- Uptime: (43,200 - 50) / 43,200 × 100 = **99.88%** → 10% credit

### Excluded Downtime

NOT counted toward SLA:
- Planned maintenance (24 hours notice)
- User errors / misconfiguration
- Issues caused by third-party services (payment gateway, SMS provider)
- DDoS attacks (covered by separate SLA)
- Force majeure (natural disaster, war)

---

## Error Budgets

### Monthly Error Budget Allocation

```
Total Error Budget: 43.2 minutes/month (99.9% SLA)

Allocated to:
├─ Planned Maintenance: 20 min (46%)
├─ Emergency Incidents: 15 min (35%)
├─ Experimentation: 5 min (12%)
└─ Reserve: 3.2 min (7%)
```

### Spending Error Budget

**Strategy:** Spend budget intentionally, don't waste it

✅ **Good uses:**
- Controlled canary deployments (gradual rollout reduces risk)
- A/B testing new features (measure before full rollout)
- Database maintenance (apply security patches)
- Emergency fixes for customer-impacting bugs

❌ **Avoid:**
- Unplanned downtime
- Cancelled deployments
- Poorly tested releases

### Budget Tracking

```
September 2026:
├─ Maintenance (AWS updates): 8 min spent
├─ Incident (payment issue): 12 min spent
├─ Canary testing (smooth rollout): 2 min spent
├─ Total: 22 min spent
└─ Remaining: 21.2 min
```

---

## Measurement & Monitoring

### Uptime Calculation

```typescript
// Code to calculate monthly uptime
async function calculateMonthlyUptime(year: number, month: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  const totalMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60);

  // Get downtime from incidents database
  const incidents = await getIncidents(startDate, endDate);
  let totalDowntime = 0;

  for (const incident of incidents) {
    if (!incident.isPlannedMaintenance) {
      const downtime = (incident.resolvedAt - incident.startedAt) / (1000 * 60);
      totalDowntime += downtime;
    }
  }

  const uptime = ((totalMinutes - totalDowntime) / totalMinutes) * 100;
  return {
    uptime: uptime.toFixed(2),
    downtime: totalDowntime.toFixed(1),
    credit: calculateCredit(uptime),
  };
}
```

### Dashboard Metrics

**Real-time Status Page:**
- Current availability (last 24 hours)
- Response time (p99, p95, avg)
- Error rate (5xx, 4xx)
- Incident history (last 30 days)

**Weekly Report:**
- SLO compliance (all services)
- Performance trends
- Error budget spent
- Incidents and resolutions

**Monthly Report:**
- SLO/SLA compliance
- Error budget analysis
- Recommendations for improvements
- Customer communications (credits if applicable)

---

## Response Times & Escalation

### Incident Severity & Response

| P1 (Critical) | P2 (High) | P3 (Medium) | P4 (Low) |
|---------------|-----------|------------|---------|
| Response: 5 min | Response: 15 min | Response: 1 hour | Response: 24 hours |
| Update: Every 15 min | Update: Every 30 min | Update: Every 2 hours | No updates |
| Owner: Engineering Lead | Owner: DevOps Lead | Owner: Team Lead | Owner: Team |
| Escalation: YES | Escalation: If > 30 min | Escalation: If > 4 hours | Escalation: If > 2 days |

### SLA Impact

| Duration | SLA Impact | Action |
|----------|-----------|--------|
| < 1 min | None | Log and monitor |
| 1-5 min | < 0.1% | Incident review |
| 5-15 min | 0.1-0.5% | Postmortem required |
| 15-60 min | 0.5-2% | Executive review |
| > 60 min | > 2% | Customer credit + review |

---

## Service-Specific SLOs

### Shell MFE

```
Availability: 99.95%
├─ Typical issues: CDN cache expiration, JS errors
├─ Recovery: Invalidate CDN cache (instant)
└─ Monthly budget: 21.6 minutes

Performance:
├─ Page load (p99): < 2.5s
├─ First paint (p95): < 1.8s
└─ Interaction: < 200ms
```

### Services MFE

```
Availability: 99.95%
├─ Typical issues: Database slow queries, search timeouts
├─ Recovery: Scale database read replicas, optimize queries
└─ Monthly budget: 21.6 minutes

Performance:
├─ Services list (p99): < 2.0s
├─ Search results (p99): < 1.5s
└─ Service details (p99): < 1.0s
```

### Booking MFE

```
Availability: 99.98% (stricter - revenue critical)
├─ Typical issues: Payment gateway timeouts, form validation
├─ Recovery: Kill switch to old form, fallback payment method
└─ Monthly budget: 8.6 minutes

Performance:
├─ Form load (p99): < 3.0s
├─ Submission (p99): < 3.0s
└─ Confirmation (p99): < 1.0s
```

### API Gateway

```
Availability: 99.99%
├─ Typical issues: Rate limiting triggered, endpoint slow
├─ Recovery: Increase rate limits, scale instances
└─ Monthly budget: 4.3 minutes

Performance:
├─ Response time (p95): < 500ms
├─ Response time (p99): < 1000ms
└─ Throughput: > 5,000 req/sec
```

---

## SLO Compliance Reporting

### Monthly Report Template

```
=== SEPTEMBER 2026 SLO REPORT ===

Platform Uptime: 99.92% (Downtime: 55 min)
├─ SLA Target: 99.9% ✗ (Below target by 0.02%)
├─ SLO Target: 99.95% ✓ (Met)
└─ Customer Credit: 5% of monthly fee

Service Breakdown:
├─ Shell MFE: 99.97% ✓ (8 min downtime)
├─ Services MFE: 99.94% ✓ (27 min downtime)
├─ Booking MFE: 99.99% ✓ (6 min downtime)
├─ API Gateway: 99.99% ✓ (4 min downtime)
└─ Database: 99.99% ✓ (4 min downtime)

Performance (p99):
├─ Homepage: 2.1s ✓ (Target: 2.5s)
├─ Services: 1.8s ✓ (Target: 2.0s)
├─ Booking: 2.8s ✓ (Target: 3.0s)
└─ API: 420ms ✓ (Target: 500ms)

Error Rate:
├─ 5xx Errors: 0.08% ✓ (Target: 0.1%)
├─ API Errors: 0.03% ✓ (Target: 0.05%)
└─ Booking Failures: 0.4% ✓ (Target: 0.5%)

Incidents:
├─ P1: 0
├─ P2: 1 (payment gateway timeout, 25 min)
├─ P3: 2 (minor UI bugs)
└─ P4: 5 (internal improvements)

Error Budget:
├─ Allocated: 43.2 min
├─ Spent: 28 min (maintenance + incidents)
├─ Remaining: 15.2 min
└─ Burn Rate: 65% (on track for month)

Highlights:
✓ Zero critical incidents
✓ All services met availability targets
✓ Performance improved 5% vs August
✓ 99.9% SLA missed by 0.02% due to payment issue

Recommendations:
1. Add payment gateway fallback
2. Increase database connection pool
3. Review booking form validation logic
4. Schedule preventative database maintenance
```

---

**Document Version:** 1.0  
**Last Updated:** September 26, 2026  
**Maintainer:** DevOps & SRE Team
