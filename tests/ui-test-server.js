"use strict";

const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const crypto = require("node:crypto");

const root = path.resolve(__dirname, "..");
const projectWriteRoot = process.env.SSP_PROJECT_WRITE_ROOT ? path.resolve(process.env.SSP_PROJECT_WRITE_ROOT) : root;
const listenPort = Number(process.env.SSP_LOCAL_PORT) || 4173;
const envLine = fs.readFileSync(path.join(root, ".env"), "utf8")
  .split(/\r?\n/)
  .find(line => /^\s*GEMINI_API_KEY\s*=/.test(line));
if (envLine) process.env.GEMINI_API_KEY = envLine.split("=").slice(1).join("=").trim().replace(/^['"]|['"]$/g, "");
process.env.ADMIN_PIN_HASH ||= crypto.createHash("sha256").update("sanjay-physics:runtime-test-pin").digest("hex");
process.env.ADMIN_SESSION_SECRET ||= "sanjay-physics-runtime-test-secret-2026";

const health = require(path.join(root, "api", "health.js"));
const physicsAssistant = require(path.join(root, "api", "physics-assistant.js"));
const adminSession = require(path.join(root, "api", "admin-session.js"));
const mime = {".html":"text/html; charset=utf-8", ".css":"text/css; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".mjs":"text/javascript; charset=utf-8", ".json":"application/json", ".png":"image/png", ".jpg":"image/jpeg", ".svg":"image/svg+xml", ".pdf":"application/pdf"};
const uploadRoot = path.join(projectWriteRoot, "assets", "uploads");
const contentFile = path.join(uploadRoot, "admin-content.json");
const MAX_PDF_BYTES = 40 * 1024 * 1024;

function safeSegment(value, fallback) {
  const cleaned = String(value || "").normalize("NFKC").replace(/[^a-zA-Z0-9._ -]+/g, "-").replace(/\s+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);
  return cleaned || fallback;
}

async function readBody(request, maxBytes) {
  const chunks = [];
  let total = 0;
  for await (const chunk of request) {
    total += chunk.length;
    if (total > maxBytes) throw new Error("Request is too large");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function saveLocalProjectPdf(request, response) {
  if (request.method !== "POST") { response.statusCode = 405; return response.end("Method not allowed"); }
  try {
    const body = await readBody(request, MAX_PDF_BYTES);
    if (body.length < 5 || body.subarray(0, 5).toString("ascii") !== "%PDF-") throw new Error("Only valid PDF files are accepted");
    const collection = safeSegment(request.headers["x-ssp-collection"], "pdfs");
    const className = safeSegment(decodeURIComponent(request.headers["x-ssp-class"] || "Other-Subjects"), "Other-Subjects");
    const id = safeSegment(request.headers["x-ssp-id"], `pdf-${Date.now()}`);
    const originalName = safeSegment(decodeURIComponent(request.headers["x-ssp-file-name"] || "document.pdf"), "document.pdf");
    const fileName = originalName.toLowerCase().endsWith(".pdf") ? originalName : `${originalName}.pdf`;
    const relativeDirectory = path.join("assets", "uploads", collection, className);
    const directory = path.join(projectWriteRoot, relativeDirectory);
    fs.mkdirSync(directory, {recursive:true});
    const storedName = `${id}-${fileName}`;
    const destination = path.join(directory, storedName);
    fs.writeFileSync(destination, body, {flag:"wx"});
    const publicPath = `/${path.join(relativeDirectory, storedName).split(path.sep).join("/")}`;
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify({ok:true, path:publicPath, bytes:body.length}));
  } catch (error) {
    response.statusCode = /exists/i.test(error.code || "") ? 409 : 400;
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify({ok:false, error:error.message}));
  }
}

async function saveLocalProjectContent(request, response) {
  if (request.method !== "PUT") { response.statusCode = 405; return response.end("Method not allowed"); }
  try {
    const body = await readBody(request, 12 * 1024 * 1024);
    const data = JSON.parse(body.toString("utf8"));
    if (!["videos", "pdfs", "questionBanks", "quizzes", "boardQuestions"].every(key => Array.isArray(data[key]))) throw new Error("Invalid content data");
    fs.mkdirSync(uploadRoot, {recursive:true});
    const temporary = `${contentFile}.tmp`;
    fs.writeFileSync(temporary, `${JSON.stringify(data, null, 2)}\n`, "utf8");
    fs.renameSync(temporary, contentFile);
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify({ok:true}));
  } catch (error) {
    response.statusCode = 400;
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify({ok:false, error:error.message}));
  }
}

function routeResponse(response) {
  return {
    setHeader:(name, value) => response.setHeader(name, value),
    status(code) { response.statusCode = code; return this; },
    json(body) { response.setHeader("Content-Type", "application/json"); response.end(JSON.stringify(body)); return this; },
    end() { response.end(); return this; }
  };
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, "http://127.0.0.1:4173");
  if (url.pathname === "/api/health") return health(request, routeResponse(response));
  if (url.pathname === "/api/physics-assistant") {
    let raw = "";
    for await (const chunk of request) raw += chunk;
    request.body = raw;
    return physicsAssistant(request, routeResponse(response));
  }
  if (url.pathname === "/api/admin-session") {
    let raw = "";
    for await (const chunk of request) raw += chunk;
    request.body = raw;
    return adminSession(request, routeResponse(response));
  }
  if (url.pathname === "/api/local-project-upload") return saveLocalProjectPdf(request, response);
  if (url.pathname === "/api/local-project-content") return saveLocalProjectContent(request, response);
  const relative = decodeURIComponent(url.pathname === "/" ? "index.html" : url.pathname.slice(1));
  if (relative.split(/[\\/]/).some(segment => segment.startsWith(".")) || /(^|[\\/])(?:secrets?|credentials?)(?:[\\/]|$)/i.test(relative)) {
    response.statusCode = 404;
    return response.end("Not found");
  }
  const filePath = path.resolve(root, relative);
  if (!filePath.startsWith(`${root}${path.sep}`) || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    response.statusCode = 404;
    return response.end("Not found");
  }
  response.setHeader("Content-Type", mime[path.extname(filePath).toLowerCase()] || "application/octet-stream");
  response.setHeader("Cache-Control", "no-store");
  fs.createReadStream(filePath).pipe(response);
});

server.listen(listenPort, "127.0.0.1", () => console.log(`UI test server ready at http://127.0.0.1:${listenPort}`));
