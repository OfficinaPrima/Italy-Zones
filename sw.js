const CACHE = 'italy-zones-v2';

function cached(req) {
  return caches.match(req, { ignoreSearch: true })
    .then(m => m || caches.match('./index.html'))
    .then(m => m || caches.match('./'));
}

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled([c.add('./index.html'), c.add('./'), c.add('./icon.png')]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request)
      .then(r => {
        if (r.ok) {
          const copy = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
          return r;
        }
        // Server answered but not with the real page (404 etc.) — serve the saved copy.
        return cached(e.request).then(m => m || r);
      })
      .catch(() => cached(e.request))
  );
});
