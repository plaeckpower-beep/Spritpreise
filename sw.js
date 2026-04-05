const CACHE = 'spritpreise-v2';
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
  // TankerKönig API – immer Netzwerk, nie cachen
  if (e.request.url.includes('tankerkoenig.de')) return;

  if (e.request.destination === 'document') {
    // HTML-Seiten: Netzwerk zuerst, Cache als Fallback
    e.respondWith(
      fetch(e.request, { cache: 'no-store' })
        .then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
    );
  } else {
    // Andere Assets (Icons etc.): Cache zuerst
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request))
    );
  }
});

// App in den Vordergrund → alle Tabs/Fenster neu laden
self.addEventListener('message', e => {
  if (e.data === 'reload') {
    self.clients.matchAll({ type: 'window' }).then(clients => {
      clients.forEach(c => c.navigate(c.url));
    });
  }
});
