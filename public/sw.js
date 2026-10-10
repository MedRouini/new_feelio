// Feelio service worker (ARCHITECTURE §5.5). Caches only non-personal static files: built art, code,
// fonts and sounds. API calls and pages are never cached, so no child data is stored on the device by
// this worker. When a page can't load (offline), it shows the cached offline screen.
const VERSION = "feelio-v1";
const STATIC = /^\/(generated|sounds|audio|_next\/static)\//;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.add("/offline")).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return; // network only

  if (STATIC.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
        return res;
      })),
    );
    return;
  }
  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => caches.match("/offline")));
  }
});
