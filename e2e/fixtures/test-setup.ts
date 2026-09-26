import { test as base } from '@playwright/test';
import { TestUtils } from './test-utils';

/**
 * Extended test fixture with custom utilities
 */
export const test = base.extend<{
  utils: typeof TestUtils;
}>({
  utils: async ({}, use) => {
    await use(TestUtils);
  },
});

export const expect = base.expect;
