import { Page, expect } from '@playwright/test';
import { TEST_DATA } from './test-data';

/**
 * Test utilities for E2E tests
 */

export class TestUtils {
  /**
   * Wait for MFE to load
   */
  static async waitForMFE(page: Page, remoteName: string, timeout = 10000) {
    try {
      // Wait for remote entry script to load
      await page.waitForFunction(
        (remote) => {
          return window[remote as keyof typeof window] !== undefined;
        },
        remoteName,
        { timeout }
      );
    } catch (error) {
      throw new Error(`MFE '${remoteName}' failed to load after ${timeout}ms`);
    }
  }

  /**
   * Navigate to a route and wait for navigation
   */
  static async navigateTo(page: Page, path: string) {
    await page.goto(path, { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
  }

  /**
   * Check if element is visible
   */
  static async isVisible(page: Page, selector: string): Promise<boolean> {
    try {
      const element = page.locator(selector);
      return await element.isVisible({ timeout: 5000 });
    } catch {
      return false;
    }
  }

  /**
   * Wait for spinner to disappear
   */
  static async waitForSpinner(page: Page) {
    const spinner = page.locator(TEST_DATA.selectors.spinner);
    await spinner.waitFor({ state: 'hidden', timeout: 15000 });
  }

  /**
   * Check for error and retry if present
   */
  static async checkAndRetryOnError(page: Page) {
    const error = page.locator(TEST_DATA.selectors.errorMessage);
    if (await error.isVisible({ timeout: 2000 }).catch(() => false)) {
      const retryButton = page.locator(TEST_DATA.selectors.retryButton);
      await retryButton.click();
      await this.waitForSpinner(page);
    }
  }

  /**
   * Get page title
   */
  static async getPageTitle(page: Page): Promise<string> {
    return await page.title();
  }

  /**
   * Switch language
   */
  static async switchLanguage(page: Page) {
    const langToggle = page.locator(TEST_DATA.selectors.langToggle);
    await langToggle.click();
    await page.waitForLoadState('networkidle');
  }

  /**
   * Verify RTL/LTR based on language
   */
  static async verifyTextDirection(page: Page, language: 'en' | 'ar') {
    const html = page.locator('html');
    const dir = await html.getAttribute('dir');

    if (language === 'ar') {
      expect(dir).toBe('rtl');
    } else {
      expect(dir).toBe('ltr');
    }
  }

  /**
   * Take screenshot with timestamp
   */
  static async takeScreenshot(page: Page, name: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await page.screenshot({
      path: `./e2e/screenshots/${name}-${timestamp}.png`,
      fullPage: true,
    });
  }

  /**
   * Check for console errors
   */
  static async getConsoleErrors(page: Page): Promise<string[]> {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    return errors;
  }

  /**
   * Verify shared dependencies loaded
   */
  static async verifySharedDependencies(page: Page) {
    const result = await page.evaluate(() => {
      return {
        hasReact: typeof window.React !== 'undefined',
        hasSharedScope: typeof (window as any).__webpack_share_scopes__ !== 'undefined',
      };
    });

    expect(result.hasReact || result.hasSharedScope).toBeTruthy();
  }

  /**
   * Get performance metrics
   */
  static async getPerformanceMetrics(page: Page) {
    return await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        dns: navigation.domainLookupEnd - navigation.domainLookupStart,
        tcp: navigation.connectEnd - navigation.connectStart,
        ttfb: navigation.responseStart - navigation.requestStart,
        contentDownload: navigation.responseEnd - navigation.responseStart,
        domInteractive: navigation.domInteractive - navigation.fetchStart,
        domComplete: navigation.domComplete - navigation.fetchStart,
        loadComplete: navigation.loadEventEnd - navigation.fetchStart,
      };
    });
  }

  /**
   * Get Core Web Vitals (CWV)
   */
  static async getCoreWebVitals(page: Page) {
    return await page.evaluate(() => {
      const paintEntries = performance.getEntriesByType('paint');
      const largestContentfulPaint = performance.getEntriesByType('largest-contentful-paint').pop() as PerformanceEntry | undefined;
      
      const fcp = paintEntries.find(e => e.name === 'first-contentful-paint')?.startTime || 0;
      const lcp = largestContentfulPaint?.startTime || 0;
      
      // Cumulative Layout Shift
      const entries = performance.getEntriesByType('layout-shift');
      let cls = 0;
      if ((entries as any[])[0]?.hadRecentInput !== true) {
        cls = (entries as any[]).reduce((sum, entry: any) => sum + (entry.value || 0), 0);
      }

      return {
        largestContentfulPaint: lcp,
        firstContentfulPaint: fcp,
        cumulativeLayoutShift: cls,
      };
    });
  }

  /**
   * Get resource summary (request count, size)
   */
  static async getResourceSummary(page: Page) {
    return await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      const resourceSize = resources.reduce((sum, entry: any) => sum + (entry.transferSize || 0), 0);

      return {
        requestCount: resources.length,
        totalSize: resourceSize,
        averageSize: resources.length > 0 ? resourceSize / resources.length : 0,
        resourcesByType: {
          script: resources.filter(r => r.name.includes('.js')).length,
          style: resources.filter(r => r.name.includes('.css')).length,
          image: resources.filter(r => /\.(jpg|png|gif|webp)/.test(r.name)).length,
          font: resources.filter(r => /\.(woff|woff2|ttf|eot)/.test(r.name)).length,
          xhr: resources.filter(r => r.initiatorType === 'fetch' || r.initiatorType === 'xmlhttprequest').length,
        },
      };
    });
  }

  /**
   * Check if metrics exceed thresholds
   */
  static checkMetricsThresholds(
    metrics: any,
    thresholds: {
      lcp?: number;
      fcp?: number;
      cls?: number;
      ttfb?: number;
    }
  ): { passed: boolean; failures: string[] } {
    const failures: string[] = [];

    if (thresholds.lcp && metrics.largestContentfulPaint > thresholds.lcp) {
      failures.push(`LCP (${metrics.largestContentfulPaint}ms) exceeds threshold (${thresholds.lcp}ms)`);
    }

    if (thresholds.fcp && metrics.firstContentfulPaint > thresholds.fcp) {
      failures.push(`FCP (${metrics.firstContentfulPaint}ms) exceeds threshold (${thresholds.fcp}ms)`);
    }

    if (thresholds.cls && metrics.cumulativeLayoutShift > thresholds.cls) {
      failures.push(`CLS (${metrics.cumulativeLayoutShift}) exceeds threshold (${thresholds.cls})`);
    }

    if (thresholds.ttfb && metrics.ttfb > thresholds.ttfb) {
      failures.push(`TTFB (${metrics.ttfb}ms) exceeds threshold (${thresholds.ttfb}ms)`);
    }

    return {
      passed: failures.length === 0,
      failures,
    };
  }
}
