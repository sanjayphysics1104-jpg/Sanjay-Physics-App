"use strict";

const {applyCors} = require("./_utils");

module.exports = function health(request, response) {
  if (!applyCors(request, response)) return response.status(403).json({error:{code:"ORIGIN_NOT_ALLOWED", message:"This frontend origin is not allowed."}});
  if (request.method === "OPTIONS") return response.status(204).end();
  if (request.method !== "GET") return response.status(405).json({error:{code:"METHOD_NOT_ALLOWED", message:"Use GET."}});
  response.setHeader("Cache-Control", "no-store");
  return response.status(200).json({ok:true, assistantConfigured:Boolean(process.env.GEMINI_API_KEY)});
};
