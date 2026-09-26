import { Page, expect } from '@playwright/test';

/**
 * Accessibility testing utilities for WCAG AA compliance
 */

export class AccessibilityUtils {
  /**
   * Check color contrast ratio between two colors
   * WCAG AA requires:
   * - 4.5:1 for normal text
   * - 3:1 for large text (18pt+ or 14pt bold+)
   */
  static getContrastRatio(rgb1: string, rgb2: string): number {
    const getLuminance = (r: number, g: number, b: number) => {
      const [rs, gs, bs] = [r, g, b].map((c) => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    const parseRGB = (rgb: string) => {
      const match = rgb.match(/\d+/g);
      return match ? [parseInt(match[0]), parseInt(match[1]), parseInt(match[2])] : [0, 0, 0];
    };

    const [r1, g1, b1] = parseRGB(rgb1);
    const [r2, g2, b2] = parseRGB(rgb2);

    const l1 = getLuminance(r1, g1, b1);
    const l2 = getLuminance(r2, g2, b2);

    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Verify color contrast for text elements
   */
  static async verifyContrast(
    page: Page,
    selector: string,
    minRatio: number = 4.5
  ): Promise<{ compliant: boolean; ratio: number; failures: string[] }> {
    const failures: string[] = [];

    try {
      const elements = page.locator(selector);
      const count = await elements.count();

      if (count === 0) {
        return { compliant: true, ratio: 0, failures: [] };
      }

      for (let i = 0; i < count; i++) {
        const element = elements.nth(i);

        const result = await element.evaluate((el: HTMLElement) => {
          const style = window.getComputedStyle(el);
          return {
            color: style.color,
            backgroundColor: style.backgroundColor,
            fontSize: style.fontSize,
            fontWeight: style.fontWeight,
            text: el.textContent,
          };
        });

        if (result.color && result.backgroundColor) {
          const ratio = this.getContrastRatio(result.color, result.backgroundColor);

          // Check if large text (18pt+ or 14pt+ bold)
          const fontSize = parseInt(result.fontSize);
          const isLargeText = fontSize >= 18 || (fontSize >= 14 && result.fontWeight >= '700');
          const requiredRatio = isLargeText ? 3 : 4.5;

          if (ratio < requiredRatio) {
            failures.push(
              `Element with text "${result.text?.substring(0, 30)}..." has contrast ratio ${ratio.toFixed(
                2
              )}:1 (required: ${requiredRatio}:1)`
            );
          }
        }
      }

      return {
        compliant: failures.length === 0,
        ratio: 0,
        failures,
      };
    } catch (error) {
      return {
        compliant: false,
        ratio: 0,
        failures: [`Error checking contrast: ${error}`],
      };
    }
  }

  /**
   * Verify heading hierarchy
   */
  static async verifyHeadingHierarchy(page: Page): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];

    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();

    if (headings.length === 0) {
      issues.push('No headings found on page');
      return { valid: false, issues };
    }

    let lastLevel = 0;

    for (const heading of headings) {
      const level = parseInt((await heading.evaluate((el) => el.tagName)).substring(1));
      const text = await heading.textContent();

      if (level > lastLevel + 1) {
        issues.push(
          `Heading hierarchy skipped: jumped from h${lastLevel} to h${level} (text: "${text?.substring(0, 30)}...")`
        );
      }

      lastLevel = level;
    }

    // Check for multiple h1 tags
    const h1Count = await page.locator('h1').count();
    if (h1Count > 1) {
      issues.push(`Found ${h1Count} h1 headings (should be exactly 1)`);
    } else if (h1Count === 0) {
      issues.push('No h1 heading found (exactly 1 is required)');
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Verify form labels are properly associated
   */
  static async verifyFormLabels(page: Page): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];

    const inputs = await page.locator('input, textarea, select').all();

    for (const input of inputs) {
      const inputId = await input.getAttribute('id');
      const inputName = await input.getAttribute('name');
      const inputType = await input.getAttribute('type');

      // Skip hidden inputs and buttons
      if (inputType === 'hidden' || inputType === 'submit' || inputType === 'button') {
        continue;
      }

      // Check for explicit label
      if (inputId) {
        const label = page.locator(`label[for="${inputId}"]`);
        const labelCount = await label.count();
        if (labelCount === 0) {
          issues.push(`Input with id="${inputId}" has no associated label`);
        }
      } else {
        // Check for aria-label
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');

        if (!ariaLabel && !ariaLabelledBy && inputName) {
          issues.push(`Input with name="${inputName}" has no label or aria-label`);
        }
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Verify images have alt text
   */
  static async verifyImageAltText(page: Page): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];

    const images = await page.locator('img').all();

    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const src = await img.getAttribute('src');

      if (!alt) {
        issues.push(`Image without alt text: ${src}`);
      } else if (alt.length === 0) {
        issues.push(`Image with empty alt text: ${src}`);
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Verify link text is descriptive
   */
  static async verifyLinkText(page: Page): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];

    const links = await page.locator('a').all();
    const problematicTexts = ['click here', 'read more', 'link', 'more', 'learn more'];

    for (const link of links) {
      const text = (await link.textContent())?.trim().toLowerCase();
      const ariaLabel = await link.getAttribute('aria-label');

      if (text && problematicTexts.some((t) => text.includes(t))) {
        if (!ariaLabel) {
          issues.push(`Link with non-descriptive text: "${text}"`);
        }
      }

      if (!text && !ariaLabel) {
        const href = await link.getAttribute('href');
        issues.push(`Link without text or aria-label: ${href}`);
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Verify focus indicators are visible
   */
  static async verifyFocusIndicators(page: Page): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];

    const focusableElements = await page
      .locator('a, button, input, select, textarea, [tabindex]')
      .all();

    for (const element of focusableElements) {
      await element.focus();

      const focusStyle = await element.evaluate((el: HTMLElement) => {
        const style = window.getComputedStyle(el, ':focus');
        return {
          outline: style.outline,
          outlineWidth: style.outlineWidth,
          boxShadow: style.boxShadow,
        };
      });

      const hasFocusIndicator =
        focusStyle.outline !== 'none' ||
        focusStyle.outlineWidth !== '0px' ||
        focusStyle.boxShadow !== 'none';

      if (!hasFocusIndicator) {
        const text = await element.textContent();
        const href = await element.getAttribute('href');
        issues.push(`Element without visible focus indicator: "${text || href}"`);
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Verify keyboard navigation works
   */
  static async verifyKeyboardNavigation(page: Page): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];

    try {
      // Tab through page and track focus
      const focusedElements: string[] = [];

      for (let i = 0; i < 20; i++) {
        // Tab 20 times max
        await page.keyboard.press('Tab');

        const focused = await page.evaluate(() => {
          const el = document.activeElement as HTMLElement;
          return {
            tagName: el?.tagName,
            type: el?.getAttribute('type'),
            text: el?.textContent?.substring(0, 30),
          };
        });

        if (focused.tagName) {
          focusedElements.push(focused.tagName);
        }
      }

      if (focusedElements.length === 0) {
        issues.push('No focusable elements found with keyboard navigation');
      }
    } catch (error) {
      issues.push(`Error during keyboard navigation: ${error}`);
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Verify page language is set
   */
  static async verifyLanguageAttribute(page: Page): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];

    const htmlLang = await page.locator('html').getAttribute('lang');

    if (!htmlLang) {
      issues.push('HTML element missing lang attribute');
    } else if (htmlLang.length === 0) {
      issues.push('HTML lang attribute is empty');
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Verify text direction (RTL/LTR) is properly set
   */
  static async verifyTextDirection(page: Page): Promise<{ valid: boolean; direction: string }> {
    const direction = await page.locator('html').getAttribute('dir');

    return {
      valid: direction === 'rtl' || direction === 'ltr',
      direction: direction || 'not set',
    };
  }

  /**
   * Verify no keyboard traps exist
   */
  static async verifyNoKeyboardTraps(page: Page): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];

    try {
      // Get initial focus
      const initialFocus = await page.evaluate(() => document.activeElement?.tagName);

      // Tab through all elements
      let tabCount = 0;
      let sameElement = 0;

      while (tabCount < 50 && sameElement < 5) {
        await page.keyboard.press('Tab');
        tabCount++;

        const currentFocus = await page.evaluate(() => document.activeElement?.tagName);

        if (currentFocus === initialFocus) {
          sameElement++;
        } else {
          sameElement = 0;
        }
      }

      if (sameElement === 5) {
        issues.push('Potential keyboard trap detected - focus stuck on same element');
      }
    } catch (error) {
      issues.push(`Error checking for keyboard traps: ${error}`);
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Check for proper ARIA attributes
   */
  static async verifyAriaAttributes(
    page: Page,
    selector: string
  ): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];

    const elements = await page.locator(selector).all();

    for (const element of elements) {
      const role = await element.getAttribute('role');
      const ariaLabel = await element.getAttribute('aria-label');
      const ariaLabelledBy = await element.getAttribute('aria-labelledby');
      const text = await element.textContent();

      // Elements with role should have label
      if (role && !ariaLabel && !ariaLabelledBy && !text?.trim()) {
        issues.push(`Element with role="${role}" has no accessible name`);
      }

      // Check for proper ARIA live regions
      const ariaLive = await element.getAttribute('aria-live');
      if (ariaLive && !['polite', 'assertive', 'off'].includes(ariaLive)) {
        issues.push(`Invalid aria-live value: "${ariaLive}"`);
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Verify skip links exist (skip to main content)
   */
  static async verifySkipLinks(page: Page): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];

    const skipLink = page.locator('a[href="#main"], a[href="#content"], a.skip-link');
    const skipLinkCount = await skipLink.count();

    if (skipLinkCount === 0) {
      issues.push('No skip link found (e.g., skip to main content)');
    }

    const mainContent = page.locator('main, [role="main"]');
    const mainCount = await mainContent.count();

    if (mainCount === 0) {
      issues.push('No main content area found (main element or role="main")');
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Check for proper error handling and validation messages
   */
  static async verifyErrorHandling(page: Page): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];

    // Look for error messages
    const errorElements = await page
      .locator('[role="alert"], .error, .form-error, [aria-invalid="true"]')
      .all();

    for (const error of errorElements) {
      // Check if error is associated with form field
      const errorId = await error.getAttribute('id');
      const ariaDescribedBy = await error.getAttribute('aria-describedby');

      if (errorId) {
        const associatedInput = page.locator(`[aria-describedby*="${errorId}"]`);
        const count = await associatedInput.count();

        if (count === 0) {
          const errorText = await error.textContent();
          issues.push(`Error message not associated with form field: "${errorText?.substring(0, 30)}..."`);
        }
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Generate comprehensive accessibility report
   */
  static async generateAccessibilityReport(
    page: Page,
    pageName: string
  ): Promise<{
    pageName: string;
    timestamp: string;
    summary: Record<string, any>;
    issues: string[];
    wcaaLevel: 'AA' | 'AAA' | 'FAILED';
  }> {
    const issues: string[] = [];
    let wcaaLevel: 'AA' | 'AAA' | 'FAILED' = 'AA';

    // Run all checks
    const headingCheck = await this.verifyHeadingHierarchy(page);
    const formCheck = await this.verifyFormLabels(page);
    const altCheck = await this.verifyImageAltText(page);
    const linkCheck = await this.verifyLinkText(page);
    const focusCheck = await this.verifyFocusIndicators(page);
    const keyboardCheck = await this.verifyKeyboardNavigation(page);
    const langCheck = await this.verifyLanguageAttribute(page);
    const directionCheck = await this.verifyTextDirection(page);
    const trapCheck = await this.verifyNoKeyboardTraps(page);
    const skipCheck = await this.verifySkipLinks(page);

    // Collect all issues
    if (!headingCheck.valid) issues.push(...headingCheck.issues);
    if (!formCheck.valid) issues.push(...formCheck.issues);
    if (!altCheck.valid) issues.push(...altCheck.issues);
    if (!linkCheck.valid) issues.push(...linkCheck.issues);
    if (!focusCheck.valid) issues.push(...focusCheck.issues);
    if (!keyboardCheck.valid) issues.push(...keyboardCheck.issues);
    if (!langCheck.valid) issues.push(...langCheck.issues);
    if (!trapCheck.valid) issues.push(...trapCheck.issues);
    if (!skipCheck.valid) issues.push(...skipCheck.issues);

    if (issues.length > 5) {
      wcaaLevel = 'FAILED';
    }

    return {
      pageName,
      timestamp: new Date().toISOString(),
      summary: {
        headingHierarchy: headingCheck.valid,
        formLabels: formCheck.valid,
        imageAltText: altCheck.valid,
        linkText: linkCheck.valid,
        focusIndicators: focusCheck.valid,
        keyboardNavigation: keyboardCheck.valid,
        languageAttribute: langCheck.valid,
        textDirection: directionCheck.valid,
        noKeyboardTraps: trapCheck.valid,
        skipLinks: skipCheck.valid,
      },
      issues,
      wcaaLevel,
    };
  }
}
