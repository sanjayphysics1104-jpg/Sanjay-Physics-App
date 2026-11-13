"use strict";

// Vercel serves the static app and /api functions from the same origin, so no
// hostname is hardcoded. A separate static host (for example GitHub Pages) may
// set this value before this file loads to its deployed Vercel origin.
const fileModeApiBaseUrl = window.location.protocol === "file:" ? "https://sanjay-physics-app.vercel.app" : "";
window.SANJAY_PHYSICS_API_BASE_URL = String(window.SANJAY_PHYSICS_API_BASE_URL || fileModeApiBaseUrl).trim().replace(/\/$/, "");

// Local Gemini credentials must not be committed. For local file:// testing,
// inject this value at runtime from an ignored local configuration source.
window.SANJAY_PHYSICS_LOCAL_GEMINI_KEY = String(window.SANJAY_PHYSICS_LOCAL_GEMINI_KEY || "").trim();
