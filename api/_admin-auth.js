"use strict";

const crypto = require("crypto");

const TOKEN_TTL_SECONDS = 8 * 60 * 60;

function base64url(value) {
  return Buffer.from(value).toString("base64url");
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left || ""));
  const b = Buffer.from(String(right || ""));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function configured() {
  return /^[a-f0-9]{64}$/i.test(String(process.env.ADMIN_PIN_HASH || ""))
    && String(process.env.ADMIN_SESSION_SECRET || "").length >= 32;
}

function hashPin(pin) {
  return crypto.createHash("sha256").update(`sanjay-physics:${pin}`).digest("hex");
}

function verifyPin(pin) {
  return configured() && safeEqual(hashPin(String(pin || "")), process.env.ADMIN_PIN_HASH);
}

function signAdminToken() {
  const payload = base64url(JSON.stringify({sub:"admin", role:"admin", exp:Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS}));
  const signature = crypto.createHmac("sha256", process.env.ADMIN_SESSION_SECRET).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function readBearerToken(request) {
  const authorization = String(request.headers.authorization || "");
  return authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
}

function verifyAdminToken(token) {
  if (!configured() || !token) return null;
  const [payload, signature, extra] = String(token).split(".");
  if (!payload || !signature || extra) return null;
  const expected = crypto.createHmac("sha256", process.env.ADMIN_SESSION_SECRET).update(payload).digest("base64url");
  if (!safeEqual(signature, expected)) return null;
  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (claims.role !== "admin" || claims.sub !== "admin" || Number(claims.exp) <= Date.now() / 1000) return null;
    return claims;
  } catch { return null; }
}

function requireAdmin(request, response) {
  const claims = verifyAdminToken(readBearerToken(request));
  if (!claims) {
    response.status(403).json({error:{code:"ADMIN_REQUIRED", message:"A valid admin session is required."}});
    return null;
  }
  return claims;
}

module.exports = {configured, requireAdmin, signAdminToken, verifyAdminToken, verifyPin};
