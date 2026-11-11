"use strict";

const SYSTEM_INSTRUCTION = `You are the AI Physics Assistant, a senior faculty member for CBSE, NEET and JEE preparation in India. Give precise, encouraging, exam-focused answers using standard NCERT terminology. For numericals, show Given, To Find, Formula, Substitution, Final Answer with SI unit, and a dimensional check. Write mathematical expressions in valid LaTeX using $...$ inline and $$...$$ for display. For derivations, show numbered steps and assumptions. For MCQ hints, do not reveal the answer unless explicitly requested. Stay within physics and directly required mathematics unless the selected mode is General Chat.`;
const SANJAY_SYSTEM_INSTRUCTION = `You are Sanjay Physics Assistant, an experienced, warm and rigorous Indian science teacher. Physics is your primary speciality for Classes 9–12, CBSE, NEET and JEE; in General Chat you may also support Class 12 Chemistry, Biology and Mathematics. Use NCERT terminology, explain concepts step by step, include SI units, and check numerical results. For an MCQ hint, guide the student without revealing the answer unless asked. Respect the selected class and chapter context. Never claim to have opened a local PDF or changed learning content.`;

function allowedOrigin(origin) {
  if (!origin) return true;
  // Browsers serialize file:// page origins as the literal string "null".
  if (origin === "null" || origin === "file://") return true;
  const normalizedOrigin = origin.replace(/\/$/, "");
  const configured = String(process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map(value => value.trim().replace(/\/$/, ""))
    .filter(Boolean);
  if (configured.includes(normalizedOrigin)) return true;
  if (configured.some(pattern => {
    if (!pattern.includes("*")) return false;
    const expression = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
    return new RegExp(`^${expression}$`, "i").test(normalizedOrigin);
  })) return true;
  try {
    const hostname = new URL(origin).hostname.toLowerCase();
    return hostname.endsWith(".github.io") || hostname.endsWith(".vercel.app");
  } catch { return false; }
}

function applyCors(request, response) {
  const origin = request.headers.origin;
  const requestHost = String(request.headers["x-forwarded-host"] || request.headers.host || "").split(",")[0].trim().toLowerCase();
  let isSameOrigin = false;
  if (origin && requestHost) {
    try { isSameOrigin = new URL(origin).host.toLowerCase() === requestHost; }
    catch { isSameOrigin = false; }
  }
  if (origin && !isSameOrigin && !allowedOrigin(origin)) return false;
  if (origin) response.setHeader("Access-Control-Allow-Origin", origin);
  response.setHeader("Vary", "Origin");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept, Authorization");
  response.setHeader("Access-Control-Max-Age", "86400");
  return true;
}

function cleanText(value, maxLength = 3000) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function createPayload(body, systemInstruction = SYSTEM_INSTRUCTION) {
  const context = body.context && typeof body.context === "object" ? body.context : {};
  const history = Array.isArray(body.history) ? body.history.slice(-14) : [];
  const contents = history
    .filter(item => item && ["user", "assistant"].includes(item.role) && typeof item.content === "string")
    .map(item => ({role:item.role === "assistant" ? "model" : "user", parts:[{text:cleanText(item.content)}]}));
  const contextText = [
    cleanText(context.className, 60) && `Class / mode: ${cleanText(context.className, 60)}`,
    cleanText(context.chapter, 100) && `Chapter: ${cleanText(context.chapter, 100)}`,
    cleanText(context.action, 120) && `Requested action: ${cleanText(context.action, 120)}`
  ].filter(Boolean).join("\n");
  const message = cleanText(body.message);
  contents.push({role:"user", parts:[{text:contextText ? `${contextText}\n\nStudent question:\n${message}` : message}]});
  return {
    systemInstruction:{parts:[{text:systemInstruction}]},
    contents,
    generationConfig:{temperature:cleanText(context.className, 60) === "General Chat" ? 0.55 : 0.25, topP:0.9, maxOutputTokens:2600}
  };
}

async function callGeminiWithInstruction(body, systemInstruction) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw Object.assign(new Error("GEMINI_API_KEY is not configured in Vercel."), {status:503, code:"NOT_CONFIGURED"});
  const models = [process.env.GEMINI_MODEL || "gemini-3.5-flash", process.env.GEMINI_FALLBACK_MODEL || "gemini-3.5-flash-lite"]
    .filter((model, index, all) => model && all.indexOf(model) === index);
  let lastError;
  for (const model of models) {
    const controller = new AbortController();
    // Leave enough of the 60-second Vercel budget for a fallback attempt and
    // for returning a useful JSON error to the browser.
    const timeout = setTimeout(() => controller.abort(), 24_000);
    try {
      const upstream = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method:"POST",
        headers:{"Content-Type":"application/json", "x-goog-api-key":apiKey},
        body:JSON.stringify(createPayload(body, systemInstruction)),
        signal:controller.signal
      });
      const result = await upstream.json().catch(() => ({}));
      if (!upstream.ok) {
        const error = Object.assign(new Error(result?.error?.message || "Gemini request failed."), {status:upstream.status, code:result?.error?.status || "GEMINI_ERROR"});
        if ([404, 429, 500, 502, 503, 504].includes(upstream.status) && model !== models.at(-1)) { lastError = error; continue; }
        throw error;
      }
      const answer = result?.candidates?.[0]?.content?.parts?.map(part => part.text || "").join("").trim();
      if (!answer) throw Object.assign(new Error("Gemini returned an empty response."), {status:502, code:"EMPTY_RESPONSE"});
      return answer;
    } catch (error) {
      lastError = error.name === "AbortError" ? Object.assign(new Error("Gemini request timed out."), {status:504, code:"TIMEOUT"}) : error;
      if (model === models.at(-1) || ![404, 429, 500, 502, 503, 504].includes(lastError.status || 0)) throw lastError;
    } finally { clearTimeout(timeout); }
  }
  throw lastError;
}

function callGemini(body) {
  return callGeminiWithInstruction(body, SYSTEM_INSTRUCTION);
}

function callSanjayGemini(body) {
  return callGeminiWithInstruction(body, SANJAY_SYSTEM_INSTRUCTION);
}

module.exports = {applyCors, callGemini, callSanjayGemini, cleanText};
