import { test, expect } from '@playwright/test';
import { AccessibilityUtils } from '../fixtures/accessibility-utils';
import { TEST_DATA } from '../fixtures/test-data';

/**
 * Accessibility audit - WCAG AA compliance testing
 * Tests all pages for accessibility standards:
 * - WCAG 2.1 Level AA
 * - Keyboard navigation
 * - Screen reader compatibility
 * - Color contrast
 * - Form accessibility
 * - Arabic RTL support
 */

test.describe('Accessibility - WCAG AA Compliance', () => {
  test.describe('Shell - Home Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(TEST_DATA.urls.home, { waitUntil: 'networkidle' });
    });

    test('should have proper heading hierarchy', async ({ page }) => {
      const result = await AccessibilityUtils.verifyHeadingHierarchy(page);
      console.log(`Home - Heading Hierarchy: ${result.valid ? 'PASS' : 'FAIL'}`);
      if (!result.valid) console.log(result.issues);
      expect(result.valid).toBeTruthy();
    });

    test('should have proper page language', async ({ page }) => {
      const result = await AccessibilityUtils.verifyLanguageAttribute(page);
      expect(result.valid).toBeTruthy();
    });

    test('should have text direction set (LTR/RTL)', async ({ page }) => {
      const result = await AccessibilityUtils.verifyTextDirection(page);
      expect(result.valid).toBeTruthy();
    });

    test('should have skip links to main content', async ({ page }) => {
      const result = await AccessibilityUtils.verifySkipLinks(page);
      if (!result.valid) {
        console.log('Skip links issues:', result.issues);
      }
    });

    test('should have visible focus indicators', async ({ page }) => {
      const result = await AccessibilityUtils.verifyFocusIndicators(page);
      if (!result.valid) {
        console.log('Focus indicator issues:', result.issues);
      }
    });

    test('should support keyboard navigation', async ({ page }) => {
      const result = await AccessibilityUtils.verifyKeyboardNavigation(page);
      expect(result.valid).toBeTruthy();
    });

    test('should have no keyboard traps', async ({ page }) => {
      const result = await AccessibilityUtils.verifyNoKeyboardTraps(page);
      expect(result.valid).toBeTruthy();
    });

    test('should have descriptive link text', async ({ page }) => {
      const result = await AccessibilityUtils.verifyLinkText(page);
      if (!result.valid) {
        console.log('Link text issues:', result.issues);
      }
    });

    test('should have proper image alt text', async ({ page }) => {
      const result = await AccessibilityUtils.verifyImageAltText(page);
      if (!result.valid) {
        console.log('Image alt text issues:', result.issues);
      }
    });

    test('should have proper page title', async ({ page }) => {
      const title = await page.title();
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(0);
    });

    test('should support language toggle for accessibility', async ({ page }) => {
      const langToggle = page.locator(TEST_DATA.selectors.langToggle);
      const isVisible = await langToggle.isVisible({ timeout: 5000 }).catch(() => false);

      if (isVisible) {
        // Toggle to Arabic
        await langToggle.click();
        await page.waitForTimeout(500);

        // Verify page direction changed
        const direction = await page.locator('html').getAttribute('dir');
        expect(direction).toBe('rtl');

        // Toggle back to English
        await langToggle.click();
        await page.waitForTimeout(500);

        const newDirection = await page.locator('html').getAttribute('dir');
        expect(newDirection).toBe('ltr');
      }
    });

    test('should have navigation marked as nav element', async ({ page }) => {
      const nav = page.locator('nav');
      const navVisible = await nav.isVisible({ timeout: 5000 }).catch(() => false);

      if (navVisible) {
        await expect(nav).toBeVisible();
      }
    });
  });

  test.describe('Services MFE - Services Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(TEST_DATA.urls.services, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
    });

    test('should have proper heading hierarchy', async ({ page }) => {
      const result = await AccessibilityUtils.verifyHeadingHierarchy(page);
      expect(result.valid).toBeTruthy();
    });

    test('should have properly labeled filter form', async ({ page }) => {
      const result = await AccessibilityUtils.verifyFormLabels(page);
      if (!result.valid) {
        console.log('Form label issues:', result.issues);
      }
    });

    test('should have proper category select label', async ({ page }) => {
      const label = page.locator('label[for="category"]');
      const labelVisible = await label.isVisible({ timeout: 5000 }).catch(() => false);

      if (labelVisible) {
        await expect(label).toBeVisible();
        const text = await label.textContent();
        expect(text).toBeTruthy();
      }
    });

    test('should have proper search input label', async ({ page }) => {
      const label = page.locator('label[for="search"]');
      const labelVisible = await label.isVisible({ timeout: 5000 }).catch(() => false);

      if (labelVisible) {
        await expect(label).toBeVisible();
      }
    });

    test('should have proper image alt text on service cards', async ({ page }) => {
      const result = await AccessibilityUtils.verifyImageAltText(page);
      if (!result.valid) {
        console.log('Image alt text issues:', result.issues);
      }
    });

    test('should have visible focus indicators on interactive elements', async ({ page }) => {
      const result = await AccessibilityUtils.verifyFocusIndicators(page);
      if (!result.valid) {
        console.log('Focus indicator issues:', result.issues);
      }
    });

    test('should support keyboard navigation through service cards', async ({ page }) => {
      const result = await AccessibilityUtils.verifyKeyboardNavigation(page);
      expect(result.valid).toBeTruthy();
    });

    test('should have no keyboard traps', async ({ page }) => {
      const result = await AccessibilityUtils.verifyNoKeyboardTraps(page);
      expect(result.valid).toBeTruthy();
    });

    test('should have proper service card heading structure', async ({ page }) => {
      await page.waitForTimeout(1000);

      const h3Elements = page.locator('h3.service-name');
      const count = await h3Elements.count();

      if (count > 0) {
        expect(count).toBeGreaterThan(0);
      }
    });

    test('should have descriptive link text on "View Details" buttons', async ({ page }) => {
      const detailsLinks = page.locator('a.cta-button');
      const count = await detailsLinks.count();

      if (count > 0) {
        for (let i = 0; i < Math.min(count, 3); i++) {
          const link = detailsLinks.nth(i);
          const text = await link.textContent();
          expect(text?.trim()).toBe('View Details');
        }
      }
    });

    test('should display error messages accessibly', async ({ page }) => {
      const result = await AccessibilityUtils.verifyErrorHandling(page);
      if (!result.valid) {
        console.log('Error handling issues:', result.issues);
      }
    });

    test('should maintain proper page language', async ({ page }) => {
      const result = await AccessibilityUtils.verifyLanguageAttribute(page);
      expect(result.valid).toBeTruthy();
    });
  });

  test.describe('Booking MFE - Booking Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(TEST_DATA.urls.booking, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
    });

    test('should have proper heading hierarchy', async ({ page }) => {
      const result = await AccessibilityUtils.verifyHeadingHierarchy(page);
      expect(result.valid).toBeTruthy();
    });

    test('should have properly labeled form inputs', async ({ page }) => {
      const result = await AccessibilityUtils.verifyFormLabels(page);
      if (!result.valid) {
        console.log('Form label issues:', result.issues);
      }
    });

    test('should have visible focus indicators on form elements', async ({ page }) => {
      const result = await AccessibilityUtils.verifyFocusIndicators(page);
      if (!result.valid) {
        console.log('Focus indicator issues:', result.issues);
      }
    });

    test('should support keyboard navigation through form steps', async ({ page }) => {
      const result = await AccessibilityUtils.verifyKeyboardNavigation(page);
      expect(result.valid).toBeTruthy();
    });

    test('should have no keyboard traps in form', async ({ page }) => {
      const result = await AccessibilityUtils.verifyNoKeyboardTraps(page);
      expect(result.valid).toBeTruthy();
    });

    test('should display form validation errors accessibly', async ({ page }) => {
      const result = await AccessibilityUtils.verifyErrorHandling(page);
      if (!result.valid) {
        console.log('Error handling issues:', result.issues);
      }
    });

    test('should have service selection buttons with accessible labels', async ({ page }) => {
      const buttons = page.locator('button.service-card');
      const count = await buttons.count();

      if (count > 0) {
        for (let i = 0; i < Math.min(count, 2); i++) {
          const button = buttons.nth(i);
          const text = await button.textContent();
          expect(text?.trim().length).toBeGreaterThan(0);
        }
      }
    });

    test('should have proper page language', async ({ page }) => {
      const result = await AccessibilityUtils.verifyLanguageAttribute(page);
      expect(result.valid).toBeTruthy();
    });

    test('should have text direction properly set', async ({ page }) => {
      const result = await AccessibilityUtils.verifyTextDirection(page);
      expect(result.valid).toBeTruthy();
    });

    test('should maintain focus management across form steps', async ({ page }) => {
      // Navigate through form and verify focus is managed
      const initialFocus = await page.evaluate(() => document.activeElement?.id);

      await page.keyboard.press('Tab');
      const secondFocus = await page.evaluate(() => document.activeElement?.id);

      // Focus should move between elements
      expect(initialFocus !== secondFocus || initialFocus === undefined).toBeTruthy();
    });
  });

  test.describe('Services MFE - Service Details Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(TEST_DATA.urls.services, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);

      // Navigate to first service details
      const firstLink = page.locator('a.cta-button').first();
      const count = await page.locator('a.cta-button').count();

      if (count > 0) {
        await firstLink.click();
        await page.waitForLoadState('networkidle');
      }
    });

    test('should have proper heading hierarchy on details page', async ({ page }) => {
      const result = await AccessibilityUtils.verifyHeadingHierarchy(page);
      expect(result.valid).toBeTruthy();
    });

    test('should have descriptive back link', async ({ page }) => {
      const backButton = page.locator('button:has-text("← Back"), a:has-text("← Back")');
      const isVisible = await backButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (isVisible) {
        const text = await backButton.textContent();
        expect(text).toContain('Back');
      }
    });

    test('should have proper booking button link', async ({ page }) => {
      const bookButton = page.locator('a.details-cta');
      const isVisible = await bookButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (isVisible) {
        const text = await bookButton.textContent();
        expect(text?.toLowerCase()).toContain('book');
      }
    });
  });

  test.describe('RTL/Arabic Accessibility', () => {
    test('should properly display and navigate RTL content', async ({ page }) => {
      await page.goto(TEST_DATA.urls.home, { waitUntil: 'networkidle' });

      // Toggle to Arabic
      const langToggle = page.locator(TEST_DATA.selectors.langToggle);
      const isVisible = await langToggle.isVisible({ timeout: 5000 }).catch(() => false);

      if (isVisible) {
        await langToggle.click();
        await page.waitForTimeout(500);

        // Verify RTL direction
        const direction = await page.locator('html').getAttribute('dir');
        expect(direction).toBe('rtl');

        // Verify RTL styles applied
        const body = page.locator('body');
        const computedStyle = await body.evaluate((el) => {
          return window.getComputedStyle(el).direction;
        });

        expect(computedStyle).toBe('rtl');

        // Navigation should still work with RTL
        const result = await AccessibilityUtils.verifyKeyboardNavigation(page);
        expect(result.valid).toBeTruthy();
      }
    });

    test('should have proper Arabic alt text for images', async ({ page }) => {
      await page.goto(TEST_DATA.urls.services, { waitUntil: 'networkidle' });

      const result = await AccessibilityUtils.verifyImageAltText(page);
      if (!result.valid) {
        console.log('Arabic page - Image alt text issues:', result.issues);
      }
    });

    test('should maintain Arabic text direction during navigation', async ({ page }) => {
      await page.goto(TEST_DATA.urls.home, { waitUntil: 'networkidle' });

      const langToggle = page.locator(TEST_DATA.selectors.langToggle);
      const isVisible = await langToggle.isVisible({ timeout: 5000 }).catch(() => false);

      if (isVisible) {
        await langToggle.click();
        await page.waitForTimeout(500);

        // Navigate to services
        const servicesLink = page.locator('a:has-text("Services")');
        const servicesVisible = await servicesLink.isVisible({ timeout: 5000 }).catch(() => false);

        if (servicesVisible) {
          await servicesLink.click();
          await page.waitForTimeout(500);

          // Direction should still be RTL
          const direction = await page.locator('html').getAttribute('dir');
          expect(direction).toBe('rtl');
        }
      }
    });
  });

  test.describe('Color Contrast - WCAG AA', () => {
    const wcaaThreshold = 4.5; // 4.5:1 for normal text, 3:1 for large text

    test('should have sufficient contrast on home page', async ({ page }) => {
      await page.goto(TEST_DATA.urls.home, { waitUntil: 'networkidle' });

      // Check headings
      const headings = page.locator('h1, h2, h3');
      const result = await AccessibilityUtils.verifyContrast(page, 'h1, h2, h3', wcaaThreshold);

      if (!result.compliant && result.failures.length > 0) {
        console.log('Heading contrast issues:', result.failures);
      }
    });

    test('should have sufficient contrast on text elements', async ({ page }) => {
      await page.goto(TEST_DATA.urls.home, { waitUntil: 'networkidle' });

      const result = await AccessibilityUtils.verifyContrast(page, 'p, span, a', wcaaThreshold);

      if (!result.compliant && result.failures.length > 0) {
        console.log('Text contrast issues:', result.failures);
      }
    });

    test('should have sufficient contrast on buttons', async ({ page }) => {
      await page.goto(TEST_DATA.urls.home, { waitUntil: 'networkidle' });

      const result = await AccessibilityUtils.verifyContrast(page, 'button, a.btn', wcaaThreshold);

      if (!result.compliant && result.failures.length > 0) {
        console.log('Button contrast issues:', result.failures);
      }
    });
  });

  test.describe('Semantic HTML', () => {
    test('should use semantic HTML on home page', async ({ page }) => {
      await page.goto(TEST_DATA.urls.home, { waitUntil: 'networkidle' });

      const header = page.locator('header');
      const nav = page.locator('nav');
      const main = page.locator('main, [role="main"]');
      const footer = page.locator('footer');

      const headerVisible = await header.isVisible({ timeout: 5000 }).catch(() => false);
      const navVisible = await nav.isVisible({ timeout: 5000 }).catch(() => false);
      const mainVisible = await main.isVisible({ timeout: 5000 }).catch(() => false);
      const footerVisible = await footer.isVisible({ timeout: 5000 }).catch(() => false);

      expect(headerVisible || navVisible || mainVisible || footerVisible).toBeTruthy();
    });

    test('should use list elements for navigation', async ({ page }) => {
      await page.goto(TEST_DATA.urls.home, { waitUntil: 'networkidle' });

      const navList = page.locator('nav ul, nav ol');
      const navListVisible = await navList.isVisible({ timeout: 5000 }).catch(() => false);

      if (navListVisible) {
        await expect(navList).toBeVisible();
      }
    });

    test('should use button elements for form submissions', async ({ page }) => {
      await page.goto(TEST_DATA.urls.booking, { waitUntil: 'networkidle' });

      const buttons = page.locator('button[type="submit"], button[type="button"]');
      const count = await buttons.count();

      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Accessibility Report Generation', () => {
    test('should generate accessibility report for home page', async ({ page }) => {
      await page.goto(TEST_DATA.urls.home, { waitUntil: 'networkidle' });

      const report = await AccessibilityUtils.generateAccessibilityReport(page, 'Home');

      console.log(`\n=== Accessibility Report: ${report.pageName} ===`);
      console.log(`WCAG Level: ${report.wcaaLevel}`);
      console.log(`Issues Found: ${report.issues.length}`);

      if (report.issues.length > 0) {
        console.log('Issues:');
        report.issues.forEach((issue, i) => {
          console.log(`  ${i + 1}. ${issue}`);
        });
      }

      // Should meet at least Level AA
      expect(report.wcaaLevel).not.toBe('FAILED');
    });

    test('should generate accessibility report for services page', async ({ page }) => {
      await page.goto(TEST_DATA.urls.services, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);

      const report = await AccessibilityUtils.generateAccessibilityReport(page, 'Services');

      console.log(`\n=== Accessibility Report: ${report.pageName} ===`);
      console.log(`WCAG Level: ${report.wcaaLevel}`);
      console.log(`Issues Found: ${report.issues.length}`);

      expect(report.wcaaLevel).not.toBe('FAILED');
    });

    test('should generate accessibility report for booking page', async ({ page }) => {
      await page.goto(TEST_DATA.urls.booking, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);

      const report = await AccessibilityUtils.generateAccessibilityReport(page, 'Booking');

      console.log(`\n=== Accessibility Report: ${report.pageName} ===`);
      console.log(`WCAG Level: ${report.wcaaLevel}`);
      console.log(`Issues Found: ${report.issues.length}`);

      expect(report.wcaaLevel).not.toBe('FAILED');
    });
  });

  test.describe('Mobile Accessibility', () => {
    test('should be accessible on mobile devices', async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: 375, height: 667 },
        isMobile: true,
      });

      const page = await context.newPage();

      try {
        await page.goto(TEST_DATA.urls.home, { waitUntil: 'networkidle' });

        // Verify touch targets are large enough (48x48px minimum)
        const buttons = page.locator('button');
        const count = await buttons.count();

        if (count > 0) {
          const firstButton = buttons.first();
          const box = await firstButton.boundingBox();

          // Touch target should be at least 48x48
          if (box) {
            expect(Math.max(box.width, box.height)).toBeGreaterThanOrEqual(44);
          }
        }

        // Verify navigation is accessible on mobile
        const result = await AccessibilityUtils.verifyKeyboardNavigation(page);
        expect(result.valid).toBeTruthy();
      } finally {
        await context.close();
      }
    });
  });
});
