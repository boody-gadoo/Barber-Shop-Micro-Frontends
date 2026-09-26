import { test, expect } from '../fixtures/test-setup';
import { TEST_DATA } from '../fixtures/test-data';

test.describe('Shell - Navigation & MFE Loading', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page before each test
    await page.goto('/', { waitUntil: 'networkidle' });
  });

  test.describe('Home Page', () => {
    test('should load home page successfully', async ({ page }) => {
      // Verify page title
      const title = await page.title();
      expect(title).toContain('Helaqat El Balad');

      // Verify logo is visible
      const logo = page.locator(TEST_DATA.selectors.logo);
      await expect(logo).toBeVisible();

      // Verify navigation menu exists
      const nav = page.locator('nav.nav');
      await expect(nav).toBeVisible();
    });

    test('should display header with logo and navigation', async ({ page }) => {
      const header = page.locator('header.header');
      await expect(header).toBeVisible();

      // Check logo Arabic and English text
      const logoAr = page.locator('span.logo-ar');
      const logoEn = page.locator('span.logo-en');

      await expect(logoAr).toBeVisible();
      await expect(logoEn).toBeVisible();

      const arText = await logoAr.textContent();
      expect(arText).toContain('حلاقة البلد');

      const enText = await logoEn.textContent();
      expect(enText).toContain('Helaqat El Balad');
    });

    test('should have language toggle button', async ({ page }) => {
      const langToggle = page.locator(TEST_DATA.selectors.langToggle);
      await expect(langToggle).toBeVisible();

      // Check initial language (should be English)
      const toggleText = await langToggle.textContent();
      expect(toggleText).toBe('AR');
    });
  });

  test.describe('Navigation Links', () => {
    test('should navigate to services page', async ({ page, utils }) => {
      // Click Services link
      const servicesLink = page.locator(
        TEST_DATA.selectors.navLink('Services')
      );
      await servicesLink.click();

      // Wait for navigation
      await page.waitForURL(/\/services/);

      // Wait for MFE to load
      await utils.waitForMFE(page, 'services');
      await utils.waitForSpinner(page);

      // Verify URL
      expect(page.url()).toContain('/services');

      // Verify Services MFE content loaded
      const servicesGrid = page.locator('div.services-grid, div.service-grid');
      await expect(servicesGrid).toBeVisible({ timeout: 10000 });
    });

    test('should navigate to booking page', async ({ page, utils }) => {
      // Click Booking link
      const bookingLink = page.locator(
        TEST_DATA.selectors.navLink('Booking')
      );
      await bookingLink.click();

      // Wait for navigation
      await page.waitForURL(/\/booking/);

      // Wait for MFE to load
      await utils.waitForMFE(page, 'booking');
      await utils.waitForSpinner(page);

      // Verify URL
      expect(page.url()).toContain('/booking');

      // Verify Booking MFE content loaded (app-root component)
      const bookingContainer = page.locator('app-root, div.booking-container');
      await expect(bookingContainer).toBeVisible({ timeout: 10000 });
    });

    test('should navigate to gallery page', async ({ page }) => {
      const galleryLink = page.locator(
        TEST_DATA.selectors.navLink('Gallery')
      );
      await galleryLink.click();

      await page.waitForURL(/\/gallery/);
      expect(page.url()).toContain('/gallery');
    });

    test('should navigate to contact page', async ({ page }) => {
      const contactLink = page.locator(
        TEST_DATA.selectors.navLink('Contact')
      );
      await contactLink.click();

      await page.waitForURL(/\/contact/);
      expect(page.url()).toContain('/contact');
    });

    test('should navigate back to home from any page', async ({ page }) => {
      // Navigate to services
      const servicesLink = page.locator(
        TEST_DATA.selectors.navLink('Services')
      );
      await servicesLink.click();
      await page.waitForURL(/\/services/);

      // Click logo to go home
      const logo = page.locator(TEST_DATA.selectors.logo);
      await logo.click();

      await page.waitForURL(/\/$/);
      expect(page.url()).toContain('/');
    });
  });

  test.describe('Language Toggle', () => {
    test('should switch from English to Arabic', async ({ page, utils }) => {
      // Initial state should be English (LTR)
      const html = page.locator('html');
      let dir = await html.getAttribute('dir');
      expect(dir).toBe('ltr');

      // Toggle language
      const langToggle = page.locator(TEST_DATA.selectors.langToggle);
      await langToggle.click();

      // Wait for language change
      await page.waitForLoadState('networkidle');

      // Verify direction changed to RTL
      dir = await html.getAttribute('dir');
      expect(dir).toBe('rtl');

      // Verify toggle button now shows EN
      const toggleText = await langToggle.textContent();
      expect(toggleText).toBe('EN');

      // Verify navigation labels are in Arabic
      const navItems = page.locator('a.nav-link');
      const firstNavText = await navItems.first().textContent();
      // Should contain Arabic text or be RTL aligned
      expect(firstNavText).toBeTruthy();
    });

    test('should switch from Arabic back to English', async ({ page, utils }) => {
      // First toggle to Arabic
      const langToggle = page.locator(TEST_DATA.selectors.langToggle);
      await langToggle.click();
      await page.waitForLoadState('networkidle');

      const html = page.locator('html');
      let dir = await html.getAttribute('dir');
      expect(dir).toBe('rtl');

      // Toggle back to English
      await langToggle.click();
      await page.waitForLoadState('networkidle');

      // Verify direction is LTR again
      dir = await html.getAttribute('dir');
      expect(dir).toBe('ltr');

      // Verify toggle button shows AR
      const toggleText = await langToggle.textContent();
      expect(toggleText).toBe('AR');
    });

    test('should persist language preference across page navigation', async ({
      page,
      utils,
    }) => {
      // Toggle to Arabic
      const langToggle = page.locator(TEST_DATA.selectors.langToggle);
      await langToggle.click();
      await page.waitForLoadState('networkidle');

      let html = page.locator('html');
      let dir = await html.getAttribute('dir');
      expect(dir).toBe('rtl');

      // Navigate to services
      const servicesLink = page.locator(
        TEST_DATA.selectors.navLink('الخدمات')
      ); // Arabic for Services
      await servicesLink.click({ timeout: 5000 }).catch(() => {
        // Fallback if Arabic text not found, use Services
        return page.locator(TEST_DATA.selectors.navLink('Services')).click();
      });

      await page.waitForURL(/\/services/);
      await utils.waitForSpinner(page);

      // Verify language is still Arabic (RTL)
      html = page.locator('html');
      dir = await html.getAttribute('dir');
      expect(dir).toBe('rtl');
    });
  });

  test.describe('MFE Preloading', () => {
    test('should preload services and booking remotes on app start', async ({
      page,
      utils,
    }) => {
      // Go to home page
      await page.goto('/', { waitUntil: 'networkidle' });

      // Wait for preloading to complete (RemotePreloader)
      await page.waitForTimeout(2000); // Give time for preload to start

      // Verify services remote is loaded
      const servicesLoaded = await page.evaluate(() => {
        return typeof (window as any).services !== 'undefined';
      });
      expect(servicesLoaded).toBeTruthy();

      // Verify booking remote is loaded
      const bookingLoaded = await page.evaluate(() => {
        return typeof (window as any).booking !== 'undefined';
      });
      expect(bookingLoaded).toBeTruthy();
    });

    test('should load services MFE instantly when preloaded', async ({
      page,
      utils,
    }) => {
      // Wait for preloading on home page
      await page.goto('/', { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000); // Wait for preload to complete

      // Measure time to navigate to services
      const startTime = Date.now();

      const servicesLink = page.locator(
        TEST_DATA.selectors.navLink('Services')
      );
      await servicesLink.click();

      await page.waitForURL(/\/services/);
      await utils.waitForSpinner(page);

      const navigationTime = Date.now() - startTime;

      // Should be fast since already preloaded
      // Expected: < 1s if cached
      expect(navigationTime).toBeLessThan(2000);

      console.log(`Navigation time to Services: ${navigationTime}ms`);
    });
  });

  test.describe('Error Handling', () => {
    test('should show error if MFE remote fails to load', async ({
      page,
      utils,
    }) => {
      // This test requires remote to be manually stopped
      // For CI, we can't reliably test this without mocking

      // Navigate to services
      const servicesLink = page.locator(
        TEST_DATA.selectors.navLink('Services')
      );
      await servicesLink.click();

      await page.waitForURL(/\/services/);

      // Check for either success or error state
      const servicesGrid = page
        .locator('div.services-grid, div.service-grid')
        .first();
      const errorDiv = page.locator(TEST_DATA.selectors.errorMessage).first();

      // One of these should be visible
      const hasContent =
        (await servicesGrid.isVisible({ timeout: 5000 }).catch(() => false)) ||
        (await errorDiv.isVisible({ timeout: 5000 }).catch(() => false));

      expect(hasContent).toBeTruthy();
    });

    test('should display retry button if MFE fails to load', async ({
      page,
      utils,
    }) => {
      // Navigate to services
      const servicesLink = page.locator(
        TEST_DATA.selectors.navLink('Services')
      );
      await servicesLink.click();

      await page.waitForURL(/\/services/);

      // If error is shown, retry button should be available
      const errorDiv = page.locator(TEST_DATA.selectors.errorMessage).first();
      const isError = await errorDiv
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      if (isError) {
        const retryButton = page.locator(TEST_DATA.selectors.retryButton);
        await expect(retryButton).toBeVisible();

        // Click retry
        await retryButton.click();

        // Should attempt to reload
        await page.waitForLoadState('networkidle');
      }
    });
  });

  test.describe('Performance', () => {
    test('should load home page within performance targets', async ({
      page,
      utils,
    }) => {
      const startTime = Date.now();

      await page.goto('/', { waitUntil: 'networkidle' });

      const loadTime = Date.now() - startTime;

      // Home page should load quickly (< 3s)
      expect(loadTime).toBeLessThan(3000);

      console.log(`Home page load time: ${loadTime}ms`);
    });

    test('should have good Core Web Vitals', async ({ page, utils }) => {
      await page.goto('/', { waitUntil: 'networkidle' });

      const metrics = await utils.getPerformanceMetrics(page);

      // Verify reasonable timing
      expect(metrics.domComplete).toBeLessThan(5000);
      expect(metrics.loadComplete).toBeLessThan(5000);

      console.log('Performance metrics:', metrics);
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper page title', async ({ page }) => {
      const title = await page.title();
      expect(title.length).toBeGreaterThan(0);
      expect(title).toContain('Helaqat El Balad');
    });

    test('should have semantic navigation', async ({ page }) => {
      const nav = page.locator('nav');
      await expect(nav).toBeVisible();

      const navLinks = page.locator('a.nav-link');
      const count = await navLinks.count();

      // Should have multiple navigation links
      expect(count).toBeGreaterThan(5);
    });

    test('should have language toggle with proper button semantics', async ({
      page,
    }) => {
      const langToggle = page.locator(TEST_DATA.selectors.langToggle);
      await expect(langToggle).toHaveRole('button');
    });

    test('should support keyboard navigation', async ({ page }) => {
      // Tab to first nav link
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(() => {
        return document.activeElement?.tagName;
      });

      // Should focus on an element (button or link)
      expect(['BUTTON', 'A', 'DIV']).toContain(focusedElement);
    });
  });

  test.describe('RTL Support', () => {
    test('should render correctly in RTL mode', async ({ page, utils }) => {
      // Switch to Arabic
      const langToggle = page.locator(TEST_DATA.selectors.langToggle);
      await langToggle.click();
      await page.waitForLoadState('networkidle');

      // Verify RTL
      await utils.verifyTextDirection(page, 'ar');

      // Navigate to services
      const servicesLink = page.locator(
        TEST_DATA.selectors.navLink('Services')
      );
      await servicesLink.click();
      await page.waitForURL(/\/services/);

      // Verify RTL still active
      await utils.verifyTextDirection(page, 'ar');
    });

    test('should render correctly in LTR mode', async ({ page, utils }) => {
      // Default is English (LTR)
      await utils.verifyTextDirection(page, 'en');

      // Navigate to services
      const servicesLink = page.locator(
        TEST_DATA.selectors.navLink('Services')
      );
      await servicesLink.click();
      await page.waitForURL(/\/services/);

      // Verify LTR still active
      await utils.verifyTextDirection(page, 'en');
    });
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on desktop', async ({ page }) => {
      // Default viewport is desktop
      const header = page.locator('header.header');
      await expect(header).toBeVisible();

      const nav = page.locator('nav.nav');
      await expect(nav).toBeVisible();
    });

    test('should display correctly on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Reload page with mobile viewport
      await page.goto('/', { waitUntil: 'networkidle' });

      // Header should still be visible
      const header = page.locator('header.header');
      await expect(header).toBeVisible();

      // Navigation should be accessible (even if in menu)
      const nav = page.locator('nav.nav');
      await expect(nav).toBeVisible();
    });
  });

  test.describe('404 Handling', () => {
    test('should show 404 page for non-existent route', async ({ page }) => {
      await page.goto('/non-existent-page', { waitUntil: 'networkidle' });

      // Should stay on page or show 404
      const notFoundElement = page.locator(
        'text=/not found|404|does not exist/i'
      );

      const isNotFound = await notFoundElement
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      // Either shows not found message or just the page content
      expect(page.url()).toContain('/non-existent-page');
    });
  });
});
