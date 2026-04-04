const CACHE = 'spritpreise-v1';
const OFFLINE_URLS = ['./index.html', './manifest.json', './icon-192.svg'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(OFFLINE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // TankerKönig API – always network, never cache (live prices)
  if (e.request.url.includes('tankerkoenig.de')) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Cache successful page fetches
        if (res.ok && e.request.destination === 'document') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
