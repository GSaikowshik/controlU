const CACHE_NAME = 'controlu-pwa-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json',
  '/icons.svg'
];

// Install Event - Pre-cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching Core Shell Assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clear old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Cleaning Old Cache', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Stale-While-Revalidate caching model
self.addEventListener('fetch', (event) => {
  // We only cache GET requests
  if (event.request.method !== 'GET') return;

  // Do not intercept or cache FastAPI REST endpoints
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Serve cached resource immediately and trigger network fetch in background to refresh cache
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
            }
          })
          .catch(() => { /* Silent offline fallback */ });
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          // Cache successful static requests dynamically
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Offline fallback for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
    })
  );
});
