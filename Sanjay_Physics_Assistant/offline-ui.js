"use strict";

(() => {
  const Engine = window.SanjayPhysicsOfflineEngine;
  const Corpus = window.SanjayPhysicsCorpus;
  if (!Engine) return;

  const HISTORY_KEY = "sanjay_physics_offline_history_v3";
  const CONTEXT_KEY = "sanjay_physics_offline_context_v1";
  const LEVELS = [
    {value:"Class 9th",label:"9th Class"},
    {value:"Class 10th",label:"10th Class"},
    {value:"Class 11th",label:"11th Class"},
    {value:"Class 12th",label:"12th Class"},
    {value:"NEET",label:"NEET"},
    {value:"JEE",label:"JEE"},
    {value:"General Chat",label:"General Chat"}
  ];
  const ENGINE_LEVEL = {NEET:"JEE / NEET",JEE:"JEE / NEET"};
  const savedContext = load(CONTEXT_KEY, {className:"Class 9th",chapter:""});
  let history = load(HISTORY_KEY, []);
  let pending = false;
  let recognition = null;
  let listening = false;
  let voicePrefix = "";

  const root = document.createElement("section");
  root.className = "spa-offline";
  root.id = "sanjayPhysicsOfflineAssistant";
  root.setAttribute("aria-label", "Sanjay Physics Assistant");
  root.innerHTML = `
    <button class="spa-launcher" type="button" aria-label="Open Sanjay Physics Assistant" title="Sanjay Physics Assistant" aria-controls="spaPanel" aria-expanded="false">
      <span class="spa-launcher-icon" aria-hidden="true">∑</span>
      <span><strong>Sanjay Physics Assistant</strong><small><i></i> 100% offline · Local PDF index</small></span>
    </button>
    <button class="spa-backdrop hidden" type="button" aria-label="Close Sanjay Physics Assistant"></button>
    <div class="spa-panel hidden" id="spaPanel" role="dialog" aria-modal="true" aria-labelledby="spaTitle">
      <header class="spa-header">
        <div class="spa-avatar" aria-hidden="true">SP</div>
        <div class="spa-heading"><strong id="spaTitle">Sanjay Physics Assistant</strong><span data-state="working"><i></i> Loading local PDF index…</span></div>
        <button class="spa-header-button spa-close" type="button" aria-label="Close assistant">×</button>
      </header>
      <div class="spa-context" aria-label="Study context">
        <label>Class
          <select class="spa-class" aria-label="Choose class"></select>
        </label>
        <label class="spa-chapter-field">Chapter
          <input class="spa-chapter" list="spaChapterList" maxlength="100" autocomplete="off" placeholder="Choose or type chapter" aria-label="Choose or type chapter">
          <datalist id="spaChapterList"></datalist>
        </label>
        <button class="spa-clear" type="button" title="Clear this chat">Clear</button>
      </div>
      <div class="spa-messages" role="log" aria-live="polite"></div>
      <div class="spa-dock">
        <div class="spa-actions" aria-label="Quick actions">
          <button type="button" data-prompt="Explain Newton's laws of motion">Explain a concept</button>
          <button type="button" data-prompt="Give me the key formulas of current electricity">Formulae</button>
          <button type="button" data-prompt="Give me an MCQ hint about gravitation without revealing the answer">MCQ hint</button>
          <button type="button" data-prompt="Show how force is resolved into horizontal and vertical components">Vector diagram</button>
        </div>
        <form class="spa-form">
          <label class="sr-only" for="spaInput">Ask or speak naturally</label>
          <textarea id="spaInput" rows="1" maxlength="1200" placeholder="Ask a physics doubt…" required></textarea>
          <button class="spa-mic" type="button" aria-label="Start voice input" aria-pressed="false" title="Speak your question">
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"></rect><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M9 21h6"></path></svg>
          </button>
          <button class="spa-send" type="submit" aria-label="Ask Sanjay Physics Assistant">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 12 16-8-6 16-2.5-6.5L4 12Z"></path><path d="m11.5 13.5 4-4"></path></svg>
          </button>
        </form>
        <p class="spa-note">100% offline · Classes 9–12 · NCERT · CBSE Board · Sanjay Singh (संजय सिंह)</p>
      </div>
    </div>`;

  const headerActions = document.querySelector(".header-actions");
  const boardButton = document.querySelector("#boardQuestionsBtn");
  if (!headerActions || !boardButton) return;
  document.body.append(root);
  const triggerHost = document.createElement("div");
  triggerHost.className = "spa-trigger-host";
  triggerHost.setAttribute("aria-label", "Sanjay Physics Assistant trigger");
  const trigger = root.querySelector(".spa-launcher");
  triggerHost.append(trigger);
  boardButton.insertAdjacentElement("afterend",triggerHost);

  const el = {
    launcher: trigger, backdrop: root.querySelector(".spa-backdrop"),
    panel: root.querySelector(".spa-panel"), close: root.querySelector(".spa-close"), clear: root.querySelector(".spa-clear"),
    classSelect: root.querySelector(".spa-class"), chapter: root.querySelector(".spa-chapter"),
    chapterField: root.querySelector(".spa-chapter-field"), chapterList: root.querySelector("#spaChapterList"),
    messages: root.querySelector(".spa-messages"), actions: root.querySelector(".spa-actions"),
    form: root.querySelector(".spa-form"), input: root.querySelector("textarea"), mic: root.querySelector(".spa-mic"),
    send: root.querySelector(".spa-send"), status: root.querySelector(".spa-heading span"), note: root.querySelector(".spa-note")
  };

  function setStatus(text,state="ready") {
    el.status.dataset.state=state;
    el.status.innerHTML="";
    const dot=document.createElement("i");
    el.status.append(dot,document.createTextNode(` ${text}`));
  }
  function load(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
  }
  function save() {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-30))); } catch {}
  }
  function saveContext() {
    try { localStorage.setItem(CONTEXT_KEY, JSON.stringify({className:el.classSelect.value,chapter:el.chapter.value.trim()})); } catch {}
  }
  function engineLevel(className = el.classSelect.value) {
    return ENGINE_LEVEL[className] || className;
  }
  function populateLevels() {
    el.classSelect.replaceChildren(...LEVELS.map(level => {
      const option=document.createElement("option");
      option.value=level.value;
      option.textContent=level.label;
      return option;
    }));
    el.classSelect.value=LEVELS.some(level => level.value === savedContext.className) ? savedContext.className : "Class 9th";
  }
  function populateChapters(preferredChapter = "") {
    const isGeneral=el.classSelect.value === "General Chat";
    const chapters=isGeneral ? [] : Engine.getChapters(engineLevel()).map(chapter => chapter.title);
    el.chapterList.replaceChildren(...chapters.map(chapter => {
      const option=document.createElement("option");
      option.value=chapter;
      return option;
    }));
    el.chapterField.hidden=isGeneral;
    el.chapter.disabled=isGeneral;
    root.querySelector(".spa-context").classList.toggle("general-chat",isGeneral);
    el.actions.hidden=isGeneral;
    el.chapter.value=isGeneral ? "" : (preferredChapter.trim() || chapters[0] || "");
    saveContext();
  }
  function escapeHTML(value) {
    return String(value).replace(/[&<>'"]/g, character => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[character]));
  }
  function safeMarkup(source) {
    return escapeHTML(source)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/^•\s+(.+)$/gm, "<span class=\"spa-bullet\">$1</span>")
      .replace(/^(\d+)\.\s+(.+)$/gm, "<span class=\"spa-step\"><b>$1.</b> $2</span>")
      .replace(/\n{2,}/g, "</p><p>")
      .replace(/\n/g, "<br>");
  }
  function forceDiagram() {
    const wrap = document.createElement("figure");
    wrap.className = "spa-diagram";
    wrap.setAttribute("aria-label", "Force F resolved into F cos theta and F sin theta");
    wrap.innerHTML = `<svg viewBox="0 0 360 210" role="img" aria-labelledby="spaForceTitle spaForceDesc">
      <title id="spaForceTitle">Resolution of a force</title><desc id="spaForceDesc">Force F at angle theta, with horizontal component F cos theta and vertical component F sin theta.</desc>
      <defs><marker id="spaArrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="currentColor"/></marker></defs>
      <g fill="none" stroke="currentColor" stroke-width="2.5" marker-end="url(#spaArrow)">
        <path class="axis" d="M48 172H320"/><path class="axis" d="M48 172V28"/>
        <path class="resultant" d="M48 172L265 55"/><path class="component-x" d="M48 172H265"/><path class="component-y" d="M265 172V55"/>
      </g>
      <path class="angle" d="M95 172 A47 47 0 0 0 89 150" fill="none"/>
      <g class="labels"><text x="278" y="50">F</text><text x="135" y="195">F cosθ</text><text x="274" y="120">F sinθ</text><text x="99" y="157">θ</text></g>
    </svg><figcaption>Standard vector resolution: horizontal = F cosθ, vertical = F sinθ</figcaption>`;
    return wrap;
  }
  function simpleDiagram(type) {
    const wrap=document.createElement("figure");
    wrap.className="spa-diagram";
    const diagrams={
      fbd:{label:"Free-body diagram of a block",svg:`<svg viewBox="0 0 360 220" role="img" aria-label="Free-body diagram"><defs><marker id="spaFbdArrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0L0 6L7 3Z" fill="currentColor"/></marker></defs><rect x="130" y="82" width="100" height="62" rx="7" fill="#123b50" stroke="#ffd166" stroke-width="3"/><g stroke="currentColor" stroke-width="3" marker-end="url(#spaFbdArrow)"><path d="M180 82V24"/><path d="M180 144V204"/><path d="M130 113H58"/><path d="M230 113H302"/></g><g fill="currentColor" font-size="16" font-weight="700"><text x="190" y="34">N</text><text x="190" y="199">mg</text><text x="63" y="103">f</text><text x="288" y="103">F</text></g></svg>`,caption:"Isolate the body and show only the external forces acting on it."},
      circuit:{label:"Series and parallel resistor circuits",svg:`<svg viewBox="0 0 440 210" role="img" aria-label="Series and parallel resistor circuits"><g fill="none" stroke="currentColor" stroke-width="3"><path d="M35 55H85l12-18 22 36 22-36 22 36 12-18h55l12-18 22 36 22-36 22 36 12-18h55"/><path d="M35 150H95V105H190V150H250V105H345V150H405"/><path d="M95 150V192H190V150M250 150V192H345V150"/></g><g fill="currentColor" font-size="14" font-weight="700"><text x="35" y="28">Series: same current</text><text x="35" y="126">Parallel: same potential difference</text><text x="128" y="96">R₁</text><text x="284" y="96">R₂</text></g></svg>`,caption:"Label current directions and voltage drops before applying Ohm's or Kirchhoff's laws."},
      ray:{label:"Convex-lens ray diagram",svg:`<svg viewBox="0 0 460 230" role="img" aria-label="Convex lens ray diagram"><g fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 145H440"/><path d="M230 35Q205 115 230 195Q255 115 230 35" stroke="#72c8ff"/><path d="M82 145V70" stroke="#ffd166"/><path d="M82 70H230L375 165" stroke="#54d6a5"/><path d="M82 70L230 145L375 165" stroke="#ff9f1c"/><path d="M375 145V165" stroke="#ffd166"/></g><g fill="currentColor" font-size="13"><text x="210" y="216">Convex lens</text><text x="62" y="62">Object</text><text x="360" y="186">Image</text><text x="145" y="162">F₁</text><text x="305" y="162">F₂</text></g></svg>`,caption:"Use a parallel ray and an optical-centre ray; their intersection gives the image position."},
      graph:{label:"Physics graph with labelled axes",svg:`<svg viewBox="0 0 420 220" role="img" aria-label="Graph with labelled axes"><g fill="none" stroke="currentColor" stroke-width="3"><path d="M60 180V30M60 180H385"/><path d="M82 164C135 150 168 123 215 108S310 75 365 45" stroke="#ffd166"/></g><g fill="currentColor" font-size="14" font-weight="700"><text x="28" y="38">y</text><text x="375" y="202">x</text><text x="236" y="88">slope = Δy/Δx</text></g></svg>`,caption:"Write the physical quantity and SI unit on each axis; interpret both slope and area where applicable."},
      pendulum:{label:"Labelled simple pendulum",svg:`<svg viewBox="0 0 420 250" role="img" aria-label="Labelled simple pendulum"><g fill="none" stroke="currentColor" stroke-width="3"><path d="M105 28H315"/><circle cx="210" cy="42" r="5" fill="#ffd166"/><path d="M210 42V215" stroke-dasharray="6 5"/><path d="M210 42L285 198" stroke="#72c8ff"/><path d="M210 92A50 50 0 0 1 232 87" stroke="#54d6a5"/></g><circle cx="285" cy="198" r="17" fill="#ffd166"/><g fill="currentColor" font-size="14" font-weight="700"><text x="218" y="65">point of suspension</text><text x="247" y="124">l</text><text x="230" y="91">θ</text><text x="302" y="204">bob</text><text x="145" y="233">mean position</text></g></svg>`,caption:"Simple pendulum: l is measured from the suspension point to the centre of the bob."},
      projectile:{label:"Projectile motion with velocity components",svg:`<svg viewBox="0 0 440 240" role="img" aria-label="Projectile trajectory"><defs><marker id="spaProjectileArrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0L0 6L7 3Z" fill="currentColor"/></marker></defs><g fill="none" stroke="currentColor" stroke-width="3"><path d="M45 205H410M45 205V28"/><path d="M70 195Q210 25 370 195" stroke="#ffd166"/><path d="M70 195L150 105" stroke="#54d6a5" marker-end="url(#spaProjectileArrow)"/><path d="M70 195H150M150 195V105" stroke="#72c8ff"/></g><g fill="currentColor" font-size="14" font-weight="700"><text x="135" y="95">u</text><text x="91" y="218">u cosθ</text><text x="158" y="152">u sinθ</text><text x="86" y="184">θ</text></g></svg>`,caption:"Resolve launch velocity into horizontal u cosθ and vertical u sinθ components."},
      wave:{label:"Transverse wave with amplitude and wavelength",svg:`<svg viewBox="0 0 440 230" role="img" aria-label="Transverse wave"><defs><marker id="spaWaveArrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0L0 6L7 3Z" fill="currentColor"/></marker></defs><path d="M30 120H410" stroke="currentColor" stroke-width="2"/><path d="M35 120C75 35 115 35 155 120S235 205 275 120S355 35 395 120" fill="none" stroke="#72c8ff" stroke-width="4"/><g stroke="#ffd166" stroke-width="2" marker-end="url(#spaWaveArrow)"><path d="M95 120V54"/><path d="M95 45H315"/></g><g fill="currentColor" font-size="14" font-weight="700"><text x="104" y="87">A</text><text x="198" y="38">λ</text><text x="25" y="143">equilibrium</text></g></svg>`,caption:"Amplitude A is measured from equilibrium; wavelength λ joins successive points in the same phase."},
      field:{label:"Gaussian surface and electric field",svg:`<svg viewBox="0 0 440 240" role="img" aria-label="Gaussian surface around a positive charge"><defs><marker id="spaFieldArrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0L0 6L7 3Z" fill="currentColor"/></marker></defs><circle cx="220" cy="120" r="76" fill="none" stroke="#72c8ff" stroke-width="3" stroke-dasharray="7 6"/><circle cx="220" cy="120" r="9" fill="#ffd166"/><g stroke="#54d6a5" stroke-width="3" marker-end="url(#spaFieldArrow)"><path d="M220 106V28"/><path d="M220 134V212"/><path d="M206 120H128"/><path d="M234 120H312"/><path d="M210 110L153 53"/><path d="M230 110L287 53"/><path d="M210 130L153 187"/><path d="M230 130L287 187"/></g><g fill="currentColor" font-size="14" font-weight="700"><text x="231" y="117">+q</text><text x="305" y="96">Gaussian surface</text><text x="242" y="40">E, dA</text></g></svg>`,caption:"For spherical symmetry, E is radial and constant on the Gaussian surface, so ΦE = E(4πr²)."}
    };
    const item=diagrams[type] || diagrams.graph;
    wrap.setAttribute("aria-label",item.label);
    wrap.innerHTML=`${item.svg}<figcaption>${item.caption}</figcaption>`;
    return wrap;
  }
  function diagramFor(type) {
    return type === "force" ? forceDiagram() : simpleDiagram(type);
  }
  function appendSources(bubble,sources=[]) {
    const valid=sources.filter(source => /^assets\/pdfs\/class-(9|10|11|12)\/.+\.pdf$/i.test(source.path || ""));
    if (!valid.length) return;
    const section=document.createElement("section");
    section.className="spa-sources";
    const heading=document.createElement("strong");
    heading.textContent="Local PDF sources";
    const list=document.createElement("div");
    valid.forEach(source => {
      const link=document.createElement("a");
      link.href=`${source.path}#page=${Math.max(1,Number(source.page)||1)}&view=FitH`;
      link.target="_blank";
      link.rel="noopener";
      link.textContent=`${source.figures?.length ? "Original figure · " : ""}${source.title} · p. ${source.page}`;
      link.title=`Open ${source.fileName}, page ${source.page}`;
      list.append(link);
    });
    section.append(heading,list);
    bubble.append(section);
  }
  function appendMessage(message) {
    const article = document.createElement("article");
    article.className = `spa-message ${message.role}`;
    const label = document.createElement("span");
    label.className = "spa-message-label";
    label.textContent = message.role === "assistant" ? "Sanjay Physics Assistant · Offline local library" : "You";
    const bubble = document.createElement("div");
    bubble.className = "spa-bubble";
    if (message.role === "assistant") {
      const parts = String(message.content).split(/(\[\[diagram:[a-z-]+\]\])/i);
      parts.forEach(part => {
        const marker=part.match(/^\[\[diagram:([a-z-]+)\]\]$/i);
        if (marker) bubble.append(diagramFor(marker[1].toLowerCase()));
        else if (part) {
          const paragraph = document.createElement("p");
          paragraph.innerHTML = safeMarkup(part);
          bubble.append(paragraph);
        }
      });
      appendSources(bubble,message.sources);
    } else bubble.textContent = message.content;
    article.append(label,bubble);
    el.messages.append(article);
  }
  function render() {
    el.messages.replaceChildren();
    const items = history.length ? history : [{role:"assistant",content:"I am your Sanjay, your Physics Assistant.\n\nNamaste! I work fully offline with the local Class 9, 10, 11 and 12 PDF library, including theory, numericals and CBSE Board question banks. Choose a class, then ask for an explanation, derivation, diagram, MCQ hint or step-by-step solution."}];
    items.forEach(appendMessage);
    requestAnimationFrame(() => { el.messages.scrollTop = el.messages.scrollHeight; });
  }
  function appendThinking() {
    const article=document.createElement("article");
    article.className="spa-message assistant spa-pending";
    const label=document.createElement("span");
    label.className="spa-message-label";
    label.textContent="Sanjay Physics Assistant · Offline local library";
    const bubble=document.createElement("div");
    bubble.className="spa-bubble spa-thinking";
    const spinner=document.createElement("span");
    spinner.className="spa-spinner";
    spinner.setAttribute("aria-hidden","true");
    bubble.append(spinner,document.createTextNode("Searching local notes and question banks…"));
    article.append(label,bubble);
    el.messages.append(article);
    el.messages.scrollTop=el.messages.scrollHeight;
  }
  function setListening(value) {
    listening = value;
    el.mic.classList.toggle("is-listening",value);
    el.mic.setAttribute("aria-pressed",String(value));
    el.mic.setAttribute("aria-label",value ? "Stop voice input" : "Start voice input");
    el.mic.title = value ? "Listening… click to stop" : "Speak your question";
    el.note.textContent = value ? "Listening… speak now" : "100% offline · Classes 9–12 · NCERT · CBSE Board · Sanjay Singh (संजय सिंह)";
  }
  function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      el.mic.disabled = true;
      el.mic.title = "Voice input is not supported by this browser";
      el.mic.setAttribute("aria-label",el.mic.title);
      return;
    }
    recognition = new SpeechRecognition();
    recognition.lang = navigator.language || "en-IN";
    recognition.continuous = false;
    recognition.interimResults = true;
    if ("processLocally" in recognition) recognition.processLocally = true;
    recognition.onstart = () => { voicePrefix=el.input.value.trim(); setListening(true); };
    recognition.onresult = event => {
      let finalText="", interimText="";
      for (let index=0; index<event.results.length; index++) {
        const text=event.results[index][0]?.transcript || "";
        if (event.results[index].isFinal) finalText+=text; else interimText+=text;
      }
      el.input.value=[voicePrefix,finalText,interimText].filter(Boolean).join(" ").trim();
    };
    recognition.onerror = event => {
      const errors={"not-allowed":"Microphone permission was denied","audio-capture":"No microphone was found","no-speech":"No speech was detected","language-not-supported":"Offline speech language is not installed",network:"Speech recognition is unavailable offline in this browser"};
      el.note.textContent=errors[event.error] || "Voice input could not start";
    };
    recognition.onend = () => { setListening(false); el.input.focus(); };
  }
  function toggleVoice() {
    if (!recognition || pending) return;
    if (listening) return recognition.stop();
    try { recognition.start(); } catch { el.note.textContent="Voice input is already active"; }
  }
  function open() {
    el.panel.classList.remove("hidden"); el.backdrop.classList.remove("hidden"); el.launcher.classList.add("hidden");
    el.launcher.setAttribute("aria-expanded","true"); document.body.classList.add("spa-chat-open");
    setTimeout(() => el.input.focus(),120);
  }
  function close() {
    if (listening) recognition?.abort();
    el.panel.classList.add("hidden"); el.backdrop.classList.add("hidden"); el.launcher.classList.remove("hidden");
    el.launcher.setAttribute("aria-expanded","false"); document.body.classList.remove("spa-chat-open");
  }
  async function ask(raw) {
    const question = String(raw || "").trim();
    if (!question || pending) return;
    if (listening) recognition?.abort();
    pending = true; history.push({role:"user",content:question}); save(); render(); el.input.value=""; el.input.disabled=true; el.mic.disabled=true; el.send.disabled=true;
    setStatus("Searching local PDF index…","working");
    appendThinking();
    try {
      const context = el.classSelect.value === "General Chat" ? {} : {className:engineLevel(),chapter:el.chapter.value.trim()};
      const result = await Engine.answer({message:question,context,history:history.slice(0,-1).slice(-8)});
      history.push({role:"assistant",content:result.answer,chapter:result.chapter,source:result.source,sources:result.sources || []});
      setStatus("Offline library ready","ready");
      save(); render();
    } finally { pending=false; el.input.disabled=false; el.mic.disabled=!recognition; el.send.disabled=false; el.input.focus(); }
  }

  populateLevels();
  populateChapters(savedContext.chapter || "");
  Corpus?.ready().then(stats => setStatus(`${stats.documentCount} PDFs · ${stats.pageCount.toLocaleString("en-IN")} pages · Offline`,"ready")).catch(() => setStatus("Offline knowledge pack ready","fallback"));
  Corpus?.preload(engineLevel());
  initSpeechRecognition();
  render();
  el.launcher.addEventListener("click",open); el.backdrop.addEventListener("click",close); el.close.addEventListener("click",close);
  el.mic.addEventListener("click",toggleVoice);
  el.clear.addEventListener("click",() => { if (!history.length || confirm("Clear the offline assistant chat saved on this device?")) { history=[]; save(); render(); } });
  el.classSelect.addEventListener("change",() => { populateChapters(); Corpus?.preload(engineLevel()); });
  el.chapter.addEventListener("change",saveContext);
  el.chapter.addEventListener("input",saveContext);
  el.form.addEventListener("submit",event => { event.preventDefault(); ask(el.input.value); });
  el.input.addEventListener("keydown",event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); el.form.requestSubmit(); } });
  el.actions.addEventListener("click",event => { const button=event.target.closest("[data-prompt]"); if (button) ask(button.dataset.prompt); });
  document.addEventListener("keydown",event => { if (event.key === "Escape" && !el.panel.classList.contains("hidden")) close(); });
})();
