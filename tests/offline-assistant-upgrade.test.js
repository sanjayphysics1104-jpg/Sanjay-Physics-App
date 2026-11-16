"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=file => fs.readFileSync(path.join(root,file),"utf8");

test("offline assistant upgrade stays isolated from Gemini modules",() => {
  const ui=read("Sanjay_Physics_Assistant/offline-ui.js");
  const engine=read("Sanjay_Physics_Assistant/offline-engine.js");
  const corpus=read("Sanjay_Physics_Assistant/corpus-index.js");
  for (const source of [ui,engine,corpus]) {
    assert.doesNotMatch(source,/fetch\s*\(\s*["'`]\/api\//i);
    assert.doesNotMatch(source,/GEMINI_API_KEY|callGemini|googleapis/i);
  }
  assert.match(ui,/BOOKMARK_KEY/);
  assert.match(ui,/ANALYTICS_KEY/);
  assert.match(ui,/SpeechRecognition/);
  assert.match(ui,/voiceLanguages=\[navigator\.language,"en-IN","en-US"\]/);
  assert.match(ui,/No compatible offline speech language pack is installed/);
  assert.match(ui,/voiceError \|\| "100% offline/);
});

test("hint-first controls and locally vendored math are wired",() => {
  const html=read("index.html");
  const ui=read("Sanjay_Physics_Assistant/offline-ui.js");
  const serviceWorker=read("sw.js");
  assert.match(html,/Sanjay_Physics_Assistant\/offline-math\.js/);
  assert.match(html,/Sanjay_Physics_Assistant\/vendor\/katex\/katex\.min\.js/);
  assert.match(ui,/data-card-action=\"hint\"/);
  assert.match(ui,/data-card-action=\"solution\"/);
  assert.match(ui,/data-card-action=\"practice\"/);
  assert.match(serviceWorker,/KATEX_ASSETS/);
  assert.ok(fs.existsSync(path.join(root,"Sanjay_Physics_Assistant/vendor/katex/fonts/KaTeX_Main-Regular.woff2")));
});

test("hybrid search includes field weighting, typo tolerance and exam filters",() => {
  const corpus=read("Sanjay_Physics_Assistant/corpus-index.js");
  assert.match(corpus,/fuzzyWordScore/);
  assert.match(corpus,/phraseScore\(documentText,chapter,22\)/);
  assert.match(corpus,/wordScore\(equationText,queryTokens,5\)/);
  assert.match(corpus,/examScore\(document,mode\)/);
  assert.match(corpus,/similarPractice/);
});

test("physics derivative questions stay in physics and use a calculus derivation",() => {
  const engine=read("Sanjay_Physics_Assistant/offline-engine.js");
  assert.match(engine,/PHYSICS_TERMS\.test\(query\) \|\| PHYSICS_FORMULAS\.test/);
  assert.match(engine,/PHYSICS_FORMULAS/);
  assert.match(engine,/explicitPhysicsTarget \? inferredChapter/);
  assert.match(engine,/chapters\.includes\(entry\)/);
  assert.match(engine,/Derivation using a derivative — first equation of motion/);
  assert.match(engine,/a = dv\/dt/);
  assert.match(engine,/v = u \+ at/);
});
