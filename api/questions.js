"use strict";

const {applyCors, cleanText} = require("./_utils");
const {requireAdmin} = require("./_admin-auth");

const QUESTION_SECTIONS = new Set(["questionBanks", "quizzes", "boardQuestions"]);
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;

async function deleteFromSupabase(questionId, section) {
  const supabaseUrl = String(process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) throw Object.assign(new Error("Question storage is not configured."), {status:503, code:"DATABASE_NOT_CONFIGURED"});
  const result = await fetch(`${supabaseUrl}/rest/v1/rpc/delete_question`, {
    method:"POST",
    headers:{
      apikey:serviceRoleKey,
      Authorization:`Bearer ${serviceRoleKey}`,
      "Content-Type":"application/json"
    },
    body:JSON.stringify({p_question_id:questionId, p_section:section})
  });
  if (!result.ok) {
    const detail = await result.text().catch(() => "");
    console.error("Supabase delete_question failed", result.status, detail.slice(0, 500));
    throw Object.assign(new Error("The question database rejected the deletion."), {status:502, code:"DATABASE_DELETE_FAILED"});
  }
}

async function listSupabaseDeletions() {
  const supabaseUrl = String(process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) throw Object.assign(new Error("Question storage is not configured."), {status:503, code:"DATABASE_NOT_CONFIGURED"});
  const result = await fetch(`${supabaseUrl}/rest/v1/question_deletions?select=question_id,section&order=deleted_at.desc&limit=5000`, {
    headers:{apikey:serviceRoleKey, Authorization:`Bearer ${serviceRoleKey}`}
  });
  if (!result.ok) throw Object.assign(new Error("Question deletions could not be loaded."), {status:502, code:"DATABASE_READ_FAILED"});
  return result.json();
}

module.exports = async function questions(request, response) {
  if (!applyCors(request, response)) return response.status(403).json({error:{code:"ORIGIN_NOT_ALLOWED", message:"This frontend origin is not allowed."}});
  if (request.method === "OPTIONS") return response.status(204).end();
  response.setHeader("Cache-Control", "no-store");
  if (request.method === "GET") {
    try { return response.status(200).json({deletions:await listSupabaseDeletions()}); }
    catch (error) { return response.status(error.status || 500).json({error:{code:error.code || "READ_FAILED", message:error.message}}); }
  }
  if (request.method !== "DELETE") return response.status(405).json({error:{code:"METHOD_NOT_ALLOWED", message:"Use GET or DELETE."}});
  if (!requireAdmin(request, response)) return;

  let body;
  try { body = typeof request.body === "string" ? JSON.parse(request.body || "{}") : (request.body || {}); }
  catch { return response.status(400).json({error:{code:"INVALID_JSON", message:"The request body must be valid JSON."}}); }
  const questionId = cleanText(body.question_id, 128);
  const section = cleanText(body.section, 40);
  if (!ID_PATTERN.test(questionId) || !QUESTION_SECTIONS.has(section)) {
    return response.status(400).json({error:{code:"INVALID_QUESTION", message:"A valid question_id and question section are required."}});
  }

  try {
    await deleteFromSupabase(questionId, section);
    return response.status(200).json({deleted:true, question_id:questionId});
  } catch (error) {
    return response.status(error.status || 500).json({error:{code:error.code || "DELETE_FAILED", message:error.message || "The question could not be deleted."}});
  }
};
