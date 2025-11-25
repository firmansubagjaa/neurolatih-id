const CACHE_NAME = 'neurolatih-8bit-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
  // Note: Build tools usually inject hashed JS/CSS filenames here.
  // In a raw setup, we cache the root and let the browser cache strategy handle specific bundles.
];

// Install Event: Cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[PWA] Caching App Shell');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[PWA] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event: Serve from cache, fall back to network
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests (like Google Fonts or CDN) from strictly caching 
  // unless we want to implement specific strategies for them.
  // For this app, we use Stale-While-Revalidate logic for the app itself.

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached response if found
      if (cachedResponse) {
        return cachedResponse;
      }

      // Otherwise fetch from network
      return fetch(event.request).then((networkResponse) => {
        // Check if we received a valid response
        if (
          !networkResponse ||
          networkResponse.status !== 200 ||
          networkResponse.type !== 'basic'
        ) {
          return networkResponse;
        }

        // Clone the response because it's a stream and can only be consumed once
        const responseToCache = networkResponse.clone();

        caches.open(CACHE_NAME).then((cache) => {
          // Cache the new resource for future use
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      });
    })
  );
});