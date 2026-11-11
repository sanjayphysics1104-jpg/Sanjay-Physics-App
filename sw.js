const CACHE_NAME = "sanjay-physics-v58-offline-pdf-corpus";
const APP_SHELL = ["./", "./index.html", "./style.css", "./script.js", "./api-config.js", "./ai-assistant.js", "./Sanjay_Physics_Assistant/knowledge-base.js", "./Sanjay_Physics_Assistant/academic-knowledge-12.json", "./Sanjay_Physics_Assistant/academic-db.js", "./Sanjay_Physics_Assistant/corpus-index.js", "./Sanjay_Physics_Assistant/offline-engine.js", "./Sanjay_Physics_Assistant/offline-ui.js", "./Sanjay_Physics_Assistant/pdf-index/manifest.json", "./Sanjay_Physics_Assistant/pdf-index/class-9.json", "./Sanjay_Physics_Assistant/pdf-index/class-10.json", "./Sanjay_Physics_Assistant/pdf-index/class-11.json", "./Sanjay_Physics_Assistant/pdf-index/class-12.json", "./manifest.json", "./assets/reference-sanjay-physics-logo.png", "./assets/reference-logo-192.png", "./assets/reference-logo-512.png"];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.pathname.startsWith("/api/")) return;
  if (requestUrl.pathname.endsWith("/api-config.js")) {
    event.respondWith(fetch(event.request).then(response => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      return response;
    }).catch(() => caches.match(event.request)));
    return;
  }
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      if (!response || (response.status !== 200 && response.type !== "opaque")) return response;
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      return response;
    }).catch(() => event.request.mode === "navigate" ? caches.match("./index.html") : undefined))
  );
});
