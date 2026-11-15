"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

function importFixture() {
  const source = read("script.js");
  const declaration = "const FRICTION_QUIZ_PDF_IMPORT =";
  const start = source.indexOf(declaration);
  const end = source.indexOf("const DEFAULT_DATA", start);
  assert.notEqual(start, -1, "verified quiz import data is missing");
  assert.notEqual(end, -1, "verified quiz import data is not isolated");
  const literal = source.slice(start + declaration.length, end).trim().replace(/;$/, "");
  return vm.runInNewContext(`(${literal})`);
}

test("verified Friction PDF maps to ten complete existing-schema quiz records", () => {
  const fixture = importFixture();
  assert.equal(fixture.fileName, "Friction Quiz Question Bank - Sanjay Singh.pdf");
  assert.equal(fixture.fileSize, 652597);
  assert.equal(fixture.pages, 5);
  assert.equal(fixture.chapter, "Friction");
  assert.equal(fixture.questions.length, 10);
  assert.deepEqual(Array.from(fixture.questions, item => item.answer), [2,0,1,2,3,1,3,3,3,2]);
  fixture.questions.forEach((item, index) => {
    assert.ok(item.question.trim(), `question ${index + 1} is empty`);
    assert.equal(item.options.length, 4, `question ${index + 1} does not have four options`);
    item.options.forEach((option, optionIndex) => assert.ok(option.trim(), `question ${index + 1} option ${optionIndex + 1} is empty`));
    assert.ok(Number.isInteger(item.answer) && item.answer >= 0 && item.answer <= 3, `question ${index + 1} has an invalid answer`);
    assert.ok(item.explanation.trim(), `question ${index + 1} explanation is empty`);
  });
  assert.match(fixture.questions[5].warning, /source context is uncertain/i);
});

test("all source diagrams are preserved as valid lightweight PNG assets", () => {
  const fixture = importFixture();
  const diagramQuestions = fixture.questions.filter(item => item.diagram);
  assert.deepEqual(Array.from(diagramQuestions, item => fixture.questions.indexOf(item) + 1), [2,8,10]);
  diagramQuestions.forEach(item => {
    const bytes = fs.readFileSync(path.join(root, item.diagram));
    assert.deepEqual([...bytes.subarray(0, 8)], [137,80,78,71,13,10,26,10]);
    assert.ok(bytes.length < 100000, `${item.diagram} is unexpectedly large`);
    assert.ok(item.diagramAlt.trim());
  });
});

test("import preview saves into the original quiz collection and student renderer", () => {
  const html = read("index.html");
  const script = read("script.js");
  const worker = read("sw.js");
  assert.match(html, /id="quizPdfImport"/);
  assert.match(html, /id="quizFolderImport"[^>]+webkitdirectory/);
  assert.match(html, /id="quizImportPreview"/);
  assert.match(html, /id="saveQuizImportBtn"/);
  assert.match(script, /data\.quizzes = \[\.\.\.data\.quizzes, \.\.\.records\]/);
  assert.match(script, /finishAdminAdd\(`\$\{records\.length\} quiz questions imported;/);
  assert.match(script, /parseQuizQuestionsFromText/);
  assert.match(script, /ocrQuizImportPage/);
  assert.match(script, /Tesseract\.createWorker/);
  assert.match(script, /const diagram = q\.diagram/);
  assert.match(worker, /question-02-diagram\.png/);
  assert.match(worker, /question-08-diagram\.png/);
  assert.match(worker, /question-10-diagram\.png/);
});

function parserFunctions() {
  const source = read("script.js");
  const names = ["normalizedQuizText", "quizFingerprint", "inferQuizChapter", "parseQuizQuestionsFromText"];
  const declarations = names.map((name, index) => {
    const start = source.indexOf(`function ${name}`);
    const nextName = names[index + 1];
    const end = nextName ? source.indexOf(`function ${nextName}`, start) : source.indexOf("async function extractPdfPageText", start);
    assert.notEqual(start, -1, `${name} is missing`);
    assert.notEqual(end, -1, `${name} boundary is missing`);
    return source.slice(start, end);
  }).join("\n");
  return vm.runInNewContext(`(() => { ${declarations}; return {parseQuizQuestionsFromText, quizFingerprint, inferQuizChapter}; })()`);
}

test("generic bulk parser extracts multiple labeled MCQs without inventing fields", () => {
  const {parseQuizQuestionsFromText} = parserFunctions();
  const sample = `Chapter: Work and Energy
Question 1: Work done by a constant force is
A. F × s
B. F / s
C. F + s
D. zero
Correct Answer: A
Explanation: Work equals force times displacement along the force.
Q.2) SI unit of power is
(A) joule
(B) watt
(C) newton
(D) pascal
Answer: B
Solution: Power is measured in watt.`;
  const records = parseQuizQuestionsFromText(sample, {className:"Class 9th", chapter:"Work and Energy", sourceFile:"sample.pdf"});
  assert.equal(records.length, 2);
  assert.deepEqual(Array.from(records, record => record.options.length), [4,4]);
  assert.deepEqual(Array.from(records, record => record.answer), [0,1]);
  assert.ok(records.every(record => record.explanation));
});

test("incomplete OCR output stays uncertain and duplicate fingerprint ignores punctuation", () => {
  const {parseQuizQuestionsFromText,quizFingerprint,inferQuizChapter} = parserFunctions();
  const [record] = parseQuizQuestionsFromText("1. A partially scanned question\nA) One\nB) Two\nC) Three\nD) Four", {className:"Class 11th", chapter:"Motion"});
  assert.equal(record.answer, null);
  assert.equal(record.explanation, "");
  assert.equal(quizFingerprint(record), quizFingerprint({...record, question:"A partially-scanned question!"}));
  assert.equal(inferQuizChapter("", "Friction Quiz Question Bank.pdf"), "Friction");
});
