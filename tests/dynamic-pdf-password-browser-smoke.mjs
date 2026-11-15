import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {createRequire} from "node:module";
import {fileURLToPath} from "node:url";
import http from "node:http";
import path from "node:path";

const require = createRequire(import.meta.url);
const {chromium} = require("C:/Users/hp/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const server = spawn(process.execPath, [path.join(root, "tests", "ui-test-server.js")], {cwd:root, stdio:"ignore", windowsHide:true});
const origin = "http://127.0.0.1:4173/";

async function waitForServer() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const ready = await new Promise(resolve => {
      const request = http.get(origin, response => { response.resume(); resolve(response.statusCode === 200); });
      request.on("error", () => resolve(false));
    });
    if (ready) return;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error("UI test server did not start");
}

const categories = [
  ["Class 9", "Class 9th"],
  ["Class 10", "Class 10th"],
  ["Class 11", "Class 11th"],
  ["Class 12", "Class 12th"],
  ["NEET", "NEET / JEE"],
  ["JEE", "NEET / JEE"]
];

await waitForServer();
const browser = await chromium.launch({headless:true, executablePath:"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"});
try {
  const page = await browser.newPage({viewport:{width:1440,height:900}});
  await page.goto(origin);
  await page.waitForTimeout(1500);
  await page.evaluate(() => { isAdmin = true; renderAll(); openAdmin("pdf"); });
  await page.locator("#pdfForm:not(.hidden)").waitFor();
  const testPdf = path.join(root, "assets", "pdfs", "class-10", "imported", "Class 10 Board electricity.pdf");
  const uploaded = [];

  for (const [label, className] of categories) {
    const slug = label.toLowerCase().replace(/\s+/g, "-");
    const password = `pw-${slug}-2026`;
    const chapter = `Password test ${label}`;
    await page.locator('#pdfForm select[name="className"]').selectOption(className);
    await page.locator('#pdfForm input[name="chapter"]').fill(chapter);
    await page.locator('#pdfForm input[name="title"]').fill(`${label} protected PDF`);
    const passwordField = page.locator("#pdfForm .pdf-password-field");
    assert.equal(await passwordField.isHidden(), true, `${label}: password starts hidden`);
    await page.locator('#pdfForm input[name="file"]').setInputFiles(testPdf);
    await passwordField.waitFor({state:"visible"});
    const [fileBox, passwordBox] = await Promise.all([
      page.locator("#pdfForm .upload-drop").boundingBox(),
      passwordField.boundingBox()
    ]);
    assert.ok(fileBox && passwordBox && Math.abs(fileBox.y - passwordBox.y) < 2 && passwordBox.x > fileBox.x, `${label}: password is inline after file control`);
    await page.locator('#pdfForm input[name="accessPassword"]').fill(password);
    assert.equal(await page.locator('#pdfForm input[name="accessPassword"]').getAttribute("type"), "password", `${label}: password starts concealed`);
    await page.locator("#pdfPasswordToggle").click();
    assert.equal(await page.locator('#pdfForm input[name="accessPassword"]').getAttribute("type"), "text", `${label}: eye toggle reveals password`);
    await page.locator("#pdfPasswordToggle").click();
    assert.equal(await page.locator('#pdfForm input[name="accessPassword"]').getAttribute("type"), "password", `${label}: eye toggle conceals password again`);
    await page.locator("#pdfForm").evaluate(form => form.requestSubmit());
    await page.waitForFunction(expectedChapter => data.pdfs.some(pdf => pdf.chapter === expectedChapter && pdf.passwordHash), chapter);
    const item = await page.evaluate(expectedChapter => {
      const pdf = data.pdfs.find(entry => entry.chapter === expectedChapter);
      return {id:pdf.id, passwordHash:pdf.passwordHash, hasPlaintext:Object.values(pdf).includes(`pw-${expectedChapter.toLowerCase().replace("password test ", "").replace(/\s+/g, "-")}-2026`)};
    }, chapter);
    assert.equal(item.hasPlaintext, false, `${label}: plaintext password is not stored`);
    uploaded.push({...item, label, password});
  }

  assert.equal(new Set(uploaded.map(item => item.passwordHash)).size, categories.length, "every PDF keeps its own password hash");

  await page.locator('[data-admin-tab="question"]').click();
  await page.locator('#questionForm input[name="chapter"]').fill("Protected question bank test");
  await page.locator('#questionForm input[name="title"]').fill("Protected question set");
  await page.locator('#questionForm input[name="file"]').setInputFiles(testPdf);
  await page.locator("#questionForm .pdf-password-field").waitFor({state:"visible"});
  await page.locator('#questionForm input[name="accessPassword"]').fill("question-bank-pw");
  await page.locator("#questionPasswordToggle").click();
  assert.equal(await page.locator('#questionForm input[name="accessPassword"]').getAttribute("type"), "text", "Question Bank eye toggle reveals password");
  await page.locator("#questionForm").evaluate(form => form.requestSubmit());
  await page.waitForFunction(() => data.questionBanks.some(pdf => pdf.chapter === "Protected question bank test" && pdf.passwordHash));
  uploaded.push(await page.evaluate(() => {
    const pdf = data.questionBanks.find(entry => entry.chapter === "Protected question bank test");
    return {id:pdf.id, passwordHash:pdf.passwordHash, label:"Question Bank", password:"question-bank-pw"};
  }));

  await page.locator('[data-admin-tab="board"]').click();
  await page.locator('#boardForm input[name="title"]').fill("Protected board test");
  await page.locator('#boardForm input[name="file"]').setInputFiles(testPdf);
  await page.locator("#boardForm .pdf-password-field").waitFor({state:"visible"});
  await page.locator('#boardForm input[name="accessPassword"]').fill("board-pw");
  await page.locator("#boardPasswordToggle").click();
  assert.equal(await page.locator('#boardForm input[name="accessPassword"]').getAttribute("type"), "text", "CBSE Board eye toggle reveals password");
  await page.locator("#boardForm").evaluate(form => form.requestSubmit());
  await page.waitForFunction(() => data.boardQuestions.some(pdf => pdf.fileName === "Class 10 Board electricity.pdf" && pdf.passwordHash));
  uploaded.push(await page.evaluate(() => {
    const pdf = [...data.boardQuestions].reverse().find(entry => entry.fileName === "Class 10 Board electricity.pdf" && entry.passwordHash);
    return {id:pdf.id, passwordHash:pdf.passwordHash, label:"CBSE Board", password:"board-pw"};
  }));

  await page.evaluate(() => closeModal(document.querySelector("#adminModal")));

  for (const item of uploaded) {
    await page.evaluate(id => openPdf(id), item.id);
    await page.locator("#dppPasswordModal.open").waitFor();
    await page.locator("#dppPassword").fill("wrong-password");
    await page.locator("#dppPasswordForm").evaluate(form => form.requestSubmit());
    await page.locator("#dppPasswordError").filter({hasText:"Incorrect password"}).waitFor();
    assert.equal(await page.locator("#pdfModal").getAttribute("aria-hidden"), "true", `${item.label}: wrong password blocks access`);
    await page.locator("#dppPassword").fill(item.password);
    await page.locator("#dppPasswordForm").evaluate(form => form.requestSubmit());
    await page.locator("#pdfModal.open").waitFor();
    await page.evaluate(() => closeModal(document.querySelector("#pdfModal")));
  }

  console.log("Dynamic PDF passwords passed for PDF Library (all categories), Question Bank and CBSE Board; Quiz unchanged.");
} finally {
  await browser.close();
  server.kill();
}
