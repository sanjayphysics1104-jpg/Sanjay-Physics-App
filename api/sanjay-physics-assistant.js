"use strict";

const {applyCors, callSanjayGemini, cleanText} = require("./_utils");

module.exports = async function sanjayPhysicsAssistant(request, response) {
  if (!applyCors(request, response)) return response.status(403).json({error:{code:"ORIGIN_NOT_ALLOWED", message:"This frontend origin is not allowed."}});
  if (request.method === "OPTIONS") return response.status(204).end();
  if (request.method !== "POST") return response.status(405).json({error:{code:"METHOD_NOT_ALLOWED", message:"Use POST."}});
  response.setHeader("Cache-Control", "no-store");
  let body;
  try { body = typeof request.body === "string" ? JSON.parse(request.body || "{}") : (request.body || {}); }
  catch { return response.status(400).json({error:{code:"INVALID_JSON", message:"The request body must be valid JSON."}}); }
  if (!cleanText(body.message)) return response.status(400).json({error:{code:"INVALID_MESSAGE", message:"Please enter a physics question."}});
  try {
    const answer = await callSanjayGemini(body);
    return response.status(200).json({answer, source:"gemini"});
  } catch (error) {
    const status = [400, 401, 403, 429, 502, 503, 504].includes(error.status) ? error.status : 502;
    const safeMessage = status === 503 && error.code === "NOT_CONFIGURED"
      ? "The assistant service is not configured on this deployment."
      : status === 429 ? "Gemini is busy right now. The offline assistant can still help."
        : status === 504 ? "Gemini took too long to respond. The offline assistant can still help."
          : "Gemini is temporarily unavailable. The offline assistant can still help.";
    return response.status(status).json({error:{code:error.code || "GEMINI_ERROR", message:safeMessage}});
  }
};
