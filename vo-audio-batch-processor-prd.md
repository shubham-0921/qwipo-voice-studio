# PRD: VO Audio Batch Processor (Sarvam TTS)

**Author:** Shubham  
**Date:** May 5, 2026  
**Status:** Draft  
**Version:** 1.0

---

## 1. Overview

A local desktop/web UI tool that takes a structured voiceover script (`.docx` format, following the Qwipo video script template), parses each VO line, calls the Sarvam TTS API for each line in the configured language, and saves the resulting audio files to a local output folder — named by their timestamp/section. The tool removes the manual, error-prone process of copy-pasting VO lines one by one into TTS tools.

---

## 2. Problem Statement

- Creating voiceover audio for training/walkthrough videos requires calling a TTS API for each VO line individually — tedious and error-prone when there are 10–15+ sections.
- Language localisation (e.g. Hindi, Telugu, Tamil dubs of the same script) requires re-running the same process manually for each language.
- No existing tooling connects a structured `.docx` script → Sarvam TTS → batch audio output.
- The pain is felt every time Qwipo produces a new product walkthrough video in a new language.

---

## 3. Goals & Success Metrics

| Goal | Metric | Target |
|------|--------|--------|
| Reduce time to generate full audio batch | Time from upload to all files downloaded | < 2 min for a 15-section script |
| Zero manual copy-paste | VO lines extracted and sent to API automatically | 100% automated extraction |
| Language flexibility | Number of supported Sarvam language codes selectable in UI | All Sarvam-supported languages available |
| Correct file naming | Audio files named by section/timestamp | Every file maps unambiguously to its VO section |

---

## 4. User Personas

**Shubham / Content PM at Qwipo** — Produces product walkthrough video scripts in the Qwipo `.docx` format. Needs to generate TTS audio for each VO line across multiple languages without writing code every time.

**Video Editor / VO Producer** — Receives audio files and syncs them to the video. Needs files clearly named by section so they can drop them in timeline order without confusion.

---

## 5. User Stories / Jobs to Be Done

- As a content PM, I want to upload a `.docx` script and select a language so that the tool generates all VO audio files automatically without manual API calls.
- As a content PM, I want to enter my Sarvam API key in the UI so that I don't have to hardcode credentials.
- As a content PM, I want to select a language from a dropdown (enum) so that I can easily generate dubs for multiple languages from the same script.
- As a content PM, I want audio files named by their section timestamp (e.g. `01_0001-0018.mp3`) so that a video editor can sync them to the timeline without guesswork.
- As a content PM, I want to see a processing status per VO line so that I know which calls succeeded or failed.
- As a content PM, I want to download all generated audio files as a zip so that I can hand them off without individually saving each file.

---

## 6. Functional Requirements

### Must Have (P0)

- **File Upload:** Accept `.docx` file upload in the UI.
- **VO Extraction:** Parse the uploaded `.docx` and extract all VO lines. Parsing logic:
  - Find rows in the first table where the first cell contains `**VO**` (bold).
  - Extract the text from the second cell of that row as the VO content.
  - Associate each VO line with its timestamp from the preceding row (e.g. `0:01 – 0:18`).
- **Language Selector:** Dropdown with Sarvam-supported language codes as enum values. Initial list (expandable):
  - `hi-IN` — Hindi
  - `te-IN` — Telugu
  - `ta-IN` — Tamil
  - `kn-IN` — Kannada
  - `ml-IN` — Malayalam
  - `mr-IN` — Marathi
  - `bn-IN` — Bengali
  - `gu-IN` — Gujarati
  - `en-IN` — English (Indian)
- **API Key Input:** Text field (password type) for Sarvam API key. Not stored between sessions.
- **TTS API Call:** For each extracted VO line, call Sarvam TTS API (`POST /text-to-speech`) with:
  - `inputs`: array containing the VO text
  - `target_language_code`: selected language code
  - `speaker`: configurable (default: a sensible Sarvam default speaker per language)
  - `model`: `bulbul:v1` (or latest Sarvam model)
- **Audio File Naming Convention:**
  ```
  {zero-padded-index}_{timestamp-slug}.wav
  ```
  Example: `01_0001-0018.wav`, `02_0018-0032.wav`
  - Timestamp slug = timestamp with colons replaced by `00` padding and `–` replaced by `-`.
- **Output Download:** After all API calls complete, offer a single "Download All as ZIP" button containing all audio files.
- **Per-Line Status Display:** Show a table/list of each VO line with status: `Pending → Processing → ✅ Done / ❌ Failed`.

### Should Have (P1)

- **Speaker Selector:** Dropdown of available speakers per language (populated based on Sarvam API capabilities).
- **Retry Failed:** Button to retry only failed API calls without re-processing successful ones.
- **Preview Audio:** Play button next to each completed VO line to preview in-browser before downloading.
- **Extracted VO Preview:** Before processing, show the parsed VO lines in a review table so the user can confirm extraction is correct.

### Nice to Have (P2)

- **Pace/Pitch Controls:** Expose Sarvam API's optional `pace` and `pitch` parameters in the UI.
- **Save API Key to LocalStorage:** Optional "Remember key" toggle.
- **Multi-language Batch:** Select multiple languages and generate all in one run, outputting language-namespaced zip folders.
- **CSV Export of VO Lines:** Export parsed VO lines as `.csv` for QA or translation.

---

## 7. Non-Functional Requirements

- **Platform:** Browser-based (React single-page app) — no backend required; all API calls made client-side directly to Sarvam API.
- **Performance:** Each TTS API call should complete within 5s. UI must not freeze — use async processing with visible per-line progress.
- **Security:** API key transmitted only to Sarvam API endpoints, never logged or stored server-side. No backend = no server-side key exposure.
- **Offline:** No offline support needed; requires internet for Sarvam API calls.
- **CORS:** Sarvam API must allow browser-origin requests. If CORS is blocked, a lightweight Node/Python proxy script will be needed as a fallback (document this clearly).
- **File Size:** `.docx` files for typical Qwipo scripts are < 100KB; no special handling needed.

---

## 8. Out of Scope

- Editing or modifying VO text within the tool.
- Uploading audio back to any platform (YouTube, Drive, etc.).
- Support for non-Qwipo `.docx` formats with different table structures (for now).
- Video sync / timeline generation.
- Translation of VO text (this tool assumes the `.docx` is already in the target language).
- User accounts, authentication, or history of past runs.

---

## 9. Design & UX Notes

**Single-page flow — 4 steps:**

```
Step 1: Configure
  [ Upload .docx ]   [ Language ▾ ]   [ API Key ••••• ]   [ Speaker ▾ ]

Step 2: Review (after upload)
  Parsed VO table: | # | Timestamp | VO Text | Status |
  [ ▶ Start Processing ] button

Step 3: Processing
  Live status updates per row: Pending → Processing → ✅ Done / ❌ Failed
  Progress bar: "8 / 12 complete"

Step 4: Done
  [ ⬇ Download All as ZIP ]
  Individual [ ▶ Play ] buttons per row
```

- Keep the UI minimal — this is a power-user internal tool, not a consumer product.
- Error messages should show the Sarvam API error code + message verbatim to aid debugging.

---

## 10. Technical Considerations

**Sarvam TTS API:**
- Endpoint: `POST https://api.sarvam.ai/text-to-speech`
- Auth: `api-subscription-key` header
- Key request fields: `inputs[]`, `target_language_code`, `speaker`, `model`, `pace`, `pitch`
- Response: returns base64-encoded audio or a binary audio file (confirm from Sarvam docs — handle both)
- Rate limits: unknown — add a configurable delay between calls (default 300ms) to avoid throttling

**DOCX Parsing:**
- Use `mammoth.js` (browser-compatible) to convert `.docx` → HTML/raw content, then parse the table structure to find `VO` rows.
- Alternative: use `docx` npm library if `mammoth` doesn't preserve table structure well enough.
- Parsing target: rows where cell[0] text is `"VO"` (stripped of bold markers); extract cell[1] text.

**ZIP Generation:**
- Use `JSZip` (browser-side) to package all audio blobs into a downloadable zip.

**Tech Stack:**
- React + Vite (or plain HTML/JS if simplicity is preferred for a one-pager)
- `mammoth` for DOCX parsing
- `JSZip` for zip packaging
- Native `fetch` for Sarvam API calls
- No backend required (assumes CORS is permissive on Sarvam's API)

---

## 11. Open Questions

- [ ] Does Sarvam TTS API support browser-origin CORS requests, or is a proxy needed? (Test with a curl first, then a browser `fetch`.)
- [ ] What is Sarvam's rate limit per API key? Determines whether we need call throttling/queuing.
- [ ] Does Sarvam return audio as base64 in JSON, or as a binary stream? (Determines response parsing logic.)
- [ ] Which Sarvam speaker voices are available per language? (Needed to populate Speaker dropdown.)
- [ ] Should the output format be `.wav` or `.mp3`? Sarvam default is typically `.wav` — confirm with video editor preference.
- [ ] Should the tool support `.docx` files with multiple tables (e.g. multi-section scripts), or only the first table?

---

## 12. Timeline / Milestones

| Milestone | Target |
|-----------|--------|
| DOCX parser + VO extraction working in browser | Day 1 |
| Sarvam API integration (single call, verify CORS) | Day 1 |
| Full batch processing loop + status UI | Day 2 |
| ZIP download + file naming | Day 2 |
| Speaker dropdown + retry failed | Day 3 |
| Testing with LSP_FullVideo_EN.docx end-to-end | Day 3 |

---

## 13. Appendix

- Reference script: `LSP_FullVideo_EN.docx` (Qwipo Logistics Seller full walkthrough, 12 VO sections)
- Sarvam TTS API docs: https://docs.sarvam.ai/api-reference-docs/text-to-speech
- `mammoth.js`: https://github.com/mwilliamson/mammoth.js
- `JSZip`: https://stuk.github.io/jszip/
