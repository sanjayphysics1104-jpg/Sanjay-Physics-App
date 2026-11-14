const CACHE_PREFIX = "sanjay-physics-";
const CACHE_NAME = `${CACHE_PREFIX}v76-critical-ai-file-pdf-preview`;
const OFFLINE_URL = "/";
const CORE_SHELL = ["/", "/style.css", "/script.js", "/api-config.js", "/ai-assistant.js", "/vendor/pdfjs/pdf.min.mjs", "/vendor/pdfjs/pdf.worker.min.mjs", "/Sanjay_Physics_Assistant/knowledge-base.js", "/Sanjay_Physics_Assistant/academic-db.js", "/Sanjay_Physics_Assistant/corpus-index.js", "/Sanjay_Physics_Assistant/offline-engine.js", "/Sanjay_Physics_Assistant/offline-ui.js", "/manifest.json", "/assets/reference-sanjay-physics-logo.png", "/assets/reference-logo-192.png", "/assets/reference-logo-512.png"];
const OFFLINE_CORPUS = ["/Sanjay_Physics_Assistant/academic-knowledge-12.json", "/Sanjay_Physics_Assistant/pdf-index/manifest.json", "/Sanjay_Physics_Assistant/pdf-index/class-9.json", "/Sanjay_Physics_Assistant/pdf-index/class-10.json", "/Sanjay_Physics_Assistant/pdf-index/class-11.json", "/Sanjay_Physics_Assistant/pdf-index/class-12.json"];
const APP_SHELL = [...CORE_SHELL, ...OFFLINE_CORPUS];
const SHELL_PATHS = new Set(APP_SHELL.map(path => new URL(path, self.registration.scope).pathname));

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(CORE_SHELL);
    await Promise.allSettled(OFFLINE_CORPUS.map(url => cache.add(url)));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

async function networkFirst(request, fallbackUrl) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (!response || !response.ok) throw new Error(`Request failed with ${response?.status || "no response"}`);
    await cache.put(fallbackUrl || request, response.clone());
    return response;
  } catch (error) {
    return (await cache.match(request)) || (fallbackUrl ? await cache.match(fallbackUrl) : undefined) || Promise.reject(error);
  }
}

async function shellCacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cacheKey = new URL(request.url).pathname;
  const cached = await cache.match(cacheKey);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) await cache.put(cacheKey, response.clone());
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
    // Both the current start URL and every legacy /index(.html) launch recover
    // from the one canonical root document when the network is unavailable.
    event.respondWith(networkFirst(request, OFFLINE_URL));
    return;
  }
  if (requestUrl.pathname === "/api-config.js") {
    event.respondWith(networkFirst(request, "/api-config.js"));
    return;
  }
  if (SHELL_PATHS.has(requestUrl.pathname)) event.respondWith(shellCacheFirst(request));
});
