const cacheName = "spa-app-cache-v2"; // updated cache version
const assetsToCache = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./icons/spa-icon-192.png",
  "./icons/spa-icon-512.png"
];

// Install Event - cache all assets
self.addEventListener("install", event => {
  console.log("Service Worker installing...");
  event.waitUntil(
    caches.open(cacheName).then(cache => {
      console.log("Caching app assets...");
      return cache.addAll(assetsToCache);
    })
  );
});

// Activate Event - cleanup old caches
self.addEventListener("activate", event => {
  console.log("Service Worker activating...");
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== cacheName) {
            console.log("Removing old cache:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch Event - respond with cache first, then network
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).then(networkResponse => {
        // Optional: cache new requests dynamically
        return caches.open(cacheName).then(cache => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      }).catch(() => {
        // Optional fallback if offline and asset not cached
        if (event.request.mode === "navigate") {
          return caches.match("./index.html");
        }
      });
    })
  );
});
