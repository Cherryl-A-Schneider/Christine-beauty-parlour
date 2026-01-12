const CACHE_NAME = 'spa-app-cache-v2'; // update version to bust old cache
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css', // or use style-v2.css if you versioned
  './app.js',
  './manifest.json',
  './icons/spa-icon-192.png',
  './icons/spa-icon-512.png'
];

// Install event — cache all assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate event — clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      )
    )
  );
  return self.clients.claim();
});

// Fetch event — serve cached assets, fallback to network, always update cache
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return; // only cache GET requests
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request).then(networkResponse => {
        if(networkResponse && networkResponse.status === 200){
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
          });
        }
        return networkResponse.clone();
      }).catch(() => cachedResponse); // fallback to cache if offline

      return cachedResponse || fetchPromise;
    })
  );
});
