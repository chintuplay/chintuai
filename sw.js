// Chintu AI service worker: makes the app itself open with no internet.
// AI models are cached separately by the engine, so they are not handled here.
const V = "ca-v7";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./privacy.html"];
const CDN = /(^|\.)cdn\.jsdelivr\.net$|^cdnjs\.cloudflare\.com$|^fonts\.(googleapis|gstatic)\.com$/;

self.addEventListener("install", e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("ca-") && k !== V).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const u = new URL(e.request.url);
  const put = r => { if (r.ok) { const c = r.clone(); caches.open(V).then(x => x.put(e.request, c)); } return r; };
  if (u.origin === location.origin) {
    // App files: try the network first so updates arrive, fall back to the saved copy.
    e.respondWith(fetch(e.request).then(put).catch(() =>
      caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match("./index.html"))));
  } else if (CDN.test(u.hostname)) {
    // Engine code and fonts: versioned URLs never change, so use the saved copy first.
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(put)));
  }
});
