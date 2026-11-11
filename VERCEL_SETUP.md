# Vercel deployment

1. Import this project into Vercel. The JavaScript files inside `api/` are detected as Vercel Functions automatically.
2. In **Project Settings → Environment Variables**, add `GEMINI_API_KEY` and select Production (plus Preview if desired).
3. Optionally add `GEMINI_MODEL`, `GEMINI_FALLBACK_MODEL`, and an exact comma-separated `ALLOWED_ORIGINS` value.
4. Redeploy after changing environment variables.
5. Deploy the complete folder to Vercel. The frontend automatically uses its own origin and `/api`; no hostname, localhost port, or manual key is required.
6. If the frontend is hosted separately on GitHub Pages, set `window.SANJAY_PHYSICS_API_BASE_URL` to the deployed Vercel origin before `api-config.js` loads. GitHub Pages cannot run the `/api` serverless functions itself.

The Gemini key must exist only in Vercel's environment settings. Never add it to `api-config.js`, HTML, frontend JavaScript, or the repository.

## Admin question deletion

Apply `supabase/migrations/202611060001_delete_questions.sql` in the Supabase SQL editor, then configure these Vercel environment variables:

```text
ADMIN_PIN_HASH=<sha256 of sanjay-physics:YOUR_PIN>
ADMIN_SESSION_SECRET=<at least 32 random characters>
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<server-only Supabase service role key>
```

Generate the PIN hash locally with Node.js (replace the example PIN):

```bash
node -e "console.log(require('crypto').createHash('sha256').update('sanjay-physics:YOUR_PIN').digest('hex'))"
```

Never place the service-role key or session secret in `api-config.js`; they must remain server-only Vercel variables. The protected `DELETE /api/questions` function verifies the signed admin role before calling the database function. The public `GET /api/questions` response contains deletion IDs only, allowing every browser to hide records that have been permanently deleted.
