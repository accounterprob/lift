// TEMPLATE — do not edit service-worker.js directly; edit this file and run
// `npm run build`, which stamps the content-hash cache version and the
// precache list into the two declarations below and writes service-worker.js.
const CACHE_VERSION = 'lift-3b34f2dc2324';
const ASSETS = [
  "./",
  "./index.html",
  "./dist/app.js",
  "./dist/app.css",
  "./manifest.webmanifest",
  "./icons/icon.svg"
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      // {cache: 'reload'} bypasses the browser HTTP cache so the SW always
      // grabs the freshest version of each asset from the server on install.
      cache.addAll(ASSETS.map((url) => new Request(url, { cache: 'reload' })))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        // Cache new GET requests under our origin
        if (res.ok && new URL(req.url).origin === location.origin) {
          const clone = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, clone));
        }
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
