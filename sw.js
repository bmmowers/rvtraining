// Lead Hub Service Worker - basic cache-first strategy
const CACHE_NAME = 'lead-hub-v1';
const PRECACHE = [
  '/',
  '/index.html',
  '/talks/index.html',
  '/pages/sops.html',
  '/pages/contacts.html'
];

// Install: cache core shell
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for local assets, network-first for external (Forms, etc.)
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Let external requests (MS Forms, etc.) go straight to network
  if (url.origin !== location.origin) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        // Cache successful GET requests
        if (response.ok && e.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      });
    }).catch(() => caches.match('/index.html'))
  );
});
