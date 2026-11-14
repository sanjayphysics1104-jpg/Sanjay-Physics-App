"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const script = fs.readFileSync(path.join(root, "script.js"), "utf8");

const additions = [
  ["physics lab", "AC Devices.pdf", "assets/pdfs/class-12/cbse-question-banks/chapter-wise-import", "Alternating Current", 7, 331828],
  ["physics lab", "CHAPTER  2 ElECTROSTATIC AND POTENTIAL.pdf", "assets/pdfs/class-12/cbse-question-banks/chapter-wise-import", "Electric Potential and Capacitance", 35, 1958450],
  ["physics lab", "Earth’s MagneticField & Magnetic Material.pdf", "assets/pdfs/class-12/cbse-question-banks/chapter-wise-import", "Magnetism and Matter", 17, 1675825],
  ["physics lab", "EddyCurrents & Self & Mutual Induction.pdf", "assets/pdfs/class-12/cbse-question-banks/chapter-wise-import", "Electromagnetic Induction", 19, 1533590],
  ["physics lab", "Electromagnetic Induction Laws.pdf", "assets/pdfs/class-12/cbse-question-banks/chapter-wise-import", "Electromagnetic Induction", 17, 1668074],
  ["physics lab", "nuclie.pdf", "assets/pdfs/class-12/legacy", "Nuclei", 24, 5261927],
  ["physics lab", "SEMICONDUCTOR.pdf", "assets/pdfs/class-12/legacy", "Semiconductor Electronics", 18, 3587090],
  ["physics lab", "Projectile-Motion sanjay_Sanjay_Singh_Modified.pdf", "assets/pdfs/class-11/legacy", "Motion in a Plane", 53, 3848673]
];

test("every previously missing CBSE PDF is copied byte-for-byte into its class and category", () => {
  for (const [sourceDir, fileName, destinationDir, chapter, pages, bytes] of additions) {
    const source = path.join(root, sourceDir, fileName);
    const destination = path.join(root, ...destinationDir.split("/"), fileName);
    assert.ok(fs.existsSync(destination), `missing imported PDF: ${fileName}`);
    const sourceContent = fs.readFileSync(source);
    const importedContent = fs.readFileSync(destination);
    assert.equal(importedContent.length, bytes, `size changed: ${fileName}`);
    assert.equal(
      crypto.createHash("sha256").update(importedContent).digest("hex"),
      crypto.createHash("sha256").update(sourceContent).digest("hex"),
      `content changed: ${fileName}`
    );
    assert.ok(script.includes(fileName), `missing app metadata: ${fileName}`);
    assert.ok(script.includes(chapter), `missing chapter metadata: ${fileName}`);
    assert.ok(script.includes(String(pages)), `missing page metadata: ${fileName}`);
  }
});

test("existing Class 10 and 11 question PDFs are exposed in the Question Bank collection", () => {
  const expected = [
    "Class 10 Board electricity.pdf",
    "13. KTG MCQ.pdf",
    "9. Elasticity Objective.pdf",
    "Friction MCQ  (1).pdf",
    "Rotational Motion MCQ.pdf",
    "Thermal Properties Of Matter MCQ.pdf",
    "Thermodynamics MCQ.pdf",
    "Work,_Energy,_Power_And_Collision_MCQ_.pdf",
    "Simple Harmonic Motion MCQ.pdf",
    "Waves MCQ.pdf"
  ];
  assert.match(script, /const IMPORTED_QUESTION_BANK_PDFS = \[/);
  assert.match(script, /\.\.\.IMPORTED_QUESTION_BANK_PDFS/);
  assert.match(script, /saved\.questionBanks\.push\(cloneContentData\(imported\)\)/);
  for (const fileName of expected) assert.ok(script.includes(fileName), `question-bank mapping missing: ${fileName}`);
});
