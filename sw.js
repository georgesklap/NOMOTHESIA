// Service worker: η εφαρμογή δουλεύει offline.
// Όταν αλλάζεις data.js ή index.html, ανέβασε κατά 1 τον αριθμό VERSION.
const VERSION = 'yef-v1';
const CORE = ['./', 'index.html', 'data.js', 'manifest.json', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const isPdf = req.url.toLowerCase().endsWith('.pdf');
  if (isPdf) {
    // PDF: από την cache αν υπάρχει, αλλιώς από το δίκτυο και αποθήκευση
    e.respondWith(caches.open(VERSION).then(c => c.match(req).then(hit => hit || fetch(req).then(r => {
      if (r.ok) c.put(req, r.clone());
      return r;
    }))));
    return;
  }
  // Υπόλοιπα: δίκτυο πρώτα (για ενημερώσεις), αλλιώς cache
  e.respondWith(fetch(req).then(r => {
    if (r.ok) { const cp = r.clone(); caches.open(VERSION).then(c => c.put(req, cp)); }
    return r;
  }).catch(() => caches.match(req, {ignoreSearch: true}).then(r => r || caches.match('index.html'))));
});
