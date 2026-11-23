// ════════════════════════════════════════════════════════════════════
// TempClean — Service Worker
// ⚠️ Change VERSION à chaque déploiement → force la MàJ sur tous les appareils
// ════════════════════════════════════════════════════════════════════

const VERSION = 'v2.2.0'; // ← INCRÉMENTER À CHAQUE PUSH (v2.0.1, v2.1.0...)
const CACHE_NAME = 'tempclean-' + VERSION;

const ASSETS = [
  './',
  './index.html',
  './logo.png'
];

// ── Install : mise en cache ───────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.all(ASSETS.map(url => cache.add(url).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

// ── Activate : supprime les ANCIENS caches (dont tempclean-v1) ────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch : Network First ─────────────────────────────────────────
// Réseau en priorité → toujours la version la plus récente
// Fallback cache uniquement si hors-ligne
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = event.request.url;
  if (url.includes('script.google.com') || url.includes('googleapis.com')) return;

  event.respondWith(
    fetch(event.request)
      .then(resp => {
        if (resp && resp.status === 200 && new URL(url).origin === self.location.origin) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return resp;
      })
      .catch(() => caches.match(event.request))
  );
});

// ── Message depuis l'app (bouton "Mettre à jour") ─────────────────
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
