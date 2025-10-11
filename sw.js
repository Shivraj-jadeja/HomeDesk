// sw.js
const CACHE = 'homedesk-lite-v8';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './sw.js',
  './vis-network.min.js',
  './styles.css',
  './galaxy.css',
  './js/galaxy.global.js',
  './js/app.js',
  './js/graph.js',
  './js/ui.js',
  './js/data.js',
  './js/files.js',
  './js/voice.js',
  './icon-512.png'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first strategy
self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE).then((cache) => cache.put(e.request, resClone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
