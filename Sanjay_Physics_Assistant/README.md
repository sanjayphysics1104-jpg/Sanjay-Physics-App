# Sanjay Physics Assistant

This folder contains the application's separate, fully offline physics assistant. It makes no API or model-server request and does not call, wrap, replace or configure the app's other assistant.

## Files

- `knowledge-base.js` — compact structured NCERT/CBSE/State Board/JEE/NEET curriculum data for Classes 6–12.
- `academic-knowledge-12.json` — compact Class 12 Physics, Chemistry, Biology and Mathematics concepts and formulae.
- `academic-db.js` — lazy offline loader and subject/chapter search API for the JSON pack.
- `pdf-index/manifest.json` — lightweight metadata for every uploaded Class 9–12 PDF.
- `pdf-index/class-*.json` — lazy class-specific page text, equation and figure-reference indexes.
- `corpus-index.js` — cached client-side retrieval over the static PDF indexes.
- `offline-engine.js` — local corpus retrieval, curriculum answers and deterministic numerical solvers using SI units and Indian textbook notation.
- `offline-ui.js` — independent chat interface in the existing header position, with local PDF/page citations, microphone input, device-local history, quick actions and safe inline SVG diagrams.
- `build-pdf-index.mjs` and `extract-pdf-text.py` — development-only index generator. Python is never used by the deployed app.
- `test-offline-engine.js` — zero-dependency module contract tests.

The runtime, manifest and four class indexes are precached by the existing service worker. After the application shell is installed, the module works with the network disconnected. No model file, server, external font, Markdown library or image is needed by this assistant. Original PDF files remain unchanged and are cached by the service worker only when a student opens them.

The Class 12 JSON pack is also precached but loaded into memory only when `SanjayAcademicDatabase.load()` or `.search()` is called. This keeps initial rendering fast. Physics remains the assistant's priority and deepest domain; the same pack provides contextual Class 12 Chemistry, Biology and Mathematics support.

Speech-to-text uses the browser's Speech Recognition interface and requests on-device recognition when the browser supports it. If a browser has no local speech pack, the microphone control reports that limitation while typed offline chat continues to work normally.

## Refresh the PDF index

Run this only after adding PDFs. It reads the source files without modifying them and rewrites the static index files:

```powershell
$env:SANJAY_PYTHON_BIN="path-to-python-with-pypdf"
node Sanjay_Physics_Assistant/build-pdf-index.mjs
```

## Numerical answer contract

Every recognised numerical is rendered as:

1. Physics branch
2. Governing principle
3. Given
4. To Find
5. Formula
6. Sequential calculation
7. SI-unit and physical-consistency check
8. Answer with SI unit

To add a solver, keep that order by returning through `labelledNumerical` in `offline-engine.js`. Do not place untrusted text inside SVG; diagrams are fixed local templates created by `offline-ui.js`.

## Run tests

```powershell
node Sanjay_Physics_Assistant/test-offline-engine.js
```
