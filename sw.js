const CACHE = 'spritpreise-v4';

self.addEventListener('install', e => {
  // Nur Icons cachen, KEIN HTML
  e.waitUntil(
    caches.open(CACHE).then(c =>
      c.addAll(['./icon-192.png', './icon-512.png', './manifest.json'])
       .catch(() => {}) // Fehler ignorieren falls Icons fehlen
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // API-Aufrufe: immer Netzwerk
  if (e.request.url.includes('tankerkoenig.de')) return;

  // HTML: NIEMALS cachen – immer frisch laden
  if (e.request.destination === 'document') {
    e.respondWith(fetch(e.request, { cache: 'no-store' }));
    return;
  }

  // Icons & Manifest: Cache first
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
