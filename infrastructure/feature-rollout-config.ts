/**
 * Feature Rollout Configuration
 * Phase 8 Task 2: Feature Flag Phased Rollout
 * October 14 - November 3, 2026
 */

import { RolloutConfig } from '../packages/shared-feature-flags/src/rollout-manager';

// Stage 1: Oct 14-15 (5% beta testers)
// Stage 2: Oct 16-17 (25% regional)
// Stage 3: Oct 18-22 (50% extended)
// Stage 4: Oct 23-30 (100% full production)

export const featureRollouts: RolloutConfig[] = [
  {
    flagKey: 'new_booking_flow',
    featureName: 'Improved Booking Experience',
    description: 'Streamlined booking flow with simplified UX',
    stages: [
      {
        stage: 1,
        targetAllocation: 0.05, // 5%
        durationHours: 48, // Oct 14-15
        startTime: new Date('2026-10-14T09:00:00Z').getTime(),
        rollbackThresholds: {
          errorRateMultiplier: 2.0,
          conversionRateThreshold: -10,
          satisfactionScore: 3.0,
        },
      },
      {
        stage: 2,
        targetAllocation: 0.25, // 25%
        durationHours: 48, // Oct 16-17
        startTime: new Date('2026-10-16T09:00:00Z').getTime(),
        rollbackThresholds: {
          errorRateMultiplier: 2.0,
          conversionRateThreshold: -10,
          satisfactionScore: 3.0,
        },
      },
      {
        stage: 3,
        targetAllocation: 0.5, // 50%
        durationHours: 120, // Oct 18-22
        startTime: new Date('2026-10-18T09:00:00Z').getTime(),
        rollbackThresholds: {
          errorRateMultiplier: 2.0,
          conversionRateThreshold: -10,
          satisfactionScore: 3.0,
        },
      },
      {
        stage: 4,
        targetAllocation: 1.0, // 100%
        durationHours: 168, // Oct 23-30
        startTime: new Date('2026-10-23T09:00:00Z').getTime(),
        rollbackThresholds: {
          errorRateMultiplier: 2.0,
          conversionRateThreshold: -10,
          satisfactionScore: 3.0,
        },
      },
    ],
    abTestSetup: {
      controlPercentage: 0.5,
      variantPercentage: 0.5,
      sampleSize: 2000,
    },
  },

  {
    flagKey: 'analytics_beta',
    featureName: 'Advanced User Analytics',
    description: 'Detailed booking insights and preference tracking',
    stages: [
      {
        stage: 1,
        targetAllocation: 0.05,
        durationHours: 48,
        startTime: new Date('2026-10-14T09:00:00Z').getTime(),
        rollbackThresholds: {
          errorRateMultiplier: 2.0,
          conversionRateThreshold: -10,
          satisfactionScore: 3.0,
        },
      },
      {
        stage: 2,
        targetAllocation: 0.25,
        durationHours: 48,
        startTime: new Date('2026-10-16T09:00:00Z').getTime(),
        rollbackThresholds: {
          errorRateMultiplier: 2.0,
          conversionRateThreshold: -10,
          satisfactionScore: 3.0,
        },
      },
      {
        stage: 3,
        targetAllocation: 0.5,
        durationHours: 120,
        startTime: new Date('2026-10-18T09:00:00Z').getTime(),
        rollbackThresholds: {
          errorRateMultiplier: 2.0,
          conversionRateThreshold: -10,
          satisfactionScore: 3.0,
        },
      },
      {
        stage: 4,
        targetAllocation: 1.0,
        durationHours: 168,
        startTime: new Date('2026-10-23T09:00:00Z').getTime(),
        rollbackThresholds: {
          errorRateMultiplier: 2.0,
          conversionRateThreshold: -10,
          satisfactionScore: 3.0,
        },
      },
    ],
    abTestSetup: {
      controlPercentage: 0.5,
      variantPercentage: 0.5,
      sampleSize: 2000,
    },
  },

  {
    flagKey: 'ui_redesign',
    featureName: 'Updated Interface Design',
    description: 'Modern design system with improved usability',
    stages: [
      {
        stage: 1,
        targetAllocation: 0.05,
        durationHours: 48,
        startTime: new Date('2026-10-14T09:00:00Z').getTime(),
        rollbackThresholds: {
          errorRateMultiplier: 2.0,
          conversionRateThreshold: -10,
          satisfactionScore: 3.0,
        },
      },
      {
        stage: 2,
        targetAllocation: 0.25,
        durationHours: 48,
        startTime: new Date('2026-10-16T09:00:00Z').getTime(),
        rollbackThresholds: {
          errorRateMultiplier: 2.0,
          conversionRateThreshold: -10,
          satisfactionScore: 3.0,
        },
      },
      {
        stage: 3,
        targetAllocation: 0.5,
        durationHours: 120,
        startTime: new Date('2026-10-18T09:00:00Z').getTime(),
        rollbackThresholds: {
          errorRateMultiplier: 2.0,
          conversionRateThreshold: -10,
          satisfactionScore: 3.0,
        },
      },
      {
        stage: 4,
        targetAllocation: 1.0,
        durationHours: 168,
        startTime: new Date('2026-10-23T09:00:00Z').getTime(),
        rollbackThresholds: {
          errorRateMultiplier: 2.0,
          conversionRateThreshold: -10,
          satisfactionScore: 3.0,
        },
      },
    ],
    abTestSetup: {
      controlPercentage: 0.5,
      variantPercentage: 0.5,
      sampleSize: 2000,
    },
  },
];

/**
 * Rollout Timeline
 *
 * Oct 14 (Monday)
 * ├─ 8:45 AM: Final health checks
 * ├─ 9:00 AM: Stage 1 deployment (5%)
 * ├─ 10:00 AM: Beta tester notifications
 * └─ 17:00 PM: Daily review
 *
 * Oct 16 (Wednesday)
 * ├─ 9:00 AM: Stage 2 deployment (25%)
 * └─ 17:00 PM: Daily review
 *
 * Oct 18 (Friday)
 * ├─ 9:00 AM: Stage 3 deployment (50%)
 * └─ 17:00 PM: Daily review
 *
 * Oct 23 (Wednesday)
 * ├─ 9:00 AM: Stage 4 deployment (100%)
 * └─ 17:00 PM: Daily review
 *
 * Nov 3 (Saturday)
 * └─ Rollout retrospective & completion
 */

/**
 * Beta Tester Target Profile
 * 500-1,000 active users for Stage 1
 */
export const betaTesterCriteria = {
  activeUsers: true,
  bookingFrequency: 'weekly_or_more',
  accountAge: '30+ days',
  emailVerified: true,
  optInBeta: true,
  expectedCount: '500-1000 users',
};

/**
 * Rollout Success Criteria
 */
export const successCriteria = {
  stage1: {
    errorRateRatio: 'max 2.0x control',
    conversionRate: '+5% vs control',
    userSatisfaction: '≥4.0/5',
    sampleSize: '500+ users',
    duration: '48 hours',
  },
  stage2: {
    errorRateRatio: 'max 2.0x control',
    conversionRate: '+5% vs control',
    userSatisfaction: '≥4.0/5',
    sampleSize: '2000+ users',
    duration: '48 hours',
  },
  stage3: {
    errorRateRatio: 'max 2.0x control',
    conversionRate: '+5% vs control',
    userSatisfaction: '≥4.0/5',
    sampleSize: '5000+ users',
    duration: '120 hours (5 days)',
  },
  stage4: {
    errorRateRatio: 'stable',
    conversionRate: '+5% sustained',
    userSatisfaction: '≥4.0/5',
    sampleSize: 'all users',
    duration: '168 hours (7 days)',
  },
};

/**
 * Automatic Rollback Triggers
 */
export const rollbackTriggers = {
  errorRate: {
    condition: 'variant error rate > control * 2.0',
    action: 'immediate rollback',
    notification: 'critical',
  },
  conversionRate: {
    condition: 'variant conversion < control * 0.9 (down 10%+)',
    action: 'manual review required',
    notification: 'high',
  },
  userSatisfaction: {
    condition: 'average satisfaction < 3.0/5',
    action: 'manual review required',
    notification: 'high',
  },
  criticalIncident: {
    condition: 'any SEV1 incident',
    action: 'immediate rollback',
    notification: 'critical',
  },
};

/**
 * Monitoring Metrics per Stage
 */
export const monitoringMetrics = [
  'error_rate',
  'conversion_rate',
  'user_satisfaction',
  'latency_p95',
  'session_duration',
  'page_load_time',
  'booking_completion_time',
  'form_abandonment_rate',
  'repeat_booking_rate',
  'feature_adoption',
];

/**
 * Feedback Collection Channels
 */
export const feedbackChannels = {
  inApp: {
    type: 'post-booking survey',
    questions: 5,
    responseTarget: '50%+',
    trigger: 'after booking completion',
  },
  email: {
    type: 'post-booking email survey',
    questions: 3,
    responseTarget: '20%+',
    trigger: '2 hours after booking',
  },
  slack: {
    type: 'closed beta community',
    purpose: 'real-time feedback and issues',
    participants: '100-200 beta testers',
  },
};

export default featureRollouts;
