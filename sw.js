/* Service worker di Contabilità Personale: permette di aprire l'app anche offline.
   - pagina (index.html): prima la rete, così gli aggiornamenti arrivano subito; senza rete la copia salvata;
   - librerie (React, Babel, Firebase, grafici…): prima la copia salvata, aggiornata in background;
   - database e login Firebase non passano di qui: li gestisce l'SDK. */
const CACHE = 'contpersonal-v1';
const ESCLUSI = /firebaseio\.com|firebasedatabase\.app|identitytoolkit\.googleapis\.com|securetoken\.googleapis\.com|www\.googleapis\.com|workers\.dev|borsaitaliana/;

self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('contpersonal-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (ESCLUSI.test(url.hostname)) return;
  const salva = (r) => { if (r && (r.ok || r.type === 'opaque')) { const c = r.clone(); caches.open(CACHE).then(ca => ca.put(req, c)); } return r; };
  if (req.mode === 'navigate' || url.origin === self.location.origin) {
    e.respondWith(fetch(req).then(salva).catch(() =>
      caches.match(req, { ignoreSearch: true })
        .then(r => r || caches.match('./', { ignoreSearch: true }))
        .then(r => r || caches.match('index.html', { ignoreSearch: true }))));
    return;
  }
  e.respondWith(caches.match(req).then(hit => {
    const net = fetch(req).then(salva).catch(() => hit);
    return hit || net;
  }));
});
