"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");

test("both independent Physics Assistants remain mounted", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  assert.match(html, /id="aiAssistant"/);
  assert.match(html, /<strong>AI Physics Assistant<\/strong>/);
  assert.match(html, /id="aiTitle">AI Physics Assistant<\/strong>/);
  assert.match(html, /Sanjay_Physics_Assistant\/offline-ui\.js/);
  assert.ok(fs.existsSync(path.join(root, "Sanjay_Physics_Assistant", "offline-engine.js")));
});

test("all learning libraries use independent draggable vertical scrolling", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
  for (const id of ["videoGrid", "pdfGrid", "questionBankGrid", "boardChapterList"]) {
    assert.match(html, new RegExp(`id="${id}"[^>]*class="[^"]*learning-scroll|class="[^"]*learning-scroll[^"]*"[^>]*id="${id}"`));
  }
  assert.match(css, /\.learning-scroll\{[^}]*max-height:clamp\([^}]*overflow-y:auto;[^}]*scrollbar-gutter:stable/s);
  assert.match(css, /\.learning-scroll::\-webkit-scrollbar\{[^}]*width:12px/s);
  assert.doesNotMatch(css, /#pdfGrid\{[^}]*grid-auto-flow:column;[^}]*overflow-x:auto/s);
});

test("every major learning section has a functional close control", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
  for (const id of ["videos", "pdfs", "question-bank", "quiz"]) {
    assert.match(html, new RegExp(`data-close-section="${id}"`));
  }
  assert.match(html, /id="boardBackBtn"[^>]*>\s*×\s*<\/button>/);
  assert.match(script, /closest\("\[data-close-section\]"\)/);
  assert.match(script, /goBackFromLearningView\(\)/);
  assert.match(script, /section\.classList\.toggle\("hidden", view !== "home" && !active\)/);
});

test("class rows open dedicated dashboards while the CBSE row retains its branch control", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
  const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
  assert.equal((html.match(/class="nav-chevron" aria-hidden="true">›<\/span>/g) || []).length, 7);
  assert.match(css, /\.nav-chevron\{[^}]*transform:rotate\(0deg\);[^}]*transition:transform \.22s ease/s);
  assert.match(css, /\.nav-branch\.expanded \.nav-chevron\{[^}]*transform:rotate\(90deg\)/s);
  assert.match(script, /function toggleNavigationBranch\(tab\)/);
  assert.match(script, /if\(tab\)\{openClassDashboard\(tab\.dataset\.class\);\}/);
  assert.match(script, /const boardTab=e\.target\.closest\("\[data-board-nav\]"\);if\(boardTab\)\{const shouldExpand=toggleNavigationBranch\(boardTab\);if\(shouldExpand\)showBoardPage\(true\);return;\}/);
});

test("AI Physics Assistant replaces the chapter dropdown beside the global search", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
  const aiScript = fs.readFileSync(path.join(root, "ai-assistant.js"), "utf8");
  const header = html.match(/<header class="app-header">[\s\S]*?<\/header>/)?.[0] || "";
  const pdfSection = html.match(/<section id="pdfs"[\s\S]*?<\/section>/)?.[0] || "";
  assert.match(header, /id="librarySearch"/);
  assert.match(header, /id="librarySearch"[\s\S]*?class="ai-launcher" id="aiLauncher"/);
  assert.doesNotMatch(header, /id="pdfChapterFilter"/);
  assert.equal((html.match(/id="aiLauncher"/g) || []).length, 1);
  assert.match(html, /<select id="pdfChapterFilter"[^>]*hidden/);
  assert.match(aiScript, /launcher:\s*document\.querySelector\("#aiLauncher"\)/);
  assert.doesNotMatch(pdfSection, /id="librarySearch"/);
  assert.doesNotMatch(pdfSection, /id="pdfChapterFilter"/);
  assert.match(css, /#pdfs\{[^}]*padding-top:(?:16|20|24)px/s);
});

test("Sanjay Physics Assistant is fully offline and uses the local PDF corpus", () => {
  const ui = fs.readFileSync(path.join(root, "Sanjay_Physics_Assistant", "offline-ui.js"), "utf8");
  const corpus = fs.readFileSync(path.join(root, "Sanjay_Physics_Assistant", "corpus-index.js"), "utf8");
  const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
  assert.match(ui, /Engine\.answer/);
  assert.match(ui, /100% offline/i);
  assert.match(ui, /Local PDF sources/);
  assert.doesNotMatch(ui, /\/api\/sanjay-physics-assistant|Gemini|AbortController/i);
  assert.match(corpus, /pdf-index\/manifest\.json/);
  assert.match(corpus, /force-cache/);
  assert.match(css, /\.spa-spinner/);
  assert.match(css, /\.spa-sources/);
});

test("AI Physics Assistant suppresses navigation and bubbling on persistent drawer actions", () => {
  const source = fs.readFileSync(path.join(root, "ai-assistant.js"), "utf8");
  const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
  assert.match(source, /elements\.launcher\.addEventListener\("click",\s*event\s*=>\s*\{\s*event\.preventDefault\(\);\s*event\.stopPropagation\(\);\s*openPanel\(\);\s*\}\)/s);
  assert.match(source, /elements\.close\.addEventListener\("click",\s*event\s*=>\s*\{\s*event\.preventDefault\(\);\s*event\.stopPropagation\(\);\s*closePanel\(\);\s*\}\)/s);
  assert.match(source, /elements\.form\.addEventListener\("submit",\s*event\s*=>\s*\{\s*event\.preventDefault\(\);\s*event\.stopPropagation\(\);/s);
  assert.match(source, /messages\.push\(\{role:\s*"assistant",\s*content:\s*answer/);
  assert.match(css, /body\.ai-chat-open \.assistant-strip\{[^}]*z-index:1100/s);
  assert.match(css, /body\.ai-chat-open \.assistant-strip \.ai-assistant\{[^}]*filter:none!important;[^}]*z-index:1100/s);
});

test("Gemini helper falls back and returns a real model answer", async () => {
  const previousKey = process.env.GEMINI_API_KEY;
  const previousModel = process.env.GEMINI_MODEL;
  const previousFallback = process.env.GEMINI_FALLBACK_MODEL;
  const previousFetch = global.fetch;
  process.env.GEMINI_API_KEY = "test-key-not-a-credential";
  process.env.GEMINI_MODEL = "primary-model";
  process.env.GEMINI_FALLBACK_MODEL = "fallback-model";
  const calls = [];
  global.fetch = async url => {
    calls.push(String(url));
    if (calls.length === 1) return {ok:false, status:404, json:async () => ({error:{status:"NOT_FOUND", message:"missing"}})};
    return {ok:true, status:200, json:async () => ({candidates:[{content:{parts:[{text:"Recovered answer"}]}}]})};
  };
  try {
    const {callGemini} = require(path.join(root, "api", "_utils.js"));
    const answer = await callGemini({message:"What is force?", history:[], context:{className:"Class 9th"}});
    assert.equal(answer, "Recovered answer");
    assert.match(calls[0], /primary-model/);
    assert.match(calls[1], /fallback-model/);
  } finally {
    global.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = previousKey;
    if (previousModel === undefined) delete process.env.GEMINI_MODEL; else process.env.GEMINI_MODEL = previousModel;
    if (previousFallback === undefined) delete process.env.GEMINI_FALLBACK_MODEL; else process.env.GEMINI_FALLBACK_MODEL = previousFallback;
  }
});

test("CBSE board view uses a compact close control with no promotional hero", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
  const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
  assert.doesNotMatch(html, /<section class="board-hero">/);
  assert.match(html, /id="boardBackBtn"[^>]*aria-label="Close CBSE Board Questions"[^>]*>\s*×\s*<\/button>/);
  assert.match(html, /id="boardChapterList"/);
  assert.match(html, /id="boardLibrarySearch"/);
  assert.match(html, /id="boardChapterFilter"/);
  assert.match(script, /#boardBackBtn"\)\.addEventListener\("click",\(\)=>history\.state\?\.sspCanGoBack\?history\.back\(\):setLearningView/);
  assert.match(css, /\.reader-heading h2\{[^}]*text-overflow:ellipsis/);
});

test("CBSE close behavior restores the learning view", () => {
  const source = fs.readFileSync(path.join(root, "script.js"), "utf8");
  const match = source.match(/function showBoardPage\(show, updateHash = true\) \{[\s\S]*?\n\}/);
  assert.ok(match, "showBoardPage implementation must exist");
  const classes = () => {
    const values = new Set();
    return {toggle(name, force) { if (force) values.add(name); else values.delete(name); }, contains:name => values.has(name)};
  };
  const elements = {
    "#home":{classList:classes()},
    "#boardQuestionsPage":{classList:classes()},
    "#boardQuestionsBtn":{classList:classes()},
    ".board-nav-tab":{classList:classes()}
  };
  const link = {getAttribute:() => "#home", classList:classes()};
  const sandbox = {
    activeClass:"Class 12th",
    $:selector => elements[selector],
    $$:() => [link],
    setExpandedNavigation() {},
    history:{pushState() {}},
    window:{scrollTo() {}}
  };
  vm.runInNewContext(`${match[0]}\nglobalThis.showBoardPage = showBoardPage;`, sandbox);
  sandbox.showBoardPage(true);
  assert.equal(elements["#home"].classList.contains("hidden"), true);
  assert.equal(elements["#boardQuestionsPage"].classList.contains("hidden"), false);
  sandbox.showBoardPage(false);
  assert.equal(elements["#home"].classList.contains("hidden"), false);
  assert.equal(elements["#boardQuestionsPage"].classList.contains("hidden"), true);
  assert.equal(link.classList.contains("active"), true);
});

