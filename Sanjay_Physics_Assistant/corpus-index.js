"use strict";

window.SanjayPhysicsCorpus = (() => {
  const MANIFEST_URL = "Sanjay_Physics_Assistant/pdf-index/manifest.json";
  const STOP_WORDS = new Set(["about","after","also","and","are","bank","board","can","cbse","class","define","derive","diagram","equation","explain","figure","find","for","formula","from","give","how","into","its","notes","of","page","pdf","question","show","that","the","their","this","through","to","using","what","when","where","which","why","with"]);
  const SEMANTIC_PHRASES = [
    [/oppos(?:e|es|ition).*?(?:current|flow of electric charge)/i,"resistance ohm conductor current"],
    [/rate of change of velocity/i,"acceleration velocity time"],
    [/rate of change of momentum/i,"force momentum newton second law"],
    [/energy (?:because of|due to) motion/i,"kinetic energy velocity"],
    [/energy (?:because of|due to) (?:position|height)/i,"potential energy height"],
    [/bending of light|light bend|bend.*light/i,"refraction light refractive index"],
    [/splitting of (?:white )?light/i,"dispersion spectrum prism"],
    [/back and forth motion|to and fro motion/i,"oscillation simple harmonic motion"],
    [/number of oscillations (?:made )?per second/i,"frequency oscillation hertz"],
    [/distance between (?:two )?(?:successive|adjacent) crests/i,"wavelength wave"],
    [/ability to do work/i,"energy work"],
    [/charge stored per (?:unit )?(?:voltage|potential difference)/i,"capacitance capacitor"],
    [/current produced by changing magnetic/i,"electromagnetic induction faraday"],
    [/minimum energy.*electron.*metal/i,"work function photoelectric"],
    [/amount of matter/i,"mass inertia"],
    [/push or pull/i,"force newton"],
    [/original.*(?:diagram|figure)|(?:diagram|figure).*original/i,"diagram figure graph circuit ray"]
  ];
  const bundles = new Map();
  let manifestPromise = null;

  const normalise = value => String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[–—−]/g,"-")
    .replace(/[^a-z0-9λμνθαβγδω\s-]/g," ")
    .replace(/\s+/g," ")
    .trim();

  function tokens(value) {
    const original=String(value || "");
    const additions=SEMANTIC_PHRASES.filter(([pattern]) => pattern.test(original)).map(([,terms]) => terms).join(" ");
    return [...new Set(normalise(`${original} ${additions}`).split(/\s+/).filter(token => token.length > 2 && !STOP_WORDS.has(token)))];
  }

  async function fetchJson(url) {
    const response = await fetch(url, {cache:"force-cache", credentials:"same-origin"});
    if (!response.ok) throw new Error(`Offline corpus asset unavailable: ${url}`);
    return response.json();
  }

  function loadManifest() {
    if (!manifestPromise) manifestPromise = fetchJson(MANIFEST_URL).catch(error => {
      manifestPromise = null;
      throw error;
    });
    return manifestPromise;
  }

  async function loadClass(className) {
    const manifest = await loadManifest();
    const url = manifest.classes[className];
    if (!url) return {className,documents:[]};
    if (!bundles.has(className)) bundles.set(className,fetchJson(url).catch(error => {
      bundles.delete(className);
      throw error;
    }));
    return bundles.get(className);
  }

  function phraseScore(haystack, phrase, weight) {
    const value = normalise(phrase);
    return value && haystack.includes(value) ? weight : 0;
  }

  function wordScore(haystack, queryTokens, weight = 1) {
    return queryTokens.reduce((score,token) => {
      const escaped = token.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
      const matches = haystack.match(new RegExp(`\\b${escaped}\\b`,"g"));
      return score + Math.min(matches?.length || 0, 5) * weight;
    },0);
  }

  function bestExcerpt(text, queryTokens) {
    const clean = String(text || "").replace(/\s+/g," ").trim();
    if (!clean) return "This page is image-based; open the cited page to view the original question, figure, or solution.";
    const lower = normalise(clean);
    let position = -1;
    for (const token of queryTokens) {
      const found = lower.indexOf(token);
      if (found >= 0 && (position < 0 || found < position)) position = found;
    }
    const start = Math.max(0,(position < 0 ? 0 : position) - 180);
    const excerpt = clean.slice(start,start + 560);
    return `${start ? "…" : ""}${excerpt}${start + excerpt.length < clean.length ? "…" : ""}`;
  }

  function classifyIntent(query) {
    const q = normalise(query);
    return {
      board:/\b(cbse|board|pyq|previous year|question bank)\b/.test(q),
      objective:/\b(mcq|objective|option)\b/.test(q),
      figure:/\b(diagram|figure|fig |graph|circuit|ray)\b/.test(q),
      equation:/\b(equation|formula|relation|derive|derivation)\b/.test(q)
    };
  }

  async function search({query,className,chapter="",limit=4} = {}) {
    const selectedClass = /^Class (9|10|11|12)th$/.test(className || "") ? className : "Class 12th";
    const bundle = await loadClass(selectedClass);
    const queryTokens = tokens(query);
    const intent = classifyIntent(query);
    const results = [];
    for (const document of bundle.documents) {
      const documentText = normalise(`${document.chapter} ${document.title} ${document.fileName} ${document.category}`);
      let documentScore = phraseScore(documentText,chapter,18) + phraseScore(documentText,query,25) + wordScore(documentText,queryTokens,6);
      if (intent.board && /board question/i.test(document.category)) documentScore += 16;
      if (intent.objective && /mcq/i.test(document.category)) documentScore += 16;
      for (const page of document.content) {
        const pageText = normalise(page.t);
        let score = documentScore + wordScore(pageText,queryTokens,2);
        if (intent.figure && page.f?.length) score += 7;
        if (intent.equation && page.e?.length) score += 7;
        if (!pageText && documentScore <= 0) continue;
        const exactQuestion=normalise(query).length > 18 && pageText.includes(normalise(query));
        if (exactQuestion) score += 40;
        results.push({document,page,score,exactQuestion});
      }
    }
    const documentCounts = new Map();
    const selected = [];
    results.sort((a,b) => b.score-a.score || a.page.n-b.page.n);
    for (const match of results) {
      if (selected.length >= limit) break;
      if (match.score <= 0 && selected.length) break;
      const documentCount=documentCounts.get(match.document.id) || 0;
      if (documentCount >= 2) continue;
      documentCounts.set(match.document.id,documentCount + 1);
      selected.push({
        id:match.document.id,
        title:match.document.title,
        fileName:match.document.fileName,
        path:match.document.path,
        className:match.document.className,
        chapter:match.document.chapter,
        category:match.document.category,
        author:match.document.author,
        page:match.page.n,
        pageCount:match.document.pages,
        excerpt:bestExcerpt(match.page.t,queryTokens),
        figures:match.page.f || [],
        equations:match.page.e || [],
        score:match.score,
        matchType:match.exactQuestion ? "exact" : "related"
      });
    }
    return selected;
  }

  async function ready() {
    const manifest = await loadManifest();
    return {
      documentCount:manifest.documents.length,
      pageCount:manifest.documents.reduce((sum,document) => sum + document.pages,0),
      author:manifest.author
    };
  }

  function preload(className) {
    const run = () => loadClass(className).catch(() => null);
    if ("requestIdleCallback" in window) window.requestIdleCallback(run,{timeout:1800});
    else setTimeout(run,200);
  }

  return {ready,search,preload,loadManifest};
})();
