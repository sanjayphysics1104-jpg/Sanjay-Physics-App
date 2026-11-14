const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

test("class menus expand in place and learning sections keep the sidebar visible", () => {
  const html = read("index.html");
  const script = read("script.js");
  const css = read("style.css");

  assert.match(html, /id="learningViewBack"/);
  assert.match(script, /function setLearningView\(/);
  assert.match(script, /history\.(pushState|replaceState)\(/);
  assert.match(script, /window\.addEventListener\("popstate"/);
  assert.match(script, /sspOverlay:\s*"pdf"/);
  assert.doesNotMatch(css, /body\.learning-section-open \.class-nav\s*\{[^}]*display:none/s);
  assert.match(css, /body\.learning-section-open [^{]*\.learning-scroll\s*\{[^}]*max-height:none[^}]*overflow:visible/s);
  assert.match(script, /if\(tab\)toggleNavigationBranch\(tab\)/);
  assert.doesNotMatch(script, /openClassDashboard/);
  assert.match(script, /function goBackFromLearningView\(\)\s*\{\s*setLearningView\(\{view:"home"/s);
});

test("global exit replaces admin logout and terminates authentication without deleting content", () => {
  const html = read("index.html");
  const script = read("script.js");

  assert.doesNotMatch(html, /id="(?:headerLogoutBtn|logoutBtn|logoutConfirmModal)"/);
  assert.match(html, /id="exitAppBtn"[^>]*>[^<]*<span[^>]*>↪<\/span> EXIT APP \/ SIGN OUT<\/button>/);
  assert.match(html, /id="exitScreen"/);
  assert.match(html, /App Closed/);
  assert.match(html, /You can now safely close this window\./);
  assert.doesNotMatch(html, /id="returnToLoginBtn"|Return to login/i);
  assert.match(script, /sessionStorage\.removeItem\(SESSION_KEY\)/);
  assert.match(script, /sessionStorage\.removeItem\(ADMIN_TOKEN_KEY\)/);
  assert.match(script, /sessionStorage\.clear\(\);sessionStorage\.setItem\(APP_EXITED_KEY, "true"\)/);
  assert.doesNotMatch(script, /localStorage\.clear\(/);
  assert.doesNotMatch(script, /indexedDB\.deleteDatabase\(/);
  assert.match(script, /function exitApplication\(/);
  assert.match(script, /window\.close\(\)/);
  assert.doesNotMatch(script, /function returnToLogin\(/);
  assert.match(script, /document\.body\.classList\.add\("app-exited"\)/);
  assert.match(script, /sessionStorage\.getItem\(APP_EXITED_KEY\)=== "true"|sessionStorage\.getItem\(APP_EXITED_KEY\)===\"true\"/);
});
