# AI Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Close the "score me AND tell me exactly what to improve" loop with two AI features: (1) **per-section improvement suggestions** — a specific "how to sharpen this" line the founder sees inside each Lean Canvas tile and in the PDF; (2) a **live AI coach probe** — when an answer is vague during the wizard, the coach asks one short follow-up (Answer / Skip), gated by the workshop's probe setting.

**Architecture:** Extend `EvaluationResult` with `sectionFeedback` (one short line per section), produced by both the real (OpenRouter/Gemini) and mock evaluators, persisted in `results`, and surfaced in the canvas zoom + PDF. Add an `ai/probe.ts` module (real + mock) and a wizard server action that classifies an answer and returns one coaching question; the `SectionStep` shows the coach card and stores the probe Q/A.

**Tech Stack:** OpenRouter (Gemini), zod, Drizzle/Turso, motion/react, vitest.

## Global Constraints

- Tone stays friendly/encouraging/non-judgmental — suggestions say "sharpen/clarify/test", never "bad/weak/wrong". No harsh language.
- Both AI paths degrade gracefully: real-call failure/invalid → mock; probe failure → no probe shown (never blocks the founder).
- Probe respects `workshop.settings.probeEnabled`; skipping a probe never blocks completion. Max ONE probe per section (per PDF §10 Workshop Mode).
- Section keys: `problem`, `customer`, `value`, `mvp`, `distribution`, `proof`. Reuse `EvaluationResultSchema`, `mockEvaluate`, `openRouterEvaluate`, `saveResponse` (already supports `probeQuestion`/`probeAnswer`), `getWorkshopByJoinCode`, the wizard, `CanvasBoard`/`CanvasCell`, `LEAN_CANVAS_BLOCKS`, PDF modules.

---

### Task 1: Add `sectionFeedback` to the evaluation result

**Files:**
- Modify: `ai/schema.ts`, `ai/prompts.ts`, `ai/mock.ts`, `db/schema.ts` (add `sectionFeedback` column + migration), `db/queries/results.ts`
- Test: update `ai/__tests__/schema.test.ts`, `ai/__tests__/mock.test.ts`, `db/queries/__tests__/results.test.ts`

**Interfaces:**
- `EvaluationResult.sectionFeedback: { problem: string; customer: string; value: string; mvp: string; distribution: string; proof: string }` — each a single encouraging "how to sharpen this" sentence. Add to `EvaluationResultSchema` (zod object, all 6 keys required, strings).
- `ai/prompts.ts`: extend the scoring instruction so the model returns `sectionFeedback` with one concrete, improvement-oriented sentence per section (tied to what the founder wrote).
- `ai/mock.ts`: produce deterministic `sectionFeedback` per section (short templated suggestions varying by that section's sub-score band — low score → "sharpen X", high → "you've nailed X, next validate Y"). Must pass the schema.
- `db/schema.ts`: `results.sectionFeedback` (`text mode:"json"`). Generate a migration (`npm run db:generate`).
- `db/queries/results.ts`: persist + decode `sectionFeedback` in `saveResult`/`getResult`.

- [ ] **Step 1:** Update `ai/__tests__/schema.test.ts` valid fixture to include `sectionFeedback` (all 6 keys) and assert a missing key fails. Run → FAIL.
- [ ] **Step 2:** Add `sectionFeedback` to `EvaluationResultSchema`. Run schema test → PASS.
- [ ] **Step 3:** Update `ai/__tests__/mock.test.ts` to assert `mockEvaluate(...).sectionFeedback` has all 6 keys and is schema-valid. Run → FAIL.
- [ ] **Step 4:** Implement `sectionFeedback` in `ai/mock.ts` (deterministic). Run mock test → PASS.
- [ ] **Step 5:** Extend `ai/prompts.ts` scoring prompt to require `sectionFeedback`.
- [ ] **Step 6:** Add the `results.sectionFeedback` column; `npm run db:generate`. Update `db/queries/results.ts` to save/read it. Update `db/queries/__tests__/results.test.ts` round-trip to include `sectionFeedback` (assert it decodes to an object). Run → PASS.
- [ ] **Step 7:** `npm run test` full suite + `npm run build`.
- [ ] **Step 8:** Commit — `feat: add per-section improvement suggestions to evaluation result`

---

### Task 2: Surface per-cell suggestions in the canvas + PDF

**Files:**
- Modify: `components/result/ResultView.tsx`, `components/result/CanvasBoard.tsx`, `components/result/CanvasCell.tsx`, `pdf/model.ts`, `pdf/ResultDocument.tsx`
- (No new unit test beyond `pdf/model` — verify via build.)

**Interfaces:**
- `CanvasBoard`/`CanvasCell` accept `suggestions: Record<SectionKey, string>` (from `result.sectionFeedback`). In the expanded (zoomed) view of a populated tile, show the suggestion under the score bar as a small "How to sharpen this →" note (soft accent styling, on-theme). Empty/uncaptured blocks show nothing new.
- `ResultView` passes `result.sectionFeedback` into `CanvasBoard`.
- `pdf/model.ts`: include the suggestion in each populated block's model (`cell.suggestion`). `pdf/ResultDocument.tsx`: render it under the block's answer in small italic. Update `pdf/__tests__/model.test.ts` to assert a populated block carries its `suggestion`.

- [ ] **Step 1:** Update `pdf/__tests__/model.test.ts` to expect `suggestion` on a populated block. Run → FAIL.
- [ ] **Step 2:** Thread `sectionFeedback` → `buildPdfModel` block `suggestion`. Run → PASS.
- [ ] **Step 3:** Render the suggestion in `ResultDocument` and in the `CanvasCell` zoom; pass through `ResultView`/`CanvasBoard`.
- [ ] **Step 4:** `npm run test` + `npm run build`.
- [ ] **Step 5:** Commit — `feat: show per-cell improvement suggestions in canvas zoom and PDF`

---

### Task 3: AI coach probe module

**Files:**
- Create: `ai/probe.ts`, `ai/__tests__/probe.test.ts`
- Modify: `ai/prompts.ts` (add probe prompt)

**Interfaces:**
- `ai/probe.ts`:
  - `mockProbe(input: { section: SectionKey; mainAnswer: string }): { needsProbe: boolean; question: string | null }` — deterministic: if the answer is short/vague (e.g. < 60 chars or lacks concrete markers) return `needsProbe:true` + one section-appropriate question (from a per-section question bank derived from PDF §10); else `needsProbe:false, question:null`.
  - `openRouterProbe(input): Promise<{ needsProbe: boolean; question: string | null }>` — fast model (`OPENROUTER_PROBE_MODEL`), JSON mode, validated; classifies per PDF §10 and returns at most one short question.
  - `probeSection(input): Promise<{ needsProbe: boolean; question: string | null }>` — if `hasOpenRouterKey()` try `openRouterProbe` (catch → `mockProbe`), else `mockProbe`. Never throws.
- `ai/prompts.ts`: `buildProbePrompt(section, mainAnswer)` per PDF §10 rules (one short question, ask for evidence not opinion, not investor-grilling).

- [ ] **Step 1:** Write `ai/__tests__/probe.test.ts`: `mockProbe` returns a question for a vague answer ("we build an app for students") and `needsProbe:false` for a detailed one; `probeSection` falls back to mock when `openRouterProbe` throws (mock the openrouter call + `hasOpenRouterKey`). Run → FAIL.
- [ ] **Step 2:** Implement `ai/probe.ts` + the probe prompt. Run → PASS.
- [ ] **Step 3:** `npm run test` + `npm run build`.
- [ ] **Step 4:** Commit — `feat: add AI coach probe module with mock fallback`

---

### Task 4: Wire the coach probe into the wizard

**Files:**
- Modify: `app/(participant)/w/[code]/actions.ts` (add `probeSectionAction`; extend save to persist probe Q/A), `components/participant/SectionStep.tsx`, `components/participant/ParticipantWizard.tsx`, `app/(participant)/w/[code]/page.tsx` (pass `probeEnabled` from workshop settings)
- Test: update `app/(participant)/w/[code]/__tests__/actions.test.ts`

**Interfaces:**
- `probeSectionAction(input: { section: SectionKey; mainAnswer: string; probeEnabled: boolean }): Promise<{ question: string | null }>` — if `!probeEnabled` return `{question:null}`; else `probeSection(...)` and return the question (or null). Never throws (catch → null).
- Extend `saveSectionAnswer` to accept optional `probeQuestion`/`probeAnswer` and forward to `saveResponse` (keep the existing cookie-binding check).
- `ParticipantWizard` passes `workshop.probeEnabled` down; `SectionStep`: after the founder writes the main answer and taps Next, call `probeSectionAction`; if a question comes back, render the **AI Coach card** (the reserved slot) with the question + an Answer textarea + "Answer" and "Skip for now" buttons. On Answer/Skip, `saveSectionAnswer` with the probe Q and (optional) probe answer, then advance. Only one probe per section. Honor `prefers-reduced-motion`; card animates in (motion/react). Style on-theme (Pulse glowing panel).

- [ ] **Step 1:** Update `actions.test.ts`: add cases for `probeSectionAction` (returns null when `probeEnabled:false`; returns the mocked probe question when enabled — mock `@/ai/probe`) and that `saveSectionAnswer` forwards `probeQuestion`/`probeAnswer`. Run → FAIL.
- [ ] **Step 2:** Implement `probeSectionAction` + extend `saveSectionAnswer`. Run actions test → PASS.
- [ ] **Step 3:** Wire `probeEnabled` through the page → wizard → `SectionStep`; build the AI Coach card UI.
- [ ] **Step 4:** `npm run test` full suite + `npm run build`.
- [ ] **Step 5:** Commit — `feat: live AI coach probe in the wizard, gated by workshop setting`

---

## Self-Review

**Spec coverage:** per-section "how to improve" from AI, shown per canvas tile + PDF (Tasks 1–2) ✓; live vague-answer coach probe during the wizard, one per section, setting-gated, skip-never-blocks, graceful fallback (Tasks 3–4) ✓.

**Placeholder scan:** UI steps delegate JSX but pin the schema field, the probe/suggestion contracts, the server-action signatures, and all tests. Migration generated in-task. No TBD/TODO.

**Type consistency:** `sectionFeedback` shape shared across schema/mock/prompts/results/canvas/pdf; `probeSection`/`probeSectionAction` return `{question|needsProbe}` consistently; `saveSectionAnswer` extension matches `saveResponse`'s existing `probeQuestion`/`probeAnswer` fields; `probeEnabled` sourced from `WorkshopSettings.probeEnabled`.
