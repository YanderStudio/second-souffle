// Service worker minimal de Second Souffle.
// - /api/ n'est JAMAIS mis en cache : le classement, les déblocages et les scores viennent toujours du serveur.
// - Pages : réseau d'abord (une nouvelle version est prise tout de suite), cache si hors ligne.
// - Fichiers du jeu (scripts, styles, images, polices, .wasm) : cache d'abord, puis réseau.
// Changer VERSION vide les anciens caches à la prochaine visite.

const VERSION = 'second-souffle-v2';
const DEMARRAGE = ['/', '/manifest.webmanifest', '/assets/icons/pwa/icon-192.png', '/assets/icons/pwa/icon-512.png'];

self.addEventListener('install', (evenement) => {
  evenement.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(DEMARRAGE)));
  self.skipWaiting();
});

self.addEventListener('activate', (evenement) => {
  evenement.waitUntil(
    caches
      .keys()
      .then((cles) => Promise.all(cles.filter((cle) => cle !== VERSION).map((cle) => caches.delete(cle))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (evenement) => {
  const requete = evenement.request;
  const url = new URL(requete.url);

  // Hors du jeu, autre méthode que GET, ou API : le navigateur s'en charge, rien n'est mis en cache
  if (requete.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  if (requete.mode === 'navigate') {
    evenement.respondWith(
      fetch(requete)
        .then((reponse) => {
          garder(requete, reponse.clone());
          return reponse;
        })
        .catch(() => caches.match(requete).then((r) => r ?? caches.match('/'))),
    );
    return;
  }

  evenement.respondWith(
    caches.match(requete).then(
      (enCache) =>
        enCache ??
        fetch(requete).then((reponse) => {
          garder(requete, reponse.clone());
          return reponse;
        }),
    ),
  );
});

/** Met une réponse correcte du jeu en cache (jamais une erreur). */
function garder(requete, reponse) {
  if (reponse.ok && reponse.type === 'basic') {
    caches.open(VERSION).then((cache) => cache.put(requete, reponse));
  }
}
