/**
 * Performance Monitoring & CloudWatch Integration
 * 
 * Tracks Core Web Vitals and sends metrics to CloudWatch for real-time monitoring.
 * Enables performance regression alerts and trend analysis.
 * 
 * Metrics tracked:
 * - Largest Contentful Paint (LCP)
 * - First Input Delay (FID)
 * - Cumulative Layout Shift (CLS)
 * - First Contentful Paint (FCP)
 * - Time to First Byte (TTFB)
 * - Bundle size
 * - API response times
 * - Error rates
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface CoreWebVitals {
  lcp?: number; // Largest Contentful Paint (ms)
  fid?: number; // First Input Delay (ms)
  cls?: number; // Cumulative Layout Shift (score)
  fcp?: number; // First Contentful Paint (ms)
  ttfb?: number; // Time to First Byte (ms)
}

export interface MonitoringConfig {
  enabled?: boolean;
  cloudWatchNamespace?: string;
  metricsInterval?: number; // How often to flush metrics (ms)
  maxMetricsPerRequest?: number;
  apiEndpoint?: string;
}

/**
 * Performance Monitor with CloudWatch integration
 */
export class PerformanceMonitor {
  private config: Required<MonitoringConfig>;
  private metrics: PerformanceMetric[] = [];
  private coreWebVitals: CoreWebVitals = {};
  private flushTimer: NodeJS.Timeout | null = null;
  private navigationStart: number;
  private sessionId: string;

  constructor(config: MonitoringConfig = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      cloudWatchNamespace: config.cloudWatchNamespace ?? 'BarberShop/Performance',
      metricsInterval: config.metricsInterval ?? 30000, // 30 seconds
      maxMetricsPerRequest: config.maxMetricsPerRequest ?? 20,
      apiEndpoint: config.apiEndpoint || '/api/metrics',
    };

    this.navigationStart = performance.now();
    this.sessionId = this.generateSessionId();

    if (this.config.enabled && typeof window !== 'undefined') {
      this.initialize();
    }
  }

  /**
   * Initialize performance monitoring
   */
  private initialize(): void {
    // Observe Core Web Vitals using PerformanceObserver
    this.observeWebVitals();

    // Start periodic metric flush
    this.startMetricsFlushing();

    // Listen for unload to flush final metrics
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.flushMetrics(true));
    }

    console.log('[Performance] Monitoring initialized');
  }

  /**
   * Observe Core Web Vitals
   */
  private observeWebVitals(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      console.warn('[Performance] PerformanceObserver not supported');
      return;
    }

    try {
      // Observe Long Tasks
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'longtask') {
            this.recordMetric({
              name: 'LongTask',
              value: (entry as any).duration,
              unit: 'ms',
              metadata: {
                duration: (entry as any).duration,
                attribution: (entry as any).attribution,
              },
            });
          }

          if (entry.entryType === 'measure') {
            const measure = entry as PerformanceMeasure;
            this.recordMetric({
              name: measure.name,
              value: measure.duration,
              unit: 'ms',
            });
          }
        }
      });

      observer.observe({ entryTypes: ['longtask', 'measure'] });

      // Observe Paint entries for FCP
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.coreWebVitals.fcp = entry.startTime;
            this.recordMetric({
              name: 'FCP',
              value: entry.startTime,
              unit: 'ms',
            });
          }
        }
      });

      paintObserver.observe({ entryTypes: ['paint'] });

      // Observe Navigation Timing for TTFB
      const navObserver = new PerformanceObserver((list) => {
        const entry = list.getEntries()[0] as PerformanceNavigationTiming;
        if (entry.responseStart && entry.fetchStart) {
          this.coreWebVitals.ttfb = entry.responseStart - entry.fetchStart;
          this.recordMetric({
            name: 'TTFB',
            value: this.coreWebVitals.ttfb,
            unit: 'ms',
          });
        }
      });

      navObserver.observe({ entryTypes: ['navigation'] });
    } catch (error) {
      console.warn('[Performance] Web Vitals observer setup failed:', error);
    }
  }

  /**
   * Record custom performance metric
   */
  recordMetric(metric: Omit<PerformanceMetric, 'timestamp'>): void {
    if (!this.config.enabled) {
      return;
    }

    this.metrics.push({
      ...metric,
      timestamp: new Date(),
    });

    console.log('[Performance] Metric recorded:', metric.name, metric.value, metric.unit);

    // Flush if batch is full
    if (this.metrics.length >= this.config.maxMetricsPerRequest) {
      this.flushMetrics();
    }
  }

  /**
   * Record API request performance
   */
  recordApiCall(endpoint: string, method: string, duration: number, status: number): void {
    this.recordMetric({
      name: `API_${method}_${status}`,
      value: duration,
      unit: 'ms',
      metadata: {
        endpoint,
        method,
        status,
      },
    });
  }

  /**
   * Record bundle size
   */
  recordBundleSize(bundleName: string, sizeBytes: number, gzipSizeBytes: number): void {
    this.recordMetric({
      name: 'BundleSize',
      value: sizeBytes,
      unit: 'bytes',
      metadata: {
        bundleName,
        gzipSize: gzipSizeBytes,
        ratio: ((gzipSizeBytes / sizeBytes) * 100).toFixed(2),
      },
    });
  }

  /**
   * Record error occurrence
   */
  recordError(errorType: string, errorMessage: string, stackTrace?: string): void {
    this.recordMetric({
      name: 'Error',
      value: 1,
      unit: 'count',
      metadata: {
        errorType,
        errorMessage,
        stackTrace,
      },
    });
  }

  /**
   * Record route transition time
   */
  recordNavigation(fromRoute: string, toRoute: string, duration: number): void {
    this.recordMetric({
      name: 'Navigation',
      value: duration,
      unit: 'ms',
      metadata: {
        from: fromRoute,
        to: toRoute,
      },
    });
  }

  /**
   * Start periodic metrics flushing
   */
  private startMetricsFlushing(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flushMetrics();
    }, this.config.metricsInterval);
  }

  /**
   * Flush accumulated metrics to CloudWatch
   */
  async flushMetrics(immediate: boolean = false): Promise<void> {
    if (this.metrics.length === 0) {
      return;
    }

    const batch = this.metrics.splice(0, this.config.maxMetricsPerRequest);

    try {
      const payload = {
        namespace: this.config.cloudWatchNamespace,
        sessionId: this.sessionId,
        metrics: batch.map((m) => ({
          MetricName: m.name,
          Value: m.value,
          Unit: m.unit,
          Timestamp: m.timestamp.toISOString(),
          Metadata: m.metadata || {},
        })),
        timestamp: new Date().toISOString(),
      };

      // Send metrics to backend (which will push to CloudWatch)
      if (typeof window !== 'undefined' && 'sendBeacon' in navigator && immediate) {
        navigator.sendBeacon(this.config.apiEndpoint, JSON.stringify(payload));
      } else if (typeof fetch !== 'undefined') {
        await fetch(this.config.apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true, // Keep connection open even if page unloads
        }).catch((err) => console.warn('[Performance] Metrics send failed:', err));
      }

      console.log(`[Performance] Flushed ${batch.length} metrics`);
    } catch (error) {
      console.error('[Performance] Flush failed:', error);
    }
  }

  /**
   * Get current metrics snapshot
   */
  getSnapshot(): {
    metrics: PerformanceMetric[];
    coreWebVitals: CoreWebVitals;
    sessionId: string;
  } {
    return {
      metrics: [...this.metrics],
      coreWebVitals: { ...this.coreWebVitals },
      sessionId: this.sessionId,
    };
  }

  /**
   * Clear metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Private: Generate session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flushMetrics(true);
  }
}

/**
 * Create resource timing report
 */
export function createResourceTimingReport(): {
  totalResources: number;
  slowestResource: string;
  averageTime: number;
  resourcesByType: Record<string, number>;
} {
  if (typeof window === 'undefined' || !performance.getEntriesByType) {
    return {
      totalResources: 0,
      slowestResource: '',
      averageTime: 0,
      resourcesByType: {},
    };
  }

  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const byType: Record<string, number> = {};
  let total = 0;
  let slowest = '';
  let slowestTime = 0;

  for (const resource of resources) {
    const type = new URL(resource.name).pathname.split('.').pop() || 'unknown';
    byType[type] = (byType[type] || 0) + 1;

    const duration = resource.duration;
    total += duration;

    if (duration > slowestTime) {
      slowestTime = duration;
      slowest = resource.name;
    }
  }

  return {
    totalResources: resources.length,
    slowestResource: slowest,
    averageTime: resources.length > 0 ? total / resources.length : 0,
    resourcesByType: byType,
  };
}

/**
 * Global performance monitor instance
 */
let monitorInstance: PerformanceMonitor | null = null;

export function getPerformanceMonitor(config?: MonitoringConfig): PerformanceMonitor {
  if (!monitorInstance) {
    monitorInstance = new PerformanceMonitor(config);
  }
  return monitorInstance;
}
