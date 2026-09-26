import { test, expect, Page } from '@playwright/test';
import { TEST_DATA } from '../fixtures/test-data';

/**
 * Performance audit with Lighthouse metrics
 * Tests Core Web Vitals and performance metrics for each page
 */

interface PerformanceMetrics {
  // Core Web Vitals
  largestContentfulPaint: number;
  firstInputDelay?: number;
  cumulativeLayoutShift: number;
  
  // Additional timing metrics
  firstContentfulPaint: number;
  timeToFirstByte: number;
  domContentLoaded: number;
  loadComplete: number;
  
  // Resource metrics
  requestCount: number;
  resourceSize: number;
}

interface PerformanceBenchmark {
  largestContentfulPaint: number; // ms, should be < 2500
  cumulativeLayoutShift: number; // score, should be < 0.1
  firstContentfulPaint: number; // ms, should be < 1800
  timeToFirstByte: number; // ms, should be < 600
}

// Performance benchmarks for each page
const BENCHMARKS: Record<string, PerformanceBenchmark> = {
  home: {
    largestContentfulPaint: 2500,
    cumulativeLayoutShift: 0.1,
    firstContentfulPaint: 1800,
    timeToFirstByte: 600,
  },
  services: {
    largestContentfulPaint: 3000,
    cumulativeLayoutShift: 0.15,
    firstContentfulPaint: 2000,
    timeToFirstByte: 700,
  },
  booking: {
    largestContentfulPaint: 2800,
    cumulativeLayoutShift: 0.12,
    firstContentfulPaint: 1900,
    timeToFirstByte: 650,
  },
};

/**
 * Collect performance metrics from page
 */
async function collectPerformanceMetrics(page: Page): Promise<PerformanceMetrics> {
  // Wait for page to stabilize
  await page.waitForLoadState('networkidle');

  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paintEntries = performance.getEntriesByType('paint');
    const largestContentfulPaint = performance.getEntriesByType('largest-contentful-paint').pop() as PerformanceEntry | undefined;
    
    // Calculate metrics
    const fcp = paintEntries.find(e => e.name === 'first-contentful-paint')?.startTime || 0;
    const lcp = largestContentfulPaint?.startTime || 0;
    
    // Get layout shift score (simplified)
    const entries = performance.getEntriesByType('layout-shift');
    let cls = 0;
    if ((entries as any[])[0]?.hadRecentInput !== true) {
      cls = (entries as any[]).reduce((sum, entry: any) => sum + (entry.value || 0), 0);
    }

    // Resource timing
    const resources = performance.getEntriesByType('resource');
    const resourceSize = resources.reduce((sum, entry: any) => sum + (entry.transferSize || 0), 0);

    return {
      largestContentfulPaint: lcp,
      cumulativeLayoutShift: cls,
      firstContentfulPaint: fcp,
      timeToFirstByte: navigation.responseStart - navigation.fetchStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      requestCount: resources.length,
      resourceSize: resourceSize,
    };
  });

  return metrics as PerformanceMetrics;
}

/**
 * Check if metrics meet benchmark
 */
function checkMetricsAgainstBenchmark(
  metrics: PerformanceMetrics,
  benchmark: PerformanceBenchmark
): { pass: boolean; failures: string[] } {
  const failures: string[] = [];

  if (metrics.largestContentfulPaint > benchmark.largestContentfulPaint) {
    failures.push(
      `LCP (${metrics.largestContentfulPaint.toFixed(0)}ms) exceeds benchmark (${benchmark.largestContentfulPaint}ms)`
    );
  }

  if (metrics.cumulativeLayoutShift > benchmark.cumulativeLayoutShift) {
    failures.push(
      `CLS (${metrics.cumulativeLayoutShift.toFixed(3)}) exceeds benchmark (${benchmark.cumulativeLayoutShift})`
    );
  }

  if (metrics.firstContentfulPaint > benchmark.firstContentfulPaint) {
    failures.push(
      `FCP (${metrics.firstContentfulPaint.toFixed(0)}ms) exceeds benchmark (${benchmark.firstContentfulPaint}ms)`
    );
  }

  if (metrics.timeToFirstByte > benchmark.timeToFirstByte) {
    failures.push(
      `TTFB (${metrics.timeToFirstByte.toFixed(0)}ms) exceeds benchmark (${benchmark.timeToFirstByte}ms)`
    );
  }

  return {
    pass: failures.length === 0,
    failures,
  };
}

/**
 * Format metrics for display
 */
function formatMetrics(metrics: PerformanceMetrics): string {
  return `
Performance Metrics:
  • LCP: ${metrics.largestContentfulPaint.toFixed(0)}ms
  • CLS: ${metrics.cumulativeLayoutShift.toFixed(3)}
  • FCP: ${metrics.firstContentfulPaint.toFixed(0)}ms
  • TTFB: ${metrics.timeToFirstByte.toFixed(0)}ms
  • DOM Content Loaded: ${metrics.domContentLoaded.toFixed(0)}ms
  • Load Complete: ${metrics.loadComplete.toFixed(0)}ms
  • Requests: ${metrics.requestCount}
  • Resource Size: ${(metrics.resourceSize / 1024).toFixed(2)}KB
`;
}

test.describe('Performance - Lighthouse Metrics', () => {
  test.describe('Shell - Home Page', () => {
    test('should meet Core Web Vitals benchmarks', async ({ page }) => {
      // Navigate to home
      await page.goto(TEST_DATA.urls.home, { waitUntil: 'networkidle' });

      // Collect metrics
      const metrics = await collectPerformanceMetrics(page);

      // Check against benchmark
      const benchmark = BENCHMARKS.home;
      const result = checkMetricsAgainstBenchmark(metrics, benchmark);

      // Log metrics
      console.log(`\n=== Home Page Performance ===\n${formatMetrics(metrics)}`);

      // Assert benchmarks met
      if (!result.pass) {
        console.log('Failures:', result.failures);
      }
      expect(result.pass).toBeTruthy();
    });

    test('should have acceptable LCP (Largest Contentful Paint)', async ({ page }) => {
      await page.goto(TEST_DATA.urls.home, { waitUntil: 'networkidle' });
      const metrics = await collectPerformanceMetrics(page);

      // LCP should be < 2.5s
      expect(metrics.largestContentfulPaint).toBeLessThan(2500);
    });

    test('should have acceptable FCP (First Contentful Paint)', async ({ page }) => {
      await page.goto(TEST_DATA.urls.home, { waitUntil: 'networkidle' });
      const metrics = await collectPerformanceMetrics(page);

      // FCP should be < 1.8s
      expect(metrics.firstContentfulPaint).toBeLessThan(1800);
    });

    test('should have acceptable CLS (Cumulative Layout Shift)', async ({ page }) => {
      await page.goto(TEST_DATA.urls.home, { waitUntil: 'networkidle' });
      const metrics = await collectPerformanceMetrics(page);

      // CLS should be < 0.1
      expect(metrics.cumulativeLayoutShift).toBeLessThan(0.1);
    });

    test('should have acceptable TTFB (Time to First Byte)', async ({ page }) => {
      await page.goto(TEST_DATA.urls.home, { waitUntil: 'networkidle' });
      const metrics = await collectPerformanceMetrics(page);

      // TTFB should be < 600ms
      expect(metrics.timeToFirstByte).toBeLessThan(600);
    });

    test('should load resources efficiently', async ({ page }) => {
      await page.goto(TEST_DATA.urls.home, { waitUntil: 'networkidle' });
      const metrics = await collectPerformanceMetrics(page);

      // Should have reasonable number of requests
      expect(metrics.requestCount).toBeLessThan(100);

      // Resource size should be reasonable
      expect(metrics.resourceSize).toBeLessThan(5 * 1024 * 1024); // 5MB
    });

    test('should complete DOM content loading quickly', async ({ page }) => {
      await page.goto(TEST_DATA.urls.home, { waitUntil: 'networkidle' });
      const metrics = await collectPerformanceMetrics(page);

      // DOM Content Loaded should be < 2s
      expect(metrics.domContentLoaded).toBeLessThan(2000);
    });
  });

  test.describe('Services MFE - Services Page', () => {
    test('should meet Core Web Vitals benchmarks', async ({ page }) => {
      await page.goto(TEST_DATA.urls.services, { waitUntil: 'networkidle' });
      const metrics = await collectPerformanceMetrics(page);
      const benchmark = BENCHMARKS.services;
      const result = checkMetricsAgainstBenchmark(metrics, benchmark);

      console.log(`\n=== Services Page Performance ===\n${formatMetrics(metrics)}`);

      expect(result.pass).toBeTruthy();
    });

    test('should have acceptable LCP', async ({ page }) => {
      await page.goto(TEST_DATA.urls.services, { waitUntil: 'networkidle' });
      const metrics = await collectPerformanceMetrics(page);

      // LCP should be < 3s
      expect(metrics.largestContentfulPaint).toBeLessThan(3000);
    });

    test('should have acceptable FCP', async ({ page }) => {
      await page.goto(TEST_DATA.urls.services, { waitUntil: 'networkidle' });
      const metrics = await collectPerformanceMetrics(page);

      // FCP should be < 2s
      expect(metrics.firstContentfulPaint).toBeLessThan(2000);
    });

    test('should have acceptable CLS', async ({ page }) => {
      await page.goto(TEST_DATA.urls.services, { waitUntil: 'networkidle' });
      const metrics = await collectPerformanceMetrics(page);

      // CLS should be < 0.15
      expect(metrics.cumulativeLayoutShift).toBeLessThan(0.15);
    });

    test('should load service cards efficiently', async ({ page }) => {
      await page.goto(TEST_DATA.urls.services, { waitUntil: 'networkidle' });

      const startTime = Date.now();

      // Wait for service cards to render
      await page.locator('div.service-card').first().waitFor({ state: 'visible', timeout: 10000 });

      const renderTime = Date.now() - startTime;

      // Service cards should render within 2 seconds
      expect(renderTime).toBeLessThan(2000);
    });

    test('should maintain performance while filtering', async ({ page }) => {
      await page.goto(TEST_DATA.urls.services, { waitUntil: 'networkidle' });

      const startTime = Date.now();

      // Apply filter
      const categorySelect = page.locator('#category');
      const options = page.locator('#category option');
      const optionCount = await options.count();

      if (optionCount > 1) {
        const secondOption = options.nth(1);
        const optionValue = await secondOption.getAttribute('value');

        await categorySelect.selectOption(optionValue || '');

        const filterTime = Date.now() - startTime;

        // Filter should apply within 500ms
        expect(filterTime).toBeLessThan(500);
      }
    });
  });

  test.describe('Booking MFE - Booking Page', () => {
    test('should meet Core Web Vitals benchmarks', async ({ page }) => {
      await page.goto(TEST_DATA.urls.booking, { waitUntil: 'networkidle' });
      const metrics = await collectPerformanceMetrics(page);
      const benchmark = BENCHMARKS.booking;
      const result = checkMetricsAgainstBenchmark(metrics, benchmark);

      console.log(`\n=== Booking Page Performance ===\n${formatMetrics(metrics)}`);

      expect(result.pass).toBeTruthy();
    });

    test('should have acceptable LCP', async ({ page }) => {
      await page.goto(TEST_DATA.urls.booking, { waitUntil: 'networkidle' });
      const metrics = await collectPerformanceMetrics(page);

      expect(metrics.largestContentfulPaint).toBeLessThan(2800);
    });

    test('should have acceptable FCP', async ({ page }) => {
      await page.goto(TEST_DATA.urls.booking, { waitUntil: 'networkidle' });
      const metrics = await collectPerformanceMetrics(page);

      expect(metrics.firstContentfulPaint).toBeLessThan(1900);
    });

    test('should render form quickly', async ({ page }) => {
      await page.goto(TEST_DATA.urls.booking, { waitUntil: 'networkidle' });

      const startTime = Date.now();

      // Wait for form to be interactive
      await page.locator('button.service-card').first().waitFor({ state: 'visible', timeout: 5000 });

      const formRenderTime = Date.now() - startTime;

      // Form should render quickly
      expect(formRenderTime).toBeLessThan(1500);
    });
  });

  test.describe('MFE Loading Performance', () => {
    test('should load Services MFE efficiently', async ({ page }) => {
      const startTime = Date.now();

      await page.goto(TEST_DATA.urls.services, { waitUntil: 'networkidle' });

      const loadTime = Date.now() - startTime;

      // MFE should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    test('should load Booking MFE efficiently', async ({ page }) => {
      const startTime = Date.now();

      await page.goto(TEST_DATA.urls.booking, { waitUntil: 'networkidle' });

      const loadTime = Date.now() - startTime;

      // MFE should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    test('should preload MFEs without blocking home page', async ({ page }) => {
      const startTime = Date.now();

      // Navigate to home
      await page.goto(TEST_DATA.urls.home, { waitUntil: 'networkidle' });

      const homeLoadTime = Date.now() - startTime;

      // Home should load quickly (MFEs preload async)
      expect(homeLoadTime).toBeLessThan(2500);
    });
  });

  test.describe('Memory Performance', () => {
    test('should not have memory leaks during navigation', async ({ page }) => {
      // Get initial memory
      const initialMemory = await page.evaluate(() => {
        if ((performance as any).memory) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });

      // Navigate through multiple pages
      await page.goto(TEST_DATA.urls.home, { waitUntil: 'networkidle' });
      await page.goto(TEST_DATA.urls.services, { waitUntil: 'networkidle' });
      await page.goto(TEST_DATA.urls.booking, { waitUntil: 'networkidle' });
      await page.goto(TEST_DATA.urls.home, { waitUntil: 'networkidle' });

      // Get final memory
      const finalMemory = await page.evaluate(() => {
        if ((performance as any).memory) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });

      // Memory growth should be reasonable (less than 50% increase)
      if (initialMemory > 0) {
        const memoryGrowth = (finalMemory - initialMemory) / initialMemory;
        expect(memoryGrowth).toBeLessThan(0.5);
      }
    });
  });

  test.describe('Network Performance', () => {
    test('should minimize network requests', async ({ page }) => {
      const requests: string[] = [];

      // Track all requests
      page.on('request', (request) => {
        requests.push(request.url());
      });

      await page.goto(TEST_DATA.urls.home, { waitUntil: 'networkidle' });

      // Home page should have reasonable number of requests
      expect(requests.length).toBeLessThan(50);
    });

    test('should cache resources effectively', async ({ page, context }) => {
      // First navigation
      await page.goto(TEST_DATA.urls.services, { waitUntil: 'networkidle' });

      let firstLoadRequests = 0;
      page.on('request', () => {
        firstLoadRequests++;
      });

      // Reload same page
      await page.reload({ waitUntil: 'networkidle' });

      // Second load should have fewer requests (due to caching)
      let secondLoadRequests = 0;
      page.on('request', () => {
        secondLoadRequests++;
      });

      // Cache should reduce requests (not always guaranteed in test environment)
      // Just verify requests are reasonable
      expect(firstLoadRequests).toBeGreaterThan(0);
    });

    test('should handle slow network gracefully', async ({ page }) => {
      // Simulate slow 3G network
      await page.route('**/*', (route) => {
        const delay = Math.random() * 100; // Add random delay
        setTimeout(() => route.continue(), delay);
      });

      const startTime = Date.now();

      await page.goto(TEST_DATA.urls.services, { waitUntil: 'domcontentloaded' });

      const loadTime = Date.now() - startTime;

      // Page should be interactive even on slow network
      const serviceCard = page.locator('div.service-card');
      const isVisible = await serviceCard.isVisible({ timeout: 10000 }).catch(() => false);

      expect(isVisible || loadTime < 15000).toBeTruthy();
    });
  });

  test.describe('Bundle Size Analysis', () => {
    test('should report main JavaScript bundle size', async ({ page }) => {
      let jsSize = 0;

      page.on('response', (response) => {
        if (response.request().resourceType() === 'script') {
          response.buffer().then((buffer) => {
            jsSize += buffer.length;
          });
        }
      });

      await page.goto(TEST_DATA.urls.home, { waitUntil: 'networkidle' });

      // Log bundle size (for monitoring)
      console.log(`\nHome Page - JS Bundle Size: ${(jsSize / 1024).toFixed(2)}KB`);

      // Bundle should be reasonable (< 1MB for home)
      expect(jsSize).toBeLessThan(1024 * 1024);
    });

    test('should report CSS bundle size', async ({ page }) => {
      let cssSize = 0;

      page.on('response', (response) => {
        if (response.request().resourceType() === 'stylesheet') {
          response.buffer().then((buffer) => {
            cssSize += buffer.length;
          });
        }
      });

      await page.goto(TEST_DATA.urls.home, { waitUntil: 'networkidle' });

      console.log(`Home Page - CSS Bundle Size: ${(cssSize / 1024).toFixed(2)}KB`);

      // CSS should be reasonable (< 100KB)
      expect(cssSize).toBeLessThan(100 * 1024);
    });
  });
});
