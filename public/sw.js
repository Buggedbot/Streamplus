// Minimal service worker: enables installability and a graceful offline
// fallback for navigations. Deliberately does NOT cache app assets, API
// responses, uploads, or the socket — avoids serving stale builds.
const OFFLINE_URL = "/offline.html";
const CACHE = "streamplus-shell-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll([OFFLINE_URL]))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  // Only handle top-level navigations; let everything else hit the network.
  if (request.mode !== "navigate") return;
  event.respondWith(
    fetch(request).catch(() => caches.match(OFFLINE_URL))
  );
});
