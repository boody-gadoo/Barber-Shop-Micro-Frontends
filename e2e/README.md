# E2E Testing with Playwright

Comprehensive end-to-end testing suite for the barber shop micro frontend platform.

## Setup

### Installation

```bash
npm install
```

This installs Playwright and all testing dependencies.

### Configuration

Playwright configuration is in `playwright.config.ts`:

- **Base URL**: http://localhost:3000 (Shell host)
- **Timeout**: 30 seconds per test
- **Retries**: 2 on CI, 0 locally
- **Browsers**: Chromium, Firefox, WebKit
- **Mobile**: iPhone 12, Pixel 5
- **Screenshots**: On failure only
- **Videos**: On failure only
- **Trace**: On first retry

## Running Tests

### Start Development Servers

Before running tests, start all three MFEs in separate terminals:

```bash
# Terminal 1: Shell
cd apps/shell && npm run dev

# Terminal 2: Services
cd apps/services-react && npm run dev

# Terminal 3: Booking
cd apps/booking-angular && npm run dev
```

### Run All Tests

```bash
npm run test
```

### Run Tests in UI Mode

Interactive mode for debugging:

```bash
npm run test:ui
```

### Run Tests Headed

See browser actions in real-time:

```bash
npm run test:headed
```

### Debug Mode

Step through tests with inspector:

```bash
npm run test:debug
```

### View Report

After tests complete:

```bash
npm run test:report
```

## Test Structure

```
e2e/
├── fixtures/
│   ├── test-data.ts          # Test data constants
│   ├── test-setup.ts         # Custom test fixture
│   └── test-utils.ts         # Utility functions
├── tests/
│   ├── shell-navigation.spec.ts
│   ├── services-mfe.spec.ts
│   ├── booking-mfe.spec.ts
│   └── shared-dependencies.spec.ts
├── screenshots/              # Failed test screenshots
├── test-results/            # HTML reports
└── README.md
```

## Test Utilities

### TestUtils Class

Provides helper methods for common test operations:

```typescript
// Wait for MFE to load
await utils.waitForMFE(page, 'services');

// Navigate and wait
await utils.navigateTo(page, '/services');

// Wait for loading spinner
await utils.waitForSpinner(page);

// Check for errors and retry
await utils.checkAndRetryOnError(page);

// Switch language
await utils.switchLanguage(page);

// Get performance metrics
const metrics = await utils.getPerformanceMetrics(page);
```

## Test Data

Test data defined in `fixtures/test-data.ts`:

- Service details (name, price, duration)
- Barber profiles (name, rating)
- Customer information (email, phone)
- Common selectors
- URL paths
- Timeout values

## Test Categories

### 1. Shell Navigation Tests

- Home page loads
- Navigation links work
- Language toggle works
- RTL support verified

### 2. Services MFE Tests

- Services page loads
- Service grid displays
- Service cards clickable
- Service details visible

### 3. Booking MFE Tests

- Booking page loads
- Multi-step form renders
- Service selection works
- Barber selection works
- Customer form works
- Confirmation shows

### 4. Shared Dependencies Tests

- React shared correctly
- Design tokens loaded
- API types available

## Debugging

### View Console Logs

```typescript
page.on('console', msg => console.log(msg.text()));
```

### Pause on Error

```typescript
await page.pause();
```

### Network Monitoring

```typescript
page.on('request', request => console.log('Request:', request.url()));
```

### Check DOM State

```typescript
const html = await page.content();
console.log(html);
```

## CI/CD Integration

### GitHub Actions

Tests run on every push to main:

```yaml
- name: Run E2E Tests
  run: npm run test
```

### Report Artifacts

Test results uploaded as artifacts:
- HTML report
- Screenshots
- Videos

## Performance Benchmarks

Monitor in test results:

- DNS lookup
- TCP connection
- TTFB (Time to First Byte)
- Content download
- DOM interactive time
- Full load time

## Troubleshooting

### Tests Timeout

- Increase timeout in config
- Check if dev servers are running
- Verify network connectivity

### MFE Not Loading

- Ensure all three dev servers running
- Check ports (3000, 3002, 3003)
- Verify remoteEntry.js accessible

### Flaky Tests

- Add explicit waits
- Use `waitForLoadState('networkidle')`
- Increase timeouts for remote loads

### Screenshot Issues

- Check `e2e/screenshots/` directory exists
- Verify write permissions

## Best Practices

1. **Use test data** — Don't hardcode selectors/values
2. **Wait explicitly** — Don't rely on timeouts
3. **Clean up** — Close pages/contexts
4. **Isolate tests** — No test dependencies
5. **Meaningful names** — Describe what's being tested
6. **Screenshot on fail** — For visual debugging
7. **Check console** — Catch errors early
8. **Performance metrics** — Track loading times

## Writing New Tests

### Template

```typescript
import { test, expect } from '../fixtures/test-setup';
import { TEST_DATA } from '../fixtures/test-data';

test('feature description', async ({ page, utils }) => {
  // 1. Navigate
  await utils.navigateTo(page, TEST_DATA.urls.services);

  // 2. Wait for load
  await utils.waitForSpinner(page);

  // 3. Interact
  const card = page.locator(TEST_DATA.selectors.serviceCard);
  await card.first().click();

  // 4. Assert
  await expect(page).toHaveURL(/\/services\//);

  // 5. Cleanup (automatic)
});
```

### Naming Convention

```
test('should [action] when [condition]', ...)
```

Example: `'should load services grid when navigating to /services'`

## Performance Targets

- Page load: < 3s
- MFE load: < 2s
- Button click response: < 500ms
- Form submission: < 1s

## Accessibility Testing

Tests verify:

- Page titles present
- Semantic HTML
- Proper ARIA labels
- Keyboard navigation
- Color contrast (manual audit)

## Reports

After running tests:

1. Open `playwright-report/` in browser
2. Review failed test screenshots
3. Check performance metrics
4. Analyze video recordings

## Contributing

When adding features:

1. Write tests first (TDD)
2. Make tests pass
3. Add documentation
4. Run full test suite
5. Commit with tests

## Links

- [Playwright Docs](https://playwright.dev)
- [API Reference](https://playwright.dev/docs/api/class-test)
- [Best Practices](https://playwright.dev/docs/best-practices)
