const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

test("startup data cloning works when Android does not provide structuredClone", () => {
  const script = read("script.js");
  const helper = script.match(/const cloneContentData = [\s\S]*?;\r?\nconst IMPORTED_CLASS_9_PDF_PATH/)?.[0]
    .replace(/\r?\nconst IMPORTED_CLASS_9_PDF_PATH[\s\S]*$/, "");
  assert.ok(helper, "startup clone helper was not found");
  const context = {result:null};
  vm.runInNewContext(`${helper}\nresult = cloneContentData({chapter:{name:"Motion"}});`, context);
  assert.deepEqual(JSON.parse(JSON.stringify(context.result)), {chapter:{name:"Motion"}});
  assert.equal((script.match(/structuredClone\(/g) || []).length, 1, "all content cloning must go through the compatibility helper");
});

test("service worker bypasses PDFs and byte ranges but handles navigations", async () => {
  const worker = read("sw.js");
  const listeners = {};
  const deletedCaches = [];
  const cache = {
    addAll: async () => {},
    match: async () => undefined,
    put: async () => {}
  };
  const response = {ok:true, clone(){ return this; }};
  const context = {
    URL,
    Set,
    Map,
    Promise,
    fetch: async () => response,
    caches: {
      open: async () => cache,
      match: async () => undefined,
      keys: async () => ["sanjay-physics-v58-offline-pdf-corpus", "sanjay-physics-v62-native-install-flow", "sanjay-physics-v63-canonical-startup", "sanjay-physics-v64-pdfjs-viewer", "sanjay-physics-v65-same-origin-pdf", "unrelated-origin-cache"],
      delete: async key => { deletedCaches.push(key); return true; }
    },
    self: {
      registration:{scope:"https://physics.example/"},
      location:{origin:"https://physics.example"},
      addEventListener(type, handler){ listeners[type] = handler; },
      skipWaiting: async () => {},
      clients:{claim:async () => {}}
    }
  };
  vm.runInNewContext(worker, context);

  const dispatchFetch = request => {
    let promise;
    listeners.fetch({request, respondWith(value){ promise = value; }});
    return promise;
  };
  const headers = range => ({has(name){ return name === "range" && range; }});

  assert.equal(dispatchFetch({method:"GET",url:"https://physics.example/assets/notes.pdf",headers:headers(false),mode:"same-origin"}), undefined);
  assert.equal(dispatchFetch({method:"GET",url:"https://physics.example/assets/notes.bin",headers:headers(true),mode:"same-origin"}), undefined);
  const navigation = dispatchFetch({method:"GET",url:"https://physics.example/",headers:headers(false),mode:"navigate"});
  assert.equal(typeof navigation?.then, "function");
  assert.equal(await navigation, response);
  let activation;
  listeners.activate({waitUntil(value){ activation = value; }});
  await activation;
  assert.deepEqual(deletedCaches.sort(), ["sanjay-physics-v58-offline-pdf-corpus", "sanjay-physics-v62-native-install-flow", "sanjay-physics-v63-canonical-startup", "sanjay-physics-v64-pdfjs-viewer"]);
  assert.match(worker, /v65-same-origin-pdf/);
  assert.match(worker, /const OFFLINE_URL = "\/"/);
  assert.doesNotMatch(worker, /["']\.\/index\.html["']/);
  assert.match(worker, /cache\.addAll\(CORE_SHELL\)/);
  assert.match(worker, /Promise\.allSettled\(OFFLINE_CORPUS/);
  assert.match(worker, /clients\.claim\(\)/);
  assert.match(worker, /skipWaiting\(\)/);
});

test("reader renders PDFs in-app on desktop and Android with real navigation, zoom and download controls", () => {
  const html = read("index.html");
  const script = read("script.js");
  const worker = read("sw.js");
  assert.match(html, /id="pdfCanvas"[^>]*aria-label="PDF page"/);
  assert.doesNotMatch(html, /<iframe id="pdfViewer"/);
  assert.match(html, /id="zoomOutBtn"/);
  assert.match(html, /id="zoomInBtn"/);
  assert.match(html, /id="zoomFitBtn"/);
  assert.match(html, /id="zoomLevel"/);
  assert.match(html, /id="readerDownload"[^>]*download/);
  assert.match(html, /id="readerFallbackOpen"[^>]*target="_blank"[^>]*rel="noopener"/);
  assert.match(script, /import\("\/vendor\/pdfjs\/pdf\.min\.mjs"\)/);
  assert.match(script, /GlobalWorkerOptions\.workerSrc = "\/vendor\/pdfjs\/pdf\.worker\.min\.mjs"/);
  assert.match(script, /getDocument\(\{url:/);
  assert.match(script, /page\.render\(\{/);
  assert.match(script, /devicePixelRatio/);
  assert.match(script, /downloadCurrentPdf/);
  assert.doesNotMatch(script, /Mobile installed apps do not always include an embedded PDF viewer/);
  assert.match(script, /item\?\.blobKey\|\|item\?\.url\|\|item\?\.fallbackUrl\)openPdf\(item\.id\)/);
  assert.doesNotMatch(script, /else if\(item\?\.url\)window\.open/);
  assert.match(worker, /"\/vendor\/pdfjs\/pdf\.min\.mjs"/);
  assert.match(worker, /"\/vendor\/pdfjs\/pdf\.worker\.min\.mjs"/);
  const vercel = JSON.parse(read("vercel.json"));
  for (const source of ["/vendor/pdfjs/pdf.min.mjs", "/vendor/pdfjs/pdf.worker.min.mjs"]) {
    const headers = vercel.headers.find(rule => rule.source === source)?.headers || [];
    assert.ok(headers.some(header => header.key === "Content-Type" && /application\/javascript/.test(header.value)), `${source} must be served as JavaScript`);
  }
});

test("manifest launches at the Vercel root without an index redirect", () => {
  const manifest = JSON.parse(read("manifest.json"));
  assert.equal(manifest.id, "/");
  assert.equal(manifest.start_url, "/");
  assert.equal(manifest.scope, "/");
  assert.equal(manifest.display, "standalone");
  assert.deepEqual(manifest.display_override, ["standalone", "minimal-ui"]);
  assert.ok(manifest.icons.some(icon => icon.sizes === "192x192" && icon.purpose === "any"));
  assert.ok(manifest.icons.some(icon => icon.sizes === "512x512" && icon.purpose === "maskable"));
});

test("install control stays discoverable and provides platform-specific fallback guidance", () => {
  const html = read("index.html");
  const script = read("script.js");
  const vercel = JSON.parse(read("vercel.json"));
  assert.match(html, /class="install-btn hidden" id="installBtn"/);
  assert.match(html, /id="installModal"/);
  assert.doesNotMatch(html, /id="installConfirmBtn"/);
  assert.match(html, /class="secondary-btn install-help-close"[^>]*>Close<\/button>/);
  assert.match(html, /id="installAvailability"[^>]*role="status"/);
  assert.match(script, /beforeinstallprompt/);
  assert.match(script, /display-mode: standalone/);
  assert.match(script, /Add to Home Screen/);
  assert.match(script, /Install app/);
  assert.match(script, /Google Chrome or Microsoft Edge/);
  assert.match(script, /\["localhost","127\.0\.0\.1"\]/);
  assert.match(script, /register\("\/sw\.js",\{scope:"\/",updateViaCache:"none"\}\)/);
  assert.match(script, /installButton\.addEventListener\("click",requestInstall\)/);
  assert.match(script, /installButton\.textContent = deferredInstallPrompt \? "Install App" : "Install Help"/);
  assert.match(script, /installHelpReady = !chromiumBrowser/);
  assert.match(script, /setTimeout\(\(\)=>\{installHelpReady=true;syncInstallButton\(\);\},3000\)/);
  assert.match(script, /await promptEvent\.prompt\(\)/);
  assert.match(script, /await promptEvent\.userChoice/);
  const swHeaders = vercel.headers.find(rule => rule.source === "/sw.js")?.headers || [];
  assert.ok(swHeaders.some(header => header.key === "Service-Worker-Allowed" && header.value === "/"));
  assert.ok(swHeaders.some(header => header.key === "Cache-Control" && /no-cache/.test(header.value)));
  const legacyRedirect = vercel.redirects.find(rule => rule.source === "/index.html");
  assert.deepEqual(legacyRedirect, {source:"/index.html", destination:"/", permanent:false});
});

test("all preserved PDF files retain valid PDF signatures", () => {
  const pdfRoot = path.join(root, "assets", "pdfs");
  const files = [];
  const walk = directory => {
    for (const entry of fs.readdirSync(directory, {withFileTypes:true})) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(fullPath);
      else if (/\.pdf$/i.test(entry.name)) files.push(fullPath);
    }
  };
  walk(pdfRoot);
  assert.equal(files.length, 97);
  for (const file of files) {
    const bytes = fs.readFileSync(file);
    assert.equal(bytes.subarray(0, 5).toString(), "%PDF-", path.relative(root, file));
    assert.match(bytes.subarray(Math.max(0, bytes.length - 2048)).toString("latin1"), /%%EOF/, path.relative(root, file));
  }
});

test("Vercel proxies Git LFS PDFs through the app origin for PDF.js range loading", () => {
  const vercel = JSON.parse(read("vercel.json"));
  const pdfRewrite = vercel.rewrites?.find(rule => rule.source === "/assets/pdfs/:path*");
  assert.ok(pdfRewrite, "same-origin bundled PDF proxy is missing");
  assert.match(pdfRewrite.destination, /^https:\/\/media\.githubusercontent\.com\/media\/sanjayphysics1104-jpg\/Sanjay-Physics-App\/main\/assets\/pdfs\/:path\*$/);
  assert.doesNotMatch(read("script.js"), /return `\$\{BUNDLED_PDF_MEDIA_BASE\}/);
});
