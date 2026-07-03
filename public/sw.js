// sw.js — offline support. The whole game is client-side (story file included),
// so once you've loaded it, it plays without a network — perfect grue territory.
// Strategy: network-first for navigations (deploys propagate immediately),
// cache-first for everything else (vite hashes assets; game data is static).
const V = "zork-v1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;

  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request)
        .then((r) => { const c = r.clone(); caches.open(V).then((ca) => ca.put(e.request, c)); return r; })
        .catch(() => caches.match(e.request).then((m) => m || caches.match("./"))),
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then((hit) => {
      const net = fetch(e.request)
        .then((r) => { if (r.ok) { const c = r.clone(); caches.open(V).then((ca) => ca.put(e.request, c)); } return r; })
        .catch(() => hit);
      return hit || net;
    }),
  );
});
