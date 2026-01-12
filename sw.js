const cacheName = 'spa-app-cache-v2';
const assetsToCache = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icons/spa-icon-192.png',
  './icons/spa-icon-512.png'
];

// INSTALL SERVICE WORKER & CACHE ASSETS
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(cacheName).then(cache => cache.addAll(assetsToCache))
  );
  self.skipWaiting();
});

// ACTIVATE SERVICE WORKER & CLEAN OLD CACHE
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== cacheName) return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

// FETCH: SERVE FROM CACHE, FALLBACK TO NETWORK
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).catch(() => {
        // Optional: fallback for offline
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
