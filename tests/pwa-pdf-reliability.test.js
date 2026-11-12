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
      keys: async () => [],
      delete: async () => true
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
  assert.match(worker, /sanjay-physics-v60-cross-device-install/);
  assert.match(worker, /cache\.addAll\(CORE_SHELL\)/);
  assert.match(worker, /Promise\.allSettled\(OFFLINE_CORPUS/);
  assert.match(worker, /clients\.claim\(\)/);
  assert.match(worker, /skipWaiting\(\)/);
});

test("reader includes Android fallback and routes question PDFs through one reader", () => {
  const html = read("index.html");
  const script = read("script.js");
  assert.match(html, /id="readerOpenExternal"[^>]*target="_blank"[^>]*rel="noopener"/);
  assert.match(html, /id="readerFallbackOpen"[^>]*target="_blank"[^>]*rel="noopener"/);
  assert.match(script, /mobilePdfFallback = \/Android\|iPad\|iPhone\|iPod\/i\.test\(navigator\.userAgent/);
  assert.match(script, /media\.githubusercontent\.com\/media\/sanjayphysics1104-jpg\/Sanjay-Physics-App\/main/);
  assert.match(script, /new Blob\(\[bytes\],\{type:"application\/pdf"\}\)/);
  assert.match(script, /item\?\.blobKey\|\|item\?\.url\|\|item\?\.fallbackUrl\)openPdf\(item\.id\)/);
  assert.doesNotMatch(script, /else if\(item\?\.url\)window\.open/);
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
  assert.match(html, /class="install-btn" id="installBtn"/);
  assert.match(html, /id="installModal"/);
  assert.match(script, /beforeinstallprompt/);
  assert.match(script, /display-mode: standalone/);
  assert.match(script, /Add to Home Screen/);
  assert.match(script, /Install app/);
  assert.match(script, /Google Chrome or Microsoft Edge/);
  assert.match(script, /\["localhost","127\.0\.0\.1"\]/);
  assert.match(script, /register\("\/sw\.js",\{scope:"\/",updateViaCache:"none"\}\)/);
  const swHeaders = vercel.headers.find(rule => rule.source === "/sw.js")?.headers || [];
  assert.ok(swHeaders.some(header => header.key === "Service-Worker-Allowed" && header.value === "/"));
  assert.ok(swHeaders.some(header => header.key === "Cache-Control" && /no-cache/.test(header.value)));
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

test("Vercel serves Git LFS PDFs through the materialized media endpoint", () => {
  const vercel = JSON.parse(read("vercel.json"));
  const pdfRedirect = vercel.redirects?.find(rule => rule.source === "/assets/pdfs/:path*");
  assert.ok(pdfRedirect, "bundled PDF redirect is missing");
  assert.equal(pdfRedirect.permanent, false);
  assert.match(pdfRedirect.destination, /^https:\/\/media\.githubusercontent\.com\/media\/sanjayphysics1104-jpg\/Sanjay-Physics-App\/main\/assets\/pdfs\/:path\*$/);
});
