"use strict";

window.SanjayAcademicDatabase = (() => {
  const url = "Sanjay_Physics_Assistant/academic-knowledge-12.json";
  let cache = null;
  let pending = null;

  async function load() {
    if (cache) return cache;
    if (!pending) {
      pending = fetch(url, {cache:"force-cache"})
        .then(response => {
          if (!response.ok) throw new Error("Academic knowledge pack is unavailable");
          return response.json();
        })
        .then(data => { cache=data; return data; })
        .finally(() => { pending=null; });
    }
    return pending;
  }

  async function search(subject, query, limit = 5) {
    const database = await load();
    const chapters = database.subjects[subject] || [];
    const terms = String(query || "").toLowerCase().split(/[^a-z0-9]+/).filter(term => term.length > 2);
    return chapters
      .map(chapter => {
        const text=[chapter.n,...chapter.c,...chapter.f].join(" ").toLowerCase();
        return {chapter,score:terms.reduce((sum,term) => sum+(text.includes(term)?1:0),0)};
      })
      .filter(result => result.score > 0)
      .sort((a,b) => b.score-a.score)
      .slice(0,Math.max(1,Math.min(Number(limit)||5,20)))
      .map(result => result.chapter);
  }

  return {url,load,search,get cached(){ return cache; }};
})();
