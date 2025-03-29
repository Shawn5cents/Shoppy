const CACHE_VERSION = '1.0.2';
const CACHE_NAME = `shoppy-${CACHE_VERSION}`;

const CRITICAL_ASSETS = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  './icons/icon-192.svg',
  './sw.js',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

const CSS_ASSETS = [
  './static/css/output.css'
];

async function preCache() {
  const cache = await caches.open(CACHE_NAME);
  
  // Cache critical assets
  for (const asset of CRITICAL_ASSETS) {
    try {
      const response = await fetch(asset, { mode: 'no-cors' });
      if (response.ok || response.type === 'opaque') {
        await cache.put(asset, response);
      }
    } catch (error) {
      console.warn(`Failed to cache asset: ${asset}`, error);
    }
  }
  
  // Handle CSS separately with proper content type verification
  for (const cssPath of CSS_ASSETS) {
    try {
      const response = await fetch(cssPath);
      const contentType = response.headers.get('content-type');
      
      if (response.ok && contentType && contentType.includes('text/css')) {
        await cache.put(cssPath, response);
      } else {
        console.warn(`Failed to cache CSS: ${cssPath} - Invalid content type: ${contentType}`);
      }
    } catch (error) {
      console.error(`Failed to fetch CSS: ${cssPath}`, error);
    }
  }
}

// Install service worker and cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      preCache(),
      self.skipWaiting()
    ])
  );
});

// Serve cached content when offline
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Handle API calls differently
  if (event.request.url.includes('nominatim.openstreetmap.org')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => new Response('{"error": "Offline"}', {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(async response => {
      if (response) {
        return response;
      }

      try {
        const fetchRequest = event.request.clone();
        const fetchResponse = await fetch(fetchRequest);
        
        // Don't cache non-successful responses
        if (!fetchResponse || fetchResponse.status !== 200) {
          return fetchResponse;
        }

        // Handle CSS files specially
        if (event.request.url.endsWith('.css')) {
          const contentType = fetchResponse.headers.get('content-type');
          if (!contentType || !contentType.includes('text/css')) {
            console.warn(`SW: Invalid CSS content type for ${event.request.url}`);
            return fetchResponse;
          }
        }

        // Cache successful responses for non-API calls
        if (!event.request.url.includes('nominatim.openstreetmap.org')) {
          const responseToCache = fetchResponse.clone();
          const cache = await caches.open(CACHE_NAME);
          await cache.put(event.request, responseToCache);
        }

        return fetchResponse;
      } catch (error) {
        console.error('SW: Fetch failed:', error);
        return response || new Response('Network error', { status: 503 });
      }
    })
  );
});

// Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(keys => {
        return Promise.all(
          keys
            .filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
        );
      }),
      clients.claim() // Take control of all clients immediately
    ])
  );
});
