const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

test("class and learning sections use one history-backed full-screen view state", () => {
  const html = read("index.html");
  const script = read("script.js");
  const css = read("style.css");

  assert.match(html, /id="classDashboard"/);
  assert.match(html, /id="learningViewBack"/);
  assert.match(script, /function setLearningView\(/);
  assert.match(script, /history\.(pushState|replaceState)\(/);
  assert.match(script, /window\.addEventListener\("popstate"/);
  assert.match(script, /sspOverlay:\s*"pdf"/);
  assert.match(css, /body\.learning-section-open \.class-nav\s*\{[^}]*display:none/s);
  assert.match(css, /body\.learning-section-open [^{]*\.learning-scroll\s*\{[^}]*max-height:none[^}]*overflow:visible/s);
});

test("logout confirms and terminates only the existing admin session", () => {
  const html = read("index.html");
  const script = read("script.js");

  assert.match(html, /id="headerLogoutBtn"/);
  assert.match(html, /id="logoutConfirmModal"[^>]*role="alertdialog"/);
  assert.match(html, /id="confirmLogoutBtn"/);
  assert.match(html, /id="logoutError"[^>]*role="alert"/);
  assert.match(script, /sessionStorage\.removeItem\(SESSION_KEY\)/);
  assert.match(script, /sessionStorage\.removeItem\(ADMIN_TOKEN_KEY\)/);
  assert.doesNotMatch(script, /localStorage\.clear\(/);
  assert.doesNotMatch(script, /indexedDB\.deleteDatabase\(/);
  assert.match(script, /function requestLogoutConfirmation\(/);
  assert.match(script, /function confirmLogout\(/);
  assert.match(script, /openAdmin\(\)/);
});
