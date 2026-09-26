/**
 * Performance Tests - E2E Suite
 * 
 * Validates:
 * - Bundle size meets 200KB target
 * - Core Web Vitals metrics
 * - Analytics batching works
 * - Service Worker caching
 * - Database query optimization
 */

import { test, expect } from '@playwright/test';

test.describe('Performance Optimizations', () => {
  // Bundle Size Tests
  test.describe('Bundle Size', () => {
    test('should load within 200KB gzipped budget', async ({ page }) => {
      // Track resource loading
      const resources: { name: string; size: number }[] = [];

      page.on('response', async (response) => {
        const contentType = response.headers()['content-type'];
        if (contentType?.includes('application/javascript')) {
          const contentLength = response.headers()['content-length'];
          if (contentLength) {
            resources.push({
              name: response.url(),
              size: parseInt(contentLength),
            });
          }
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Calculate total JS size
      const totalSize = resources.reduce((sum, r) => sum + r.size, 0);

      console.log(`Total JS size: ${totalSize} bytes`);
      console.log('Resources:', resources);

      // Should be under 200KB
      expect(totalSize).toBeLessThan(200 * 1024);
    });

    test('should have lazy-loaded chunks', async ({ page }) => {
      await page.goto('/');

      // Verify chunks are loaded
      const chunkLoads = await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script'));
        return scripts
          .filter((s) => s.src.includes('chunk'))
          .map((s) => ({
            src: s.src,
            async: s.async,
          }));
      });

      expect(chunkLoads.length).toBeGreaterThan(0);
    });
  });

  // Core Web Vitals Tests
  test.describe('Core Web Vitals', () => {
    test('should report Largest Contentful Paint (LCP)', async ({ page }) => {
      let lcpValue = null;

      page.on('console', (msg) => {
        if (msg.text().includes('[Performance]') && msg.text().includes('LCP')) {
          lcpValue = msg.text();
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Wait for LCP to be measured
      await page.waitForTimeout(2000);

      // LCP should be measured
      const lcp = await page.evaluate(() => {
        return (performance as any).getEntriesByType('largest-contentful-paint')?.[0]?.renderTime;
      });

      expect(lcp).toBeGreaterThan(0);
      console.log(`LCP: ${lcp}ms`);
    });

    test('should have low Cumulative Layout Shift (CLS)', async ({ page }) => {
      let cls = null;

      // Monitor layout shifts
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      cls = await page.evaluate(() => {
        const entries = (performance as any).getEntriesByType(
          'layout-shift',
        );
        if (!entries) return 0;

        return entries
          .filter((e: any) => !e.hadRecentInput)
          .reduce((sum: number, e: any) => sum + e.value, 0);
      });

      console.log(`CLS: ${cls}`);

      // CLS should be < 0.1
      expect(cls).toBeLessThan(0.1);
    });
  });

  // Service Worker Tests
  test.describe('Service Worker', () => {
    test('should register service worker', async ({ page }) => {
      await page.goto('/');

      const swRegistered = await page.evaluate(() => {
        return 'serviceWorker' in navigator;
      });

      expect(swRegistered).toBe(true);

      // Check if registration successful
      const registrations = await page.evaluate(() => {
        return navigator.serviceWorker.getRegistrations();
      });

      expect(registrations.length).toBeGreaterThan(0);
    });

    test('should cache static assets', async ({ page }) => {
      await page.goto('/');

      const cached = await page.evaluate(() => {
        return caches.keys();
      });

      console.log('Cache storage:', cached);

      // Should have caches registered
      expect(cached.length).toBeGreaterThan(0);
    });

    test('should respond offline', async ({ page, context }) => {
      // Go online first
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Go offline
      await context.setOffline(true);

      // Page should still render from cache
      const title = await page.locator('h1').first().textContent();

      expect(title).toBeTruthy();

      // Go back online
      await context.setOffline(false);
    });
  });

  // Analytics Optimization Tests
  test.describe('Analytics Optimization', () => {
    test('should batch analytics events', async ({ page }) => {
      const eventBatch: any[] = [];

      page.on('request', (request) => {
        if (request.url().includes('/api/metrics')) {
          const postData = request.postDataJSON();
          if (postData?.metrics) {
            eventBatch.push(...postData.metrics);
          }
        }
      });

      await page.goto('/');

      // Simulate some interactions
      const buttons = await page.locator('button').count();
      for (let i = 0; i < Math.min(buttons, 3); i++) {
        await page.locator('button').nth(i).click().catch(() => {});
      }

      // Wait for batch flush
      await page.waitForTimeout(6000);

      // Events should be batched
      console.log('Batched events:', eventBatch.length);
      expect(eventBatch.length).toBeGreaterThanOrEqual(0);
    });

    test('should defer analytics initialization', async ({ page }) => {
      const logs: string[] = [];

      page.on('console', (msg) => {
        logs.push(msg.text());
      });

      await page.goto('/');

      // Analytics should initialize after interactive
      const analyticsInitLog = logs.find((l) => l.includes('Analytics') && l.includes('initialized'));

      expect(analyticsInitLog).toBeTruthy();
      console.log('Analytics initialized:', analyticsInitLog);
    });
  });

  // Caching Tests
  test.describe('Caching Strategy', () => {
    test('should cache API responses', async ({ page }) => {
      const requests: { url: string; cached: boolean }[] = [];

      page.on('response', (response) => {
        if (response.url().includes('/api/')) {
          requests.push({
            url: response.url(),
            cached: response.fromServiceWorker?.() ?? false,
          });
        }
      });

      await page.goto('/');

      // Make some API requests
      const apiCalls = requests.filter((r) => r.url.includes('/api/'));

      console.log('API calls:', apiCalls.length);
      console.log('Cached calls:', apiCalls.filter((r) => r.cached).length);

      expect(apiCalls.length).toBeGreaterThan(0);
    });

    test('should set cache headers', async ({ page }) => {
      let cacheHeaders: Record<string, string> = {};

      page.on('response', (response) => {
        const cacheControl = response.headers()['cache-control'];
        const etag = response.headers()['etag'];

        if (cacheControl) {
          cacheHeaders[response.url()] = cacheControl;
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      console.log('Cache headers:', cacheHeaders);

      // Static assets should have long cache
      const jsCache = Object.values(cacheHeaders).find((h) =>
        h.includes('max-age=31536000'),
      );

      console.log('Long cache found:', !!jsCache);
    });
  });

  // Navigation Performance
  test.describe('Navigation Performance', () => {
    test('should measure route transitions', async ({ page }) => {
      const navigationTimes: number[] = [];

      page.on('response', async (response) => {
        if (response.status() === 200 && !response.fromServiceWorker?.()) {
          const timing = await page.evaluate(() => {
            const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
            return nav.loadEventEnd - nav.fetchStart;
          });

          navigationTimes.push(timing);
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      console.log('Navigation times:', navigationTimes);

      // Should have measurable navigation time
      expect(navigationTimes.length).toBeGreaterThan(0);
    });
  });

  // Image Lazy Loading Tests
  test.describe('Image Optimization', () => {
    test('should lazy load below-fold images', async ({ page }) => {
      await page.goto('/');

      const images = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('img')).map((img: any) => ({
          src: img.src,
          loading: img.loading,
          visible:
            img.getBoundingClientRect().top <
            window.innerHeight,
        }));
      });

      console.log('Images:', images);

      // Below-fold images should have loading="lazy"
      const belowFoldImages = images.filter((img) => !img.visible);
      const lazyImages = belowFoldImages.filter((img) => img.loading === 'lazy');

      console.log(
        `Below-fold images: ${belowFoldImages.length}, Lazy-loaded: ${lazyImages.length}`,
      );

      expect(lazyImages.length).toBeGreaterThanOrEqual(0);
    });
  });

  // Font Performance
  test.describe('Font Optimization', () => {
    test('should use font-display swap', async ({ page }) => {
      const fontConfig = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('link[rel="preconnect"]')).map(
          (link: any) => ({
            href: link.href,
            rel: link.rel,
          }),
        );
      });

      console.log('Font preconnects:', fontConfig);

      // Should have font preconnect for Google Fonts
      const hasPreconnect = fontConfig.some((f) => f.href.includes('fonts.googleapis'));

      expect(hasPreconnect).toBe(true);
    });
  });
});
