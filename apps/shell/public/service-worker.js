/**
 * Service Worker for Barber Shop MFE
 * 
 * Provides:
 * - Offline support with cache-first strategy
 * - Asset caching with versioning
 * - Network requests optimization
 * - Background sync for offline actions
 */

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `barber-shop-cache-${CACHE_VERSION}`;
const RUNTIME_CACHE = `barber-shop-runtime-${CACHE_VERSION}`;
const API_CACHE = `barber-shop-api-${CACHE_VERSION}`;

// Assets to precache on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/js/main.js',
  '/css/main.css',
];

/**
 * Install: Cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Precaching assets');
        return cache.addAll(PRECACHE_URLS).catch((err) => {
          console.warn('[Service Worker] Precache failed:', err);
          // Continue even if precache fails
        });
      })
      .then(() => self.skipWaiting()),
  );
});

/**
 * Activate: Clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (
            cacheName !== CACHE_NAME &&
            cacheName !== RUNTIME_CACHE &&
            cacheName !== API_CACHE
          ) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        }),
      );
    }).then(() => self.clients.claim()),
  );
});

/**
 * Fetch: Network-first with fallback to cache
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Handle API requests: network-first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    return event.respondWith(
      networkFirstStrategy(request, API_CACHE),
    );
  }

  // Handle static assets: cache-first, fallback to network
  if (isStaticAsset(request)) {
    return event.respondWith(
      cacheFirstStrategy(request, CACHE_NAME),
    );
  }

  // Handle HTML documents: network-first, fallback to cache
  if (request.mode === 'navigate') {
    return event.respondWith(
      networkFirstStrategy(request, RUNTIME_CACHE),
    );
  }

  // Default: network-first
  event.respondWith(
    networkFirstStrategy(request, RUNTIME_CACHE),
  );
});

/**
 * Network-first strategy: Try network, fallback to cache
 */
async function networkFirstStrategy(request, cacheName) {
  try {
    const response = await fetch(request);

    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log('[Service Worker] Network failed, using cache:', request.url);

    // Return from cache if network fails
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline fallback
    return createOfflineFallback(request);
  }
}

/**
 * Cache-first strategy: Try cache first, fallback to network
 */
async function cacheFirstStrategy(request, cacheName) {
  try {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Fetch from network if not in cache
    const response = await fetch(request);

    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log('[Service Worker] Cache and network failed:', request.url);
    return createOfflineFallback(request);
  }
}

/**
 * Check if request is for a static asset
 */
function isStaticAsset(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  return (
    /\.(js|css|woff2|woff|ttf|eot|png|jpg|jpeg|gif|svg|webp)(\?.*)?$/.test(path) ||
    path.includes('/assets/')
  );
}

/**
 * Create offline fallback response
 */
function createOfflineFallback(request) {
  if (request.destination === 'image') {
    return new Response(
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#f0f0f0" width="100" height="100"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999" font-size="12">Offline</text></svg>',
      {
        headers: { 'Content-Type': 'image/svg+xml' },
      },
    );
  }

  if (request.mode === 'navigate') {
    return caches.match('/index.html');
  }

  return new Response('Offline', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: new Headers({
      'Content-Type': 'text/plain',
    }),
  });
}

/**
 * Background sync: Queue offline actions
 */
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);

  if (event.tag === 'sync-booking') {
    event.waitUntil(syncBooking());
  }

  if (event.tag === 'sync-analytics') {
    event.waitUntil(syncAnalytics());
  }
});

/**
 * Sync booking data when online
 */
async function syncBooking() {
  try {
    console.log('[Service Worker] Syncing booking data');
    // Query IndexedDB for pending bookings and sync them
    const response = await fetch('/api/bookings/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.ok) {
      console.log('[Service Worker] Booking sync successful');
    }
  } catch (error) {
    console.error('[Service Worker] Booking sync failed:', error);
    throw error; // Retry the sync
  }
}

/**
 * Sync analytics events when online
 */
async function syncAnalytics() {
  try {
    console.log('[Service Worker] Syncing analytics events');
    // Query IndexedDB for pending events and sync them
    const response = await fetch('/api/analytics/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.ok) {
      console.log('[Service Worker] Analytics sync successful');
    }
  } catch (error) {
    console.error('[Service Worker] Analytics sync failed:', error);
    throw error; // Retry the sync
  }
}
