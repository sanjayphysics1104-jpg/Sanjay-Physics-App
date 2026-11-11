"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
global.window = global;
const databasePath = require.resolve("./academic-knowledge-12.json");
const databaseBytes = fs.statSync(databasePath).size;
const database = JSON.parse(fs.readFileSync(databasePath,"utf8"));
global.SanjayAcademicDatabase = {load:async () => database};
global.fetch = async url => {
  const filePath = require("node:path").resolve(__dirname,"..",String(url));
  if (!fs.existsSync(filePath)) return {ok:false,status:404,json:async () => ({})};
  return {ok:true,status:200,json:async () => JSON.parse(fs.readFileSync(filePath,"utf8"))};
};
global.requestIdleCallback = callback => callback();
require("./knowledge-base.js");
require("./corpus-index.js");
require("./offline-engine.js");

(async () => {
  const engine = global.SanjayPhysicsOfflineEngine;
  assert.equal(engine.knowledgeBase.name, "Sanjay Physics Assistant");
  ["Class 6th","Class 7th","Class 8th","Class 9th","Class 10th","Class 11th","Class 12th","JEE / NEET"].forEach(level => {
    assert.ok(engine.getChapters(level).length > 0, `${level} must have local chapters`);
  });

  const force = await engine.answer({message:"A body of mass 5 kg has acceleration 2 m/s2. Find force.",context:{className:"Class 9th",chapter:"Force and Laws of Motion"}});
  ["**Branch:**","**Principle:**","**Given Data:**","**Required Quantity:**","**Relevant Formula:**","**Explanation of Symbols:**","**Substitution:**","**Step-by-Step Calculation:**","**Final Answer with SI Units:**","**Related Physics Concept:**"].forEach(label => assert.ok(force.answer.includes(label), `missing ${label}`));
  assert.ok(force.answer.includes("10 N"));
  assert.ok(force.answer.includes("Mechanics"));

  const vector = await engine.answer({message:"Resolve a force of 10 N at angle 30 degree into components.",context:{className:"Class 11th",chapter:"Motion in a Plane"}});
  assert.ok(vector.answer.includes("Fₓ = F cosθ"));
  assert.ok(vector.answer.includes("Fᵧ = F sinθ"));
  assert.ok(vector.answer.includes("[[diagram:force]]"));

  const electricity = await engine.answer({message:"Find resistance when voltage is 12 V and current is 2 A.",context:{className:"Class 10th",chapter:"Electricity"}});
  assert.ok(electricity.answer.includes("R = 6 Ω"));
  ["**Given Data:**","**Required Quantity:**","**Relevant Formula:**","**Explanation of Symbols:**","**Substitution:**","**Step-by-Step Calculation:**","**Final Answer with SI Units:**","**Related Physics Concept:**"].forEach(label => {
    assert.ok(electricity.answer.includes(label),`numerical answer is missing ${label}`);
  });

  const paraphrase = await engine.answer({message:"What property tells how strongly a conductor opposes the flow of electric charge?",context:{className:"Class 10th",chapter:"Electricity"}});
  assert.equal(paraphrase.chapter,"Electricity");
  assert.ok(paraphrase.answer.toLowerCase().includes("resistance"));
  assert.ok(paraphrase.sources.some(source => source.fileName && Number.isInteger(source.page)),"paraphrased questions need a verified PDF/page source when available");

  const contextual = await engine.answer({
    message:"What does R represent in that relation?",
    context:{className:"Class 10th",chapter:"Electricity"},
    history:[
      {role:"user",content:"State Ohm's law."},
      {role:"assistant",content:"At constant temperature, V = IR."}
    ]
  });
  assert.ok(contextual.answer.toLowerCase().includes("resistance"),"follow-up questions should use recent conversation context");

  const unsupported = await engine.answer({message:"A particle has several unknown forces. Calculate its exact acceleration.",context:{className:"Class 11th",chapter:"Laws of Motion"}});
  assert.match(unsupported.answer,/not enough verified information|insufficient information/i);
  assert.doesNotMatch(unsupported.answer,/\*\*Final Answer with SI Units:\*\*/);

  const concept = await engine.answer({message:"Explain photoelectric effect",context:{className:"Class 12th",chapter:"Dual Nature of Radiation and Matter"}});
  assert.ok(concept.answer.includes("Dual Nature of Radiation and Matter"));
  assert.ok(concept.sources.length > 0,"concept answers should cite local PDFs");
  assert.match(concept.sources[0].path,/^assets\/pdfs\/class-12\//);
  assert.ok(!concept.answer.includes("$"), "student-facing content must not use dollar delimiters");

  const greeting = await engine.answer({message:"Hello"});
  assert.equal(greeting.source,"offline-conversation");
  assert.ok(greeting.answer.startsWith("I am your Sanjay, your Physics Assistant."));

  const generalKnowledge = await engine.answer({message:"What is the capital of India?"});
  assert.equal(generalKnowledge.source,"offline-general-knowledge");
  assert.ok(generalKnowledge.answer.includes("New Delhi"));

  const chemistry = await engine.answer({message:"Explain the periodic table in chemistry"});
  assert.equal(chemistry.source,"offline-chemistry");
  assert.ok(chemistry.answer.includes("atomic number"));
  const mathematics = await engine.answer({message:"Solve this quadratic equation in mathematics"});
  assert.equal(mathematics.source,"offline-mathematics");
  assert.ok(mathematics.answer.includes("discriminant"));
  const biology = await engine.answer({message:"Explain photosynthesis in biology"});
  assert.equal(biology.source,"offline-biology");
  assert.ok(biology.answer.includes("chloroplasts"));

  assert.ok(!concept.answer.includes("Core relations"),"concept answers must not add an unsolicited formula list");
  const formulaRequest = await engine.answer({message:"Give me the formulas for current electricity"});
  assert.ok(formulaRequest.answer.includes("V = IR"));
  const fbd = await engine.answer({message:"Draw a free body diagram of a block pulled on a rough surface"});
  assert.ok(fbd.answer.includes("[[diagram:fbd]]"));
  const pendulum = await engine.answer({message:"Draw a labelled simple pendulum diagram",context:{className:"Class 11th",chapter:"Oscillations"}});
  assert.ok(pendulum.answer.includes("[[diagram:pendulum]]"),"common diagrams should be produced locally without a model");

  const originalFigure = await engine.answer({message:"Find the original ray diagram from the PDF",context:{className:"Class 12th",chapter:"Ray Optics and Optical Instruments"}});
  assert.ok(originalFigure.sources.some(source => source.fileName && Number.isInteger(source.page)),"original figures must retain a PDF filename and page reference");
  assert.match(originalFigure.answer,/original PDF page|figure reference/i);

  const uiSource = fs.readFileSync(require.resolve("./offline-ui.js"),"utf8");
  assert.ok(uiSource.includes('content:"I am your Sanjay, your Physics Assistant.'),"new chats must start with the required introduction");
  assert.ok(uiSource.includes("spa-class"),"class selector must exist");
  assert.ok(uiSource.includes("spa-chapter"),"chapter selector must exist");
  ["9th Class","10th Class","11th Class","12th Class","NEET","JEE","General Chat"].forEach(level => {
    assert.ok(uiSource.includes(level),`${level} must exist in the offline assistant context`);
  });
  assert.ok(uiSource.includes('NEET:"JEE / NEET"'),"NEET must route to the existing exam knowledge pack");
  assert.ok(uiSource.includes('JEE:"JEE / NEET"'),"JEE must route to the existing exam knowledge pack");
  assert.ok(uiSource.includes('document.querySelector(".header-actions")'),"launcher must mount in the top header");
  assert.ok(!uiSource.includes('querySelector("#aiAssistantMount")'),"launcher must not share the AI Physics Assistant mount");
  assert.ok(uiSource.includes("spa-mic"),"microphone control must exist");
  assert.ok(uiSource.includes("Local PDF sources"),"local PDF citations must be rendered");
  assert.ok(uiSource.includes("history:history.slice"),"recent conversation must be provided to the offline engine");
  assert.ok(!uiSource.includes("/api/sanjay-physics-assistant"),"the assistant must not call a server API");
  assert.ok(!uiSource.includes("Gemini"),"the assistant must remain purely offline");

  const manifest = JSON.parse(fs.readFileSync(require.resolve("./pdf-index/manifest.json"),"utf8"));
  const localPdfs = fs.readdirSync(require("node:path").join(__dirname,"..","assets","pdfs"),{recursive:true,withFileTypes:true}).filter(entry => entry.isFile() && /\.pdf$/i.test(entry.name));
  assert.equal(manifest.documents.length,localPdfs.length,"every uploaded Class 9-12 PDF must be indexed");
  assert.equal(manifest.documents.reduce((sum,document) => sum + document.pages,0),5996);
  manifest.documents.forEach(document => assert.ok(fs.existsSync(require("node:path").join(__dirname,"..",document.path)),`missing indexed PDF ${document.path}`));

  assert.ok(databaseBytes < 20 * 1024 * 1024,"academic JSON must stay under 20 MB");
  assert.deepEqual(Object.keys(database.subjects),["Physics","Chemistry","Biology","Mathematics"]);
  Object.entries(database.subjects).forEach(([subject,chapters]) => {
    assert.ok(chapters.length >= 13,`${subject} should cover standard Class 12 chapters`);
    chapters.forEach(chapter => {
      assert.equal(typeof chapter.n,"string");
      assert.ok(Array.isArray(chapter.c) && chapter.c.length > 0,`${chapter.n} needs core concepts`);
      assert.ok(Array.isArray(chapter.f),`${chapter.n} needs a formula list`);
    });
  });
  const serviceWorker = fs.readFileSync(require.resolve("../sw.js"),"utf8");
  assert.ok(serviceWorker.includes("academic-knowledge-12.json"),"academic JSON must be cached offline");
  assert.ok(serviceWorker.includes("pdf-index/class-12.json"),"PDF corpus bundles must be cached offline");

  console.log("Sanjay Physics Assistant: all offline engine tests passed.");
})().catch(error => { console.error(error); process.exitCode = 1; });
