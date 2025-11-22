const CACHE_NAME = 'tri-cal-v2-farming';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => {
      if (k !== CACHE_NAME) return caches.delete(k);
    })))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then(resp => resp || fetch(e.request).then(networkResp => {
      if (e.request.method === 'GET' && networkResp && networkResp.status === 200){
        const clone = networkResp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
      }
      return networkResp;
    }).catch(() => caches.match('./index.html')))
  );
});
