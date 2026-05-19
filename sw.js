var CACHE = 'rudranil-v25';
var FILES = ['./index.html', './style.css', './app.js'];

self.addEventListener('install', function(e) {
  e.waitUntil(caches.open(CACHE).then(function(cache) { return cache.addAll(FILES); }));
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(caches.keys().then(function(keys) {
    return Promise.all(keys.filter(function(k) { return k !== CACHE; }).map(function(k) { return caches.delete(k); }));
  }));
  self.clients.claim();
});

// Network-first strategy: always try fresh code, fall back to cache offline
self.addEventListener('fetch', function(e) {
  e.respondWith(
    fetch(e.request).then(function(networkResponse) {
      // Update cache with fresh response
      if (networkResponse && networkResponse.status === 200) {
        var responseClone = networkResponse.clone();
        caches.open(CACHE).then(function(cache) {
          cache.put(e.request, responseClone);
        });
      }
      return networkResponse;
    }).catch(function() {
      // Offline: serve from cache
      return caches.match(e.request);
    })
  );
});
