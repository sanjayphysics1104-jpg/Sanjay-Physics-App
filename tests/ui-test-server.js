"use strict";

const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const envLine = fs.readFileSync(path.join(root, ".env"), "utf8")
  .split(/\r?\n/)
  .find(line => /^\s*GEMINI_API_KEY\s*=/.test(line));
if (envLine) process.env.GEMINI_API_KEY = envLine.split("=").slice(1).join("=").trim().replace(/^['"]|['"]$/g, "");

const health = require(path.join(root, "api", "health.js"));
const physicsAssistant = require(path.join(root, "api", "physics-assistant.js"));
const mime = {".html":"text/html; charset=utf-8", ".css":"text/css; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".json":"application/json", ".png":"image/png", ".jpg":"image/jpeg", ".svg":"image/svg+xml", ".pdf":"application/pdf"};

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
  const relative = decodeURIComponent(url.pathname === "/" ? "index.html" : url.pathname.slice(1));
  const filePath = path.resolve(root, relative);
  if (!filePath.startsWith(`${root}${path.sep}`) || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    response.statusCode = 404;
    return response.end("Not found");
  }
  response.setHeader("Content-Type", mime[path.extname(filePath).toLowerCase()] || "application/octet-stream");
  response.setHeader("Cache-Control", "no-store");
  fs.createReadStream(filePath).pipe(response);
});

server.listen(4173, "127.0.0.1", () => console.log("UI test server ready at http://127.0.0.1:4173"));
