const CACHE_NAME = "sanjay-physics-v60-cross-device-install";
const CORE_SHELL = ["./", "./index.html", "./style.css", "./script.js", "./api-config.js", "./ai-assistant.js", "./Sanjay_Physics_Assistant/knowledge-base.js", "./Sanjay_Physics_Assistant/academic-db.js", "./Sanjay_Physics_Assistant/corpus-index.js", "./Sanjay_Physics_Assistant/offline-engine.js", "./Sanjay_Physics_Assistant/offline-ui.js", "./manifest.json", "./assets/reference-sanjay-physics-logo.png", "./assets/reference-logo-192.png", "./assets/reference-logo-512.png"];
const OFFLINE_CORPUS = ["./Sanjay_Physics_Assistant/academic-knowledge-12.json", "./Sanjay_Physics_Assistant/pdf-index/manifest.json", "./Sanjay_Physics_Assistant/pdf-index/class-9.json", "./Sanjay_Physics_Assistant/pdf-index/class-10.json", "./Sanjay_Physics_Assistant/pdf-index/class-11.json", "./Sanjay_Physics_Assistant/pdf-index/class-12.json"];
const APP_SHELL = [...CORE_SHELL, ...OFFLINE_CORPUS];
const SHELL_URLS = new Set(APP_SHELL.map(path => new URL(path, self.registration.scope).href));
const SHELL_PATHS = new Map([...SHELL_URLS].map(url => [new URL(url).pathname, url]));

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(CORE_SHELL);
    await Promise.allSettled(OFFLINE_CORPUS.map(url => cache.add(url)));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

async function networkFirst(request, fallbackUrl) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response && response.ok) await cache.put(fallbackUrl || request, response.clone());
    return response;
  } catch (error) {
    return (await cache.match(request)) || (fallbackUrl ? await cache.match(fallbackUrl) : undefined) || Promise.reject(error);
  }
}

async function shellCacheFirst(request, cacheKey) {
  const cached = (await caches.match(request)) || (cacheKey ? await caches.match(cacheKey) : undefined);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) await (await caches.open(CACHE_NAME)).put(cacheKey || request, response.clone());
  return response;
}

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== self.location.origin || requestUrl.pathname.startsWith("/api/")) return;

  // PDF viewers depend on byte-range responses. A cached full 200 response for
  // a Range request breaks Android viewers, and caching large PDFs can exhaust
  // mobile storage, so document traffic always goes directly to the network.
  if (request.headers.has("range") || /\.pdf$/i.test(requestUrl.pathname)) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, "./index.html"));
    return;
  }
  if (requestUrl.pathname.endsWith("/api-config.js")) {
    event.respondWith(networkFirst(request, "./api-config.js"));
    return;
  }
  const shellUrl = SHELL_PATHS.get(requestUrl.pathname);
  if (shellUrl) event.respondWith(shellCacheFirst(request, shellUrl));
});
