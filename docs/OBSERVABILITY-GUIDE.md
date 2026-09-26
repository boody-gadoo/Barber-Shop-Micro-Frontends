# Barber Shop Observability Guide

**Version:** 1.0  
**Status:** Production-Ready  
**Last Updated:** September 26, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Logging Strategy](#logging-strategy)
3. [Distributed Tracing](#distributed-tracing)
4. [Custom Metrics](#custom-metrics)
5. [Web Vitals Tracking](#web-vitals-tracking)
6. [Implementation Guide](#implementation-guide)
7. [Query Examples](#query-examples)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The Barber Shop observability stack provides:

- **Centralized Logging:** Structured JSON logs to CloudWatch
- **Distributed Tracing:** Request flow across MFEs via AWS X-Ray
- **Custom Metrics:** Business and technical metrics to CloudWatch
- **Web Vitals:** Core Web Vitals tracking (LCP, FCP, CLS, TTFB, FID, INP)

### Key Benefits

| Component | Benefit | Use Case |
|-----------|---------|----------|
| Logging | Root cause analysis | Find bugs, understand errors |
| Tracing | Request flow visibility | Optimize latency, debug integrations |
| Metrics | Trend analysis | Monitor performance, detect anomalies |
| Web Vitals | User experience | Ensure fast, smooth interactions |

---

## Logging Strategy

### Log Levels

```typescript
import { logger } from '@barber-shop/shared-observability';

// DEBUG: Detailed diagnostic information (development only)
logger.debug('User clicked booking button', {
  buttonElement: '#booking-btn',
  userId: '123',
});

// INFO: General informational messages
logger.info('Booking created successfully', {
  bookingId: 'book-456',
  serviceId: 'service-789',
  amount: 150,
});

// WARN: Warning messages (unusual but recoverable)
logger.warn('Slow database query detected', {
  query: 'SELECT * FROM services WHERE...',
  duration: 5000,
  threshold: 2000,
});

// ERROR: Error messages (requires action)
logger.error('Payment processing failed', paymentError, {
  paymentId: 'pay-123',
  amount: 150,
  gateway: 'stripe',
});
```

### Structured Logging

All logs are structured JSON with:

```json
{
  "timestamp": "2026-09-26T10:30:45.123Z",
  "level": "INFO",
  "message": "Booking created successfully",
  "context": {
    "requestId": "req-12345",
    "userId": "user-456",
    "sessionId": "sess-789",
    "environment": "production",
    "version": "7.0.0",
    "microFrontend": "booking"
  },
  "metadata": {
    "bookingId": "book-789",
    "serviceId": "service-123",
    "amount": 150
  },
  "duration": 245
}
```

### Context Information

Always include relevant context:

```typescript
const context = {
  requestId: generateRequestId(),
  userId: currentUser.id,
  sessionId: getSessionId(),
  microFrontend: 'booking',
};

logger.info('User viewed booking confirmation', {}, context);
```

### Performance Tracking

```typescript
// Async operation timing
await logger.measureAsync('booking-api-call', async () => {
  return await bookingService.create({
    serviceId: '123',
    barberId: '456',
    date: '2026-09-27',
  });
}, context);

// Sync operation timing
logger.measureSync('form-validation', () => {
  return validateBookingForm(formData);
}, context);
```

### Error Logging

```typescript
try {
  await processPayment(bookingData);
} catch (error) {
  // Error automatically includes stack trace
  logger.error(
    'Payment processing failed',
    error,
    {
      bookingId: bookingData.id,
      amount: bookingData.amount,
      retryAttempt: 1,
    },
    context
  );
}
```

---

## Distributed Tracing

### X-Ray Overview

AWS X-Ray traces requests across your Micro Frontend architecture:

```
User Browser
    ↓
Shell MFE (Service Map: Shell)
    ↓ (API call)
Services MFE (Service Map: Services)
    ↓ (Fetch services)
Backend API (Service Map: API)
    ↓
Database
```

### Trace Context

```typescript
import { tracer } from '@barber-shop/shared-observability';

// Get current trace context
const traceContext = tracer.getTraceContext();
console.log(traceContext);
// { traceId: '1-5e7e3c4a-123abc456def789', sampled: true }

// Extract from request headers
const incomingContext = tracer.extractTraceContext(req.headers);

// Format for outbound requests
const headers = {
  'X-Amzn-Trace-Id': tracer.formatTraceHeader(traceContext),
};
```

### Tracing Operations

```typescript
// Trace async operation
const result = await tracer.traceAsync(
  'fetch-services',
  async () => {
    return await fetch('/api/services');
  },
  {
    namespace: 'aws:service',
    httpMethod: 'GET',
    httpUrl: '/api/services',
  }
);

// Trace sync operation
const parsed = tracer.traceSync(
  'parse-response',
  () => JSON.parse(responseText)
);
```

### Service Segments

```typescript
// Manual segment control
const segment = tracer.startSegment('booking-creation', {
  namespace: 'local',
  httpMethod: 'POST',
  httpUrl: '/api/bookings',
});

try {
  // Perform operation
  const booking = await createBooking(data);

  tracer.endSegment(segment, {
    httpStatus: 201,
    metadata: { bookingId: booking.id },
  });
} catch (error) {
  tracer.endSegment(segment, {
    error: true,
    errorMessage: error.message,
  });
}
```

---

## Custom Metrics

### Business Metrics

```typescript
import { metrics } from '@barber-shop/shared-observability';

// Track bookings
metrics.recordBooking('success');
metrics.recordBooking('failure');

// Track user actions
metrics.recordUserAction('view-services', 1);
metrics.recordUserAction('apply-promo-code', 1);
```

### Technical Metrics

```typescript
// MFE load time
metrics.recordMFELoadTime('services', 1250); // 1.25 seconds

// API latency
metrics.recordAPILatency('/api/services', 245); // 245ms

// Cache performance
metrics.recordCacheHit('services-list');
metrics.recordCacheMiss('user-preferences');

// Database queries
metrics.recordDatabaseQueryTime('SELECT services', 125);

// Resource usage
metrics.recordMemoryUsage(process.memoryUsage().heapUsed);
metrics.recordCPUUsage(cpuUsagePercentage);

// Errors
metrics.recordError('PaymentFailed');
metrics.recordError('ServiceNotFound');
```

### Custom Metrics

```typescript
// Put arbitrary metric
metrics.putMetric({
  name: 'BookingProcessingTime',
  value: 1250,
  unit: 'Milliseconds',
  dimensions: {
    ServiceType: 'HairCut',
    Barber: 'Ahmed',
  },
});
```

---

## Web Vitals Tracking

### Core Web Vitals

```typescript
import { vitalsReporter } from '@barber-shop/shared-observability';

// Vitals are automatically tracked and reported
// Access vitals anytime:
const vitals = vitalsReporter.getVitals();

// Example output:
{
  LCP: { name: 'LCP', value: 2100, rating: 'good', ... },
  FCP: { name: 'FCP', value: 1500, rating: 'good', ... },
  CLS: { name: 'CLS', value: 0.05, rating: 'good', ... },
  TTFB: { name: 'TTFB', value: 450, rating: 'good', ... }
}
```

### Vital Ratings

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP | ≤ 2.5s | ≤ 4s | > 4s |
| FCP | ≤ 1.8s | ≤ 3s | > 3s |
| CLS | ≤ 0.1 | ≤ 0.25 | > 0.25 |
| TTFB | ≤ 600ms | ≤ 1.8s | > 1.8s |
| FID | ≤ 100ms | ≤ 300ms | > 300ms |
| INP | ≤ 200ms | ≤ 500ms | > 500ms |

### Custom Vital Handler

```typescript
const vitalsReporter = VitalsReporter.getInstance({
  onVitalUpdate: (vital) => {
    if (vital.rating !== 'good') {
      // Alert when vital is poor
      analytics.track('poor_web_vital', {
        metric: vital.name,
        value: vital.value,
        rating: vital.rating,
      });
    }
  },
});
```

---

## Implementation Guide

### Setup in React MFEs

```typescript
// apps/shell/src/main.tsx
import { logger, tracer, metrics, vitalsReporter } from '@barber-shop/shared-observability';

// Initialize observability
const traceContext = tracer.getTraceContext();
console.log('Trace ID:', traceContext.traceId);

logger.info('Shell MFE loaded', {
  buildVersion: __APP_VERSION__,
});

vitalsReporter.initialize();

// Use in components
function BookingForm() {
  const handleSubmit = async (data) => {
    const context = {
      requestId: traceContext.traceId,
      userId: currentUser.id,
    };

    try {
      await logger.measureAsync(
        'submit-booking',
        async () => {
          return await tracer.traceAsync(
            'post-booking',
            async () => {
              const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: {
                  'X-Amzn-Trace-Id': tracer.formatTraceHeader(traceContext),
                },
                body: JSON.stringify(data),
              });

              metrics.recordAPILatency('/api/bookings', response.timing.duration);
              return response.json();
            }
          );
        },
        context
      );

      metrics.recordBooking('success');
      logger.info('Booking created', { bookingId: booking.id }, context);
    } catch (error) {
      metrics.recordBooking('failure');
      logger.error('Booking failed', error, {}, context);
    }
  };
}
```

### Setup in Angular MFEs

```typescript
// apps/booking/src/main.ts
import { logger, tracer, metrics } from '@barber-shop/shared-observability';

// In service
@Injectable({ providedIn: 'root' })
export class BookingService {
  constructor(private http: HttpClient) {
    const traceContext = tracer.getTraceContext();
    logger.info('BookingService initialized', {
      traceId: traceContext.traceId,
    });
  }

  createBooking(data: BookingRequest) {
    return tracer.traceAsync(
      'create-booking',
      async () => {
        const startTime = Date.now();
        const response = await this.http.post('/api/bookings', data).toPromise();
        const duration = Date.now() - startTime;

        metrics.recordAPILatency('POST /api/bookings', duration);
        return response;
      }
    );
  }
}
```

### Observability Context Helper

```typescript
import { 
  createObservabilityContext, 
  trackObservableOperation 
} from '@barber-shop/shared-observability';

// Create context for entire request
const context = createObservabilityContext({
  userId: currentUser.id,
  sessionId: getSessionId(),
});

// Track operation with logging, tracing, and metrics
const result = await trackObservableOperation(
  'fetch-services',
  async () => {
    const response = await fetch('/api/services', {
      headers: {
        'X-Amzn-Trace-Id': tracer.formatTraceHeader(context.traceContext),
      },
    });
    return response.json();
  },
  context.logContext
);
```

---

## Query Examples

### CloudWatch Logs Insights

**Find errors in last hour:**
```
fields @timestamp, @message, context.userId, error
| filter @message like /ERROR/
| stats count() as error_count by error
```

**Slow API calls:**
```
fields @timestamp, @message, duration, context.requestId
| filter duration > 3000
| sort duration desc
```

**Bookings by hour:**
```
fields @timestamp
| filter @message like /Booking created/
| stats count() as bookings by bin(5m)
```

**Error rate by MFE:**
```
fields context.microFrontend
| filter @message like /ERROR/
| stats count() as errors by context.microFrontend
```

### X-Ray Service Map

**View in AWS Console:**
- CloudWatch → X-Ray → Service Map
- Shows: Shell → Services → API → Database

**Analyze latency:**
- Trace List → Filter by latency > 3000ms
- View: Each segment duration, bottlenecks

**Error analysis:**
- Trace List → Filter by errors
- View: Error messages, stack traces, affected services

### CloudWatch Metrics

**MFE load time:**
```
Namespace: BarberShop
Metric: MFELoadTime
Dimensions: MicroFrontend
Statistics: Average, Max, p99
```

**Booking success rate:**
```
Namespace: BarberShop
Metric: Bookings
Dimensions: Status
Statistic: Sum(Status=Success) / Sum(all) * 100
```

---

## Best Practices

### 1. Context & Traceability

✅ **Always include context:**
```typescript
logger.info('User action', {}, {
  requestId: traceId,
  userId: userId,
  sessionId: sessionId,
});
```

❌ **Avoid:**
```typescript
logger.info('Something happened');
```

### 2. Structured Data

✅ **Use structured metadata:**
```typescript
logger.info('Booking created', {
  bookingId: '123',
  serviceId: '456',
  amount: 150,
  paymentMethod: 'card',
});
```

❌ **Avoid:**
```typescript
logger.info('Booking created: ID 123, Service 456, Amount 150');
```

### 3. Sensitive Data

✅ **Redact sensitive data:**
```typescript
logger.info('Payment processed', {
  paymentId: 'pay-123',
  amount: 150,
  cardLastFour: '****4242', // Masked
});
```

❌ **Avoid:**
```typescript
logger.info('Payment processed', {
  cardNumber: '4242424242424242', // NEVER!
  cvv: '123', // NEVER!
});
```

### 4. Error Handling

✅ **Include errors with context:**
```typescript
try {
  await processPayment();
} catch (error) {
  logger.error('Payment failed', error, {
    retryAttempt: 1,
    fallbackMethod: 'wallet',
  });
}
```

❌ **Avoid:**
```typescript
try {
  await processPayment();
} catch (error) {
  console.log('Error:', error); // Lost context!
}
```

### 5. Metric Naming

✅ **Use clear, hierarchical names:**
```typescript
metrics.putMetric({ name: 'Booking_CreationTime', ... });
metrics.putMetric({ name: 'Booking_SuccessRate', ... });
metrics.putMetric({ name: 'Payment_ProcessingTime', ... });
```

❌ **Avoid:**
```typescript
metrics.putMetric({ name: 'time', ... }); // Too generic
metrics.putMetric({ name: 'blah', ... }); // Meaningless
```

### 6. Sampling Strategy

**Development:**
- Log Level: DEBUG
- Trace Sample: 100%
- Metric Flush: Every 5 seconds

**Production:**
- Log Level: INFO
- Trace Sample: 10%
- Metric Flush: Every 60 seconds

```typescript
const logger = Logger.getInstance({
  logLevel: process.env.LOG_LEVEL || 'INFO',
});

const tracer = Tracer.getInstance({
  sampleRate: process.env.TRACE_SAMPLE_RATE || 0.1,
});
```

---

## Troubleshooting

### Issue: Logs Not Appearing in CloudWatch

**Cause:** CloudWatch Logs integration not configured

**Solution:**
```typescript
// Verify configuration
const logger = Logger.getInstance({
  enableCloudWatch: true,
  enableConsoleOutput: true,
});

// Check IAM permissions
// Lambda/EC2 role must have: logs:CreateLogStream, logs:PutLogEvents
```

### Issue: Slow Query Logging

**Cause:** Too much debug logging

**Solution:**
```typescript
// Set appropriate log level
const logger = Logger.getInstance({
  logLevel: 'INFO', // Not DEBUG
});

// Or sample debug logs
if (Math.random() < 0.01) { // 1% sampling
  logger.debug('Detailed info', data);
}
```

### Issue: High X-Ray Costs

**Cause:** Tracing everything (100% sample rate)

**Solution:**
```typescript
// Reduce sample rate
const tracer = Tracer.getInstance({
  sampleRate: 0.1, // 10% instead of 100%
});
```

### Issue: Missing Trace Context

**Cause:** Not propagating trace headers across services

**Solution:**
```typescript
// Always include trace header in outbound requests
const traceContext = tracer.getTraceContext();
const headers = {
  'X-Amzn-Trace-Id': tracer.formatTraceHeader(traceContext),
};

fetch('/api/services', { headers });
```

---

**Document Version:** 1.0  
**Last Updated:** September 26, 2026  
**Maintainer:** DevOps & Engineering Teams
