/* Studeo: service worker. Guarda la app para que abra sin internet.
   Los datos (eventos, apuntes) NO pasan por acá: viven en el almacenamiento del navegador.
   YouTube y Supabase siempre van a la red. */
const CACHE = 'studeo-16e2de7102';
const APP = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(APP)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith('studeo-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // La página: primero la red (para tener siempre la última versión); sin conexión, la copia guardada
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req)
      .then(r => { if (r.ok) { const copia = r.clone(); caches.open(CACHE).then(c => c.put('./index.html', copia)); } return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  // Íconos y manifiesto: de la copia guardada, y si no está, de la red
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(r => r || fetch(req)));
});
