const CACHE = 'angela-tracker-v1';
const SHELL = ['./angela.html', './angela-manifest.json',
  './angela-icon-192.png', './angela-icon-512.png', './angela-icon-maskable-512.png'];

// Save the app files. One missing file never blocks the rest.
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isFont = url.hostname.endsWith('googleapis.com') || url.hostname.endsWith('gstatic.com');
  const isOwn = url.origin === location.origin;
  if (!isFont && !isOwn) return;

  e.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(req, {ignoreSearch: true}).then(hit => {
        const net = fetch(req).then(res => {
          if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
          return res;
        }).catch(() => hit || (req.mode === 'navigate' ? cache.match('./angela.html') : undefined));
        return hit || net;
      })
    )
  );
});
