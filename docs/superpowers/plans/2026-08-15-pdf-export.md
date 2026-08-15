# Lean Canvas PDF Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** From the results screen a founder can download a clean, branded **PDF of their MVP Readiness Snapshot + Lean Canvas** — Quantana logo, readiness stage, the 6 canvas cells with their answers + feedback, dimension scores, strengths/assumptions, MVP experiment, 7-day plan, improved pitch, and reflection question.

**Architecture:** A server route `/w/[code]/result/[pid]/pdf` loads the participant + result, renders a PDF with `@react-pdf/renderer` (`renderToBuffer`), and returns it as an attachment. A pure `buildPdfModel` maps result + answers into the PDF's sections (unit-tested). The results screen gets a "Download PDF" button.

**Tech Stack:** `@react-pdf/renderer` (server-side PDF), Next.js route handler, vitest.

## Global Constraints

- Brand: Quantana purple `#6b1f9c`. Header shows the `quantana` wordmark (render as bold purple text now; if `public/quantana-logo.png` exists, embed it via `<Image>` instead — keep the code ready for that swap).
- Reuse: `getParticipant`, `getWorkshopById`, `getResponses`, `getOrCreateResult`; `EvaluationResult`; `STAGE_META`, `DIMENSION_MAX`, `DIMENSIONS`; `CANVAS_CELLS`, `cellFeedback` (`lib/result-view.ts`); `getSection` (`lib/sections.ts`).
- Tone/content match the on-screen result (encouraging, non-judgmental). Stage colored with its soft palette.
- Ownership: the PDF route mirrors the public result page's access model — it serves the PDF for a valid participant `pid` under the given workshop `code` (same capability-based access as the result page; no admin auth required, since founders download their own).

---

### Task 1: PDF model + document + route + download button

**Files:**
- Modify: add `@react-pdf/renderer` dependency.
- Create: `pdf/model.ts`, `pdf/ResultDocument.tsx`, `app/(participant)/w/[code]/result/[pid]/pdf/route.ts`
- Modify: `components/result/ResultView.tsx` (add a "Download PDF" link/button pointing at the pdf route)
- Test: `pdf/__tests__/model.test.ts`, `pdf/__tests__/render.test.ts`

**Interfaces:**
- `pdf/model.ts` (pure): `buildPdfModel(input: { founderName: string; startupName: string; result: EvaluationResult; answers: Record<SectionKey, string> }): PdfModel` where `PdfModel = { title; stageLabel; stageColor; summary; strengths: string[]; assumptions: string[]; mvpExperiment; sevenDayPlan: {day,text}[]; improvedPitch; reflectionQuestion; score: number; cells: { title: string; answer: string; feedback: string; score: number; max: number }[]; dimensions: { label: string; score: number; max: number }[] }`. `cells` built from `CANVAS_CELLS` (title + the answer for that section + `cellFeedback(...).label` + the dimension score/max). `stageColor` from a hex map for the 5 stages.
- `pdf/ResultDocument.tsx`: `ResultDocument({ model }: { model: PdfModel })` returns a `@react-pdf/renderer` `<Document>` — A4, Quantana wordmark header (purple text, or `<Image src="/quantana-logo.png">` when available), stage banner, a 2-column canvas grid of the 6 cells, dimension bars/rows, and the copy sections. Also export `renderResultPdf(model: PdfModel): Promise<Buffer>` using `renderToBuffer`.
- Route `GET .../pdf/route.ts`: `await params` → `{code,pid}`; load workshop by code + participant by pid; if participant missing or `participant.workshopId !== workshop.id` → 404; build `answers` from `getResponses`; `getOrCreateResult(pid)`; `buildPdfModel(...)`; `renderResultPdf(...)`; return `new Response(buffer, { headers: { "Content-Type":"application/pdf", "Content-Disposition": `attachment; filename="mvp-readiness-${startupName}.pdf"` } })`.
- `ResultView`: a "Download PDF" button (an `<a href={`/w/${code}/result/${pid}/pdf`}>` — pass `code`/`pid` into `ResultView` as props; the results page already has them).

- [ ] **Step 1: Install** — `npm install @react-pdf/renderer`

- [ ] **Step 2: Write failing test** `pdf/__tests__/model.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { buildPdfModel } from "../model";

const result = {
  backendScore: 72,
  dimensionScores: { problemClarity: 12, customerClarity: 9, valuePayment: 15, mvpQuality: 10, distribution: 7, validation: 7, teamStageFit: 3, cashflow: 2 },
  readinessStage: "pilot_ready",
  summary: "s", strengths: ["a", "b"], assumptions: ["c", "d"],
  mvpExperiment: "m", sevenDayPlan: [{ day: "Day 1", text: "x" }],
  improvedPitch: "p", reflectionQuestion: "q",
} as any;
const answers = { problem: "P", customer: "C", value: "V", mvp: "M", distribution: "D", proof: "PR" } as any;

describe("buildPdfModel", () => {
  it("maps result + answers into a 6-cell canvas model", () => {
    const m = buildPdfModel({ founderName: "Asha", startupName: "KiranaLoop", result, answers });
    expect(m.stageLabel).toBe("Pilot Ready");
    expect(m.score).toBe(72);
    expect(m.cells).toHaveLength(6);
    expect(m.cells.find((c) => c.title.toLowerCase().includes("problem"))?.answer).toBe("P");
    expect(m.strengths).toHaveLength(2);
    expect(m.stageColor).toMatch(/^#/);
  });
});
```

- [ ] **Step 3: Run to verify fail** — `npm run test -- pdf/__tests__/model` → FAIL.

- [ ] **Step 4: Implement `pdf/model.ts`.**

- [ ] **Step 5: Run to verify pass** — PASS.

- [ ] **Step 6: Write a render smoke test** `pdf/__tests__/render.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { buildPdfModel } from "../model";
import { renderResultPdf } from "../ResultDocument";

it("renders a non-empty PDF buffer", async () => {
  const model = buildPdfModel({
    founderName: "Asha", startupName: "KiranaLoop",
    result: {
      backendScore: 72,
      dimensionScores: { problemClarity: 12, customerClarity: 9, valuePayment: 15, mvpQuality: 10, distribution: 7, validation: 7, teamStageFit: 3, cashflow: 2 },
      readinessStage: "pilot_ready", summary: "s", strengths: ["a", "b"], assumptions: ["c", "d"],
      mvpExperiment: "m", sevenDayPlan: [{ day: "Day 1", text: "x" }], improvedPitch: "p", reflectionQuestion: "q",
    } as any,
    answers: { problem: "P", customer: "C", value: "V", mvp: "M", distribution: "D", proof: "PR" } as any,
  });
  const buf = await renderResultPdf(model);
  expect(buf.length).toBeGreaterThan(1000);
  expect(buf.subarray(0, 5).toString()).toBe("%PDF-");
});
```

- [ ] **Step 7: Run to verify fail** — FAIL (module `../ResultDocument` missing).

- [ ] **Step 8: Implement `pdf/ResultDocument.tsx`** (react-pdf Document + `renderResultPdf`). Use only react-pdf primitives (`Document, Page, View, Text, StyleSheet`, and `Image` guarded behind an existence check for `/quantana-logo.png`). Clean, branded, A4.

- [ ] **Step 9: Run to verify pass** — PASS.

- [ ] **Step 10: Implement the route + add the Download PDF button to `ResultView`** (thread `code`/`pid` props from the results page into `ResultView`).

- [ ] **Step 11: Full suite + build** — `npm run test` all pass; `npm run build` succeeds. If `@react-pdf/renderer` needs the route to run on the Node runtime, add `export const runtime = "nodejs"` to the pdf route.

- [ ] **Step 12: Commit** — `git add -A && git commit -m "feat: add branded Lean Canvas PDF export"`

---

## Self-Review

**Spec coverage:** downloadable branded PDF of the snapshot + Lean Canvas with Quantana logo (Task 1) ✓; content mirrors on-screen result ✓; capability-based access matching the result page ✓.

**Placeholder scan:** the document JSX is delegated but the pure `buildPdfModel`, the render contract (`%PDF-` buffer), the route contract, and the button wiring are pinned + tested. Logo swap path documented. No TBD/TODO.

**Type consistency:** `PdfModel` shared between `buildPdfModel`, `ResultDocument`, and the route; `CANVAS_CELLS`/`cellFeedback`/`STAGE_META`/`DIMENSION_MAX` reused; `renderResultPdf` returns a Node `Buffer` consumed by the route.
