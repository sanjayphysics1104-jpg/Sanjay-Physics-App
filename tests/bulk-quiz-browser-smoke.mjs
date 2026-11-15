import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {createRequire} from "node:module";
import {fileURLToPath} from "node:url";
import http from "node:http";
import {mkdtemp, rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";

const require = createRequire(import.meta.url);
const {chromium} = require("C:/Users/hp/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const server = spawn(process.execPath, [path.join(root, "tests", "ui-test-server.js")], {cwd:root, stdio:"ignore", windowsHide:true});
const origin = "http://127.0.0.1:4173/";
const waitForServer = async () => {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const ready = await new Promise(resolve => {
      const request = http.get(origin, response => { response.resume(); resolve(response.statusCode === 200); });
      request.on("error", () => resolve(false));
    });
    if (ready) return;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error("UI test server did not start");
};

async function authenticate(page) {
  await page.goto(origin);
  await page.evaluate(() => openAdmin("quiz"));
  await page.locator("#adminModal.open").waitFor();
  await page.locator("#adminPin").fill("runtime-test-pin");
  await page.locator("#loginForm").evaluate(form => form.requestSubmit());
  await page.locator("body.admin-mode").waitFor();
  await page.locator('[data-admin-tab="quiz"]').click();
  await page.locator("#quizForm:not(.hidden)").waitFor();
}

async function makeTextQuizPdf(browser, outputPath) {
  const page = await browser.newPage();
  await page.setContent(`<style>body{font:18px Arial;line-height:1.5}</style>
    <h1>Chapter: Work and Energy</h1>
    <p>Question 1: Work done by a constant force is</p><p>A. F × s<br>B. F / s<br>C. F + s<br>D. zero</p>
    <p>Correct Answer: A</p><p>Explanation: Work equals force times displacement along the force.</p>
    <p>Question 2: SI unit of power is</p><p>A. joule<br>B. watt<br>C. newton<br>D. pascal</p>
    <p>Correct Answer: B</p><p>Explanation: Power is measured in watt.</p>`);
  await page.pdf({path:outputPath, format:"A4", printBackground:true});
  await page.close();
}

async function runFlow(browser, viewport, pdfPath) {
  const context = await browser.newContext({viewport});
  const page = await context.newPage();
  page.on("pageerror", error => console.error("PAGE_ERROR", error.message));
  await authenticate(page);
  await page.locator("#quizPdfImport").setInputFiles(pdfPath);
  await page.locator("#quizImportSummary").filter({hasText:"2 found"}).waitFor({timeout:30000});
  const firstSummary = await page.locator("#quizImportSummary").textContent();
  assert.match(firstSummary, /2 validated/);
  assert.equal(await page.locator(".quiz-import-card.validated").count(), 2);
  await page.locator("#saveQuizImportBtn").click();
  await page.locator("#quizImportPreview.hidden").waitFor();
  const imported = await page.evaluate(() => data.quizzes.filter(item => item.chapter === "Work and Energy" && /constant force|unit of power/i.test(item.question)).map(item => ({question:item.question, options:item.options, answer:item.answer, explanation:item.explanation})));
  assert.equal(imported.length, 2);
  assert.equal(imported.flatMap(item => item.options).length, 8);
  assert.deepEqual(imported.map(item => item.answer), [0,1]);
  assert.ok(imported.every(item => item.explanation));

  await page.locator("#quizPdfImport").setInputFiles(pdfPath);
  await page.locator("#quizImportSummary").filter({hasText:"2 duplicate"}).waitFor({timeout:30000});
  assert.equal(await page.locator("#saveQuizImportBtn").isDisabled(), true);
  assert.equal(await page.locator("#quizFolderImport").getAttribute("webkitdirectory"), "");

  await page.locator("#clearQuizImportBtn").click();
  await page.evaluate(() => { closeModal(document.querySelector("#adminModal")); setActiveClass("Class 9th"); startQuiz(); });
  await page.locator("#quizBox .quiz-option").first().waitFor();
  assert.equal(await page.locator("#quizBox .quiz-option").count(), 4);
  assert.ok(await page.locator("#quizQuestion").textContent());
  await context.close();
}

await waitForServer();
const temp = await mkdtemp(path.join(tmpdir(), "sanjay-bulk-quiz-"));
const pdfPath = path.join(temp, "Work and Energy Quiz.pdf");
const browser = await chromium.launch({headless:true, executablePath:"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"});
try {
  await makeTextQuizPdf(browser, pdfPath);
  await runFlow(browser, {width:1440,height:900}, pdfPath);
  await runFlow(browser, {width:412,height:915}, pdfPath);
  console.log("Bulk quiz browser smoke passed on desktop and Android-size viewport.");
} finally {
  await browser.close();
  server.kill();
  await rm(temp, {recursive:true, force:true});
}
