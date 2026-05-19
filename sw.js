const CACHE_NAME = 'chronicle-rss-v3';

// Core local application assets to cache for offline load
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './sw.js'
];

// Install Event: Cache local assets and skip waiting state immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Clear out older caching versions and claim clients instantly
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Implement Network-First with Cache Fallback for local assets
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // 1. Bypass Service Worker cache completely for external dynamic RSS feeds & JSON converter APIs
  if (!requestUrl.origin.includes(self.location.hostname)) {
    return; // Network-Only (Let browser handle it normally)
  }

  // 2. Network-First strategy for local application assets (index.html, manifest, styles, icons, fonts)
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Save a clone of the fresh asset into cache
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Fall back to cache if network is unavailable (offline mode)
        return caches.match(event.request);
      })
  );
});
