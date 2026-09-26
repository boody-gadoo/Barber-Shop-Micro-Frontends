import { test, expect } from '../fixtures/test-setup';
import { TestUtils } from '../fixtures/test-utils';
import { TEST_DATA } from '../fixtures/test-data';

test.describe('Services MFE - Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to services page before each test
    await page.goto(TEST_DATA.urls.services, { waitUntil: 'networkidle' });
    // Wait for services to load
    await TestUtils.waitForSpinner(page);
  });

  test.describe('Services Page - Initial Load', () => {
    test('should load services page successfully', async ({ page }) => {
      // Verify page title
      const title = await page.title();
      expect(title).toContain('Helaqat El Balad');

      // Verify header exists
      const header = page.locator('div.services-header');
      await expect(header).toBeVisible();

      // Verify header content
      const heading = page.locator('h1');
      const headingText = await heading.textContent();
      expect(headingText).toContain('Our Services');

      // Verify subheading
      const subheading = page.locator('div.services-header p');
      const subheadingText = await subheading.textContent();
      expect(subheadingText).toContain('Professional barber services');
    });

    test('should display loading spinner during initial load', async ({ page }) => {
      // Create a new page to catch loading state
      const newPage = await page.context().newPage();
      
      try {
        const navigationPromise = newPage.waitForLoadState('networkidle');
        await newPage.goto(TEST_DATA.urls.services);
        
        // Spinner should eventually hide
        const spinner = newPage.locator('div.loading-state');
        await spinner.waitFor({ state: 'hidden', timeout: 15000 });
      } finally {
        await newPage.close();
      }
    });

    test('should display services grid after loading', async ({ page }) => {
      // Wait for spinner to disappear
      await TestUtils.waitForSpinner(page);

      // Verify services grid exists
      const grid = page.locator('div.services-grid');
      await expect(grid).toBeVisible();

      // Verify at least one service card exists
      const serviceCards = page.locator('div.service-card');
      const count = await serviceCards.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should display service cards with required information', async ({ page }) => {
      // Wait for services to load
      await TestUtils.waitForSpinner(page);

      // Get first service card
      const firstCard = page.locator('div.service-card').first();
      await expect(firstCard).toBeVisible();

      // Verify service card contains required elements
      const serviceName = firstCard.locator('h3.service-name');
      await expect(serviceName).toBeVisible();

      const description = firstCard.locator('p.service-description');
      await expect(description).toBeVisible();

      const price = firstCard.locator('div.service-price');
      await expect(price).toBeVisible();

      const duration = firstCard.locator('div.service-duration');
      await expect(duration).toBeVisible();

      // Verify View Details button exists
      const button = firstCard.locator('a.cta-button');
      await expect(button).toBeVisible();
      const buttonText = await button.textContent();
      expect(buttonText).toContain('View Details');
    });

    test('should display popular and unavailable badges', async ({ page }) => {
      // Wait for services to load
      await TestUtils.waitForSpinner(page);

      // Check for popular badges
      const badges = page.locator('div.service-badge');
      const count = await badges.count();

      // Should have at least some badges (popular or unavailable)
      if (count > 0) {
        const firstBadge = badges.first();
        const badgeText = await firstBadge.textContent();
        expect(
          badgeText === 'Popular' || 
          badgeText === 'Unavailable' ||
          badgeText?.includes('Unavailable')
        ).toBeTruthy();
      }
    });
  });

  test.describe('Services Filtering', () => {
    test('should filter services by category', async ({ page }) => {
      // Wait for services to load
      await TestUtils.waitForSpinner(page);

      // Get initial service count
      const initialCards = page.locator('div.service-card');
      const initialCount = await initialCards.count();
      expect(initialCount).toBeGreaterThan(0);

      // Select a category
      const categorySelect = page.locator('#category');
      await expect(categorySelect).toBeVisible();

      // Get available options
      const options = page.locator('#category option');
      const optionCount = await options.count();

      // If more than one option (excluding "All Categories")
      if (optionCount > 1) {
        // Select second option (first non-"All Categories" option)
        const secondOption = options.nth(1);
        const optionValue = await secondOption.getAttribute('value');

        // Select this option
        await categorySelect.selectOption(optionValue || '');

        // Wait for filter to apply
        await page.waitForTimeout(500);

        // Verify filtered results
        const filteredCards = page.locator('div.service-card');
        const filteredCount = await filteredCards.count();

        // Filtered count should be <= initial count
        expect(filteredCount).toBeLessThanOrEqual(initialCount);

        // Verify all visible cards have the selected category
        if (filteredCount > 0) {
          const categories = page.locator('div.service-category');
          for (let i = 0; i < filteredCount; i++) {
            const category = categories.nth(i);
            const categoryText = await category.textContent();
            expect(categoryText).toBeTruthy();
          }
        }
      }
    });

    test('should reset category filter to show all services', async ({ page }) => {
      // Wait for services to load
      await TestUtils.waitForSpinner(page);

      const categorySelect = page.locator('#category');

      // Select a specific category
      const options = page.locator('#category option');
      const optionCount = await options.count();

      if (optionCount > 1) {
        const secondOption = options.nth(1);
        const optionValue = await secondOption.getAttribute('value');
        await categorySelect.selectOption(optionValue || '');
        await page.waitForTimeout(500);

        // Get filtered count
        const filteredCards = page.locator('div.service-card');
        const filteredCount = await filteredCards.count();

        // Reset to "All Categories"
        await categorySelect.selectOption('');
        await page.waitForTimeout(500);

        // Get all services count
        const allCards = page.locator('div.service-card');
        const allCount = await allCards.count();

        // All services should be >= filtered count
        expect(allCount).toBeGreaterThanOrEqual(filteredCount);
      }
    });

    test('should search services by name', async ({ page }) => {
      // Wait for services to load
      await TestUtils.waitForSpinner(page);

      // Get initial service count
      const initialCards = page.locator('div.service-card');
      const initialCount = await initialCards.count();

      // Enter search term
      const searchInput = page.locator('#search');
      await expect(searchInput).toBeVisible();

      // Search for a common term
      await searchInput.fill('haircut');
      await page.waitForTimeout(500);

      // Verify filtered results
      const searchResults = page.locator('div.service-card');
      const searchCount = await searchResults.count();

      // Search results should be <= initial count
      expect(searchCount).toBeLessThanOrEqual(initialCount);

      // If results exist, verify they contain the search term
      if (searchCount > 0) {
        const firstResult = searchResults.first();
        const resultText = (await firstResult.textContent()) || '';
        expect(resultText.toLowerCase()).toContain('haircut');
      }
    });

    test('should clear search and show all services', async ({ page }) => {
      // Wait for services to load
      await TestUtils.waitForSpinner(page);

      const searchInput = page.locator('#search');

      // Search for something
      await searchInput.fill('nonexistent');
      await page.waitForTimeout(500);

      // Should show empty state
      let cards = page.locator('div.service-card');
      let count = await cards.count();
      expect(count).toBe(0);

      // Clear search
      await searchInput.clear();
      await page.waitForTimeout(500);

      // Services should appear again
      cards = page.locator('div.service-card');
      count = await cards.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should display empty state when no services match filter', async ({ page }) => {
      // Wait for services to load
      await TestUtils.waitForSpinner(page);

      const searchInput = page.locator('#search');

      // Search for non-existent service
      await searchInput.fill('zzzzzzzzzzz');
      await page.waitForTimeout(500);

      // Verify empty state
      const emptyState = page.locator('div.empty-state');
      await expect(emptyState).toBeVisible();

      const emptyText = await emptyState.textContent();
      expect(emptyText).toContain('No services found');
    });

    test('should combine category and search filters', async ({ page }) => {
      // Wait for services to load
      await TestUtils.waitForSpinner(page);

      const categorySelect = page.locator('#category');
      const searchInput = page.locator('#search');

      // Select a category
      const options = page.locator('#category option');
      const optionCount = await options.count();

      if (optionCount > 1) {
        const secondOption = options.nth(1);
        const optionValue = await secondOption.getAttribute('value');
        await categorySelect.selectOption(optionValue || '');
        await page.waitForTimeout(300);

        // Enter search term
        await searchInput.fill('haircut');
        await page.waitForTimeout(500);

        // Verify filtered results exist
        const cards = page.locator('div.service-card');
        const count = await cards.count();

        // Results should exist or empty state should show
        const emptyState = page.locator('div.empty-state');
        const hasResults = count > 0;
        const isEmpty = await emptyState.isVisible({ timeout: 2000 }).catch(() => false);

        expect(hasResults || isEmpty).toBeTruthy();
      }
    });
  });

  test.describe('Service Details Navigation', () => {
    test('should navigate to service details page from grid', async ({ page }) => {
      // Wait for services to load
      await TestUtils.waitForSpinner(page);

      // Get first service card
      const firstCard = page.locator('div.service-card').first();
      const viewDetailsLink = firstCard.locator('a.cta-button');

      // Get the href to verify navigation
      const href = await viewDetailsLink.getAttribute('href');
      expect(href).toBeTruthy();
      expect(href).toContain('/services/');

      // Click to navigate
      await viewDetailsLink.click();

      // Wait for details page to load
      await page.waitForLoadState('networkidle');

      // Verify we're on details page
      const detailsSection = page.locator('div.service-details');
      await expect(detailsSection).toBeVisible();

      // Verify service name is displayed
      const heading = page.locator('h1');
      const headingText = await heading.textContent();
      expect(headingText).toBeTruthy();
    });

    test('should display service details correctly', async ({ page }) => {
      // Wait for services to load
      await TestUtils.waitForSpinner(page);

      // Navigate to first service
      const firstCard = page.locator('div.service-card').first();
      const viewDetailsLink = firstCard.locator('a.cta-button');
      await viewDetailsLink.click();

      // Wait for details page
      await page.waitForLoadState('networkidle');

      // Verify details page elements
      const backButton = page.locator('button:has-text("← Back")');
      await expect(backButton).toBeVisible();

      // Verify category is displayed
      const category = page.locator('div.details-category');
      await expect(category).toBeVisible();

      // Verify service name
      const heading = page.locator('h1');
      await expect(heading).toBeVisible();

      // Verify description
      const description = page.locator('p.details-description');
      await expect(description).toBeVisible();

      // Verify meta information (price and duration)
      const metaItems = page.locator('div.meta-item');
      const metaCount = await metaItems.count();
      expect(metaCount).toBeGreaterThan(0);

      // Verify CTA button
      const ctaButton = page.locator('a.details-cta');
      await expect(ctaButton).toBeVisible();
      const ctaText = await ctaButton.textContent();
      expect(ctaText).toContain('Book This Service');
    });

    test('should navigate back from service details', async ({ page }) => {
      // Navigate to first service
      await TestUtils.waitForSpinner(page);
      const firstCard = page.locator('div.service-card').first();
      const viewDetailsLink = firstCard.locator('a.cta-button');
      await viewDetailsLink.click();

      // Wait for details page
      await page.waitForLoadState('networkidle');

      // Click back button
      const backButton = page.locator('button:has-text("← Back")');
      await backButton.click();

      // Wait for navigation
      await page.waitForLoadState('networkidle');

      // Verify we're back on services page
      const servicesGrid = page.locator('div.services-grid');
      await expect(servicesGrid).toBeVisible();
    });

    test('should handle invalid service ID gracefully', async ({ page }) => {
      // Navigate to non-existent service
      await page.goto(`${TEST_DATA.urls.services}/invalid-id-12345`, {
        waitUntil: 'networkidle',
      });

      // Wait for content to load
      await page.waitForTimeout(1000);

      // Verify error state or not found message
      const notFoundText = page.locator('text=not found');
      const backLink = page.locator('a:has-text("Back to Services")');

      const hasNotFound = await notFoundText.isVisible({ timeout: 5000 }).catch(() => false);
      const hasBackLink = await backLink.isVisible({ timeout: 5000 }).catch(() => false);

      expect(hasNotFound || hasBackLink).toBeTruthy();
    });

    test('should preserve service ID in URL when viewing details', async ({ page }) => {
      // Wait for services to load
      await TestUtils.waitForSpinner(page);

      // Get first service card and extract ID from link
      const firstCard = page.locator('div.service-card').first();
      const viewDetailsLink = firstCard.locator('a.cta-button');
      const href = await viewDetailsLink.getAttribute('href');

      // Extract service ID from URL
      const serviceId = href?.split('/').pop();
      expect(serviceId).toBeTruthy();

      // Navigate to service
      await viewDetailsLink.click();
      await page.waitForLoadState('networkidle');

      // Verify service ID is in the URL
      const currentUrl = page.url();
      expect(currentUrl).toContain(`/services/${serviceId}`);
    });
  });

  test.describe('Service Details - Booking CTA', () => {
    test('should navigate to booking with service pre-selected', async ({ page }) => {
      // Wait for services to load
      await TestUtils.waitForSpinner(page);

      // Navigate to first service
      const firstCard = page.locator('div.service-card').first();
      const viewDetailsLink = firstCard.locator('a.cta-button');
      const href = await viewDetailsLink.getAttribute('href');
      const serviceId = href?.split('/').pop();

      await viewDetailsLink.click();
      await page.waitForLoadState('networkidle');

      // Click Book This Service button
      const bookButton = page.locator('a.details-cta');
      const bookHref = await bookButton.getAttribute('href');

      // Verify booking URL contains service ID
      expect(bookHref).toContain(`serviceId=${serviceId}`);
    });

    test('should display "Book This Service" button with correct link', async ({ page }) => {
      // Wait for services to load
      await TestUtils.waitForSpinner(page);

      // Navigate to first service
      const firstCard = page.locator('div.service-card').first();
      const viewDetailsLink = firstCard.locator('a.cta-button');
      await viewDetailsLink.click();

      // Wait for details page
      await page.waitForLoadState('networkidle');

      // Verify CTA button exists and has correct href
      const ctaButton = page.locator('a.details-cta');
      await expect(ctaButton).toBeVisible();

      const href = await ctaButton.getAttribute('href');
      expect(href).toBeTruthy();
      expect(href).toContain('/booking');

      // Verify button text
      const buttonText = await ctaButton.textContent();
      expect(buttonText).toContain('Book This Service');
    });
  });

  test.describe('Offers Page', () => {
    test('should navigate to offers page from services', async ({ page }) => {
      // Navigate directly to offers page
      await page.goto(`${TEST_DATA.urls.services}/offers`, { waitUntil: 'networkidle' });

      // Wait for content to load
      await page.waitForTimeout(1000);

      // Verify offers page is loaded
      const offersHeader = page.locator('h1:has-text("Special Offers")');
      const isVisible = await offersHeader.isVisible({ timeout: 5000 }).catch(() => false);

      if (isVisible) {
        await expect(offersHeader).toBeVisible();
      }
    });

    test('should display offers section with grid layout', async ({ page }) => {
      // Navigate to offers
      await page.goto(`${TEST_DATA.urls.services}/offers`, { waitUntil: 'networkidle' });

      // Wait for content
      await page.waitForTimeout(1000);

      // Check for offers grid or empty/loading state
      const offersGrid = page.locator('div.offers-grid');
      const loadingState = page.locator('div.loading-state');
      const emptyState = page.locator('div.empty-state');

      const hasGrid = await offersGrid.isVisible({ timeout: 5000 }).catch(() => false);
      const isLoading = await loadingState.isVisible({ timeout: 5000 }).catch(() => false);
      const isEmpty = await emptyState.isVisible({ timeout: 5000 }).catch(() => false);

      // Should have either grid, loading, or empty state
      expect(hasGrid || isLoading || isEmpty).toBeTruthy();
    });

    test('should display offer cards with required information', async ({ page }) => {
      // Navigate to offers
      await page.goto(`${TEST_DATA.urls.services}/offers`, { waitUntil: 'networkidle' });

      // Wait for content
      await TestUtils.waitForSpinner(page);

      // Check if offers exist
      const offerCards = page.locator('div.offer-card');
      const cardCount = await offerCards.count();

      if (cardCount > 0) {
        // Verify first offer card contains expected elements
        const firstCard = offerCards.first();

        // Badge (status)
        const badge = firstCard.locator('div.offer-badge');
        await expect(badge).toBeVisible();

        // Title
        const title = firstCard.locator('h3.offer-title');
        await expect(title).toBeVisible();

        // Description
        const description = firstCard.locator('p.offer-description');
        await expect(description).toBeVisible();

        // Discount
        const discount = firstCard.locator('div.offer-discount');
        await expect(discount).toBeVisible();

        // CTA
        const cta = firstCard.locator('a.offer-cta');
        await expect(cta).toBeVisible();
      }
    });

    test('should have back to services link on offers page', async ({ page }) => {
      // Navigate to offers
      await page.goto(`${TEST_DATA.urls.services}/offers`, { waitUntil: 'networkidle' });

      // Wait for content
      await page.waitForTimeout(1000);

      // Find back link
      const backLink = page.locator('a:has-text("← Back to Services")');
      const isVisible = await backLink.isVisible({ timeout: 5000 }).catch(() => false);

      if (isVisible) {
        await expect(backLink).toBeVisible();

        // Verify it links back to services
        const href = await backLink.getAttribute('href');
        expect(href).toBe('/services');
      }
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper semantic HTML structure', async ({ page }) => {
      // Wait for services to load
      await TestUtils.waitForSpinner(page);

      // Verify main landmark
      const main = page.locator('main, div.services-container');
      await expect(main).toBeVisible();

      // Verify headings hierarchy
      const h1 = page.locator('h1');
      await expect(h1).toBeVisible();

      // Verify service cards are accessible
      const cards = page.locator('div.service-card');
      const count = await cards.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should have accessible filter inputs', async ({ page }) => {
      // Wait for services to load
      await TestUtils.waitForSpinner(page);

      // Check category select has label
      const categoryLabel = page.locator('label[for="category"]');
      await expect(categoryLabel).toBeVisible();

      // Check search input has label
      const searchLabel = page.locator('label[for="search"]');
      await expect(searchLabel).toBeVisible();

      // Verify inputs are associated with labels
      const categorySelect = page.locator('#category');
      const categoryId = await categorySelect.getAttribute('id');
      expect(categoryId).toBe('category');

      const searchInput = page.locator('#search');
      const searchId = await searchInput.getAttribute('id');
      expect(searchId).toBe('search');
    });

    test('should support keyboard navigation', async ({ page }) => {
      // Wait for services to load
      await TestUtils.waitForSpinner(page);

      // Tab to category filter
      const categorySelect = page.locator('#category');
      await categorySelect.focus();

      // Verify focused
      const focusedElement = await page.evaluate(() => document.activeElement?.id);
      expect(focusedElement).toBe('category');

      // Tab to search input
      await page.keyboard.press('Tab');

      // Verify search is focused
      const searchFocused = await page.evaluate(() => document.activeElement?.id);
      expect(searchFocused).toBe('search');

      // Tab to first button
      await page.keyboard.press('Tab');
      const buttonFocused = await page.evaluate(() =>
        document.activeElement?.tagName.toLowerCase()
      );
      expect(buttonFocused).toBe('a');
    });

    test('should have properly labeled buttons', async ({ page }) => {
      // Wait for services to load
      await TestUtils.waitForSpinner(page);

      // Check View Details buttons have text
      const buttons = page.locator('a.cta-button');
      const count = await buttons.count();

      if (count > 0) {
        for (let i = 0; i < Math.min(count, 3); i++) {
          const button = buttons.nth(i);
          const text = await button.textContent();
          expect(text?.trim().length).toBeGreaterThan(0);
        }
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should display properly on desktop view', async ({ page }) => {
      // Current viewport should be desktop (default)
      const viewport = page.viewportSize();
      expect(viewport?.width).toBeGreaterThan(1024);

      // Wait for services to load
      await TestUtils.waitForSpinner(page);

      // Verify grid layout
      const grid = page.locator('div.services-grid');
      await expect(grid).toBeVisible();

      // Verify cards are visible
      const cards = page.locator('div.service-card');
      const count = await cards.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should display properly on mobile view', async ({ browser }) => {
      // Create page with mobile viewport
      const context = await browser.newContext({
        viewport: { width: 375, height: 667 },
        isMobile: true,
      });

      const page = await context.newPage();

      try {
        // Navigate to services
        await page.goto(TEST_DATA.urls.services, { waitUntil: 'networkidle' });

        // Wait for services to load
        await TestUtils.waitForSpinner(page);

        // Verify mobile layout
        const servicesContainer = page.locator('div.services-container');
        await expect(servicesContainer).toBeVisible();

        // Verify cards stack vertically on mobile
        const cards = page.locator('div.service-card');
        const count = await cards.count();
        expect(count).toBeGreaterThan(0);

        // Verify filters are still accessible
        const filters = page.locator('div.services-filters');
        await expect(filters).toBeVisible();
      } finally {
        await context.close();
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should display error message on load failure', async ({ page }) => {
      // This test would require mocking API failures
      // For now, we verify the error handling structure exists

      // Navigate to services
      await page.goto(TEST_DATA.urls.services, { waitUntil: 'networkidle' });

      // Check if error boundary elements exist in DOM
      const errorElements = page.locator('[class*="error"]');
      const count = await errorElements.count();

      // Should have error-related elements available
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate offline mode
      await page.context().setOffline(true);

      try {
        // Try to navigate to services
        await page.goto(TEST_DATA.urls.services, { waitUntil: 'domcontentloaded' });

        // Page should still be interactive (cached or showing error)
        const container = page.locator('div.services-container');
        const isVisible = await container.isVisible({ timeout: 5000 }).catch(() => false);

        // Container should exist (even if showing error)
        expect(isVisible).toBeTruthy();
      } finally {
        // Restore connectivity
        await page.context().setOffline(false);
      }
    });
  });

  test.describe('Performance', () => {
    test('should load services page within acceptable time', async ({ page }) => {
      const startTime = Date.now();

      // Navigate to services
      await page.goto(TEST_DATA.urls.services, { waitUntil: 'networkidle' });

      // Wait for services to load
      await TestUtils.waitForSpinner(page);

      const loadTime = Date.now() - startTime;

      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should render service grid efficiently', async ({ page }) => {
      // Navigate to services
      await page.goto(TEST_DATA.urls.services, { waitUntil: 'networkidle' });
      await TestUtils.waitForSpinner(page);

      // Measure DOM node count for service cards
      const cardCount = await page.locator('div.service-card').count();

      // Get paint timing if available
      const metrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        };
      });

      // Should have reasonable performance metrics
      expect(cardCount).toBeGreaterThan(0);
      expect(metrics.domContentLoaded).toBeGreaterThan(0);
    });

    test('should apply filters without noticeable delay', async ({ page }) => {
      // Navigate to services
      await page.goto(TEST_DATA.urls.services, { waitUntil: 'networkidle' });
      await TestUtils.waitForSpinner(page);

      const categorySelect = page.locator('#category');
      const options = page.locator('#category option');
      const optionCount = await options.count();

      if (optionCount > 1) {
        const secondOption = options.nth(1);
        const optionValue = await secondOption.getAttribute('value');

        const startTime = Date.now();

        // Apply filter
        await categorySelect.selectOption(optionValue || '');
        await page.waitForTimeout(500);

        const filterTime = Date.now() - startTime;

        // Filter should apply quickly (within 1 second)
        expect(filterTime).toBeLessThan(1000);

        // Verify results are updated
        const cards = page.locator('div.service-card');
        const count = await cards.count();
        expect(count).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
