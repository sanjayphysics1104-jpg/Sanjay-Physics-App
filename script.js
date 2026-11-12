"use strict";

const CLASSES = ["Class 9th", "Class 10th", "Class 11th", "Class 12th", "NEET / JEE", "Other Subjects"];
const STORAGE_KEY = "ssp_content_v1";
const PIN_KEY = "ssp_admin_pin_v1";
const SESSION_KEY = "ssp_admin_session";
const ADMIN_TOKEN_KEY = "ssp_admin_token";
const MAX_PDF_BYTES = 40 * 1024 * 1024;
const MAX_PDF_LABEL = "40 MB";
const PDF_DB_NAME = "ssp_pdf_files_v1";
const PDF_STORE_NAME = "pdfFiles";
// CBSE board-question PDFs are deliberately isolated from the legacy PDF
// library. Never reuse PDF_DB_NAME/PDF_STORE_NAME for board uploads.
const BOARD_PDF_DB_NAME = "ssp_cbse_board_pdf_files_v1";
const BOARD_PDF_STORE_NAME = "boardPdfFiles";
const QUESTION_BANK_PDF_DB_NAME = "ssp_question_bank_pdf_files_v1";
const QUESTION_BANK_PDF_STORE_NAME = "questionBankPdfFiles";
const BUNDLED_PDF_MEDIA_BASE = "https://media.githubusercontent.com/media/sanjayphysics1104-jpg/Sanjay-Physics-App/main/";
const cloneContentData = value => typeof structuredClone === "function"
  ? structuredClone(value)
  : JSON.parse(JSON.stringify(value));
const IMPORTED_CLASS_9_PDF_PATH = "assets/pdfs/class-9/imported";
const IMPORTED_CLASS_9_PDFS = [
  ["Force and Laws of Motion.pdf","Force and Laws",8,1189410],
  ["Gravitation.pdf","Gravitation",11,1588365],
  ["Kinematics & Motion.pdf","Motion",6,156175],
  ["motion.pdf","Motion",12,1561254],
  ["Sound.pdf","Sound",14,2155620],
  ["Work and Energy.pdf","Work and Energy",10,1332873]
].map(([fileName,chapter,pages,fileSize],index) => ({
  id:`imported-9-${String(index + 1).padStart(2,"0")}`,
  className:"Class 9th",
  chapter,
  title:fileName.replace(/\.pdf$/i,""),
  fileName,
  url:`${IMPORTED_CLASS_9_PDF_PATH}/${fileName}`,
  pages,
  fileSize,
  isImportedStatic:true
}));
const IMPORTED_CLASS_10_PDF_PATH = "assets/pdfs/class-10/imported";
const IMPORTED_CLASS_10_PDFS = [
  ["Class 10 Board electricity.pdf","Electricity",4,121140],
  ["Class 10 Physics electricity.pdf","Electricity",3,150839],
  ["Electricity.pdf","Electricity",43,5837046],
  ["Light Reflection and Refraction.pdf","Light",37,4402784],
  ["Magnetic Effects of Electric Current.pdf","Magnetic Effects of Electric Current",35,6025195]
].map(([fileName,chapter,pages,fileSize],index) => ({
  id:`imported-10-${String(index + 1).padStart(2,"0")}`,
  className:"Class 10th",
  chapter,
  title:fileName.replace(/\.pdf$/i,""),
  fileName,
  url:`${IMPORTED_CLASS_10_PDF_PATH}/${fileName}`,
  pages,
  fileSize,
  isImportedStatic:true
}));
const IMPORTED_CLASS_11_PDF_PATH = "assets/pdfs/class-11/imported";
const IMPORTED_CLASS_11_PDFS = [
  ["circular motion.pdf","Motion in a Plane",22,3050915],
  ["Chapter 10 Thermal Properties of Matter.pdf","Thermal Properties of Matter",76,19550444],
  ["Chapter 11 Thermodynamics.pdf","Thermodynamics",66,16090116],
  ["Chapter 12 Kinetic Theory of Gases.pdf","Kinetic Theory of Gases",52,11651975],
  ["Chapter 13 Oscillations.pdf","Oscillations",72,16316835],
  ["Chapter 14 Waves.pdf","Waves",76,17879409],
  ["Simple Harmonic Motion MCQ.pdf","Oscillations",47,8279178],
  ["Simple Harmonic Motion part theory.pdf","Oscillations",12,2315292],
  ["Wave Theory.pdf","Waves",22,4318232],
  ["Waves MCQ.pdf","Waves",60,11704549]
].map(([fileName,chapter,pages,fileSize],index) => ({
  id:`imported-11-${String(index + 1).padStart(2,"0")}`,
  className:"Class 11th",
  chapter,
  title:fileName.replace(/\.pdf$/i,""),
  fileName,
  url:`${IMPORTED_CLASS_11_PDF_PATH}/${fileName}`,
  pages,
  fileSize,
  isImportedStatic:true
}));
const LEGACY_CLASS_12_PDF_PATH = "assets/pdfs/class-12/legacy";
const RECOVERED_CLASS_12_PDFS = [
  {id:"legacy-12-electric-charges-fields",chapter:"Electric Charges and Fields",title:"Electric Charges and Fields",fileName:"ELECTRIC CHARGES AND FIELDS.pdf",pages:1},
  {id:"legacy-12-potential-capacitance",chapter:"Electric Potential and Capacitance",title:"Electrostatic Potential and Capacitance",fileName:"ELECTOSTAIC POTENTIAL AND CAPACITANCE.pdf",pages:1},
  {id:"legacy-12-current-electricity",chapter:"Current Electricity",title:"Current Electricity",fileName:"current electricity.pdf",pages:1},
  {id:"legacy-12-moving-charges",chapter:"Moving Charges and Magnetism",title:"Moving Charges and Magnetism",fileName:"MOVING CHARGES AND MAGNETISM.pdf",pages:1},
  {id:"legacy-12-magnetism-matter",chapter:"Magnetism and Matter",title:"Magnetism and Matter",fileName:"MAGNETISM AND MATTER.pdf",pages:1},
  {id:"legacy-12-emi",chapter:"Electromagnetic Induction",title:"Electromagnetic Induction",fileName:"ELECTROMAGNETIC INDUCTION.pdf",pages:1},
  {id:"legacy-12-alternating-current",chapter:"Alternating Current",title:"Alternating Current",fileName:"ALTERNATING CURRENT.pdf",pages:1},
  {id:"legacy-12-em-waves",chapter:"Electromagnetic Waves",title:"Electromagnetic Waves",fileName:"ELECTROMAGNETIC WAVE.pdf",pages:1},
  {id:"legacy-12-ray-optics",chapter:"Ray Optics and Optical Instruments",title:"Ray Optics and Optical Instruments",fileName:"RAY OPTICS AND OPTICAL INSTRUMENTS.pdf",pages:1},
  {id:"legacy-12-wave-optics",chapter:"Wave Optics",title:"Wave Optics",fileName:"WAVE OPTICS.pdf",pages:1},
  {id:"legacy-12-dual-nature",chapter:"Dual Nature of Radiation and Matter",title:"Dual Nature of Radiation and Matter",fileName:"DUAL NATURE OF RADIATION AND MATTER.pdf",pages:1},
  {id:"legacy-12-atoms",chapter:"Atoms",title:"Atoms",fileName:"ATOMS.pdf",pages:1}
].map(item => ({...item,className:"Class 12th",url:`${LEGACY_CLASS_12_PDF_PATH}/${item.fileName}`,fileSize:0,isRecoveredLegacy:true}));
const LEGACY_CLASS_11_PDF_PATH = "assets/pdfs/class-11/legacy";
const RECOVERED_CLASS_11_PDFS = [
  ["13. KTG MCQ.pdf","Kinetic Theory of Gases"],
  ["9. Elasticity Objective.pdf","Mechanical Properties of Solids"],
  ["9. Elasticity Theory.pdf","Mechanical Properties of Solids"],
  ["Chapter 10 Thermal Properties of Matter.pdf","Thermal Properties of Matter"],
  ["Chapter 2 Motion in a Straight Line (1).pdf","Motion in a Straight Line"],
  ["Chapter 3 Motion in a Plane.pdf","Motion in a Plane"],
  ["Chapter 4 Laws Of Motion.pdf","Laws of Motion"],
  ["Chapter 5 Work Energy and Power.pdf","Work, Energy and Power"],
  ["Chapter 6 System of Particles and Rotational Motion.pdf","System of Particles and Rotational Motion"],
  ["Chapter 7 Gravitation.pdf","Gravitation"],
  ["Chapter 8 Mechanical Properties of Solids.pdf","Mechanical Properties of Solids"],
  ["Chapter 9 Mechanical Properties of Fluids.pdf","Mechanical Properties of Fluids"],
  ["Fluid Mechanics.pdf","Mechanical Properties of Fluids"],
  ["Friction MCQ  (1).pdf","Laws of Motion"],
  ["Friction Theory.pdf","Laws of Motion"],
  ["Fundamentals_Mathematics_And_Vectors.pdf","Units, Measurements and Vectors"],
  ["Gravitation Theory.pdf","Gravitation"],
  ["Horizontal_Projectile_Motion_Complete_Learning_Module_Made_by_Sanjay_Singh.pdf","Motion in a Plane"],
  ["KTG.pdf","Kinetic Theory of Gases"],
  ["Laws_of_Motion_Sanjay_Singh_v4.pdf","Laws of Motion"],
  ["Motion In One Dimension (Theory + Sample Problem).pdf","Motion in a Straight Line"],
  ["Motion in Two Dimension-1 projectile.pdf","Motion in a Plane"],
  ["PHYSICS - LAWS OF MOTION - Part 1.pdf","Laws of Motion"],
  ["PHYSICS - LAWS OF MOTION - Part 2.pdf","Laws of Motion"],
  ["Rotational Motion MCQ.pdf","System of Particles and Rotational Motion"],
  ["Rotational Motion Theory.pdf","System of Particles and Rotational Motion"],
  ["sanjy projectile.pdf","Motion in a Plane"],
  ["Surface Tension.pdf","Mechanical Properties of Fluids"],
  ["Thermal Properties Of Matter MCQ.pdf","Thermal Properties of Matter"],
  ["Thermal properties Of Matter.pdf","Thermal Properties of Matter"],
  ["Thermodynamics MCQ.pdf","Thermodynamics"],
  ["Thermodynamics Theory.pdf","Thermodynamics"],
  ["Units, Dimensions and Measurements Theory Errorless Physics.pdf","Units and Measurements"],
  ["Work, Energy, Power And Collision Theory.pdf","Work, Energy and Power"],
  ["Work,_Energy,_Power_And_Collision_MCQ_.pdf","Work, Energy and Power"]
].map(([fileName,chapter],index) => ({id:`recovered-11-${String(index + 1).padStart(2,"0")}`,className:"Class 11th",chapter,title:fileName.replace(/\.pdf$/i,""),fileName,url:`${LEGACY_CLASS_11_PDF_PATH}/${fileName}`,pages:1,fileSize:0,isRecoveredLegacy:true}));
const BOARD_CHAPTERS = [
  "Electric Charges and Fields",
  "Electric Potential and Capacitance",
  "Current Electricity",
  "Moving Charges and Magnetism",
  "Magnetism and Matter",
  "Electromagnetic Induction",
  "Alternating Current",
  "Electromagnetic Waves",
  "Ray Optics and Optical Instruments",
  "Wave Optics",
  "Dual Nature of Radiation and Matter",
  "Atoms",
  "Nuclei",
  "Semiconductor Electronics"
];
const RECOVERED_CBSE_BOARD_FILE = "CBSE_Class_12_Physics_Question_Bank_2022-2026.pdf";
const RECOVERED_CBSE_BOARD_PATH = `assets/pdfs/class-12/cbse-question-banks/${RECOVERED_CBSE_BOARD_FILE}`;
const RECOVERED_CBSE_BOARD_QUESTIONS = BOARD_CHAPTERS.map((chapter,index) => ({
  id:`recovered-cbse-12-${String(index + 1).padStart(2,"0")}`,
  className:"Class 12th",
  chapter,
  title:`${chapter} — ${RECOVERED_CBSE_BOARD_FILE.replace(/\.pdf$/i,"")}`,
  documentLabel:RECOVERED_CBSE_BOARD_FILE.replace(/\.pdf$/i,""),
  fileName:RECOVERED_CBSE_BOARD_FILE,
  url:RECOVERED_CBSE_BOARD_PATH,
  blobKey:"",
  fileSize:106981304,
  pages:1,
  years:"2022–2026",
  isRecoveredLegacy:true
}));
const IMPORTED_CBSE_BOARD_PDF_PATH = "assets/pdfs/class-12/cbse-question-banks/chapter-wise-import";
const IMPORTED_CBSE_BOARD_PDFS = [
  ["Alternating Current  question.pdf","Alternating Current",56,3519185],
  ["Capacitance.pdf","Electric Potential and Capacitance",35,3875466],
  ["CBSE_Class12_Physics_Atoms_Master_Question_Bank_By_Sanjay_Singh.pdf","Atoms",14,2682795],
  ["CBSE_Class12_Physics_Dual_Nature_Master_Question_Bank_By_Sanjay_Singh.pdf","Dual Nature of Radiation and Matter",12,2528894],
  ["CBSE_Class12_Physics_EM_Waves_25_Questions_By_Sanjay_Singh.pdf","Electromagnetic Waves",9,1935229],
  ["CBSE_Class12_Physics_Nuclei_Master_Question_Bank_By_Sanjay_Singh.pdf","Nuclei",12,2330856],
  ["CBSE_Class12_Physics_Ray_Optics_40_Questions_By_Sanjay_Singh.pdf","Ray Optics and Optical Instruments",13,2731774],
  ["CBSE_Class12_Physics_Ray_Optics_Master_Question_Bank_By_Sanjay_Singh.pdf","Ray Optics and Optical Instruments",11,2027036],
  ["CBSE_Class12_Physics_Semiconductors_Master_Question_Bank_By_Sanjay_Singh.pdf","Semiconductor Electronics",13,2742850],
  ["CBSE_Class12_Physics_Wave_Optics_Master_Question_Bank_By_Sanjay_Singh.pdf","Wave Optics",14,2619800],
  ["Coulombs Law, Electrostatic Field & Electric Dipole.pdf","Electric Charges and Fields",16,1349365],
  ["Current Electricity impotant.pdf","Current Electricity",72,3525977],
  ["ELECTRIC CHARGE AND FIELD CBSE QST.pdf","Electric Charges and Fields",52,3350030],
  ["Electromagnetic Induction question.pdf","Electromagnetic Induction",49,3036048],
  ["Electromagnetic Waves question.pdf","Electromagnetic Waves",22,1577806],
  ["Electrostatic Potential and Capacitance CBSE QST.pdf","Electric Potential and Capacitance",78,4241804],
  ["Electrostatic Potential QUESTION BANK.pdf","Electric Potential and Capacitance",18,1595312],
  ["Gauss’sLaw.pdf","Electric Charges and Fields",35,2709598],
  ["Introduction toAlternating Current.pdf","Alternating Current",6,633514],
  ["Kirchhoff’s Laws &Electric Devices.pdf","Current Electricity",34,2834832],
  ["Magnetic Dipole & Magnetic Field Lines.pdf","Moving Charges and Magnetism",5,623490],
  ["Magnetic Field Laws & their Applications.pdf","Moving Charges and Magnetism",39,3130139],
  ["Magnetic Force & Torque.pdf","Moving Charges and Magnetism",30,3406151],
  ["Magnetism And Matter cbse.pdf","Magnetism and Matter",10,768368],
  ["Moving Charges and Magnetism question.pdf","Moving Charges and Magnetism",74,4118796],
  ["Physics AC Currents.pdf","Alternating Current",36,3789388],
  ["Potentiometer, Cell & their Combinations.pdf","Current Electricity",23,1810636],
  ["Resistance & Ohm’sLaw.pdf","Current Electricity",21,2433053]
].map(([fileName,chapter,pages,fileSize],index) => {
  const documentLabel = fileName.replace(/\.pdf$/i, "");
  return {
    id:`imported-cbse-12-${String(index + 1).padStart(2,"0")}`,
    className:"Class 12th",
    chapter,
    title:`${chapter} — ${documentLabel}`,
    documentLabel,
    fileName,
    url:`${IMPORTED_CBSE_BOARD_PDF_PATH}/${fileName}`,
    blobKey:"",
    fileSize,
    pages,
    years:"Chapter-wise CBSE questions",
    isImportedStatic:true
  };
});

const DEFAULT_DATA = {
  boardQuestions: [...RECOVERED_CBSE_BOARD_QUESTIONS, ...IMPORTED_CBSE_BOARD_PDFS],
  videos: [
    {id:"v1",className:"Class 9th",chapter:"Motion",title:"Motion: Distance, Displacement & Speed",url:"https://www.youtube.com/watch?v=ZM8ECpBuQYE",duration:"18 min"},
    {id:"v2",className:"Class 9th",chapter:"Force and Laws",title:"Newton's Laws of Motion Explained",url:"https://www.youtube.com/watch?v=kKKM8Y-u7ds",duration:"24 min"},
    {id:"v3",className:"Class 9th",chapter:"Gravitation",title:"Universal Law of Gravitation",url:"https://www.youtube.com/watch?v=MTY1Kje0yLg",duration:"21 min"},
    {id:"v4",className:"Class 10th",chapter:"Light",title:"Reflection and Refraction of Light",url:"https://www.youtube.com/watch?v=acQ3qUtr6Mc",duration:"26 min"},
    {id:"v5",className:"Class 10th",chapter:"Electricity",title:"Electric Current and Ohm's Law",url:"https://www.youtube.com/watch?v=mc979OhitAg",duration:"28 min"},
    {id:"v6",className:"Class 11th",chapter:"Kinematics",title:"Motion in a Straight Line",url:"https://www.youtube.com/watch?v=ZM8ECpBuQYE",duration:"32 min"},
    {id:"v7",className:"Class 11th",chapter:"Thermodynamics",title:"Laws of Thermodynamics",url:"https://www.youtube.com/watch?v=NyOYW07-L5g",duration:"30 min"},
    {id:"v8",className:"Class 12th",chapter:"Electrostatics",title:"Electric Charges and Fields",url:"https://www.youtube.com/watch?v=mc979OhitAg",duration:"35 min"},
    {id:"v9",className:"NEET / JEE",chapter:"Mechanics",title:"Mechanics: High-Yield Revision",url:"https://www.youtube.com/watch?v=kKKM8Y-u7ds",duration:"42 min"}
  ],
  pdfs: [
    {id:"p1",className:"Class 9th",chapter:"Motion",title:"Motion — Complete Notes",url:"",pages:128},
    {id:"p2",className:"Class 9th",chapter:"Force and Laws",title:"Force & Laws — Formula Book",url:"",pages:126},
    {id:"p3",className:"Class 9th",chapter:"Gravitation",title:"Gravitation — Revision Module",url:"",pages:130},
    {id:"p4",className:"Class 9th",chapter:"Work and Energy",title:"Work, Energy & Power",url:"",pages:125},
    {id:"p5",className:"Class 10th",chapter:"Light",title:"Light — Complete Notes",url:"",pages:128},
    {id:"p6",className:"Class 10th",chapter:"Electricity",title:"Electricity — Question Notes",url:"",pages:127},
    {id:"p7",className:"Class 11th",chapter:"Kinematics",title:"Kinematics Master Module",url:"",pages:130},
    {id:"p8",className:"Class 11th",chapter:"Thermodynamics",title:"Thermodynamics Notes",url:"",pages:126},
    ...IMPORTED_CLASS_9_PDFS,
    ...IMPORTED_CLASS_10_PDFS,
    ...IMPORTED_CLASS_11_PDFS,
    ...RECOVERED_CLASS_11_PDFS,
    ...RECOVERED_CLASS_12_PDFS,
    {id:"p11",className:"NEET / JEE",chapter:"Mechanics",title:"Mechanics Rank Booster",url:"",pages:130},
    {id:"p12",className:"NEET / JEE",chapter:"Modern Physics",title:"Modern Physics Quick Book",url:"",pages:125}
  ],
  questionBanks: [
    {id:"b1",className:"Class 9th",chapter:"Motion",title:"Motion Practice Set",count:35,url:""},
    {id:"b2",className:"Class 9th",chapter:"Force and Laws",title:"Force & Laws Challenge",count:30,url:""},
    {id:"b3",className:"Class 9th",chapter:"Gravitation",title:"Gravitation Numericals",count:25,url:""},
    {id:"b4",className:"Class 9th",chapter:"Work and Energy",title:"Work & Energy Drill",count:28,url:""},
    {id:"b5",className:"Class 10th",chapter:"Light",title:"Light Board Practice",count:40,url:""},
    {id:"b6",className:"Class 10th",chapter:"Electricity",title:"Electricity Numericals",count:32,url:""},
    {id:"b7",className:"Class 11th",chapter:"Kinematics",title:"Kinematics Problem Set",count:45,url:""},
    {id:"b8",className:"Class 12th",chapter:"Electrostatics",title:"Electrostatics Problems",count:42,url:""},
    {id:"b9",className:"NEET / JEE",chapter:"Mechanics",title:"Mechanics PYQ Drill",count:60,url:""}
  ],
  quizzes: [
    {id:"q1",className:"Class 9th",chapter:"Motion",question:"Which quantity describes the shortest distance from the initial to the final position?",options:["Distance","Displacement","Speed","Path length"],answer:1,explanation:"Displacement is the straight-line change in position, including direction."},
    {id:"q2",className:"Class 9th",chapter:"Force and Laws",question:"The SI unit of force is:",options:["Joule","Pascal","Newton","Watt"],answer:2,explanation:"Force is measured in newtons (N), where 1 N = 1 kg·m/s²."},
    {id:"q3",className:"Class 9th",chapter:"Gravitation",question:"An object's weight on the Moon is approximately what fraction of its weight on Earth?",options:["1/2","1/4","1/6","Same"],answer:2,explanation:"The Moon's gravitational acceleration is approximately one-sixth of Earth's."},
    {id:"q4",className:"Class 10th",chapter:"Light",question:"The image formed by a plane mirror is:",options:["Real and inverted","Virtual and erect","Real and enlarged","Virtual and inverted"],answer:1,explanation:"A plane mirror always forms a virtual, erect image of the same size."},
    {id:"q5",className:"Class 10th",chapter:"Electricity",question:"Ohm's law is expressed as:",options:["V = IR","P = VI","Q = It","E = Pt"],answer:0,explanation:"At constant temperature, voltage is proportional to current: V = IR."},
    {id:"q6",className:"Class 11th",chapter:"Kinematics",question:"The slope of a velocity–time graph represents:",options:["Displacement","Acceleration","Speed","Momentum"],answer:1,explanation:"Change in velocity per unit time is acceleration."},
    {id:"q7",className:"Class 11th",chapter:"Thermodynamics",question:"For an isolated system, the first law implies total energy is:",options:["Increasing","Decreasing","Conserved","Zero"],answer:2,explanation:"Energy can change form, but the total energy of an isolated system remains constant."},
    {id:"q8",className:"Class 12th",chapter:"Electrostatics",question:"The electric field inside a conductor in electrostatic equilibrium is:",options:["Maximum","Zero","Infinite","Variable"],answer:1,explanation:"Free charges rearrange until the internal electric field becomes zero."},
    {id:"q9",className:"Class 12th",chapter:"Optics",question:"The phenomenon that establishes the wave nature of light is:",options:["Photoelectric effect","Interference","Compton effect","Pair production"],answer:1,explanation:"Interference is a characteristic wave phenomenon."},
    {id:"q10",className:"NEET / JEE",chapter:"Mechanics",question:"If net external force on a system is zero, its total momentum:",options:["Becomes zero","Is conserved","Always increases","Always decreases"],answer:1,explanation:"This is the law of conservation of linear momentum."},
    {id:"q11",className:"NEET / JEE",chapter:"Modern Physics",question:"The energy of a photon is proportional to its:",options:["Wavelength","Frequency","Amplitude","Speed"],answer:1,explanation:"Photon energy is E = hν, so it is directly proportional to frequency."}
  ]
};

let data = loadData();
let activeClass = "Class 9th";
let isAdmin = location.protocol === "file:" && sessionStorage.getItem(SESSION_KEY) === "true";
let pendingDelete = null;
let deferredInstallPrompt = null;
let activeQuiz = [];
let quizIndex = 0;
let quizScore = 0;
let answered = false;
let currentPdf = null;
let currentPage = 1;
let currentPdfUrl = "";
let activePdfObjectUrl = null;
let readerDocuments = [];
let currentPdfCollection = "pdfs";
let pdfLoadToken = 0;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const uid = prefix => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
const escapeHTML = value => String(value ?? "").replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));

function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || !saved.videos || !saved.pdfs || !saved.questionBanks || !saved.quizzes) return cloneContentData(DEFAULT_DATA);
    saved.boardQuestions = Array.isArray(saved.boardQuestions) ? saved.boardQuestions : [];
    // Reattach the protected on-disk legacy files for browsers/profiles that do
    // not have the original IndexedDB blobs. Existing uploaded metadata wins,
    // but receives a static fallback URL to the recovered file.
    [...IMPORTED_CLASS_9_PDFS, ...IMPORTED_CLASS_10_PDFS, ...IMPORTED_CLASS_11_PDFS, ...RECOVERED_CLASS_11_PDFS, ...RECOVERED_CLASS_12_PDFS].forEach(recovered => {
      const existing = saved.pdfs.find(pdf => pdf.fileName === recovered.fileName);
      if (existing) existing.fallbackUrl = recovered.url;
      else saved.pdfs.push(cloneContentData(recovered));
    });
    RECOVERED_CBSE_BOARD_QUESTIONS.forEach(recovered => {
      const existing = saved.boardQuestions.find(pdf => pdf.chapter === recovered.chapter && (pdf.fileName === recovered.fileName || pdf.url === recovered.url));
      if (!existing) saved.boardQuestions.push(cloneContentData(recovered));
    });
    IMPORTED_CBSE_BOARD_PDFS.forEach(imported => {
      const existing = saved.boardQuestions.find(pdf => pdf.chapter === imported.chapter && (pdf.fileName === imported.fileName || pdf.url === imported.url));
      if (!existing) saved.boardQuestions.push(cloneContentData(imported));
    });
    return saved;
  } catch { return cloneContentData(DEFAULT_DATA); }
}

function saveData() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); return true; }
  catch (error) { toast("Browser storage is full. Use a PDF link or remove older uploads.", true); return false; }
}

function filtered(collection) { return collection.filter(item => item.className === activeClass); }

function renderAll() {
  renderVideos(); renderPdfs(); renderQuestionBanks(); renderQuizAdmin(); renderBoardQuestions(); renderBoardAdmin(); updateStats();
  renderNavigationLegs();
  $("#activeClassLabel").textContent = activeClass;
  $("#quizClassName").textContent = activeClass;
  document.body.classList.toggle("admin-mode", isAdmin);
  $$(".admin-only").forEach(el => el.style.display = isAdmin ? "" : "none");
  $("#adminButtonText").textContent = isAdmin ? "Admin Dashboard" : "Admin Login";
}

function boardQuestionsFor(chapter) {
  return data.boardQuestions.filter(item => item.chapter === chapter);
}

function boardQuestionFor(chapter) { return boardQuestionsFor(chapter)[0]; }

function renderBoardQuestions() {
  const host = $("#boardChapterList");
  if (!host) return;
  const available = BOARD_CHAPTERS.filter(chapter => boardQuestionsFor(chapter).length).length;
  $("#boardAvailableCount").textContent = available;
  const search = $("#boardLibrarySearch")?.value.trim().toLowerCase() || "";
  const select = $("#boardChapterFilter");
  const chapters = [...BOARD_CHAPTERS].sort((a, b) => a.localeCompare(b));
  const previous = select?.value || "all";
  if (select) {
    select.innerHTML = `<option value="all">All chapters</option>${chapters.map(chapter => `<option value="${escapeHTML(chapter)}">${escapeHTML(chapter)}</option>`).join("")}`;
    select.value = chapters.includes(previous) ? previous : "all";
  }
  const selectedChapter = select?.value || "all";
  const visibleChapters = BOARD_CHAPTERS.filter(chapter =>
    (selectedChapter === "all" || chapter === selectedChapter) && chapter.toLowerCase().includes(search)
  );
  host.innerHTML = visibleChapters.length ? visibleChapters.map(chapter => {
    const documents = boardQuestionsFor(chapter);
    const item = documents[0];
    const chapterNumber = BOARD_CHAPTERS.indexOf(chapter) + 1;
    return `<article class="content-card pdf-card board-pdf-card${item ? " is-ready" : " is-pending"}" ${item ? `data-open-board-pdf="${item.id}" tabindex="0" role="button" aria-label="Read ${escapeHTML(chapter)} CBSE question bank"` : ""}>
      ${isAdmin ? `<label class="board-card-upload">${item ? "Add PDFs" : "Upload PDFs"}<input type="file" accept="application/pdf" multiple data-max-bytes="41943040" data-board-upload="${escapeHTML(chapter)}"></label>` : ""}
      <div class="pdf-cover">P</div>
      <div class="card-meta"><span>${escapeHTML(chapter)}</span><span>CH ${String(chapterNumber).padStart(2, "0")}</span></div>
      <h3>${escapeHTML(chapter)}</h3>
      <p>${item ? `${documents.length} independent PDF${documents.length === 1 ? "" : "s"} • Questions with solutions` : "CBSE question-bank PDF awaiting upload"}</p>
      ${documents.length ? `<div class="chapter-document-preview">${documents.map(document => `<span title="${escapeHTML(document.fileName || document.documentLabel || document.title)}">${escapeHTML(document.documentLabel || document.fileName || document.title)}</span>`).join("")}</div>` : ""}
      <div class="open-row"><span>${item ? "Browse PDFs" : "Not uploaded"}</span><span>${item ? "→" : "—"}</span></div>
    </article>`;
  }).join("") : emptyState("No CBSE chapters found", "Try another chapter or clear the search.");
}

function renderBoardAdmin() {
  const host = $("#boardAdminList");
  if (!host || !isAdmin) { if (host) host.innerHTML = ""; return; }
  host.innerHTML = BOARD_CHAPTERS.map((chapter, index) => {
    const documents = boardQuestionsFor(chapter);
    const item = documents[0];
    return `<div class="board-admin-row">
      <span class="board-admin-number">${String(index + 1).padStart(2, "0")}</span>
      <div><strong>${escapeHTML(chapter)}</strong><small>${item ? `${documents.length} PDF${documents.length === 1 ? "" : "s"}: ${escapeHTML(documents.map(document => document.documentLabel || document.fileName || "PDF").join(", "))}` : "No PDF uploaded"}</small></div>
      <label class="board-upload-btn">Add PDFs<input type="file" accept="application/pdf" multiple data-max-bytes="41943040" data-board-upload="${escapeHTML(chapter)}"></label>
      ${documents.length ? `<div class="board-admin-actions">${documents.map(document => `<button class="board-remove-btn" type="button" data-delete="boardQuestions" data-id="${document.id}" data-question-id="${document.id}" aria-label="Delete CBSE question PDF: ${escapeHTML(document.documentLabel || document.fileName || "PDF")}">Delete ${escapeHTML(document.documentLabel || document.fileName || "PDF")}</button>`).join("")}</div>` : ""}
    </div>`;
  }).join("");
}

function renderQuizAdmin() {
  const host = $("#quizAdminList");
  if (!host || !isAdmin) { if (host) host.innerHTML = ""; return; }
  const items = filtered(data.quizzes);
  host.innerHTML = items.length ? items.map(item => `<div class="quiz-admin-item"><span>${escapeHTML(item.question)}</span><button type="button" data-edit-quiz="${item.id}">Edit</button><button type="button" data-delete="quizzes" data-id="${item.id}" data-question-id="${item.id}" aria-label="Delete question: ${escapeHTML(item.question)}">Delete</button></div>`).join("") : `<p class="form-error">No questions in this category.</p>`;
}

function renderVideos() {
  const items = filtered(data.videos);
  $("#videoGrid").innerHTML = items.length ? items.map(item => `
    <article class="content-card video-card">
      ${isAdmin ? `<button class="delete-btn" data-delete="videos" data-id="${item.id}" aria-label="Delete ${escapeHTML(item.title)}">Delete</button>` : ""}
      <button class="video-thumb" data-play="${item.id}" aria-label="Play ${escapeHTML(item.title)}"><span class="play-button">▶</span></button>
      <div class="card-body"><div class="card-meta"><span>${escapeHTML(item.chapter)}</span><span>${escapeHTML(item.duration || "Video")}</span></div><h3>${escapeHTML(item.title)}</h3><div class="card-action"><span>Concept lecture</span><button data-play="${item.id}">Watch now →</button></div></div>
    </article>`).join("") : emptyState("No lectures yet", "Admin can add the first lecture for this category.");
}

function renderPdfs() {
  const search = $("#librarySearch").value.trim().toLowerCase();
  const chapter = $("#pdfChapterFilter").value;
  const base = filtered(data.pdfs);
  const chapters = uniqueChapters(base);
  updateChapterSuggestions();
  const select = $("#pdfChapterFilter");
  const previous = select.value;
  select.innerHTML = `<option value="all">All chapters</option>${chapters.map(c => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join("")}`;
  select.value = chapters.includes(previous) ? previous : "all";
  const actualChapter = select.value;
  const items = base.filter(item => (actualChapter === "all" || item.chapter === actualChapter) && `${item.title} ${item.fileName || ""} ${item.chapter}`.toLowerCase().includes(search));
  const chapterGroups = uniqueChapters(items).map(chapterName => ({
    chapter: chapterName,
    documents: items.filter(item => item.chapter === chapterName)
  }));
  $("#pdfGrid").innerHTML = chapterGroups.length ? chapterGroups.map(group => `
    <article class="content-card pdf-chapter-card">
      <div class="pdf-chapter-heading">
        <div class="pdf-cover">P</div>
        <div><div class="card-meta"><span>${escapeHTML(group.chapter)}</span></div><h3>${escapeHTML(group.chapter)}</h3><p>${group.documents.length} PDF${group.documents.length === 1 ? "" : "s"} available</p></div>
      </div>
      <div class="pdf-document-list" aria-label="PDFs for ${escapeHTML(group.chapter)}">
        ${group.documents.map((item, index) => `<div class="pdf-document-row">
          <button class="pdf-document-open" type="button" data-open-pdf="${item.id}" aria-label="Read ${escapeHTML(item.title)}">
            <span class="pdf-document-number">${String(index + 1).padStart(2, "0")}</span>
            <span><strong>${escapeHTML(item.title)}</strong><small>${escapeHTML(item.fileName || `${Number(item.pages) || 1} pages`)}</small></span>
            <span aria-hidden="true">→</span>
          </button>
          ${isAdmin ? `<button class="pdf-document-delete" type="button" data-delete="pdfs" data-id="${item.id}" aria-label="Delete ${escapeHTML(item.title)}">Delete</button>` : ""}
        </div>`).join("")}
      </div>
    </article>`).join("") : emptyState("No PDFs found", "Try another search or add a new document.");
}

function uniqueChapters(items) {
  const seen = new Set();
  return items.map(item => String(item.chapter || "").trim()).filter(chapter => {
    const key = chapter.toLocaleLowerCase();
    if (!chapter || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => a.localeCompare(b));
}

function updateChapterSuggestions(category = $("#pdfForm")?.elements.namedItem("className")?.value || activeClass) {
  const host = $("#pdfChapterSuggestions");
  if (!host) return;
  const items = data.pdfs.filter(pdf => pdf.className === category);
  host.innerHTML = uniqueChapters(items).map(chapter => `<option value="${escapeHTML(chapter)}"></option>`).join("");
}

function renderQuestionBanks() {
  const items = filtered(data.questionBanks);
  $("#questionBankGrid").innerHTML = items.length ? items.map((item, index) => `
    <article class="content-card bank-card" data-open-bank="${item.id}">
      ${isAdmin ? `<button class="delete-btn" type="button" data-delete="questionBanks" data-id="${item.id}" data-question-id="${item.id}" aria-label="Delete question set: ${escapeHTML(item.title)}">Delete</button>` : ""}
      <span class="bank-number">${String(index + 1).padStart(2,"0")}</span><div><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.chapter)} • ${Number(item.count)} questions with solutions</p></div><span class="arrow">→</span>
    </article>`).join("") : emptyState("No question sets yet", "New practice sets will appear here.");
}

function updateStats() {
  $("#videoCount").textContent = filtered(data.videos).length;
  $("#pdfCount").textContent = filtered(data.pdfs).length;
  $("#questionCount").textContent = filtered(data.questionBanks).reduce((sum, item) => sum + Number(item.count || 0), 0);
  $("#quizCount").textContent = filtered(data.quizzes).length;
}

function emptyState(title, message) { return `<div class="empty-state"><strong>${title}</strong><p>${message}</p></div>`; }

const NAVIGATION_LEGS = [
  {target:"videos", icon:"▶", title:"Video Lectures", detail:className=>`${data.videos.filter(item=>item.className===className).length} lessons`},
  {target:"pdfs", icon:"▤", title:"PDFs & Notes", detail:className=>`${data.pdfs.filter(item=>item.className===className).length} documents`},
  {target:"question-bank", icon:"?", title:"Question Bank Hub", detail:className=>`${data.questionBanks.filter(item=>item.className===className).length} practice sets`},
  {target:"quiz", icon:"★", title:"Online Quiz", detail:className=>`${data.quizzes.filter(item=>item.className===className).length} challenges`}
];

function renderNavigationLegs() {
  $$(".nav-branch[data-nav-branch]:not(.nav-board-branch)").forEach(branch => {
    const className = branch.dataset.navBranch;
    const menu = branch.querySelector(".nav-submenu");
    if (!menu) return;
    menu.innerHTML = NAVIGATION_LEGS.map(leg => `<button type="button" class="nav-subleg" data-nav-target="${leg.target}" data-nav-class="${escapeHTML(className)}"><span aria-hidden="true">${leg.icon}</span><span><strong>${leg.title}</strong><small>${leg.detail(className)}</small></span></button>`).join("");
    const expanded = branch.classList.contains("expanded");
    menu.setAttribute("aria-hidden", String(!expanded));
    menu.querySelectorAll("button").forEach(button => button.tabIndex = expanded ? 0 : -1);
  });
}

function setExpandedNavigation(branchName) {
  $$(".nav-branch").forEach(branch => {
    const expanded = branch.dataset.navBranch === branchName;
    branch.classList.toggle("expanded", expanded);
    branch.querySelector(":scope > .class-tab")?.setAttribute("aria-expanded", String(expanded));
    const menu = branch.querySelector(":scope > .nav-submenu");
    menu?.setAttribute("aria-hidden", String(!expanded));
    menu?.querySelectorAll("button").forEach(button => button.tabIndex = expanded ? 0 : -1);
  });
}

function toggleNavigationBranch(tab) {
  const branch=tab.closest(".nav-branch");
  if(!branch)return false;
  const shouldExpand=!branch.classList.contains("expanded");
  setExpandedNavigation(shouldExpand?branch.dataset.navBranch:"");
  return shouldExpand;
}

function navigateToLearningView(className, target) {
  if (!$("#boardQuestionsPage").classList.contains("hidden")) showBoardPage(false, false);
  setActiveClass(className);
  const section = document.getElementById(target);
  if (section) section.classList.remove("hidden");
  $$(".nav-subleg").forEach(button => button.classList.toggle("active", button.dataset.navClass === className && button.dataset.navTarget === target));
  requestAnimationFrame(() => section?.scrollIntoView({behavior:"smooth", block:"start"}));
}

function setActiveClass(className) {
  activeClass = className;
  $$(".class-tab").forEach(tab => { const active = tab.dataset.class === className; tab.classList.toggle("active", active); tab.setAttribute("aria-selected", active); });
  $(".board-nav-tab")?.classList.remove("active");
  setExpandedNavigation(className);
  $("#librarySearch").value = "";
  $("#pdfChapterFilter").value = "all";
  exitQuiz(); renderAll();
  $$(".nav-subleg").forEach(button => button.classList.remove("active"));
  window.dispatchEvent(new CustomEvent("sanjay:classchange", {detail: getSanjayPhysicsContext()}));
  toast(`Showing ${className} content`);
}

function getSanjayPhysicsContext() {
  const classItems = [...data.videos, ...data.pdfs, ...data.questionBanks, ...data.quizzes]
    .filter(item => item.className === activeClass);
  return {
    activeClass,
    chapters: uniqueChapters(classItems),
    questionBanks: data.questionBanks
      .filter(item => item.className === activeClass)
      .map(item => ({title: item.title, chapter: item.chapter, count: Number(item.count) || 0}))
  };
}

window.getSanjayPhysicsContext = getSanjayPhysicsContext;

function getYoutubeId(url) {
  try { const parsed = new URL(url); if (parsed.hostname.includes("youtu.be")) return parsed.pathname.slice(1); if (parsed.hostname.includes("youtube")) return parsed.searchParams.get("v") || parsed.pathname.split("/").pop(); }
  catch {} return "";
}

function playVideo(id) {
  const item = data.videos.find(video => video.id === id); if (!item) return;
  const ytId = getYoutubeId(item.url);
  $("#videoFrame").innerHTML = ytId ? `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(ytId)}?autoplay=1" title="${escapeHTML(item.title)}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>` : `<video src="${escapeHTML(item.url)}" controls autoplay></video>`;
  $("#videoModalTitle").textContent = item.title;
  $("#videoModalMeta").textContent = `${item.className} • ${item.chapter}`;
  openModal("videoModal");
}

function readerCollectionFor(id) {
  if (data.boardQuestions.some(pdf => pdf.id === id)) return "boardQuestions";
  if (data.questionBanks.some(pdf => pdf.id === id)) return "questionBanks";
  return "pdfs";
}

function readerTabName(pdf, index) {
  const fileLabel = String(pdf.fileName || "").replace(/\.pdf$/i, "").trim();
  let label = String(pdf.documentLabel || pdf.title || fileLabel || "Document").trim();
  if (pdf.chapter && label.toLocaleLowerCase().startsWith(pdf.chapter.toLocaleLowerCase())) {
    label = label.slice(pdf.chapter.length).replace(/^\s*[—–:\-]\s*/, "").trim() || fileLabel || "Document";
  }
  return `PDF ${index + 1}: ${label}`;
}

function renderReaderDocumentTabs() {
  const host = $("#readerDocumentTabs");
  host.innerHTML = readerDocuments.map((pdf, index) => `<button class="reader-document-tab${pdf.id === currentPdf?.id ? " active" : ""}" type="button" role="tab" aria-selected="${pdf.id === currentPdf?.id}" data-reader-pdf="${escapeHTML(pdf.id)}" title="${escapeHTML(readerTabName(pdf, index))}">${escapeHTML(readerTabName(pdf, index))}</button>`).join("");
  host.querySelector(".active")?.scrollIntoView({block:"nearest", inline:"nearest"});
}

async function resolveReaderPdfUrl(pdf, collection) {
  const resolveBundledPdf = async source => {
    const resolved = new URL(source, document.baseURI);
    if (!resolved.pathname.startsWith("/assets/pdfs/")) return resolved.href;
    const mediaUrl = `${BUNDLED_PDF_MEDIA_BASE}${resolved.pathname.slice(1)}${resolved.search}`;
    const mobilePdfFallback = /Android|iPad|iPhone|iPod/i.test(navigator.userAgent || "") || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (mobilePdfFallback) return mediaUrl;
    const response = await fetch(mediaUrl);
    if (!response.ok) throw new Error(`PDF request failed with ${response.status}`);
    const bytes = await response.blob();
    return URL.createObjectURL(new Blob([bytes],{type:"application/pdf"}));
  };
  if (!pdf.blobKey) {
    const source = pdf.url || pdf.fallbackUrl || "";
    if (source) return resolveBundledPdf(source);
    throw new Error("PDF URL unavailable");
  }
  try {
    const file = collection === "boardQuestions" ? await getBoardPdfFile(pdf.blobKey) : collection === "questionBanks" ? await getQuestionBankPdfFile(pdf.blobKey) : await getPdfFile(pdf.blobKey);
    if (file) return URL.createObjectURL(file);
    if (pdf.fallbackUrl) return resolveBundledPdf(pdf.fallbackUrl);
  } catch {
    if (pdf.fallbackUrl) return resolveBundledPdf(pdf.fallbackUrl);
  }
  throw new Error("PDF file unavailable");
}

async function selectReaderDocument(id, announceError = true) {
  const nextPdf = readerDocuments.find(pdf => pdf.id === id);
  if (!nextPdf) return false;
  const loadToken = ++pdfLoadToken;
  const previousObjectUrl = activePdfObjectUrl;
  try {
    const nextUrl = await resolveReaderPdfUrl(nextPdf, currentPdfCollection);
    if (loadToken !== pdfLoadToken) {
      if (nextUrl.startsWith("blob:")) URL.revokeObjectURL(nextUrl);
      return false;
    }
    if (previousObjectUrl) URL.revokeObjectURL(previousObjectUrl);
    activePdfObjectUrl = nextUrl.startsWith("blob:") ? nextUrl : null;
    currentPdf = nextPdf;
    currentPdfUrl = nextUrl;
    currentPage = 1;
    $("#readerTitle").textContent = nextPdf.title || nextPdf.documentLabel || "PDF document";
    $("#readerClass").textContent = `${nextPdf.className} • ${nextPdf.chapter}`;
    $("#totalPages").textContent = nextPdf.pages || 1;
    $("#pageNumber").max = nextPdf.pages || 1;
    $("#readerOpenExternal").href = nextUrl;
    $("#readerOpenExternal").classList.remove("hidden");
    $("#readerFallbackOpen").href = nextUrl;
    renderReaderDocumentTabs();
    updateReader();
    return true;
  } catch {
    if (announceError) toast("This PDF file is unavailable on this device.", true);
    return false;
  }
}

async function openPdf(id) {
  currentPdfCollection = readerCollectionFor(id);
  const collection = data[currentPdfCollection];
  const requested = collection.find(pdf => pdf.id === id);
  if (!requested) return;
  readerDocuments = collection.filter(pdf => pdf.className === requested.className && pdf.chapter === requested.chapter);
  const opened = await selectReaderDocument(id);
  if (opened) openModal("pdfModal");
}

function updateReader(direction = 0) {
  if (!currentPdf) return;
  const max = Number(currentPdf.pages) || 1;
  currentPage = Math.max(1, Math.min(max, Number(currentPage) || 1));
  $("#pageNumber").value = currentPage;
  const page = $("#bookPage");
  page.classList.add("turning");
  setTimeout(() => {
    const hasUrl = Boolean(currentPdfUrl);
    const mobilePdfFallback = /Android|iPad|iPhone|iPod/i.test(navigator.userAgent || "") || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const canEmbed = hasUrl && !mobilePdfFallback;
    $("#pdfViewer").style.display = canEmbed ? "block" : "none";
    $("#readerPlaceholder").style.display = canEmbed ? "none" : "grid";
    $("#readerPlaceholderTitle").textContent = mobilePdfFallback ? "Open this PDF in your browser" : "Preview unavailable";
    $("#readerPlaceholderText").textContent = mobilePdfFallback ? "Mobile installed apps do not always include an embedded PDF viewer." : "Use the browser button to open or download this document.";
    $("#readerFallbackOpen").classList.toggle("hidden", !hasUrl);
    if (canEmbed) $("#pdfViewer").src = `${currentPdfUrl}${currentPdfUrl.includes("#") ? "&" : "#"}page=${currentPage}&view=FitH`;
    else $("#pdfViewer").src = "about:blank";
    page.classList.remove("turning");
  }, direction ? 180 : 0);
}

function startQuiz() {
  activeQuiz = filtered(data.quizzes);
  if (!activeQuiz.length) { toast("No quiz questions are available for this category yet.", true); return; }
  quizIndex = 0; quizScore = 0; answered = false;
  $("#quizIntro").classList.add("hidden"); $("#scoreCard").classList.add("hidden"); $("#quizPlayer").classList.remove("hidden");
  renderQuizQuestion(); $("#quiz").scrollIntoView({behavior:"smooth"});
}

function renderQuizQuestion() {
  const q = activeQuiz[quizIndex]; answered = false;
  $("#quizProgressText").textContent = `Question ${quizIndex + 1} of ${activeQuiz.length}`;
  $("#quizProgressBar").style.width = `${(quizIndex / activeQuiz.length) * 100}%`;
  $("#liveScore").textContent = quizScore;
  $("#quizQuestionArea").innerHTML = `<span class="question-label">${escapeHTML(q.chapter)}</span><h3 class="quiz-question">${escapeHTML(q.question)}</h3><div class="options-list">${q.options.map((option,i) => `<button class="option-btn" data-option="${i}"><span class="option-letter">${"ABCD"[i]}</span><span>${escapeHTML(option)}</span></button>`).join("")}</div><div class="quiz-feedback hidden" id="quizFeedback"></div><button class="primary-btn next-question hidden" id="nextQuestionBtn">${quizIndex === activeQuiz.length - 1 ? "See result" : "Next question"} →</button>`;
}

function answerQuiz(selected) {
  if (answered) return; answered = true;
  const q = activeQuiz[quizIndex]; const correct = selected === q.answer;
  if (correct) quizScore++;
  $$(".option-btn").forEach((button, index) => { button.disabled = true; if (index === q.answer) button.classList.add("correct"); else if (index === selected) button.classList.add("wrong"); });
  const feedback = $("#quizFeedback");
  feedback.classList.remove("hidden"); feedback.innerHTML = `<strong>${correct ? "Correct!" : "Not quite."}</strong> ${escapeHTML(q.explanation)}`;
  $("#liveScore").textContent = quizScore; $("#nextQuestionBtn").classList.remove("hidden");
}

function nextQuizQuestion() { if (quizIndex < activeQuiz.length - 1) { quizIndex++; renderQuizQuestion(); } else finishQuiz(); }

function finishQuiz() {
  const percent = Math.round((quizScore / activeQuiz.length) * 100);
  $("#quizPlayer").classList.add("hidden");
  const card = $("#scoreCard"); card.classList.remove("hidden");
  card.innerHTML = `<div class="score-ring">${percent}%</div><span class="section-kicker">QUIZ COMPLETE</span><h2>${percent >= 80 ? "Excellent work!" : percent >= 50 ? "Good progress!" : "Keep practising!"}</h2><p>You answered <strong>${quizScore} of ${activeQuiz.length}</strong> questions correctly in the ${escapeHTML(activeClass)} quiz.</p><button class="primary-btn" id="retryQuizBtn">Try again ↻</button>`;
}

function exitQuiz() { $("#quizIntro").classList.remove("hidden"); $("#quizPlayer").classList.add("hidden"); $("#scoreCard").classList.add("hidden"); }

function openModal(id) { const modal = $(`#${id}`); modal.classList.add("open"); modal.setAttribute("aria-hidden","false"); document.body.style.overflow="hidden"; }
function fullscreenElement() { return document.fullscreenElement || document.webkitFullscreenElement || null; }
function syncReaderFullscreenButton() {
  const button = $("#readerFullscreenBtn");
  const active = fullscreenElement() === $(".reader-shell");
  button.setAttribute("aria-pressed", String(active));
  button.setAttribute("aria-label", active ? "Exit full screen" : "Enter full screen");
  button.title = active ? "Exit full screen" : "Enter full screen";
}
async function toggleReaderFullscreen() {
  const shell = $(".reader-shell");
  try {
    if (fullscreenElement()) {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    } else if (shell.requestFullscreen) {
      await shell.requestFullscreen();
    } else if (shell.webkitRequestFullscreen) {
      shell.webkitRequestFullscreen();
    } else {
      toast("Full-screen mode is not supported by this browser.", true);
    }
  } catch (error) {
    console.warn("Unable to toggle PDF full screen", error);
    toast("Full-screen mode could not be started.", true);
  }
}
function exitReaderFullscreen() {
  if (fullscreenElement() !== $(".reader-shell")) return;
  if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
  else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
}
function closeModal(modal) { modal.classList.remove("open"); modal.setAttribute("aria-hidden","true"); document.body.style.overflow=""; if (modal.id === "videoModal") $("#videoFrame").innerHTML=""; if (modal.id === "pdfModal") { exitReaderFullscreen(); pdfLoadToken++; $("#pdfViewer").src="about:blank"; $("#readerOpenExternal").removeAttribute("href"); $("#readerOpenExternal").classList.add("hidden"); $("#readerFallbackOpen").removeAttribute("href"); if (activePdfObjectUrl) URL.revokeObjectURL(activePdfObjectUrl); activePdfObjectUrl=null; currentPdfUrl=""; currentPdf=null; readerDocuments=[]; $("#readerDocumentTabs").innerHTML=""; } }

async function hashPin(pin) {
  const bytes = new TextEncoder().encode(`sanjay-physics:${pin}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2,"0")).join("");
}

function openAdmin(preferredTab) {
  const configured = location.protocol !== "file:" || Boolean(localStorage.getItem(PIN_KEY));
  if (!isAdmin) {
    $("#loginView").classList.remove("hidden"); $("#adminDashboard").classList.add("hidden");
    $("#loginHelp").textContent = configured ? "Enter your admin PIN to manage learning content." : "First-time setup: create a private admin PIN with at least 6 characters.";
    $("#loginSubmit").textContent = configured ? "Unlock dashboard" : "Create admin PIN";
    $("#adminPin").value=""; $("#loginError").textContent=""; setPasswordVisibility(false);
  } else { $("#loginView").classList.add("hidden"); $("#adminDashboard").classList.remove("hidden"); if (preferredTab) setAdminTab(preferredTab); }
  $$(".class-select").forEach(select => select.value = activeClass);
  updateChapterSuggestions(activeClass);
  openModal("adminModal"); setTimeout(() => isAdmin ? null : $("#adminPin").focus(),100);
}

function setPasswordVisibility(visible) {
  const input = $("#adminPin");
  const toggle = $("#passwordToggle");
  input.type = visible ? "text" : "password";
  toggle.setAttribute("aria-pressed", String(visible));
  toggle.setAttribute("aria-label", visible ? "Hide admin PIN" : "Show admin PIN");
  toggle.title = visible ? "Hide PIN" : "Show PIN";
}

async function handleLogin(event) {
  event.preventDefault(); const pin = $("#adminPin").value; const configuredHash = localStorage.getItem(PIN_KEY);
  if (pin.length < 6) { $("#loginError").textContent="Use at least 6 characters."; return; }
  if (location.protocol !== "file:") {
    $("#loginSubmit").disabled = true;
    $("#loginError").textContent = "";
    try {
      const result = await adminRequest("/api/admin-session", {method:"POST", body:{pin}, includeToken:false});
      sessionStorage.setItem(ADMIN_TOKEN_KEY, result.token);
      isAdmin = result.role === "admin";
      $("#loginView").classList.add("hidden"); $("#adminDashboard").classList.remove("hidden"); renderAll(); toast("Admin dashboard unlocked");
    } catch (error) { $("#loginError").textContent = error.message || "Admin login failed."; }
    finally { $("#loginSubmit").disabled = false; }
    return;
  }
  const hash = await hashPin(pin);
  if (configuredHash && hash !== configuredHash) { $("#loginError").textContent="Incorrect PIN. Please try again."; return; }
  if (!configuredHash) localStorage.setItem(PIN_KEY, hash);
  isAdmin = true; sessionStorage.setItem(SESSION_KEY,"true");
  $("#loginView").classList.add("hidden"); $("#adminDashboard").classList.remove("hidden"); renderAll(); toast(configuredHash ? "Admin dashboard unlocked" : "Admin PIN created successfully");
}

function logout() { isAdmin=false; sessionStorage.removeItem(SESSION_KEY); sessionStorage.removeItem(ADMIN_TOKEN_KEY); renderAll(); closeModal($("#adminModal")); toast("Admin session closed"); }

function setAdminTab(name) {
  $$("[data-admin-tab]").forEach(btn => btn.classList.toggle("active",btn.dataset.adminTab===name));
  $$("[data-admin-form]").forEach(form => form.classList.toggle("hidden",form.dataset.adminForm!==name));
}

function adminApiUrl(path) {
  return `${String(window.SANJAY_PHYSICS_API_BASE_URL || "").replace(/\/$/, "")}${path}`;
}

async function adminRequest(path, {method="GET", body, includeToken=true} = {}) {
  const headers = {Accept:"application/json"};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (includeToken) {
    const token = sessionStorage.getItem(ADMIN_TOKEN_KEY);
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(adminApiUrl(path), {method, headers, body:body === undefined ? undefined : JSON.stringify(body)});
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result?.error?.message || "The admin request could not be completed.");
  return result;
}

async function validateAdminSession() {
  if (location.protocol === "file:") return;
  const token = sessionStorage.getItem(ADMIN_TOKEN_KEY);
  if (!token) return;
  try {
    const result = await adminRequest("/api/admin-session");
    isAdmin = result.authenticated && result.role === "admin";
  } catch { isAdmin = false; sessionStorage.removeItem(ADMIN_TOKEN_KEY); }
  renderAll();
}

async function syncQuestionDeletions() {
  if (location.protocol === "file:") return;
  try {
    const response = await fetch(adminApiUrl("/api/questions"), {headers:{Accept:"application/json"}});
    if (!response.ok) return;
    const result = await response.json();
    if (!Array.isArray(result.deletions)) return;
    let changed = false;
    result.deletions.forEach(({question_id:questionId, section}) => {
      if (!["questionBanks", "quizzes", "boardQuestions"].includes(section) || !Array.isArray(data[section])) return;
      const next = data[section].filter(item => item.id !== questionId);
      if (next.length !== data[section].length) { data[section] = next; changed = true; }
    });
    if (changed) { saveData(); renderAll(); }
  } catch { /* The public app remains usable while the API is offline. */ }
}

function deleteItem(collection,id) {
  if (!isAdmin) return;
  const item = data[collection]?.find(entry => entry.id === id); if (!item) return;
  const isQuestion = ["questionBanks", "quizzes", "boardQuestions"].includes(collection);
  pendingDelete = {collection, id, item};
  $("#deleteQuestionTitle").textContent = isQuestion ? "Delete question?" : "Delete content?";
  $("#deleteQuestionMessage").textContent = isQuestion
    ? "Are you sure you want to delete this question? This cannot be undone."
    : `Are you sure you want to delete “${item.title || "this content"}”? This cannot be undone.`;
  $("#confirmDeleteBtn").textContent = isQuestion ? "Delete question" : "Delete content";
  openModal("deleteQuestionModal");
  setTimeout(() => $("#cancelDeleteBtn").focus(), 50);
}

function cancelDelete() {
  pendingDelete = null;
  closeModal($("#deleteQuestionModal"));
}

async function confirmDeleteItem() {
  if (!isAdmin || !pendingDelete) return;
  const {collection, id, item} = pendingDelete;
  const isQuestion = ["questionBanks", "quizzes", "boardQuestions"].includes(collection);
  const button = $("#confirmDeleteBtn");
  button.disabled = true;
  button.textContent = "Deleting…";
  const previous = data[collection];
  data[collection]=previous.filter(entry=>entry.id!==id);
  if (!saveData()) { data[collection]=previous; button.disabled=false; button.textContent="Delete question"; return; }
  renderAll();
  closeModal($("#deleteQuestionModal"));
  pendingDelete = null;
  try {
    if (isQuestion && location.protocol !== "file:") await adminRequest("/api/questions", {method:"DELETE", body:{question_id:id, section:collection}});
  } catch (error) {
    data[collection] = previous; saveData(); renderAll();
    if (/admin session|required/i.test(error.message)) { isAdmin=false; sessionStorage.removeItem(ADMIN_TOKEN_KEY); renderAll(); }
    toast(error.message || "The question could not be deleted.", true);
    button.disabled=false;
    return;
  }
  if (collection === "pdfs" && item.blobKey) await deletePdfFile(item.blobKey).catch(()=>{});
  if (collection === "boardQuestions" && item.blobKey) await deleteBoardPdfFile(item.blobKey).catch(()=>{});
  if (collection === "questionBanks" && item.blobKey) await deleteQuestionBankPdfFile(item.blobKey).catch(()=>{});
  button.disabled=false;
  toast(isQuestion ? "Question deleted successfully" : "Content deleted successfully");
}

function selectedFiles(input) {
  return [...(input?.files || [])].filter(file => file instanceof File && file.size > 0);
}

function validatePdfFiles(files) {
  const invalidType = files.find(file => file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf"));
  if (invalidType) return `“${invalidType.name}” is not a PDF file.`;
  const oversized = files.find(file => file.size > MAX_PDF_BYTES);
  if (oversized) return `“${oversized.name}” exceeds the ${MAX_PDF_LABEL} limit. Choose a smaller PDF.`;
  return "";
}

async function uploadBoardPdf(chapter, files, input) {
  if (!isAdmin) return;
  const pdfFiles = Array.isArray(files) ? files : [files].filter(Boolean);
  if (!pdfFiles.length) return;
  const validationError = validatePdfFiles(pdfFiles);
  if (validationError) { toast(validationError, true); input.value = ""; return; }
  const created = [];
  try {
    for (const file of pdfFiles) {
      const id = uid("cbse");
      const blobKey = `board_${uid("file")}`;
      await putBoardPdfFile(blobKey, file);
      const documentLabel = file.name.replace(/\.pdf$/i, "").trim() || `Document ${boardQuestionsFor(chapter).length + created.length + 1}`;
      created.push({id, className:"Class 12th", chapter, title:`${chapter} — ${documentLabel}`, documentLabel, url:"", blobKey, fileName:file.name, fileSize:file.size, pages:1, years:"Last 10 years"});
    }
  } catch {
    await Promise.all(created.map(item => deleteBoardPdfFile(item.blobKey).catch(()=>{})));
    toast("The browser could not store these PDFs. Check available device storage.", true);
    input.value = "";
    return;
  }
  const oldItems = data.boardQuestions;
  data.boardQuestions = [...oldItems, ...created];
  if (!saveData()) { data.boardQuestions = oldItems; await Promise.all(created.map(item => deleteBoardPdfFile(item.blobKey).catch(()=>{}))); return; }
  input.value = "";
  renderAll();
  toast(`${created.length} PDF${created.length === 1 ? "" : "s"} added to ${chapter}`);
}

async function saveBoardQuestion(form) {
  if (!isAdmin) return;
  const fields = new FormData(form);
  const chapter = String(fields.get("chapter") || "").trim();
  const documentLabel = String(fields.get("title") || "").trim();
  const files = selectedFiles(form.elements.namedItem("file"));
  const hasFile = files.length > 0;
  let url = String(fields.get("url") || "").trim();
  if (!chapter || (!url && !hasFile)) { toast("Provide a PDF URL or choose a PDF file.", true); return; }
  const validationError = validatePdfFiles(files);
  if (validationError) { toast(validationError, true); return; }
  if (files.length > 1 && url) { toast("Choose either multiple PDF files or one PDF URL.", true); return; }
  if (files.length) { await uploadBoardPdf(chapter, files, form.elements.namedItem("file")); form.reset(); return; }
  const id = uid("cbse");
  const blobKey = "";
  const label = documentLabel || "Board Questions";
  const item = {id,className:"Class 12th",chapter,title:`${chapter} — ${label}`,documentLabel:label,url,blobKey,fileName:"",fileSize:0,pages:1,years:"Last 10 years"};
  const oldItems = data.boardQuestions;
  data.boardQuestions = [...oldItems, item];
  if (!saveData()) { data.boardQuestions = oldItems; if (blobKey) await deleteBoardPdfFile(blobKey).catch(()=>{}); return; }
  form.reset();
  renderAll();
  toast(`${chapter} PDF added as a separate document`);
}

function showBoardPage(show, updateHash = true) {
  $("#home").classList.toggle("hidden", show);
  $("#boardQuestionsPage").classList.toggle("hidden", !show);
  $("#boardQuestionsBtn").classList.toggle("active", show);
  $(".board-nav-tab")?.classList.toggle("active", show);
  if (show) setExpandedNavigation("CBSE Board"); else setExpandedNavigation(activeClass);
  $$(".mobile-nav a").forEach(link => link.classList.toggle("active", !show && link.getAttribute("href") === "#home"));
  if (updateHash) history.pushState(null, "", show ? "#cbse-board-questions" : "#home");
  window.scrollTo({top:0, behavior:"smooth"});
}

function addVideo(form) {
  const f=new FormData(form); data.videos.unshift({id:uid("v"),className:f.get("className"),chapter:f.get("chapter").trim(),title:f.get("title").trim(),url:f.get("url").trim(),duration:"New"});
  if(saveData()){form.reset();activeClass=f.get("className");finishAdminAdd("Lecture added");}
}

async function addPdf(form) {
  const f=new FormData(form); const files=selectedFiles(form.elements.namedItem("file")); const url=String(f.get("url")||"").trim();
  if(!url && !files.length){toast("Provide a PDF URL or choose one or more files.",true);return;}
  const validationError=validatePdfFiles(files);
  if(validationError){toast(validationError,true);return;}
  if(files.length>1 && url){toast("Choose either multiple PDF files or one PDF URL.",true);return;}
  const className=String(f.get("className")); const chapter=String(f.get("chapter")||"").trim(); const enteredTitle=String(f.get("title")||"").trim(); const pages=Number(f.get("pages"))||1;
  const created=[];
  try {
    if(files.length){
      for(const file of files){
        const id=uid("p");
        await putPdfFile(id,file);
        const originalTitle=file.name.replace(/\.pdf$/i,"").trim()||enteredTitle;
        created.push({id,className,chapter,title:files.length===1?enteredTitle:originalTitle,url:"",blobKey:id,fileName:file.name,fileSize:file.size,pages});
      }
    } else {
      created.push({id:uid("p"),className,chapter,title:enteredTitle,url,blobKey:"",fileName:"",fileSize:0,pages});
    }
  } catch {
    await Promise.all(created.filter(item=>item.blobKey).map(item=>deletePdfFile(item.blobKey).catch(()=>{})));
    toast("The browser could not store these PDFs. Check available device storage.",true);
    return;
  }
  data.pdfs=[...created,...data.pdfs];
  if(saveData()){form.reset();activeClass=className;finishAdminAdd(`${created.length} PDF${created.length===1?"":"s"} added to ${chapter}`);}
  else { const ids=new Set(created.map(item=>item.id)); data.pdfs=data.pdfs.filter(pdf=>!ids.has(pdf.id)); await Promise.all(created.filter(item=>item.blobKey).map(item=>deletePdfFile(item.blobKey).catch(()=>{}))); }
}

async function addQuestionBank(form){
  const fields=new FormData(form);const file=fields.get("file");const hasFile=file instanceof File&&file.size>0;let url=String(fields.get("url")||"").trim();
  if(!url&&!hasFile){toast("Provide a resource URL or choose a PDF file.",true);return;}
  if(hasFile&&file.type!=="application/pdf"&&!file.name.toLowerCase().endsWith(".pdf")){toast("Please choose a PDF file.",true);return;}
  if(hasFile&&file.size>MAX_PDF_BYTES){toast(`“${file.name}” exceeds the ${MAX_PDF_LABEL} limit. Choose a smaller PDF.`,true);return;}
  const id=uid("b");const blobKey=hasFile?`question_${uid("file")}`:"";
  if(hasFile){try{await putQuestionBankPdfFile(blobKey,file);url="";}catch{toast("The browser could not store this PDF. Check available device storage.",true);return;}}
  const item={id,className:fields.get("className"),chapter:String(fields.get("chapter")||"").trim(),title:String(fields.get("title")||"").trim(),count:Number(fields.get("count")),url,blobKey,fileName:hasFile?file.name:"",fileSize:hasFile?file.size:0,pages:1};
  data.questionBanks.unshift(item);
  if(saveData()){form.reset();activeClass=item.className;finishAdminAdd("Question set added");}
  else{data.questionBanks=data.questionBanks.filter(entry=>entry.id!==id);if(blobKey)await deleteQuestionBankPdfFile(blobKey).catch(()=>{});}
}
function addQuiz(form){const f=new FormData(form);const editId=String(f.get("editId")||"");const item={id:editId||uid("q"),className:f.get("className"),chapter:f.get("chapter").trim(),question:f.get("question").trim(),options:[f.get("a"),f.get("b"),f.get("c"),f.get("d")].map(String),answer:Number(f.get("answer")),explanation:f.get("explanation").trim()};if(editId){const index=data.quizzes.findIndex(q=>q.id===editId);if(index>=0)data.quizzes[index]=item;}else data.quizzes.push(item);if(saveData()){form.reset();$("#quizSubmitBtn").textContent="Add quiz question";activeClass=item.className;finishAdminAdd(editId?"Quiz question updated":"Quiz question added");}}
function editQuiz(id){const item=data.quizzes.find(q=>q.id===id);if(!item||!isAdmin)return;setAdminTab("quiz");const form=$("#quizForm");form.elements.namedItem("editId").value=item.id;form.elements.namedItem("className").value=item.className;form.elements.namedItem("chapter").value=item.chapter;form.elements.namedItem("question").value=item.question;["a","b","c","d"].forEach((name,index)=>form.elements.namedItem(name).value=item.options[index]);form.elements.namedItem("answer").value=String(item.answer);form.elements.namedItem("explanation").value=item.explanation;$("#quizSubmitBtn").textContent="Save changes";form.scrollIntoView({behavior:"smooth",block:"start"});}
function finishAdminAdd(message){setActiveClass(activeClass);toast(message);}
function openBlobDatabase(databaseName, storeName){return new Promise((resolve,reject)=>{const request=indexedDB.open(databaseName,1);request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains(storeName))db.createObjectStore(storeName);};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
async function putBlobFile(databaseName,storeName,key,file){const db=await openBlobDatabase(databaseName,storeName);return new Promise((resolve,reject)=>{const tx=db.transaction(storeName,"readwrite");tx.objectStore(storeName).put(file,key);tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>{db.close();reject(tx.error);};tx.onabort=()=>{db.close();reject(tx.error);};});}
async function getBlobFile(databaseName,storeName,key){const db=await openBlobDatabase(databaseName,storeName);return new Promise((resolve,reject)=>{const request=db.transaction(storeName,"readonly").objectStore(storeName).get(key);request.onsuccess=()=>{db.close();resolve(request.result);};request.onerror=()=>{db.close();reject(request.error);};});}
async function deleteBlobFile(databaseName,storeName,key){const db=await openBlobDatabase(databaseName,storeName);return new Promise((resolve,reject)=>{const tx=db.transaction(storeName,"readwrite");tx.objectStore(storeName).delete(key);tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>{db.close();reject(tx.error);};tx.onabort=()=>{db.close();reject(tx.error);};});}

const putPdfFile = (key,file) => putBlobFile(PDF_DB_NAME,PDF_STORE_NAME,key,file);
const getPdfFile = key => getBlobFile(PDF_DB_NAME,PDF_STORE_NAME,key);
const deletePdfFile = key => deleteBlobFile(PDF_DB_NAME,PDF_STORE_NAME,key);
const putBoardPdfFile = (key,file) => putBlobFile(BOARD_PDF_DB_NAME,BOARD_PDF_STORE_NAME,key,file);
const getBoardPdfFile = key => getBlobFile(BOARD_PDF_DB_NAME,BOARD_PDF_STORE_NAME,key);
const deleteBoardPdfFile = key => deleteBlobFile(BOARD_PDF_DB_NAME,BOARD_PDF_STORE_NAME,key);
const putQuestionBankPdfFile = (key,file) => putBlobFile(QUESTION_BANK_PDF_DB_NAME,QUESTION_BANK_PDF_STORE_NAME,key,file);
const getQuestionBankPdfFile = key => getBlobFile(QUESTION_BANK_PDF_DB_NAME,QUESTION_BANK_PDF_STORE_NAME,key);
const deleteQuestionBankPdfFile = key => deleteBlobFile(QUESTION_BANK_PDF_DB_NAME,QUESTION_BANK_PDF_STORE_NAME,key);

function toast(message,isError=false){const el=document.createElement("div");el.className=`toast${isError?" error":""}`;el.textContent=message;$("#toastRegion").append(el);setTimeout(()=>el.remove(),3200);}

function initForms() {
  const classOptions=CLASSES.map(c=>`<option value="${c}">${c}</option>`).join("");
  $$(".class-select").forEach(select=>{select.innerHTML=classOptions;});
  $("#boardAdminChapter").innerHTML=BOARD_CHAPTERS.map(chapter=>`<option value="${escapeHTML(chapter)}">${escapeHTML(chapter)}</option>`).join("");
  $("#pdfForm").elements.namedItem("className").addEventListener("change", event => updateChapterSuggestions(event.target.value));
  $("#videoForm").addEventListener("submit",e=>{e.preventDefault();addVideo(e.currentTarget);});
  $("#pdfForm").addEventListener("submit",async e=>{e.preventDefault();await addPdf(e.currentTarget);});
  $("#questionForm").addEventListener("submit",async e=>{e.preventDefault();await addQuestionBank(e.currentTarget);});
  $("#boardForm").addEventListener("submit",async e=>{e.preventDefault();await saveBoardQuestion(e.currentTarget);});
  $("#quizForm").addEventListener("submit",e=>{e.preventDefault();addQuiz(e.currentTarget);});
}

function initEvents() {
  $("#classTabs").addEventListener("click",e=>{
    const leg=e.target.closest("[data-nav-target]");
    if(leg){navigateToLearningView(leg.dataset.navClass,leg.dataset.navTarget);return;}
    const boardLeg=e.target.closest("[data-board-view]");
    if(boardLeg){showBoardPage(true);$$('.nav-subleg').forEach(button=>button.classList.toggle('active',button===boardLeg));requestAnimationFrame(()=>{$(".board-library")?.scrollIntoView({behavior:"smooth",block:"start"});if(boardLeg.dataset.boardView==="search")setTimeout(()=>$("#boardLibrarySearch")?.focus(),450);});return;}
    const boardTab=e.target.closest("[data-board-nav]");if(boardTab){const shouldExpand=toggleNavigationBranch(boardTab);if(shouldExpand)showBoardPage(true);return;}
    const tab=e.target.closest(".class-tab[data-class]");
    if(tab){const shouldExpand=toggleNavigationBranch(tab);if(!shouldExpand)return;if(!$("#boardQuestionsPage").classList.contains("hidden"))showBoardPage(false,false);setActiveClass(tab.dataset.class);}
  });
  $("#librarySearch").addEventListener("input",renderPdfs); $("#pdfChapterFilter").addEventListener("change",renderPdfs);
  $("#boardLibrarySearch")?.addEventListener("input",renderBoardQuestions); $("#boardChapterFilter")?.addEventListener("change",renderBoardQuestions);
  document.addEventListener("click",e=>{
    const sectionClose=e.target.closest("[data-close-section]");
    if(sectionClose){e.preventDefault();e.stopPropagation();const section=document.getElementById(sectionClose.dataset.closeSection);if(section)section.classList.add("hidden");return;}
    const play=e.target.closest("[data-play]");if(play)playVideo(play.dataset.play);
    const pdf=e.target.closest("[data-open-pdf]");if(pdf&&!e.target.closest("[data-delete]"))openPdf(pdf.dataset.openPdf);
    const boardPdf=e.target.closest("[data-open-board-pdf]");if(boardPdf&&!e.target.closest("[data-board-upload],.board-card-upload,[data-delete]"))openPdf(boardPdf.dataset.openBoardPdf);
    const del=e.target.closest("[data-delete]");if(del){e.stopPropagation();deleteItem(del.dataset.delete,del.dataset.id);}
    const admin=e.target.closest("[data-open-admin]");if(admin)openAdmin(admin.dataset.openAdmin);
    const edit=e.target.closest("[data-edit-quiz]");if(edit)editQuiz(edit.dataset.editQuiz);
    const option=e.target.closest("[data-option]");if(option)answerQuiz(Number(option.dataset.option));
    if(e.target.id==="nextQuestionBtn")nextQuizQuestion();if(e.target.id==="retryQuizBtn")startQuiz();
    const readerTab=e.target.closest("[data-reader-pdf]");if(readerTab)selectReaderDocument(readerTab.dataset.readerPdf);
    const close=e.target.closest("[data-close-modal]");if(close)closeModal(close.closest(".modal"));
    if(e.target.closest("[data-cancel-delete]"))cancelDelete();
  });
  document.addEventListener("change", e => {
    const input=e.target.closest("input[type='file'][data-max-bytes]");
    if(input){const error=validatePdfFiles(selectedFiles(input));if(error){toast(error,true);input.value="";return;}}
    const boardInput=e.target.closest("[data-board-upload]");
    if(boardInput?.files?.length) uploadBoardPdf(boardInput.dataset.boardUpload,selectedFiles(boardInput),boardInput);
  });
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!fullscreenElement()){$$(".modal.open").forEach(closeModal);}const card=e.target.closest?.("[data-open-pdf]");if(card&&(e.key==="Enter"||e.key===" ")){e.preventDefault();openPdf(card.dataset.openPdf);}const boardCard=e.target.closest?.("[data-open-board-pdf]");if(boardCard&&(e.key==="Enter"||e.key===" ")){e.preventDefault();openPdf(boardCard.dataset.openBoardPdf);}});
  $("#adminLoginBtn").addEventListener("click",()=>openAdmin()); $("#loginForm").addEventListener("submit",handleLogin); $("#logoutBtn").addEventListener("click",logout);
  $("#passwordToggle").addEventListener("click",()=>setPasswordVisibility($("#adminPin").type === "password"));
  $("#confirmDeleteBtn").addEventListener("click",confirmDeleteItem);
  $$("[data-admin-tab]").forEach(btn=>btn.addEventListener("click",()=>setAdminTab(btn.dataset.adminTab)));
  $("#startQuizBtn").addEventListener("click",startQuiz); $("#startMixedQuiz").addEventListener("click",()=>{$("#quiz").scrollIntoView({behavior:"smooth"});startQuiz();}); $("#exitQuizBtn").addEventListener("click",exitQuiz);
  $("#prevPage").addEventListener("click",()=>{if(currentPage>1){currentPage--;updateReader(-1);}}); $("#nextPage").addEventListener("click",()=>{if(currentPdf&&currentPage<Number(currentPdf.pages)){currentPage++;updateReader(1);}}); $("#pageNumber").addEventListener("change",e=>{currentPage=Number(e.target.value);updateReader();});
  $("#readerFullscreenBtn").addEventListener("click",toggleReaderFullscreen);
  document.addEventListener("fullscreenchange",syncReaderFullscreenButton);
  document.addEventListener("webkitfullscreenchange",syncReaderFullscreenButton);
  $("#searchBtn").addEventListener("click",()=>{$("#pdfs").scrollIntoView({behavior:"smooth"});setTimeout(()=>$("#librarySearch").focus(),500);});
  $("#boardQuestionsBtn").addEventListener("click",()=>showBoardPage(true));
  $("#boardBackBtn").addEventListener("click",()=>showBoardPage(false));
  window.addEventListener("hashchange",()=>showBoardPage(location.hash === "#cbse-board-questions",false));
  $("#continueBtn").addEventListener("click",()=>{const first=filtered(data.videos)[0];first?playVideo(first.id):toast("No lesson is available yet.",true);});
  $("#questionBankGrid").addEventListener("click",e=>{const card=e.target.closest("[data-open-bank]");if(!card||e.target.closest("[data-delete]"))return;const item=data.questionBanks.find(q=>q.id===card.dataset.openBank);if(item?.blobKey||item?.url||item?.fallbackUrl)openPdf(item.id);else toast("This set is ready for the admin to attach a solution link.");});
  $$(".mobile-nav a").forEach(link=>link.addEventListener("click",()=>{$$(".mobile-nav a").forEach(a=>a.classList.remove("active"));link.classList.add("active");}));
}

function initPwa() {
  const installButton = $("#installBtn");
  const standaloneQuery = window.matchMedia?.("(display-mode: standalone)");
  const isStandalone = () => Boolean(standaloneQuery?.matches || navigator.standalone === true);
  const chromiumBrowser = /Chrome|Chromium|CriOS|Edg\//i.test(navigator.userAgent || "");
  let installHelpReady = !chromiumBrowser;
  const syncInstallButton = () => {
    installButton.classList.toggle("hidden", isStandalone() || (!deferredInstallPrompt && !installHelpReady));
    installButton.textContent = deferredInstallPrompt ? "Install App" : "Install Help";
    installButton.setAttribute("aria-label", deferredInstallPrompt ? "Install Sanjay Physics" : "Show installation instructions");
  };
  const showInstallHelp = reason => {
    const userAgent = navigator.userAgent || "";
    const isIos = /iPad|iPhone|iPod/i.test(userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/i.test(userAgent);
    const isFirefox = /Firefox|FxiOS/i.test(userAgent);
    const isEdge = /Edg\//i.test(userAgent);
    const isChrome = /Chrome|CriOS/i.test(userAgent) && !isEdge;
    const steps = isIos
      ? ["Open this site in Safari.", "Tap the Share button.", "Choose ‘Add to Home Screen’, then tap ‘Add’."]
      : isAndroid && isFirefox
        ? ["Open the Firefox menu (⋮).", "Choose ‘Install’ or ‘Add to Home screen’.", "Confirm the shortcut or installation."]
        : isAndroid
          ? ["Open the browser menu (⋮).", "Choose ‘Install app’ or ‘Add to Home screen’.", "Confirm Install."]
          : isFirefox
            ? ["Firefox desktop does not provide native PWA installation.", "Open this site in Google Chrome or Microsoft Edge.", "Use the install icon in the address bar or Browser menu → Apps → Install Sanjay Physics."]
            : ["Open the browser menu.", `Choose ${isEdge ? "Apps → Install Sanjay Physics" : isChrome ? "Cast, save and share → Install Sanjay Physics" : "the Install app option"}.`, "Confirm Install in the browser prompt."];
    $("#installHelpText").textContent = isIos ? "Apple devices install web apps from the Share menu." : isAndroid ? "Use your mobile browser menu to install this app." : isFirefox ? "Use Chrome or Edge for a native Windows installation." : "Use the browser's own installation menu when its automatic prompt is unavailable.";
    $("#installAvailability").textContent = reason || "The native install prompt is not available in this browser session.";
    $("#installSteps").innerHTML = steps.map(step=>`<li>${escapeHTML(step)}</li>`).join("");
    openModal("installModal");
    setTimeout(()=>$("#installModal .install-help-close")?.focus(),0);
  };
  const requestInstall = async () => {
    if(isStandalone()){toast("Sanjay Physics is already installed");syncInstallButton();return;}
    if(!deferredInstallPrompt){
      showInstallHelp("Chrome/Edge did not expose a native install prompt. This can happen after dismissal, when the app is already installed, or when the current browser does not support PWA installation.");
      return;
    }
    const promptEvent = deferredInstallPrompt;
    deferredInstallPrompt = null;
    installButton.disabled = true;
    installButton.textContent = "Opening…";
    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if(choice.outcome === "dismissed") showInstallHelp("Installation was dismissed. To try again now, use the browser installation menu below; Chrome may not show the automatic prompt again until a later visit.");
    } catch {
      showInstallHelp("The browser could not open its native prompt. Use the browser installation menu below.");
    }
    finally { installButton.disabled = false; syncInstallButton(); }
  };

  syncInstallButton();
  standaloneQuery?.addEventListener?.("change",syncInstallButton);
  const secureForServiceWorker = location.protocol === "https:" || ["localhost","127.0.0.1"].includes(location.hostname);
  if("serviceWorker" in navigator && secureForServiceWorker) {
    navigator.serviceWorker.register("/sw.js",{scope:"/",updateViaCache:"none"})
      .then(registration=>{
        registration.waiting?.postMessage({type:"SKIP_WAITING"});
        registration.addEventListener("updatefound",()=>registration.installing?.addEventListener("statechange",()=>{
          if(registration.waiting) registration.waiting.postMessage({type:"SKIP_WAITING"});
        }));
        return registration.update().catch(()=>{});
      })
      .catch(()=>toast("Offline installation could not be prepared. Reload the page and try again.",true));
  }
  window.addEventListener("beforeinstallprompt",event=>{event.preventDefault();deferredInstallPrompt=event;syncInstallButton();});
  // Chromium only exposes a real Install action after beforeinstallprompt.
  // If it never arrives, expose clearly-labelled browser instructions instead.
  setTimeout(()=>{installHelpReady=true;syncInstallButton();},3000);
  installButton.addEventListener("click",requestInstall);
  window.addEventListener("appinstalled",()=>{deferredInstallPrompt=null;syncInstallButton();closeModal($("#installModal"));toast("Sanjay Physics installed successfully");});
}

function init(){ $("#year").textContent=new Date().getFullYear();initForms();initEvents();initPwa();renderAll();validateAdminSession();syncQuestionDeletions();showBoardPage(location.hash === "#cbse-board-questions",false); }
init();
