import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const assistantDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(assistantDir, "..");
const pdfRoot = join(root, "assets", "pdfs");
const outputDir = join(assistantDir, "pdf-index");
const MAX_PAGE_CHARS = 2400;
const AUTHOR = "Sanjay Singh (संजय सिंह)";
const pythonBin = process.env.SANJAY_PYTHON_BIN || "python";
const extractor = join(assistantDir, "extract-pdf-text.py");

function walk(directory) {
  return readdirSync(directory, {withFileTypes:true}).flatMap(entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : (/\.pdf$/i.test(entry.name) ? [path] : []);
  });
}

function clean(value) {
  return String(value || "")
    .replace(/\u0000/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function inferClass(path) {
  const match = path.replaceAll("\\", "/").match(/class-(9|10|11|12)\//i);
  if (!match) throw new Error(`Cannot infer class for ${path}`);
  return `Class ${match[1]}th`;
}

function inferChapter(className, fileName, path) {
  const name = fileName.replace(/\.pdf$/i, "").toLowerCase();
  const has = pattern => pattern.test(name);
  if (className === "Class 9th") {
    if (has(/force|law.*motion/)) return "Force and Laws";
    if (has(/gravitation/)) return "Gravitation";
    if (has(/sound/)) return "Sound";
    if (has(/work.*energy/)) return "Work and Energy";
    return "Motion";
  }
  if (className === "Class 10th") {
    if (has(/magnetic/)) return "Magnetic Effects of Electric Current";
    if (has(/light|reflection|refraction/)) return "Light";
    return "Electricity";
  }
  if (className === "Class 11th") {
    if (has(/thermal propert/)) return "Thermal Properties of Matter";
    if (has(/thermodynamic/)) return "Thermodynamics";
    if (has(/kinetic theory|\bktg\b|13\. ktg/)) return "Kinetic Theory of Gases";
    if (has(/oscillation|simple harmonic|\bshm\b/)) return "Oscillations";
    if (has(/wave/)) return "Waves";
    if (has(/fluid|surface tension|mechanical properties of fluids/)) return "Mechanical Properties of Fluids";
    if (has(/elasticity|mechanical properties of solids/)) return "Mechanical Properties of Solids";
    if (has(/rotational|system of particles/)) return "System of Particles and Rotational Motion";
    if (has(/work.*energy.*power/)) return "Work, Energy and Power";
    if (has(/gravitation/)) return "Gravitation";
    if (has(/friction|laws?_of_motion|laws of motion/)) return "Laws of Motion";
    if (has(/projectile|motion in a plane|motion in two|circular motion/)) return "Motion in a Plane";
    if (has(/straight line|one dimension/)) return "Motion in a Straight Line";
    return "Units and Measurements";
  }
  if (/cbse-question-banks[\\/]cbse_class_12/i.test(path.replaceAll(" ", "_"))) return "CBSE Board Question Bank (All Chapters)";
  if (has(/semiconductor/)) return "Semiconductor Electronics";
  if (has(/nuclei/)) return "Nuclei";
  if (has(/\batoms?\b/)) return "Atoms";
  if (has(/dual nature/)) return "Dual Nature of Radiation and Matter";
  if (has(/wave optics/)) return "Wave Optics";
  if (has(/ray optics/)) return "Ray Optics and Optical Instruments";
  if (has(/electromagnetic wave|em.wave/)) return "Electromagnetic Waves";
  if (has(/alternating|ac current/)) return "Alternating Current";
  if (has(/induction/)) return "Electromagnetic Induction";
  if (has(/magnetism and matter/)) return "Magnetism and Matter";
  if (has(/moving charges|magnetic force|magnetic field|magnetic dipole/)) return "Moving Charges and Magnetism";
  if (has(/potential|capacitance|capacitor/)) return "Electric Potential and Capacitance";
  if (has(/current electricity|resistance|ohm|kirchhoff|potentiometer|cell/)) return "Current Electricity";
  return "Electric Charges and Fields";
}

function inferCategory(fileName, path) {
  const value = `${fileName} ${path}`.toLowerCase();
  if (/cbse-question-banks|question bank|question\.pdf|question$/.test(value)) return "CBSE Board Question Bank";
  if (/mcq|objective/.test(value)) return "MCQ Practice";
  if (/theory|chapter|notes?/.test(value)) return "Theory and Notes";
  return "Study Material";
}

function pageMetadata(text) {
  const figureMatches = [...text.matchAll(/\b(?:fig(?:ure)?\.?\s*\d+(?:\.\d+)*|diagram|graph|ray diagram|circuit diagram)\b/gi)]
    .map(match => match[0].replace(/\s+/g, " "))
    .filter((value,index,array) => array.findIndex(item => item.toLowerCase() === value.toLowerCase()) === index)
    .slice(0, 5);
  const equations = text.split("\n")
    .map(line => line.trim())
    .filter(line => line.length >= 5 && line.length <= 150 && /[=≈∝]|\b(?:sin|cos|tan)\s*θ|\b[A-Za-z]\s*=/.test(line))
    .slice(0, 6);
  return {f:figureMatches, e:equations};
}

function textFor(path) {
  return JSON.parse(execFileSync(pythonBin, [extractor, path], {
    encoding:"utf8", maxBuffer:256 * 1024 * 1024, windowsHide:true
  }));
}

function indexPdf(path) {
  const fileName = basename(path);
  const className = inferClass(path);
  const relativePath = relative(root, path).split(sep).join("/");
  const rawPages = textFor(path);
  const pages = rawPages.map((raw,index) => {
    const fullText = clean(raw);
    const text = fullText.length > MAX_PAGE_CHARS ? `${fullText.slice(0, MAX_PAGE_CHARS)}…` : fullText;
    const metadata = pageMetadata(fullText);
    return {n:index + 1, t:text, ...metadata};
  });
  const stats = statSync(path);
  const id = createHash("sha1").update(relativePath).digest("hex").slice(0, 12);
  return {
    id,
    className,
    chapter:inferChapter(className, fileName, relativePath),
    title:fileName.replace(/\.pdf$/i, ""),
    fileName,
    path:relativePath,
    category:inferCategory(fileName, relativePath),
    author:AUTHOR,
    pages:pages.length,
    bytes:stats.size,
    content:pages
  };
}

if (!existsSync(pdfRoot)) throw new Error(`PDF root not found: ${pdfRoot}`);
mkdirSync(outputDir, {recursive:true});
const documents = walk(pdfRoot).sort((a,b) => a.localeCompare(b)).map(path => {
  process.stdout.write(`Indexing ${relative(root,path)}\n`);
  return indexPdf(path);
});
const bundles = {};
for (const className of ["Class 9th", "Class 10th", "Class 11th", "Class 12th"]) {
  const slug = className.match(/\d+/)[0];
  const docs = documents.filter(document => document.className === className);
  const fileName = `class-${slug}.json`;
  writeFileSync(join(outputDir,fileName), JSON.stringify({version:1,className,documents:docs}), "utf8");
  bundles[className] = `Sanjay_Physics_Assistant/pdf-index/${fileName}`;
}
const manifest = {
  version:1,
  generatedAt:new Date().toISOString(),
  author:AUTHOR,
  classes:bundles,
  documents:documents.map(({content,...document}) => document)
};
writeFileSync(join(outputDir,"manifest.json"), JSON.stringify(manifest), "utf8");
process.stdout.write(`Indexed ${documents.length} PDFs across ${documents.reduce((sum,doc) => sum + doc.pages,0)} pages.\n`);
