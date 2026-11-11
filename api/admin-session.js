"use strict";

const {applyCors, cleanText} = require("./_utils");
const {configured, signAdminToken, verifyAdminToken, verifyPin} = require("./_admin-auth");

module.exports = function adminSession(request, response) {
  if (!applyCors(request, response)) return response.status(403).json({error:{code:"ORIGIN_NOT_ALLOWED", message:"This frontend origin is not allowed."}});
  if (request.method === "OPTIONS") return response.status(204).end();
  response.setHeader("Cache-Control", "no-store");

  if (!configured()) return response.status(503).json({error:{code:"ADMIN_NOT_CONFIGURED", message:"Admin authentication is not configured on the server."}});
  if (request.method === "GET") {
    const authorization = String(request.headers.authorization || "");
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
    const claims = verifyAdminToken(token);
    return response.status(claims ? 200 : 401).json({authenticated:Boolean(claims), role:claims ? "admin" : null});
  }
  if (request.method !== "POST") return response.status(405).json({error:{code:"METHOD_NOT_ALLOWED", message:"Use GET or POST."}});

  let body;
  try { body = typeof request.body === "string" ? JSON.parse(request.body || "{}") : (request.body || {}); }
  catch { return response.status(400).json({error:{code:"INVALID_JSON", message:"The request body must be valid JSON."}}); }
  const pin = cleanText(body.pin, 128);
  if (pin.length < 6 || !verifyPin(pin)) return response.status(401).json({error:{code:"INVALID_CREDENTIALS", message:"Incorrect admin PIN."}});
  return response.status(200).json({token:signAdminToken(), role:"admin", expiresIn:8 * 60 * 60});
};
