# Barber Shop Feature Flags & Canary Deployment Guide

**Version:** 1.0  
**Status:** Production-Ready  
**Last Updated:** September 26, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Feature Flags](#feature-flags)
3. [Canary Deployment Strategy](#canary-deployment-strategy)
4. [Implementation Guide](#implementation-guide)
5. [Operations](#operations)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Overview

### Feature Flags vs Canary Deployments

**Feature Flags:**
- Runtime control of features
- Gradual user adoption (10% → 100%)
- Quick rollback (no redeployment)
- User targeting (beta testers, groups)
- A/B testing variants

**Canary Deployments:**
- Infrastructure level gradual rollout
- Traffic shifted from blue → green
- Automatic health checks between stages
- Rollback to previous version if thresholds exceeded
- Used for backend/infrastructure changes

**Combined Strategy:**
```
Deploy code (all users get new code) → Canary (shift traffic %) → Feature flag (control feature access)
```

### Key Benefits

| Scenario | Benefit |
|----------|---------|
| Bug in feature | Toggle off instantly, no redeploy |
| Risky optimization | Start at 10%, monitor, increase gradually |
| New UI | Beta testers first, then 10% → 100% |
| Database migration | Kill switch to revert to old schema |
| Payment change | Test with internal users first |
| Performance optimization | Measure impact before full rollout |

---

## Feature Flags

### Flag Types

```typescript
import { featureFlagManager, User } from '@barber-shop/shared-feature-flags';

// 1. Boolean flag (feature on/off)
{
  key: 'newBookingFlow',
  enabled: true,
  metadata: { team: 'booking', owner: 'alice' }
}

// 2. Percentage-based rollout (canary)
{
  key: 'enhancedSearch',
  enabled: true,
  percentage: 25,  // 25% of users
  metadata: { rolloutStage: 2 }
}

// 3. User-targeted flag (beta testing)
{
  key: 'betaFeature',
  enabled: true,
  userIds: ['user-123', 'user-456'],
  metadata: { betaProgram: true }
}

// 4. Group-based flag
{
  key: 'partnerFeature',
  enabled: true,
  groupIds: ['barber-shop:partners'],
  metadata: { partnerProgram: true }
}

// 5. A/B test flag
{
  key: 'bookingUIVariant',
  enabled: true,
  variant: 'variantB',
  percentage: 50,
  metadata: { experiment: 'booking-ui-ab-test' }
}
```

### Using Feature Flags

```typescript
// 1. Check if enabled (Node.js)
const user: User = {
  id: 'user-123',
  groups: ['customers'],
  custom: { plan: 'premium' }
};

if (featureFlagManager.isEnabled('newBookingFlow', { user })) {
  // Use new feature
} else {
  // Use old feature
}

// 2. React component
import { useFeatureFlag, FeatureGate } from '@barber-shop/shared-feature-flags';

function BookingPage() {
  const user = getCurrentUser();
  const newFlowEnabled = useFeatureFlag('newBookingFlow', user);

  if (newFlowEnabled) {
    return <NewBookingFlow />;
  } else {
    return <OldBookingFlow />;
  }
}

// 3. React component with gate
function BookingPage() {
  const user = getCurrentUser();

  return (
    <FeatureGate flag="newBookingFlow" user={user}>
      <NewBookingFlow />
      <Fallback slot="fallback">
        <OldBookingFlow />
      </Fallback>
    </FeatureGate>
  );
}

// 4. A/B testing variant
function SearchResults() {
  const user = getCurrentUser();
  const variant = useFeatureVariant(
    'searchAlgorithmVariant',
    user,
    ['algorithmA', 'algorithmB', 'algorithmC']
  );

  if (variant === 'algorithmB') {
    return <SearchWithAlgorithmB />;
  } else if (variant === 'algorithmC') {
    return <SearchWithAlgorithmC />;
  }

  return <SearchWithAlgorithmA />;
}

// 5. Get variant using VariantRenderer
function SearchResults() {
  const user = getCurrentUser();

  return (
    <VariantRenderer
      flag="searchAlgorithmVariant"
      user={user}
      variants={{
        algorithmA: <SearchWithAlgorithmA />,
        algorithmB: <SearchWithAlgorithmB />,
        algorithmC: <SearchWithAlgorithmC />,
      }}
      fallback={<SearchWithAlgorithmA />}
    />
  );
}
```

### Operations

```typescript
// Initialize flags
await featureFlagManager.initialize({
  environment: 'production',
  sdkKey: 'sdk-key-123',
  flags: {
    newBookingFlow: { key: 'newBookingFlow', enabled: true, percentage: 50 },
    enhancedSearch: { key: 'enhancedSearch', enabled: true, percentage: 25 },
  },
});

// Gradual rollout (canary)
featureFlagManager.setCanaryPercentage('newBookingFlow', 10);   // Start
setTimeout(() => featureFlagManager.setCanaryPercentage('newBookingFlow', 25), 5 * 60 * 1000);
setTimeout(() => featureFlagManager.setCanaryPercentage('newBookingFlow', 50), 10 * 60 * 1000);
setTimeout(() => featureFlagManager.setCanaryPercentage('newBookingFlow', 100), 15 * 60 * 1000);

// Kill switch (emergency disable)
featureFlagManager.disableFlag('paymentOptimization');  // Instant rollback

// Beta testing
featureFlagManager.enableForUser('betaFeature', 'user-123');
featureFlagManager.disableForUser('betaFeature', 'user-456');

// Get all flags
const allFlags = featureFlagManager.getAllFlags();
```

---

## Canary Deployment Strategy

### Stages Overview

```
┌─────────────────────────────────────────────────┐
│         Deployment Version: v7.0.0              │
├─────────────────────────────────────────────────┤
│                                                 │
│  Stage 1: Canary 10%                            │
│  ├─ Traffic: 10% new (green) / 90% old (blue)  │
│  ├─ Duration: 5 minutes                         │
│  ├─ Success Criteria:                           │
│  │  ├─ Error rate < 1%                          │
│  │  ├─ Latency p99 < 3s                         │
│  │  └─ Availability > 99%                       │
│  ├─ Monitoring: Every 30 seconds                │
│  └─ Alerts: ErrorRate, Latency, HealthChecks   │
│                                                 │
│  ✓ PASSED → Continue to Stage 2                 │
│  ✗ FAILED → Automatic rollback                 │
│                                                 │
│                          ↓                      │
│                                                 │
│  Stage 2: Canary 25%                            │
│  ├─ Traffic: 25% new / 75% old                  │
│  ├─ Duration: 5 minutes                         │
│  ├─ Success Criteria: Stricter thresholds       │
│  └─ ...                                         │
│                                                 │
│                          ↓                      │
│                                                 │
│  Stage 3: Canary 50%                            │
│  ├─ Production-level testing                    │
│  ├─ Additional metrics monitored                │
│  └─ ...                                         │
│                                                 │
│                          ↓                      │
│                                                 │
│  Stage 4: Finalize 100%                         │
│  ├─ Complete cutover to new version             │
│  ├─ Monitor for 5 minutes                       │
│  └─ Success → Decommission old version          │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Stage Configuration

Each stage has:
1. **Percentage:** Traffic to new version
2. **Duration:** How long to monitor
3. **Success Criteria:** Thresholds for progression
4. **Monitoring:** How often to check metrics
5. **Alerts:** Which alarms to watch

### Metrics Per Stage

| Metric | Stage 1 | Stage 2 | Stage 3 | Stage 4 |
|--------|---------|---------|---------|---------|
| Error Rate | < 1% | < 0.5% | < 0.1% | < 0.1% |
| Latency p99 | < 3s | < 2.8s | < 2.6s | < 2.5s |
| Availability | > 99% | > 99.9% | > 99.9% | > 99.9% |

### Rollback Triggers

Automatic rollback if ANY of these are exceeded:
- Error rate > 2%
- Latency p99 > 5s
- Availability < 95%
- 3+ health check failures
- 10+ consecutive errors

---

## Implementation Guide

### 1. Initialize Feature Flags

```typescript
// src/main.tsx (React Shell)
import { featureFlagManager } from '@barber-shop/shared-feature-flags';

async function initializeApp() {
  // Load feature flags from API or config
  await featureFlagManager.initialize({
    environment: process.env.ENVIRONMENT || 'production',
    sdkKey: process.env.LAUNCHDARKLY_SDK_KEY,
    flags: {
      newBookingFlow: {
        key: 'newBookingFlow',
        enabled: true,
        percentage: 10,  // Start canary at 10%
      },
      enhancedSearch: {
        key: 'enhancedSearch',
        enabled: true,
        percentage: 25,
      },
      paymentOptimization: {
        key: 'paymentOptimization',
        enabled: true,
        percentage: 5,
        metadata: { riskLevel: 'high' },
      },
    },
  });

  // Start React app
  ReactDOM.render(<App />, document.getElementById('root'));
}

initializeApp();
```

### 2. Use in Components

```typescript
// src/pages/BookingPage.tsx
import { useFeatureFlag, FeatureGate } from '@barber-shop/shared-feature-flags';

export function BookingPage() {
  const user = useAuth().user;

  return (
    <FeatureGate flag="newBookingFlow" user={user} fallback={<OldBookingFlow />}>
      <NewBookingFlow />
    </FeatureGate>
  );
}
```

### 3. Gradual Rollout Script

```bash
#!/bin/bash
# scripts/canary-rollout.sh

FLAG_NAME="newBookingFlow"
VERSION="v7.0.0"

echo "Starting canary rollout of $FLAG_NAME ($VERSION)"

# Stage 1: 10%
echo "Stage 1: Deploying to 10% of users..."
set_feature_flag_percentage $FLAG_NAME 10
sleep 300  # 5 minutes
check_metrics_pass || rollback

# Stage 2: 25%
echo "Stage 2: Deploying to 25% of users..."
set_feature_flag_percentage $FLAG_NAME 25
sleep 300
check_metrics_pass || rollback

# Stage 3: 50%
echo "Stage 3: Deploying to 50% of users..."
set_feature_flag_percentage $FLAG_NAME 50
sleep 300
check_metrics_pass || rollback

# Stage 4: 100%
echo "Stage 4: Complete rollout to 100%..."
set_feature_flag_percentage $FLAG_NAME 100
sleep 300
check_metrics_pass || rollback

echo "✅ Canary rollout complete!"
```

### 4. Dashboard/Admin Panel

```typescript
// src/admin/FeatureFlagsAdmin.tsx
import { featureFlagManager } from '@barber-shop/shared-feature-flags';

export function FeatureFlagsAdmin() {
  const [flags, setFlags] = useState(featureFlagManager.getAllFlags());

  const handlePercentageChange = (flagKey: string, percentage: number) => {
    featureFlagManager.setCanaryPercentage(flagKey, percentage);
    setFlags(new Map(featureFlagManager.getAllFlags()));
  };

  const handleKillSwitch = (flagKey: string) => {
    if (confirm(`Disable ${flagKey}?`)) {
      featureFlagManager.disableFlag(flagKey);
      setFlags(new Map(featureFlagManager.getAllFlags()));
      
      // Send to observability
      logger.warn(`Kill switch activated for ${flagKey}`);
      metrics.recordError('KillSwitchActivated');
    }
  };

  return (
    <div>
      <h1>Feature Flags</h1>
      {Array.from(flags.entries()).map(([key, flag]) => (
        <div key={key}>
          <h3>{key}</h3>
          <p>Enabled: {flag.enabled ? '✓' : '✗'}</p>
          <p>Percentage: {flag.percentage || 100}%</p>
          <input
            type="range"
            min="0"
            max="100"
            value={flag.percentage || 100}
            onChange={(e) => handlePercentageChange(key, parseInt(e.target.value))}
          />
          <button onClick={() => handleKillSwitch(key)} style={{ color: 'red' }}>
            Kill Switch 🚨
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

## Operations

### Monitoring Canary Deployment

```bash
# 1. Watch canary metrics
watch -n 5 'aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name HTTPCode_Target_5XX_Count \
  --start-time $(date -u -d 30 minutes ago +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Average'

# 2. Check flag status
curl https://barber-shop.com/api/feature-flags/newBookingFlow

# 3. View canary progress
aws cloudwatch list-metrics \
  --namespace BarberShop \
  --metric-name CanaryProgress

# 4. Check error logs
aws logs tail /aws/alb/barber-shop-prod --follow \
  | grep -i "error\|exception"
```

### Rollback Procedures

```bash
# Option 1: Automatic (happens automatically)
# Error rate > 2% triggers automatic rollback

# Option 2: Manual kill switch
curl -X POST https://barber-shop.com/api/feature-flags/newBookingFlow/kill-switch

# Option 3: Reduce percentage to 0%
featureFlagManager.setCanaryPercentage('newBookingFlow', 0);

# Option 4: Blue-green deployment rollback
./infrastructure/deployment/blue-green-deploy.ps1 \
  -Environment prod \
  -Version v6.0.0 \
  -Rollback $true
```

---

## Best Practices

### 1. Start Small

✅ **Start at 5-10%**
```typescript
// Day 1: 5% of users
featureFlagManager.setCanaryPercentage('newFeature', 5);

// Day 2: 10% of users
featureFlagManager.setCanaryPercentage('newFeature', 10);

// Week 1: 50% of users
featureFlagManager.setCanaryPercentage('newFeature', 50);

// Week 2: 100% of users
featureFlagManager.setCanaryPercentage('newFeature', 100);
```

### 2. Monitor Specific Metrics

✅ **Measure business impact**
```typescript
// Track booking success rate, not just error rate
metrics.putMetric({
  name: 'BookingSuccessRate',
  value: successCount / totalCount,
  unit: 'Percent',
  dimensions: { feature: 'newBookingFlow' },
});

// Track user engagement
metrics.putMetric({
  name: 'FeatureAdoption',
  value: usersUsingNewFeature / totalUsers,
  unit: 'Percent',
});
```

### 3. Have a Kill Switch

✅ **Always include emergency disable**
```typescript
// Easy to disable if issues detected
featureFlagManager.disableFlag('riskierFeature');

// Log it
logger.warn('Feature disabled', { feature: 'riskierFeature', reason: 'high-error-rate' });

// Alert team
metrics.recordError('KillSwitchActivated');
```

### 4. Document Feature Flags

✅ **Maintain flag registry**
```typescript
export const FLAG_REGISTRY = {
  newBookingFlow: {
    description: 'New booking user interface',
    owner: 'alice@barber-shop.com',
    team: 'Booking',
    riskLevel: 'medium',
    launched: '2026-09-30',
  },
  paymentOptimization: {
    description: 'Optimized payment processing',
    owner: 'bob@barber-shop.com',
    team: 'Payments',
    riskLevel: 'high',
    launched: '2026-10-01',
  },
};
```

---

## Troubleshooting

### Issue: Feature disabled for some users

**Cause:** Hash-based percentage not consistent

**Solution:** Percentage calculation is deterministic per user ID
```typescript
// Same user always gets same result
const user1 = { id: 'user-123' };
const result1 = featureFlagManager.isEnabled('flag', { user: user1 });
// Always same as:
const result2 = featureFlagManager.isEnabled('flag', { user: user1 });
```

### Issue: Flag not updating in real-time

**Cause:** Cache not cleared

**Solution:** Clear cache when flag updated
```typescript
// Internally handled, but if needed manually:
featureFlagManager.updateFlag('flag', { percentage: 50 });
// Clears cache automatically
```

### Issue: Canary deployment not progressing

**Cause:** Error rate too high

**Solution:** Check logs and metrics
```bash
# View recent errors
aws logs filter-log-events \
  --log-group-name /aws/alb/barber-shop-prod \
  --filter-pattern "ERROR" \
  --start-time $(date -d '10 minutes ago' +%s)000

# Fix issue, then retry
```

---

**Document Version:** 1.0  
**Last Updated:** September 26, 2026  
**Maintainer:** Engineering Team
