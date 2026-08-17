const CACHE_NAME = 'bcv-calc-v24';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap'
];

// Install: cache static assets
self.addEventListener('install', (evt) => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (evt) => {
  evt.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first for Google Sheets, cache-first for static assets
self.addEventListener('fetch', (evt) => {
  const url = evt.request.url;

  // Ignorar peticiones a Google Sheets para que el navegador maneje el JSONP nativamente sin interferencias
  if (url.includes('docs.google.com') || url.includes('sheets.googleapis.com')) {
    return;
  }

  // For fonts: cache-first
  if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
    evt.respondWith(
      caches.match(evt.request).then(cached => cached || fetch(evt.request))
    );
    return;
  }

  // For app assets: cache-first with network fallback
  evt.respondWith(
    caches.match(evt.request).then(cached => {
      if (cached) return cached;
      return fetch(evt.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(evt.request, clone));
        }
        return response;
      });
    })
  );
});
