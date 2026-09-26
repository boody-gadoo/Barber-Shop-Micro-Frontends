/**
 * CloudWatch Synthetics Canaries
 * 
 * Automated synthetic monitoring to catch issues before users
 * Runs every 1 minute in production, 5 minutes in staging
 */

import https from 'https';

// Configuration
const CONFIG = {
  environment: process.env.ENVIRONMENT || 'staging',
  baseUrl: process.env.BASE_URL || 'https://barber-shop.com',
  timeouts: {
    default: 30000,      // 30 seconds
    pageLoad: 45000,     // 45 seconds
    api: 10000,          // 10 seconds
  },
  thresholds: {
    statusCode: 200,
    maxLatency: 3000,
    maxSize: 5000000,    // 5MB
  },
};

interface CanaryResult {
  name: string;
  status: 'PASSED' | 'FAILED';
  duration: number;
  error?: string;
  details?: Record<string, any>;
}

interface CanaryResponse {
  statusCode?: number;
  headers?: Record<string, string>;
  body?: string;
  duration: number;
}

/**
 * HTTP request helper
 */
async function makeRequest(
  url: string,
  options?: {
    method?: 'GET' | 'POST';
    body?: string;
    headers?: Record<string, string>;
    timeout?: number;
  },
): Promise<CanaryResponse> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const timeout = options?.timeout || CONFIG.timeouts.default;

    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const request = isHttps ? https.request : (require('http') as typeof import('http')).request;

    const req = request(
      {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname + urlObj.search,
        method: options?.method || 'GET',
        headers: {
          'User-Agent': 'CloudWatch-Synthetics/1.0',
          ...options?.headers,
        },
        timeout,
      },
      (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          const duration = Date.now() - startTime;

          resolve({
            statusCode: res.statusCode,
            headers: res.headers as Record<string, string>,
            body: data,
            duration,
          });
        });
      },
    );

    req.on('error', (error) => {
      const duration = Date.now() - startTime;
      reject({
        error: error.message,
        duration,
      });
    });

    req.on('timeout', () => {
      const duration = Date.now() - startTime;
      req.destroy();
      reject({
        error: `Request timeout after ${timeout}ms`,
        duration,
      });
    });

    if (options?.body) {
      req.write(options.body);
    }

    req.end();
  });
}

/**
 * Canary 1: Homepage Availability
 */
async function canaryHomepage(): Promise<CanaryResult> {
  const startTime = Date.now();

  try {
    const response = await makeRequest(`${CONFIG.baseUrl}/`, {
      timeout: CONFIG.timeouts.pageLoad,
    });

    const duration = Date.now() - startTime;

    if (response.statusCode !== 200) {
      return {
        name: 'Homepage Availability',
        status: 'FAILED',
        duration,
        error: `Expected status 200, got ${response.statusCode}`,
        details: {
          statusCode: response.statusCode,
          url: `${CONFIG.baseUrl}/`,
        },
      };
    }

    if (!response.body || response.body.length === 0) {
      return {
        name: 'Homepage Availability',
        status: 'FAILED',
        duration,
        error: 'Empty response body',
      };
    }

    if (!response.body.includes('<html') && !response.body.includes('<!doctype')) {
      return {
        name: 'Homepage Availability',
        status: 'FAILED',
        duration,
        error: 'Invalid HTML response',
        details: {
          bodyPreview: response.body.substring(0, 100),
        },
      };
    }

    return {
      name: 'Homepage Availability',
      status: 'PASSED',
      duration,
      details: {
        statusCode: response.statusCode,
        responseSize: response.body.length,
      },
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      name: 'Homepage Availability',
      status: 'FAILED',
      duration,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Canary 2: Health Check
 */
async function canaryHealthCheck(): Promise<CanaryResult> {
  const startTime = Date.now();

  try {
    const response = await makeRequest(`${CONFIG.baseUrl}/health`, {
      timeout: CONFIG.timeouts.api,
    });

    const duration = Date.now() - startTime;

    if (response.statusCode !== 200) {
      return {
        name: 'Health Check',
        status: 'FAILED',
        duration,
        error: `Expected status 200, got ${response.statusCode}`,
      };
    }

    let health;
    try {
      health = JSON.parse(response.body || '{}');
    } catch (e) {
      return {
        name: 'Health Check',
        status: 'FAILED',
        duration,
        error: 'Invalid JSON response',
      };
    }

    if (!health.status || health.status !== 'healthy') {
      return {
        name: 'Health Check',
        status: 'FAILED',
        duration,
        error: `Service not healthy: ${health.status}`,
        details: health,
      };
    }

    return {
      name: 'Health Check',
      status: 'PASSED',
      duration,
      details: health,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      name: 'Health Check',
      status: 'FAILED',
      duration,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Canary 3: API Services Endpoint
 */
async function canaryServicesAPI(): Promise<CanaryResult> {
  const startTime = Date.now();

  try {
    const response = await makeRequest(`${CONFIG.baseUrl}/api/services`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      timeout: CONFIG.timeouts.api,
    });

    const duration = Date.now() - startTime;

    if (response.statusCode !== 200) {
      return {
        name: 'Services API',
        status: 'FAILED',
        duration,
        error: `Expected status 200, got ${response.statusCode}`,
      };
    }

    if (duration > CONFIG.thresholds.maxLatency) {
      return {
        name: 'Services API',
        status: 'FAILED',
        duration,
        error: `API latency ${duration}ms exceeds threshold ${CONFIG.thresholds.maxLatency}ms`,
      };
    }

    let services;
    try {
      services = JSON.parse(response.body || '[]');
    } catch (e) {
      return {
        name: 'Services API',
        status: 'FAILED',
        duration,
        error: 'Invalid JSON response',
      };
    }

    if (!Array.isArray(services) || services.length === 0) {
      return {
        name: 'Services API',
        status: 'FAILED',
        duration,
        error: 'Empty or invalid services list',
        details: {
          servicesCount: Array.isArray(services) ? services.length : 'invalid',
        },
      };
    }

    return {
      name: 'Services API',
      status: 'PASSED',
      duration,
      details: {
        statusCode: response.statusCode,
        servicesCount: services.length,
        latency: duration,
      },
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      name: 'Services API',
      status: 'FAILED',
      duration,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Canary 4: Create Booking (POST)
 */
async function canaryBookingCreation(): Promise<CanaryResult> {
  const startTime = Date.now();

  const bookingData = {
    serviceId: 'service-1',
    barberId: 'barber-1',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    time: '10:00',
  };

  try {
    const response = await makeRequest(`${CONFIG.baseUrl}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(bookingData),
      timeout: CONFIG.timeouts.api,
    });

    const duration = Date.now() - startTime;

    if (response.statusCode !== 201 && response.statusCode !== 200) {
      return {
        name: 'Booking Creation',
        status: 'FAILED',
        duration,
        error: `Expected status 200/201, got ${response.statusCode}`,
        details: {
          statusCode: response.statusCode,
          response: response.body.substring(0, 200),
        },
      };
    }

    let booking;
    try {
      booking = JSON.parse(response.body || '{}');
    } catch (e) {
      return {
        name: 'Booking Creation',
        status: 'FAILED',
        duration,
        error: 'Invalid JSON response',
      };
    }

    if (!booking.id) {
      return {
        name: 'Booking Creation',
        status: 'FAILED',
        duration,
        error: 'Response missing booking ID',
        details: booking,
      };
    }

    return {
      name: 'Booking Creation',
      status: 'PASSED',
      duration,
      details: {
        statusCode: response.statusCode,
        bookingId: booking.id,
        latency: duration,
      },
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      name: 'Booking Creation',
      status: 'FAILED',
      duration,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Canary 5: CDN/Static Assets
 */
async function canaryStaticAssets(): Promise<CanaryResult> {
  const startTime = Date.now();

  try {
    const response = await makeRequest(`${CONFIG.baseUrl}/static/app.js`, {
      timeout: CONFIG.timeouts.api,
    });

    const duration = Date.now() - startTime;

    if (response.statusCode !== 200) {
      return {
        name: 'Static Assets',
        status: 'FAILED',
        duration,
        error: `Expected status 200, got ${response.statusCode}`,
      };
    }

    if (response.body.length === 0) {
      return {
        name: 'Static Assets',
        status: 'FAILED',
        duration,
        error: 'Empty response body',
      };
    }

    if (response.body.length > CONFIG.thresholds.maxSize) {
      return {
        name: 'Static Assets',
        status: 'FAILED',
        duration,
        error: `Asset size ${response.body.length} exceeds threshold ${CONFIG.thresholds.maxSize}`,
      };
    }

    const hasCache = response.headers['x-cache'] || response.headers['cache-control'];
    const isCached = hasCache && (hasCache.includes('Hit') || hasCache.includes('max-age'));

    return {
      name: 'Static Assets',
      status: 'PASSED',
      duration,
      details: {
        statusCode: response.statusCode,
        assetSize: response.body.length,
        cached: isCached,
        latency: duration,
      },
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      name: 'Static Assets',
      status: 'FAILED',
      duration,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Run all canaries
 */
async function runCanaries(): Promise<void> {
  const results: CanaryResult[] = [];

  console.log(`[${new Date().toISOString()}] Starting Canaries...`);

  // Run canaries
  results.push(await canaryHomepage());
  results.push(await canaryHealthCheck());
  results.push(await canaryServicesAPI());
  results.push(await canaryBookingCreation());
  results.push(await canaryStaticAssets());

  // Calculate summary
  const passed = results.filter((r) => r.status === 'PASSED').length;
  const failed = results.filter((r) => r.status === 'FAILED').length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`\n=== Canary Results (${CONFIG.environment}) ===`);
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`Total Duration: ${totalDuration}ms\n`);

  results.forEach((result) => {
    const status = result.status === 'PASSED' ? '✓' : '✗';
    console.log(`${status} ${result.name} (${result.duration}ms)`);

    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }

    if (result.details) {
      console.log(`  Details: ${JSON.stringify(result.details)}`);
    }
  });

  // CloudWatch metrics
  const passRate = (passed / results.length) * 100;
  console.log(`\nPass Rate: ${passRate.toFixed(1)}%`);

  // Exit with error if any canary failed
  if (failed > 0) {
    console.error(`\n❌ Canary execution failed: ${failed} canaries failed`);
    process.exit(1);
  }

  console.log(`\n✅ All canaries passed`);
  process.exit(0);
}

// Run canaries
runCanaries().catch((error) => {
  console.error('Canary execution error:', error);
  process.exit(1);
});
