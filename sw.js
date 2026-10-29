/* Service worker CRA : fonctionne hors ligne. Ne touche QU'À ses propres caches (préfixe "cra-"). */
const VERSION = 'cra-v9';
const ASSETS = ['./', 'index.html', 'style.css', 'app.js', 'cra-xlsx.js', 'mail.js', 'config.js', 'lib/jszip.min.js', 'modele/CRA_izencia.xlsx',
  'manifest.json', 'confidentialite.html', 'conditions.html', 'mentions-legales.html', 'pages.css', 'fonts.css',
  'fonts/bricolage-grotesque-latin.woff2', 'fonts/bricolage-grotesque-latin-ext.woff2', 'fonts/jetbrains-mono-latin.woff2', 'fonts/jetbrains-mono-latin-ext.woff2', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((k) => k.startsWith('cra-') && k !== VERSION).map((k) => caches.delete(k))
  )).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  // fichiers de l'app : réseau d'abord (mises à jour immédiates) ; si le réseau ne répond pas
  // en 4 s ou échoue, version en cache. La réponse réseau tardive met quand même le cache à jour.
  let copy = null;
  const net = fetch(req).then((res) => { if (res.ok) copy = res.clone(); return res; });
  // uniquement NOTRE cache de version : l'origine est partagée avec d'autres dépôts, caches.match() global lirait aussi les leurs
  const cached = () => caches.open(VERSION).then((c) => c.match(req, { ignoreSearch: true }).then((r) => r || (req.mode === 'navigate' ? c.match('index.html') : undefined)));
  e.respondWith(new Promise((resolve) => {
    let done = false;
    const finish = (r) => { if (!done && r) { done = true; resolve(r); } };
    const timer = setTimeout(() => cached().then(finish), 4000);
    net.then((r) => { clearTimeout(timer); finish(r); })
      .catch(() => { clearTimeout(timer); cached().then((r) => { if (r) finish(r); else if (!done) { done = true; resolve(Response.error()); } }); });
  }));
  e.waitUntil(net.then(() => copy && caches.open(VERSION).then((c) => c.put(req, copy))).catch(() => {}));
});
