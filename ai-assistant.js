"use strict";

(() => {
  const HISTORY_KEY = "sanjay_physics_ai_history_v1";
  const PREFERENCES_KEY = "sanjay_physics_ai_preferences_v1";
  const MAX_STORED_MESSAGES = 40;
  const REQUEST_HISTORY_MESSAGES = 14;
  const DUPLICATE_SUBMIT_WINDOW_MS = 2_000;
  const WELCOME = "I am your AI Physics Assistant. Choose your class and chapter, then ask me for explanation, numerical solution, formula, or MCQ hint.";
  const CHAPTERS = {
    "Class 9th": ["Motion", "Force and Laws of Motion", "Gravitation", "Work and Energy", "Sound"],
    "Class 10th": ["Light – Reflection and Refraction", "The Human Eye and the Colourful World", "Electricity", "Magnetic Effects of Electric Current", "Sources of Energy"],
    "Class 11th": ["Units and Measurements", "Motion in a Straight Line", "Motion in a Plane", "Laws of Motion", "Work, Energy and Power", "Rotational Motion", "Gravitation", "Mechanical Properties of Matter", "Thermodynamics", "Kinetic Theory", "Oscillations", "Waves"],
    "Class 12th": ["Electric Charges and Fields", "Electrostatic Potential and Capacitance", "Current Electricity", "Moving Charges and Magnetism", "Magnetism and Matter", "Electromagnetic Induction", "Alternating Current", "Electromagnetic Waves", "Ray Optics", "Wave Optics", "Dual Nature of Radiation and Matter", "Atoms", "Nuclei", "Semiconductor Electronics"],
    "NEET / JEE": ["Mechanics", "Thermal Physics", "Electrostatics", "Current Electricity", "Magnetism", "Electromagnetic Induction", "Optics", "Modern Physics"],
    "General Chat": []
  };
  const CLASS_NAMES = Object.keys(CHAPTERS);

  const elements = {
    launcher: document.querySelector("#aiLauncher"),
    backdrop: document.querySelector("#aiBackdrop"),
    panel: document.querySelector("#aiPanel"),
    body: document.querySelector(".ai-body"),
    minimize: document.querySelector("#aiMinimize"),
    close: document.querySelector("#aiClose"),
    unread: document.querySelector("#aiUnread"),
    messages: document.querySelector("#aiMessages"),
    quickActions: document.querySelector("#aiQuickActions"),
    form: document.querySelector("#aiForm"),
    input: document.querySelector("#aiInput"),
    send: document.querySelector("#aiSend"),
    mic: document.querySelector("#aiMic"),
    classSelect: document.querySelector("#aiClass"),
    chapterSelect: document.querySelector("#aiChapter"),
    chapterList: document.querySelector("#aiChapterList"),
    chapterField: document.querySelector("#aiChapterField"),
    context: document.querySelector(".ai-context"),
    clear: document.querySelector("#aiClear")
  };

  if (!elements.launcher || !elements.panel) return;

  const assistant = document.querySelector("#aiAssistant");
  const assistantMount = document.querySelector("#aiAssistantMount");
  const status = document.querySelector("#aiStatus");
  if (assistant && assistantMount) assistantMount.append(assistant);

  let messages = loadHistory();
  let pending = false;
  let activeAction = "";
  let lastQuestion = "";
  let renderingWarningShown = false;
  let recognition = null;
  let listening = false;
  let voiceInputPrefix = "";
  let discardVoiceResults = false;
  let lastSubmission = {question: "", time: 0};
  let activeApiBaseUrl = "";
  let connectionPromise = null;
  let usingDirectGemini = false;

  function localGeminiKey() {
    if (window.location.protocol !== "file:") return "";
    return String(window.SANJAY_PHYSICS_LOCAL_GEMINI_KEY || "").trim();
  }

  function apiBaseCandidates() {
    const candidates = [];
    const add = base => { if (base && !candidates.includes(base)) candidates.push(base); };
    const configured = String(window.SANJAY_PHYSICS_API_BASE_URL || "").trim().replace(/\/$/, "");
    if (configured) add(configured);
    // Full Vercel deployments (including custom domains and preview URLs) use
    // the same origin. GitHub Pages needs SANJAY_PHYSICS_API_BASE_URL because
    // it cannot host the serverless /api directory itself.
    if (/^https?:$/.test(window.location.protocol) && !window.location.hostname.endsWith(".github.io")) {
      add(window.location.origin);
    }
    return candidates;
  }

  async function fetchWithTimeout(url, options = {}, timeoutMs = 5_000) {
    const controller = new AbortController();
    const parentSignal = options.signal;
    const abortFromParent = () => controller.abort();
    if (parentSignal) {
      if (parentSignal.aborted) controller.abort();
      else parentSignal.addEventListener("abort", abortFromParent, {once:true});
    }
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try { return await fetch(url, {...options, signal:controller.signal}); }
    finally {
      clearTimeout(timeout);
      parentSignal?.removeEventListener("abort", abortFromParent);
    }
  }

  async function connectToBackend() {
    if (!navigator.onLine) {
      activeApiBaseUrl = "";
      setConnectionStatus("Offline Mode - Search Available", "error");
      return false;
    }
    if (connectionPromise) return connectionPromise;
    connectionPromise = (async () => {
      if (!apiBaseCandidates().length) {
        if (localGeminiKey()) {
          usingDirectGemini = true;
          setConnectionStatus("AI Ready (Local Test)", "ready");
          return true;
        }
        setConnectionStatus("Vercel API URL needs configuration", "error");
        return false;
      }
      setConnectionStatus("Connecting to AI…", "working");
      for (const baseUrl of apiBaseCandidates()) {
        try {
          const response = await fetchWithTimeout(`${baseUrl}/api/health`, {cache:"no-store", credentials:"omit"});
          if (!response.ok) continue;
          const health = await response.json().catch(() => ({}));
          activeApiBaseUrl = baseUrl;
          if (health.assistantConfigured) {
            usingDirectGemini = false;
            setConnectionStatus("AI Ready (Online)", "ready");
            return true;
          }
          setConnectionStatus("AI setup required on server", "error");
          return false;
        } catch {}
      }
      activeApiBaseUrl = "";
      if (localGeminiKey()) {
        usingDirectGemini = true;
        setConnectionStatus("AI Ready (Local Test)", "ready");
        return true;
      }
      setConnectionStatus("AI unavailable - Search Available", "error");
      return false;
    })().finally(() => { connectionPromise = null; });
    return connectionPromise;
  }

  function directGeminiPayload(payload) {
    const contents = (Array.isArray(payload.history) ? payload.history : [])
      .filter(item => item && ["user", "assistant"].includes(item.role) && typeof item.content === "string")
      .map(item => ({role:item.role === "assistant" ? "model" : "user", parts:[{text:item.content.slice(0, 3000)}]}));
    const context = payload.context && typeof payload.context === "object" ? payload.context : {};
    const contextText = [
      context.className && `Class / mode: ${String(context.className).slice(0, 60)}`,
      context.chapter && `Chapter: ${String(context.chapter).slice(0, 100)}`,
      context.action && `Requested action: ${String(context.action).slice(0, 120)}`
    ].filter(Boolean).join("\n");
    contents.push({role:"user", parts:[{text:`${contextText ? `${contextText}\n\n` : ""}Student question:\n${String(payload.message || "").slice(0, 3000)}`} ]});
    return {
      systemInstruction:{parts:[{text:"You are the AI Physics Assistant for CBSE, NEET and JEE. Give precise, encouraging, exam-focused answers using NCERT terminology. For numericals, show Given, To Find, Formula, Substitution and Final Answer with SI units. Use valid LaTeX. Stay within physics and directly required mathematics unless the selected mode is General Chat."}]},
      contents,
      generationConfig:{temperature:context.className === "General Chat" ? 0.55 : 0.25, topP:0.9, maxOutputTokens:2600}
    };
  }

  async function fetchDirectGemini(payload, signal) {
    const key = localGeminiKey();
    if (!key) throw new TypeError("Local Gemini key is unavailable");
    const models = ["gemini-3.5-flash-lite", "gemini-3.5-flash"];
    let lastError;
    for (const model of models) {
      try {
        const response = await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method:"POST",
          mode:"cors",
          credentials:"omit",
          cache:"no-store",
          headers:{"Content-Type":"application/json", "x-goog-api-key":key},
          body:JSON.stringify(directGeminiPayload(payload)),
          signal
        }, 45_000);
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          const error = new Error(result?.error?.message || "Gemini request failed.");
          error.status = response.status;
          error.code = result?.error?.status || "GEMINI_ERROR";
          if ([404, 429, 500, 502, 503, 504].includes(response.status) && model !== models.at(-1)) {
            lastError = error;
            continue;
          }
          throw error;
        }
        const answer = result?.candidates?.[0]?.content?.parts?.map(part => part.text || "").join("").trim();
        if (!answer) throw new Error("Gemini returned an empty response.");
        return answer;
      } catch (error) {
        lastError = error;
        if (error.name === "AbortError" || error.status && ![404, 429, 500, 502, 503, 504].includes(error.status)) throw error;
      }
    }
    throw lastError || new Error("Gemini request failed.");
  }

  async function fetchAssistant(payload, signal) {
    if (!navigator.onLine) throw new TypeError("Offline");
    if (!activeApiBaseUrl && !(await connectToBackend())) throw new TypeError("Backend unavailable");
    if (usingDirectGemini && !activeApiBaseUrl) return fetchDirectGemini(payload, signal);
    const tryRequest = async () => {
      try {
        const response = await fetchWithTimeout(`${activeApiBaseUrl}/api/physics-assistant`, {
          method: "POST",
          mode: "cors",
          credentials: "omit",
          cache: "no-store",
          headers: {"Content-Type":"application/json", "Accept":"application/json"},
          body: JSON.stringify(payload),
          signal
        }, 65_000);
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          const error = new Error(result?.error?.message || "The AI Physics Assistant is temporarily unavailable.");
          error.status = response.status;
          error.code = result?.error?.code;
          throw error;
        }
        if (typeof result.answer !== "string" || !result.answer.trim()) throw new Error("The assistant returned an empty response.");
        return result.answer;
      } catch (error) {
        if (error.name === "AbortError") throw error;
        if (error.status) throw error;
        activeApiBaseUrl = "";
        throw error;
      }
    };
    try { return await tryRequest(); }
    catch (error) {
      if (error.status || error.name === "AbortError") throw error;
      if (await connectToBackend()) return tryRequest();
      throw error;
    }
  }

  function setConnectionStatus(message = "Ready to help", state = "ready") {
    if (!status) return;
    status.dataset.state = state;
    status.lastChild.textContent = ` ${message}`;
  }

  function loadHistory() {
    try {
      const saved = JSON.parse(localStorage.getItem(HISTORY_KEY));
      if (!Array.isArray(saved)) return [];
      return saved
        .filter(item => item && ["user", "assistant"].includes(item.role) && typeof item.content === "string")
        .slice(-MAX_STORED_MESSAGES);
    } catch {
      return [];
    }
  }

  function saveHistory() {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-MAX_STORED_MESSAGES)));
    } catch {
      // Chat remains usable in memory when browser storage is unavailable.
    }
  }

  function loadPreferences() {
    try { return JSON.parse(localStorage.getItem(PREFERENCES_KEY)) || {}; }
    catch { return {}; }
  }

  function savePreferences() {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify({
        className: elements.classSelect.value,
        chapter: elements.chapterSelect.value
      }));
    } catch {}
  }

  function populateClasses(preferredClass = "") {
    elements.classSelect.replaceChildren(...CLASS_NAMES.map(className => {
      const option = document.createElement("option");
      option.value = className;
      option.textContent = className;
      return option;
    }));
    elements.classSelect.value = CHAPTERS[preferredClass] ? preferredClass : "Class 11th";
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>'"]/g, character => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[character]));
  }

  function fallbackMarkdown(source) {
    return escapeHTML(source)
      .replace(/^###\s+(.+)$/gm, "<h3>$1</h3>")
      .replace(/^##\s+(.+)$/gm, "<h2>$1</h2>")
      .replace(/^#\s+(.+)$/gm, "<h1>$1</h1>")
      .replace(/\*\*(.+?)\*\*/gs, "<strong>$1</strong>")
      .replace(/`([^`\n]+)`/g, "<code>$1</code>")
      .replace(/\n{2,}/g, "</p><p>")
      .replace(/\n/g, "<br>");
  }

  function renderMarkdown(source) {
    if (typeof window.marked?.parse === "function" && typeof window.DOMPurify?.sanitize === "function") {
      const parsed = window.marked.parse(String(source), {gfm: true, breaks: true, async: false});
      return window.DOMPurify.sanitize(parsed, {
        USE_PROFILES: {html: true},
        FORBID_TAGS: ["style", "iframe", "form", "input", "button"],
        FORBID_ATTR: ["style", "onerror", "onclick"]
      });
    }
    if (!renderingWarningShown) {
      console.error("Markdown libraries did not load; using the built-in safe renderer.");
      renderingWarningShown = true;
    }
    return `<p>${fallbackMarkdown(source)}</p>`;
  }

  function renderMathWithKatex(container) {
    if (typeof window.katex?.render !== "function") return false;
    const ignoredTags = new Set(["CODE", "PRE", "SCRIPT", "STYLE", "TEXTAREA"]);
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) {
      if (!ignoredTags.has(walker.currentNode.parentElement?.tagName)) textNodes.push(walker.currentNode);
    }
    const mathPattern = /\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\$([^$\n]+?)\$|\\\((.+?)\\\)/g;
    textNodes.forEach(node => {
      const text = node.nodeValue || "";
      mathPattern.lastIndex = 0;
      if (!mathPattern.test(text)) return;
      mathPattern.lastIndex = 0;
      const fragment = document.createDocumentFragment();
      let lastIndex = 0;
      let match;
      while ((match = mathPattern.exec(text))) {
        fragment.append(document.createTextNode(text.slice(lastIndex, match.index)));
        const displayMode = Boolean(match[1] || match[2]);
        const mathHost = document.createElement(displayMode ? "div" : "span");
        const expression = match[1] || match[2] || match[3] || match[4];
        try {
          window.katex.render(expression.trim(), mathHost, {displayMode, throwOnError: false, strict: false});
        } catch {
          mathHost.textContent = match[0];
        }
        fragment.append(mathHost);
        lastIndex = mathPattern.lastIndex;
      }
      fragment.append(document.createTextNode(text.slice(lastIndex)));
      node.replaceWith(fragment);
    });
    return true;
  }

  function renderMath(container) {
    if (typeof window.renderMathInElement === "function") {
      try {
        window.renderMathInElement(container, {
          delimiters: [
            {left: "$$", right: "$$", display: true},
            {left: "\\[", right: "\\]", display: true},
            {left: "$", right: "$", display: false},
            {left: "\\(", right: "\\)", display: false}
          ],
          ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code"],
          throwOnError: false,
          strict: false
        });
        return;
      } catch (error) {
        console.warn("KaTeX auto-render failed; using the core renderer.", error);
      }
    }
    if (!renderMathWithKatex(container) && !renderingWarningShown) {
      console.error("KaTeX did not load; mathematical notation cannot be typeset.");
      renderingWarningShown = true;
    }
  }

  /**
   * Converts an untrusted AI response into safe, formatted chat content.
   * Keep this as the single injection point for every assistant response.
   */
  function renderRichResponse(container, source) {
    container.innerHTML = renderMarkdown(source);
    renderMath(container);
  }

  function messageElement(message, index) {
    const item = document.createElement("article");
    item.className = `ai-message ${message.role}${message.status === "error" ? " error" : ""}`;
    item.dataset.messageIndex = String(index);

    const label = document.createElement("span");
    label.className = "ai-message-label";
    label.textContent = message.role === "assistant" ? "Physics AI" : "You";

    const bubble = document.createElement("div");
    bubble.className = "ai-bubble";
    if (message.role === "assistant") {
      renderRichResponse(bubble, message.content);
    } else {
      bubble.textContent = message.content;
    }
    item.append(label, bubble);

    if (message.status === "error") {
      const retry = document.createElement("button");
      retry.type = "button";
      retry.className = "ai-retry";
      retry.textContent = "Try again";
      retry.dataset.retry = "true";
      item.append(retry);
    }
    return item;
  }

  function renderMessages() {
    elements.messages.innerHTML = "";
    const visibleMessages = messages.length ? messages : [{role: "assistant", content: WELCOME, status: "welcome"}];
    visibleMessages.forEach((message, index) => elements.messages.append(messageElement(message, index)));
    scrollToLatest(false);
  }

  function scrollToLatest(smooth = true) {
    requestAnimationFrame(() => elements.messages.scrollTo({top: elements.messages.scrollHeight, behavior: smooth ? "smooth" : "auto"}));
  }

  function showTyping() {
    const typing = document.createElement("article");
    typing.className = "ai-message assistant ai-typing-message";
    typing.id = "aiTyping";
    typing.innerHTML = `<span class="ai-message-label">Physics AI</span><div class="ai-bubble ai-typing" role="status" aria-live="polite"><span class="ai-spinner" aria-hidden="true"></span><span class="ai-thinking-copy">Thinking…</span></div>`;
    elements.messages.append(typing);
    scrollToLatest();
  }

  function removeTyping() {
    document.querySelector("#aiTyping")?.remove();
  }

  function setPending(value) {
    pending = value;
    elements.send.disabled = value;
    elements.input.disabled = value;
    if (elements.mic) elements.mic.disabled = value || !recognition;
    elements.quickActions.querySelectorAll("button").forEach(button => { button.disabled = value; });
    if (value) {
      setConnectionStatus("Thinking…", "working");
      showTyping();
    } else {
      removeTyping();
    }
  }

  function openPanel() {
    elements.panel.classList.remove("hidden");
    elements.backdrop?.classList.remove("hidden");
    elements.panel.classList.remove("minimized");
    elements.launcher.classList.add("hidden");
    elements.launcher.setAttribute("aria-expanded", "true");
    elements.minimize.textContent = "—";
    elements.minimize.setAttribute("aria-label", "Collapse assistant");
    elements.unread.classList.add("hidden");
    document.body.classList.add("ai-chat-open");
    scrollToLatest(false);
    setTimeout(() => elements.input.focus(), 180);
  }

  function closePanel() {
    elements.panel.classList.add("hidden");
    elements.backdrop?.classList.add("hidden");
    elements.launcher.classList.remove("hidden");
    elements.launcher.setAttribute("aria-expanded", "false");
    document.body.classList.remove("ai-chat-open");
    elements.launcher.focus();
  }

  function toggleMinimize() {
    closePanel();
  }

  function populateChapters(preferredChapter = "") {
    const chapters = CHAPTERS[elements.classSelect.value] || [];
    const isGeneralChat = elements.classSelect.value === "General Chat";
    elements.chapterList.replaceChildren(...chapters.map(chapter => {
      const option = document.createElement("option");
      option.value = chapter;
      return option;
    }));
    elements.chapterField.hidden = isGeneralChat;
    elements.chapterSelect.disabled = isGeneralChat;
    elements.context.classList.toggle("general-chat", isGeneralChat);
    elements.quickActions.hidden = isGeneralChat;
    // Preserve a saved custom chapter; otherwise select the first suggested chapter.
    elements.chapterSelect.value = isGeneralChat ? "" : (preferredChapter.trim() || chapters[0] || "");
    savePreferences();
  }

  function setListening(value) {
    listening = value;
    if (!elements.mic) return;
    elements.mic.classList.toggle("is-listening", value);
    elements.mic.setAttribute("aria-pressed", String(value));
    elements.mic.setAttribute("aria-label", value ? "Stop voice input" : "Start voice input");
    elements.mic.title = value ? "Listening… click to stop" : "Ask using your microphone";
  }

  function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!elements.mic || !SpeechRecognition) {
      if (elements.mic) {
        elements.mic.disabled = true;
        elements.mic.title = "Voice input is not supported by this browser";
        elements.mic.setAttribute("aria-label", elements.mic.title);
      }
      return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = navigator.language || "en-IN";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      discardVoiceResults = false;
      voiceInputPrefix = elements.input.value.trim();
      setListening(true);
      setConnectionStatus("Listening…", "working");
    };

    recognition.onresult = event => {
      if (discardVoiceResults) return;
      let finalTranscript = "";
      let interimTranscript = "";
      for (let index = 0; index < event.results.length; index++) {
        const transcript = event.results[index][0]?.transcript || "";
        if (event.results[index].isFinal) finalTranscript += transcript;
        else interimTranscript += transcript;
      }
      elements.input.value = [voiceInputPrefix, finalTranscript, interimTranscript].filter(Boolean).join(" ").trim();
      autoSizeInput();
    };

    recognition.onerror = event => {
      if (event.error === "aborted" && discardVoiceResults) return;
      const messagesByError = {
        "not-allowed": "Microphone permission was denied",
        "audio-capture": "No microphone was found",
        "no-speech": "No speech was detected",
        network: "Voice recognition network error"
      };
      setConnectionStatus(messagesByError[event.error] || "Voice input could not start", "error");
    };

    recognition.onend = () => {
      setListening(false);
      discardVoiceResults = false;
      if (pending) return;
      if (status?.dataset.state !== "error") setConnectionStatus(activeApiBaseUrl ? "AI Ready (Online)" : "AI unavailable - Search Available", activeApiBaseUrl ? "ready" : "error");
      elements.input.focus();
    };

    elements.mic.disabled = false;
  }

  function toggleVoiceInput() {
    if (!recognition || pending) return;
    if (listening) {
      recognition.stop();
      return;
    }
    try {
      recognition.start();
    } catch (error) {
      console.warn("Speech recognition could not start.", error);
      setConnectionStatus("Voice input is already active", "error");
    }
  }

  function getContext() {
    const appContext = typeof window.getSanjayPhysicsContext === "function" ? window.getSanjayPhysicsContext() : {};
    const questionBanks = Array.isArray(appContext.questionBanks) && appContext.activeClass === elements.classSelect.value
      ? appContext.questionBanks.map(bank => `${bank.title} (${bank.chapter}, ${bank.count} questions)`)
      : [];
    return {
      className: elements.classSelect.value,
      chapter: elements.chapterSelect.value,
      action: activeAction,
      questionBanks
    };
  }

  function friendlyError(error, status) {
    if (!navigator.onLine) return "You appear to be offline. Your chat is saved on this device—reconnect and tap **Try again**.";
    if (status === 504 || error?.includes("too long")) return "That response took too long. Your question is saved; please tap **Try again**.";
    if (status === 503) return error || "The AI service is not configured yet. Add GEMINI_API_KEY in the Vercel project environment settings.";
    if (!status) return "The AI service is temporarily unreachable. Search and saved learning content remain available; reconnect and tap **Try again**.";
    return error || "I couldn’t reach the tutor just now. Your chat is saved; please try again shortly.";
  }

  async function sendQuestion(rawQuestion, {isRetry = false} = {}) {
    const question = rawQuestion.trim();
    if (!question || pending) return;
    const now = Date.now();
    if (!isRetry && lastSubmission.question === question && now - lastSubmission.time < DUPLICATE_SUBMIT_WINDOW_MS) {
      setConnectionStatus("This question is already being sent", "retrying");
      return;
    }
    if (!isRetry) lastSubmission = {question, time: now};
    if (listening) {
      discardVoiceResults = true;
      recognition?.abort();
      setListening(false);
    }
    lastQuestion = question;

    if (!isRetry) {
      messages.push({role: "user", content: question, createdAt: Date.now()});
      saveHistory();
      renderMessages();
    } else {
      const last = messages.at(-1);
      if (last?.status === "error") messages.pop();
      renderMessages();
    }

    elements.input.value = "";
    autoSizeInput();
    setPending(true);

    const history = messages
      .filter(item => !item.status || item.status !== "error")
      .slice(0, -1)
      .slice(-REQUEST_HISTORY_MESSAGES)
      .map(({role, content}) => ({role, content}));

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 150_000);
      let answer;
      try {
        answer = await fetchAssistant({message:question, history, context:getContext()}, controller.signal);
      } finally {
        clearTimeout(timeout);
      }
      messages.push({role: "assistant", content: answer, createdAt: Date.now()});
      saveHistory();
      setConnectionStatus(usingDirectGemini ? "AI Ready (Local Test)" : "AI Ready (Online)", "ready");
      if (elements.panel.classList.contains("hidden") || elements.panel.classList.contains("minimized")) elements.unread.classList.remove("hidden");
    } catch (error) {
      const message = error.name === "AbortError" ? friendlyError("That response took too long.", 504) : friendlyError(error.message, error.status);
      messages.push({
        role: "assistant",
        content: message,
        status: "error",
        createdAt: Date.now()
      });
      saveHistory();
      setConnectionStatus(navigator.onLine ? "Request failed" : "You’re offline", "error");
    } finally {
      setPending(false);
      activeAction = "";
      renderMessages();
      if (!elements.panel.classList.contains("minimized")) elements.input.focus();
    }
  }

  function applyQuickAction(action) {
    activeAction = action;
    const typed = elements.input.value.trim();
    if (typed) {
      sendQuestion(`${action}: ${typed}`);
      return;
    }
    if (elements.classSelect.value === "General Chat") {
      sendQuestion(typed ? `${action}: ${typed}` : "How can you help me today?");
      return;
    }
    const chapter = elements.chapterSelect.value;
    const starter = action.startsWith("Explain")
      ? `Explain the most important idea in ${chapter} with a simple analogy.`
      : action.startsWith("Solve")
        ? `Give me a representative ${chapter} numerical and solve it step by step.`
        : action.startsWith("Give me the key formulas")
          ? `Give me the key formulas for ${chapter}, with symbol meanings and SI units.`
          : `Give me an exam-style MCQ hint from ${chapter} without revealing the answer.`;
    sendQuestion(starter);
  }

  function clearConversation() {
    if (messages.length && !window.confirm("Clear the saved AI chat on this device?")) return;
    messages = [];
    lastQuestion = "";
    localStorage.removeItem(HISTORY_KEY);
    renderMessages();
  }

  function autoSizeInput() {
    elements.input.style.height = "auto";
    elements.input.style.height = `${Math.min(elements.input.scrollHeight, 112)}px`;
  }

  function init() {
    const preferences = loadPreferences();
    const pageClass = window.getSanjayPhysicsContext?.().activeClass;
    const initialClass = preferences.className || (CLASS_NAMES.includes(pageClass) ? pageClass : "Class 11th");
    populateClasses(initialClass);
    populateChapters(preferences.chapter);
    initSpeechRecognition();
    renderMessages();
    connectToBackend();

    elements.launcher.addEventListener("click", event => { event.preventDefault(); event.stopPropagation(); openPanel(); });
    elements.backdrop?.addEventListener("click", event => { event.preventDefault(); event.stopPropagation(); closePanel(); });
    elements.close.addEventListener("click", event => { event.preventDefault(); event.stopPropagation(); closePanel(); });
    elements.minimize.addEventListener("click", event => { event.preventDefault(); event.stopPropagation(); toggleMinimize(); });
    elements.classSelect.addEventListener("change", () => populateChapters());
    elements.chapterSelect.addEventListener("change", savePreferences);
    elements.chapterSelect.addEventListener("input", savePreferences);
    elements.mic?.addEventListener("click", toggleVoiceInput);
    elements.clear.addEventListener("click", clearConversation);
    elements.form.addEventListener("submit", event => {
      event.preventDefault();
      event.stopPropagation();
      sendQuestion(elements.input.value);
    });
    elements.input.addEventListener("input", autoSizeInput);
    elements.input.addEventListener("keydown", event => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        elements.form.requestSubmit();
      }
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && !elements.panel.classList.contains("hidden")) closePanel();
    });
    elements.quickActions.addEventListener("click", event => {
      const button = event.target.closest("[data-ai-action]");
      if (button) applyQuickAction(button.dataset.aiAction);
    });
    elements.messages.addEventListener("click", event => {
      if (event.target.closest("[data-retry]")) sendQuestion(lastQuestion || messages.slice().reverse().find(item => item.role === "user")?.content || "", {isRetry: true});
    });
    window.addEventListener("online", async () => {
      await connectToBackend();
      const last = messages.at(-1);
      if (last?.status === "error" && last.content.includes("offline")) renderMessages();
    });
    window.addEventListener("offline", () => {
      activeApiBaseUrl = "";
      setConnectionStatus("Offline Mode - Search Available", "error");
    });
    window.addEventListener("sanjay:classchange", event => {
      const className = event.detail?.activeClass;
      if (CLASS_NAMES.includes(className)) {
        elements.classSelect.value = className;
        populateChapters();
      }
    });
  }

  init();
})();
