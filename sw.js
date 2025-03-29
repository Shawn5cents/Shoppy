const CACHE_VERSION = '1.0.0';
const CACHE_NAME = `shoppy-${CACHE_VERSION}`;

const ASSETS = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  './dist/output.css',
  './icons/icon-192.svg',
  './sw.js'
];

// Install service worker and cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
  // Activate worker immediately
  self.skipWaiting();
});

// Serve cached content when offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // Return cached response if found
      if (response) {
        return response;
      }
      // Clone the request because it can only be used once
      const fetchRequest = event.request.clone();

      return fetch(fetchRequest).then(response => {
        // Check if we received a valid response
        // For CSS, explicitly check the Content-Type header if possible
        const contentType = response.headers.get('content-type');
        if (!response || response.status !== 200 || (contentType && !contentType.includes('text/css') && event.request.url.endsWith('.css'))) {
           // Don't cache invalid responses or non-CSS files served for .css requests
           console.warn(`SW: Not caching ${event.request.url} - Status: ${response.status}, Type: ${contentType}`);
           return response;
        }
        // Also ensure we only cache 'basic' type responses (same-origin) to avoid opaque responses
        if (response.type !== 'basic') {
             console.warn(`SW: Not caching non-basic response for ${event.request.url}`);
             return response;
        }

        // Clone the response because it can only be used once
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});

// Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    })
  );
  // Take control of all clients immediately
  event.waitUntil(clients.claim());
});