const CACHE = 'spritpreise-v3';
const OFFLINE_URLS = ['./index.html', './manifest.json', './icon-192.svg'];

// Installation: ALLE alten Caches löschen, neu aufbauen
self.addEventListener('install', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    ).then(() =>
      caches.open(CACHE).then(c => c.addAll(OFFLINE_URLS))
    )
  );
  self.skipWaiting();
});

// Aktivierung: sofort alle Tabs übernehmen
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // TankerKönig API – immer Netzwerk, nie cachen
  if (e.request.url.includes('tankerkoenig.de')) return;

  if (e.request.destination === 'document') {
    // HTML: immer frisch vom Netzwerk
    e.respondWith(
      fetch(e.request, { cache: 'no-store' })
        .then(res => {
          if (res.ok) {
            caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          }
          return res;
        })
        .catch(() =>
          caches.match(e.request).then(r => r || caches.match('./index.html'))
        )
    );
  } else {
    // Icons, Fonts etc.: Cache zuerst
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request))
    );
  }
});
