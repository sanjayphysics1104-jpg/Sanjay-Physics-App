"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const envLine = fs.readFileSync(path.join(root, ".env"), "utf8")
  .split(/\r?\n/)
  .find(line => /^\s*GEMINI_API_KEY\s*=/.test(line));
assert.ok(envLine, "GEMINI_API_KEY must remain configured");
process.env.GEMINI_API_KEY = envLine.split("=").slice(1).join("=").trim().replace(/^['"]|['"]$/g, "");

const physicsAssistantRoute = require(path.join(root, "api", "physics-assistant.js"));
const sanjayPhysicsAssistantRoute = require(path.join(root, "api", "sanjay-physics-assistant.js"));

async function invoke(route, token) {
  let statusCode = 200;
  let responseBody;
  const request = {
    method:"POST",
    headers:{host:"localhost"},
    body:{message:`Reply with exactly: ${token}`,history:[],context:{className:"General Chat",chapter:"",action:"Connection verification"}}
  };
  const response = {
    setHeader() {},
    status(code) { statusCode=code; return this; },
    json(body) { responseBody=body; return this; },
    end() { return this; }
  };
  await route(request,response);
  assert.equal(statusCode,200,`Assistant route returned ${statusCode}`);
  assert.match(responseBody?.answer || "",new RegExp(token,"i"),"Gemini must return the requested live verification token");
}

(async () => {
  await invoke(physicsAssistantRoute,"PHYSICS_ASSISTANT_OK");
  await invoke(sanjayPhysicsAssistantRoute,"SANJAY_PHYSICS_ASSISTANT_OK");
  console.log("Both Gemini API routes passed (two authenticated model responses received).");
})().catch(error => {
  console.error(`Gemini live smoke test failed: ${error.code || error.name || "ERROR"} (${error.status || "no status"})`);
  process.exitCode = 1;
});
