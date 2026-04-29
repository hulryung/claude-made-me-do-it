// claude-made-me-do-it — service worker
// Network-first for HTML so updates show up; cache-first for static assets.

const CACHE = 'cmmdi-v1';
const ASSETS = [
  './',
  './index.html',
  './clean.js',
  './favicon.svg',
  './manifest.webmanifest'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE)
      .then(function (cache) { return cache.addAll(ASSETS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(
          keys.filter(function (k) { return k !== CACHE; })
              .map(function (k) { return caches.delete(k); })
        );
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;
  var url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  var isHTML =
    event.request.mode === 'navigate' ||
    (event.request.headers.get('accept') || '').indexOf('text/html') !== -1 ||
    url.pathname.endsWith('.html');

  if (isHTML) {
    event.respondWith(
      fetch(event.request)
        .then(function (res) {
          var clone = res.clone();
          caches.open(CACHE).then(function (c) { c.put(event.request, clone); });
          return res;
        })
        .catch(function () {
          return caches.match(event.request)
            .then(function (r) { return r || caches.match('./index.html'); });
        })
    );
  } else {
    event.respondWith(
      caches.match(event.request).then(function (r) { return r || fetch(event.request); })
    );
  }
});
