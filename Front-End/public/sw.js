// Beautify Africa Progressive Web App Service Worker
// Version 1.0.0
const CACHE_NAME = 'beautify-africa-v1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
];

// Install: Pre-cache core application shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Precache incomplete:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: Purge obsolete caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event handler with strict API isolation & strategy routing
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. Never intercept non-GET requests (mutations, checkout, login, cart modifications)
  if (request.method !== 'GET') {
    return;
  }

  // 2. Never cache or intercept dynamic backend API requests or auth routes
  if (url.pathname.startsWith('/api') || url.pathname.includes('/auth/')) {
    return;
  }

  // 3. Ignore non-HTTP/HTTPS requests (browser extensions, etc.)
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // 4. HTML Navigation: Network-First with cached app shell fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          return caches.match('/index.html');
        })
    );
    return;
  }

  // 5. Static Assets (scripts, styles, fonts, images, webp, avif): Cache-First, fallback to Network
  const isStaticAsset =
    url.pathname.match(/\.(js|css|woff2|woff|ttf|svg|png|jpg|jpeg|webp|avif|gif|ico)$/i) ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        }).catch(() => {
          // Graceful fallback for offline images
          return new Response('', { status: 408, statusText: 'Offline' });
        });
      })
    );
  }
});
