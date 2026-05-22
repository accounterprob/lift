const CACHE_VERSION = 'lift-v25';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './manifest.webmanifest',
  './icons/icon.svg',
  './src/main.js',
  './src/state.js',
  './src/db.js',
  './src/seed.js',
  './src/backup.js',
  './src/utils.js',
  './src/views/workout.js',
  './src/views/exercises.js',
  './src/views/progress.js',
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
