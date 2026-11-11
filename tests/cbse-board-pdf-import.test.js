"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const importDir = path.join(root, "assets", "pdfs", "class-12", "cbse-question-banks", "chapter-wise-import");

const expected = [
  ["Alternating Current  question.pdf","Alternating Current",56,3519185,"426B1556BFA80B9C7494E39F839DA552DA8200E52EB6331552B15F17CA811D30"],
  ["Capacitance.pdf","Electric Potential and Capacitance",35,3875466,"9B32964723263CF16E2992DDEA126CE30F51BC2B5FC1CF145BBA966B62459859"],
  ["CBSE_Class12_Physics_Atoms_Master_Question_Bank_By_Sanjay_Singh.pdf","Atoms",14,2682795,"8CFB680EF71DD1DF1794E314E4982CDA512A6960A1C12554104FFBE69619905F"],
  ["CBSE_Class12_Physics_Dual_Nature_Master_Question_Bank_By_Sanjay_Singh.pdf","Dual Nature of Radiation and Matter",12,2528894,"CA3B1794C8D408413B7DF2C87F09540DA0E2FA51BA47FC9BC1E9C80C3AD4149D"],
  ["CBSE_Class12_Physics_EM_Waves_25_Questions_By_Sanjay_Singh.pdf","Electromagnetic Waves",9,1935229,"0A9F492697515EA67A0862F102A065A5B1AEC43D52EC5763FD498F4C09829863"],
  ["CBSE_Class12_Physics_Nuclei_Master_Question_Bank_By_Sanjay_Singh.pdf","Nuclei",12,2330856,"CC060312D68ECEEBABC7F2A6EC503268098E36DFA587935F469D50FD1AC71CC8"],
  ["CBSE_Class12_Physics_Ray_Optics_40_Questions_By_Sanjay_Singh.pdf","Ray Optics and Optical Instruments",13,2731774,"C84E1C424093D3B6C53AE07852C0A5396EC0086BAEDD4A0260CA222211D15F31"],
  ["CBSE_Class12_Physics_Ray_Optics_Master_Question_Bank_By_Sanjay_Singh.pdf","Ray Optics and Optical Instruments",11,2027036,"602BDAFCF52C069F90646FD49E934BA9D2644EAD0FA221AEBE1BD6BC5DFE6171"],
  ["CBSE_Class12_Physics_Semiconductors_Master_Question_Bank_By_Sanjay_Singh.pdf","Semiconductor Electronics",13,2742850,"DF9DE9E8387CBC1CCAEB2CFFD970B31E3493BB597E7D16997B2AEA971C6F4093"],
  ["CBSE_Class12_Physics_Wave_Optics_Master_Question_Bank_By_Sanjay_Singh.pdf","Wave Optics",14,2619800,"F99EE6A5E8F7CC832FBD6DB85D47B4839F57757E7108577897E37E9C403BDC66"],
  ["Coulombs Law, Electrostatic Field & Electric Dipole.pdf","Electric Charges and Fields",16,1349365,"A8E7C1CA393ECC4A0390B4F4E496BE8E1CB745E0A61E2031BA12BF3D8A778345"],
  ["Current Electricity impotant.pdf","Current Electricity",72,3525977,"7AA2426709653207728E14D0B418F8990A7B7B13880502D07DC1B1E1A5B28B51"],
  ["ELECTRIC CHARGE AND FIELD CBSE QST.pdf","Electric Charges and Fields",52,3350030,"4385DD97BBB4351A0ED897F33532A002BD0E5458ADC87E05F169BBEB0FADF992"],
  ["Electromagnetic Induction question.pdf","Electromagnetic Induction",49,3036048,"795ECEB3675E82085357A2EEC4D7698416ABCC61B512B66D083E0AD515BF8385"],
  ["Electromagnetic Waves question.pdf","Electromagnetic Waves",22,1577806,"1F1F2688A3362A736466C39E1039CFAA8AFCE929F8175E7EA9696E4C114AF199"],
  ["Electrostatic Potential and Capacitance CBSE QST.pdf","Electric Potential and Capacitance",78,4241804,"D633F8F82613A42E73C0DDF0AA150A544C3750B771153714C67BC90E36CD8052"],
  ["Electrostatic Potential QUESTION BANK.pdf","Electric Potential and Capacitance",18,1595312,"530509B1BF9329D2DB422CE1CEE06CC05D63FFCC0C4FA6EE4EE0054E46B9B94B"],
  ["Gauss’sLaw.pdf","Electric Charges and Fields",35,2709598,"9AC071A7F969FF95A19DD706A2AF6138E6EDC7C7B670260B266DE99EC13D8A33"],
  ["Introduction toAlternating Current.pdf","Alternating Current",6,633514,"7AB258A100B9C2D50BFC63A7922C8D458D9D01A503DA0C2ADFC4E8E20239A644"],
  ["Kirchhoff’s Laws &Electric Devices.pdf","Current Electricity",34,2834832,"9329DD517C6D58C6FE5FDC265DC31FA8814E673AC2002F00BC7146681AF70556"],
  ["Magnetic Dipole & Magnetic Field Lines.pdf","Moving Charges and Magnetism",5,623490,"7BB0427B2C7D68CAEF432276EE6E24A6808CE328A0744705D1653888CEE1DCBF"],
  ["Magnetic Field Laws & their Applications.pdf","Moving Charges and Magnetism",39,3130139,"5D28489808331D9BAA6C27BB3CF54EA027D29514FA9860A9846058A72225FF65"],
  ["Magnetic Force & Torque.pdf","Moving Charges and Magnetism",30,3406151,"900A3282D9F1D4F42EA15C600060022EFAD5F9C8CB084E8F53BAB94923286636"],
  ["Magnetism And Matter cbse.pdf","Magnetism and Matter",10,768368,"286F8377BF97A568956586C05C6A07AFB5EAEBB3426A305DE9491C84264CA613"],
  ["Moving Charges and Magnetism question.pdf","Moving Charges and Magnetism",74,4118796,"0A8535B091256F482344DDE31F551E1203FA7B67F0715A0D759F4F64BC84D2F5"],
  ["Physics AC Currents.pdf","Alternating Current",36,3789388,"9311C25250BC65B53E5AAD3014C33776DEFAD0341F5200B1014F6B734EC327B9"],
  ["Potentiometer, Cell & their Combinations.pdf","Current Electricity",23,1810636,"B30AF5ADAC854DD559C5216F24687A8E431C5627E7C807A84767DB7A78553A60"],
  ["Resistance & Ohm’sLaw.pdf","Current Electricity",21,2433053,"310B506A88361326749E6E48DA9C565547F558D387A1AD6DE4E730B44A6FF73F"]
];

test("all source CBSE PDFs are imported byte-for-byte and mapped to existing chapters", () => {
  const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
  assert.equal(expected.length, 28);
  for (const [fileName, chapter, pages, bytes, sha256] of expected) {
    const importedPath = path.join(importDir, fileName);
    assert.ok(fs.existsSync(importedPath), `missing imported PDF: ${fileName}`);
    const content = fs.readFileSync(importedPath);
    assert.equal(content.length, bytes, `size changed: ${fileName}`);
    assert.equal(crypto.createHash("sha256").update(content).digest("hex").toUpperCase(), sha256, `content changed: ${fileName}`);
    assert.ok(script.includes(JSON.stringify([fileName, chapter, pages, bytes])), `missing chapter metadata: ${fileName}`);
  }
});

test("the import is isolated to the existing CBSE board-question collection", () => {
  const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
  assert.match(script, /const IMPORTED_CBSE_BOARD_PDF_PATH = "assets\/pdfs\/class-12\/cbse-question-banks\/chapter-wise-import";/);
  assert.match(script, /boardQuestions:\s*\[\.\.\.RECOVERED_CBSE_BOARD_QUESTIONS,\s*\.\.\.IMPORTED_CBSE_BOARD_PDFS\]/);
  assert.match(script, /IMPORTED_CBSE_BOARD_PDFS\.forEach\(imported =>/);
});
