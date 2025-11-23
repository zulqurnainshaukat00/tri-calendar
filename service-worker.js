const VERSION='tri-cal-v8';
const ASSETS=[
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon-180.png'
];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(VERSION).then(c=>c.addAll(ASSETS)));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>k!==VERSION?caches.delete(k):null))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET') return;
  e.respondWith(
    caches.match(req).then(cached=>{
      if(cached) return cached;
      return fetch(req).then(res=>{
        try{if(res && res.status===200 && res.type==='basic'){const copy=res.clone();caches.open(VERSION).then(c=>c.put(req,copy));}}catch{}
        return res;
      }).catch(()=>{
        if(req.mode==='navigate'||(req.headers.get('accept')||'').includes('text/html')) return caches.match('./index.html');
        return new Response('',{status:504,statusText:'Offline'});
      });
    })
  );
});
self.addEventListener('message',e=>{});
