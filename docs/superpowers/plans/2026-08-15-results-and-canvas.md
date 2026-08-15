# Results & Lean Canvas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** After finishing the wizard, a founder lands on a delightful, motion-rich results screen: an animated readiness-stage reveal, encouraging copy (summary, 2 strengths, 2 assumptions, MVP experiment, 7-day plan, improved pitch, reflection question), a hidden numeric breakdown, and an interactive Lean Canvas board whose cells tap-to-zoom (shared-element) into each area's answer + feedback.

**Architecture:** A server route `/w/[code]/result/[pid]` loads the participant, their responses, and calls `getOrCreateResult(pid)` (Plan 3). It renders a client `ResultView` composed of `StageBadge`, staged copy reveals, a `DimensionBars` breakdown behind a toggle, and a `CanvasBoard` of `CanvasCell`s using Framer Motion `layoutId` for tap-to-zoom. The wizard's finish navigates here instead of `/done`.

**Tech Stack:** Next.js server + client components, `motion/react` (layout animations, `AnimatePresence`), Tailwind v4, vitest.

## Global Constraints

- Tone: friendly, encouraging, non-judgmental. Results must NOT look like a report card. Lead with the STAGE, not the score. Hide the numeric score behind "View detailed breakdown".
- Stage colors (soft, positive): Idea Clarity slate-blue, Discovery Ready blue, MVP Candidate purple, Pilot Ready green, Revenue Ready gold. Avoid red.
- Motion everywhere via `motion/react`; honor `prefers-reduced-motion` (the `MotionConfig` primitive already sets `reducedMotion="user"` app-wide; zoom must degrade to a simple fade when reduced).
- Reuse Plan 3: `getOrCreateResult` (`ai/evaluate.ts`), `EvaluationResult` (`ai/schema.ts`), `STAGE_META`/`DIMENSION_MAX`/`DIMENSIONS`/`stageForScore` (`lib/readiness.ts`). Reuse `getParticipant` (`db/queries/participants.ts`), `getResponses` (`db/queries/responses.ts`), `getWorkshopByJoinCode`. Reuse motion primitives + `SECTIONS`/`getSection` (`lib/sections.ts`).
- The 6 canvas cells map sections→dimensions: problem→problemClarity, customer→customerClarity, value→valuePayment, mvp→mvpQuality, distribution→distribution, proof→validation.

---

### Task 1: Result presentation helpers

**Files:**
- Create: `lib/result-view.ts`
- Test: `lib/__tests__/result-view.test.ts`

**Interfaces:**
- Consumes: `ReadinessStage` (`@/db/schema`), `Dimension`/`DIMENSION_MAX` (`lib/readiness.ts`), `SectionKey`.
- Produces:
  - `stageColorClasses(stage: ReadinessStage): { badge: string; ring: string; bar: string; glow: string }` — Tailwind class strings per stage (soft palette; no red).
  - `cellFeedback(score: number, max: number): { label: string; tone: "strong" | "growing" | "sharpen" }` — ratio ≥0.7 → `{ "Strong and clear", "strong" }`; ≥0.45 → `{ "Coming together", "growing" }`; else `{ "Worth sharpening", "sharpen" }`. Encouraging wording only.
  - `CANVAS_CELLS: { section: SectionKey; dimension: Dimension; title: string }[]` — the 6 cells in a pleasing board order with short titles (Problem, Customer Map, Value & Payment, MVP, Distribution, Proof).

- [ ] **Step 1: Write failing test** `lib/__tests__/result-view.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { stageColorClasses, cellFeedback, CANVAS_CELLS } from "../result-view";

describe("result-view helpers", () => {
  it("gives distinct classes per stage and never uses red", () => {
    const s = stageColorClasses("mvp_candidate");
    expect(s.badge).toMatch(/purple|violet/);
    expect(JSON.stringify(stageColorClasses("idea_clarity"))).not.toMatch(/red/);
  });
  it("maps score ratio to encouraging feedback", () => {
    expect(cellFeedback(14, 15).tone).toBe("strong");
    expect(cellFeedback(8, 15).tone).toBe("growing");
    expect(cellFeedback(3, 15).tone).toBe("sharpen");
    expect(cellFeedback(3, 15).label).not.toMatch(/bad|weak|fail/i);
  });
  it("has 6 canvas cells covering the 6 sections", () => {
    expect(CANVAS_CELLS.map((c) => c.section).sort()).toEqual(
      ["customer", "distribution", "mvp", "problem", "proof", "value"],
    );
  });
});
```

- [ ] **Step 2: Run to verify fail** — `npm run test -- result-view` → FAIL.

- [ ] **Step 3: Implement `lib/result-view.ts`** per interface. `stageColorClasses` returns soft Tailwind classes (e.g. idea_clarity → slate/blue, mvp_candidate → purple/violet, revenue_ready → amber/gold). `cellFeedback` exactly as tested. `CANVAS_CELLS` the 6 section→dimension cells.

- [ ] **Step 4: Run to verify pass** — `npm run test -- result-view` → PASS.

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: add result presentation helpers"`

---

### Task 2: Count-up + stage reveal motion primitives

**Files:**
- Create: `components/motion/AnimatedNumber.tsx`, `components/motion/StageReveal.tsx`
- Test: `components/motion/__tests__/animated-number.test.ts`

**Interfaces:**
- Produces (client):
  - `AnimatedNumber({ value, durationMs? }: { value: number; durationMs?: number })` — counts up from 0 to `value` using `motion`'s `useMotionValue`/`animate`; renders an integer. Exports a pure helper `clampCount(n: number, target: number): number` = `Math.max(0, Math.min(target, Math.round(n)))`.
  - `StageReveal({ children }: { children: React.ReactNode })` — a `motion.div` that scales/fades in with a gentle spring for the stage headline.

- [ ] **Step 1: Write failing test** `components/motion/__tests__/animated-number.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { clampCount } from "../AnimatedNumber";

describe("clampCount", () => {
  it("rounds and clamps to target", () => {
    expect(clampCount(3.6, 100)).toBe(4);
    expect(clampCount(-2, 100)).toBe(0);
    expect(clampCount(140, 100)).toBe(100);
  });
});
```

- [ ] **Step 2: Run to verify fail** — `npm run test -- animated-number` → FAIL.

- [ ] **Step 3: Implement both components** (`clampCount` exactly as tested; `AnimatedNumber` uses it to render during the tween; honor reduced motion by jumping to `value`).

- [ ] **Step 4: Run to verify pass** — `npm run test -- animated-number` → PASS.

- [ ] **Step 5: Build** — `npm run build` → success.

- [ ] **Step 6: Commit** — `git add -A && git commit -m "feat: add animated number and stage reveal primitives"`

---

### Task 3: StageBadge, DimensionBars, CanvasCell, CanvasBoard

**Files:**
- Create: `components/result/StageBadge.tsx`, `components/result/DimensionBars.tsx`, `components/result/CanvasCell.tsx`, `components/result/CanvasBoard.tsx`
- (No new unit test — pure logic already covered in Task 1; verify via build. Presentational components.)

**Interfaces:**
- Consumes: `stageColorClasses`, `cellFeedback`, `CANVAS_CELLS`; `STAGE_META`, `DIMENSION_MAX`, `DIMENSIONS`; `AnimatedNumber`; `getSection`; `EvaluationResult`.
- Produces (all client):
  - `StageBadge({ stage }: { stage: ReadinessStage })` — big soft-colored pill with `STAGE_META[stage].label` and blurb; uses `stageColorClasses`.
  - `DimensionBars({ scores }: { scores: EvaluationResult["dimensionScores"] })` — 8 rows, each an animated bar filling to `score/DIMENSION_MAX[dim]`, labeled with a friendly dimension name; a total using `AnimatedNumber`.
  - `CanvasCell({ cell, answer, score, isOpen, onToggle })` — a board tile. Collapsed: section title + a truncated snippet of `answer` + a small `cellFeedback` chip. Uses `motion.div` with `layoutId={cell.section}` so it can expand. When `isOpen`, renders expanded content (full answer, the `cellFeedback` label, the dimension score bar).
  - `CanvasBoard({ result, answers }: { result: EvaluationResult; answers: Record<SectionKey, string> })` — a responsive grid of `CanvasCell`s for `CANVAS_CELLS`; tracks which cell is open; an open cell expands via shared-element (`layoutId`) into an overlay card (`AnimatePresence`), tap-scrim to close. Reduced motion → simple fade.

- [ ] **Step 1: Implement the four components** per interfaces and the spec's visual language (soft stage colors, warm/clean, springy). The tap-to-zoom uses matching `layoutId` between the collapsed tile and the expanded overlay so Framer Motion morphs between them.

- [ ] **Step 2: Build** — `npm run build` → success (fix any client/server boundary issues minimally).

- [ ] **Step 3: Commit** — `git add -A && git commit -m "feat: add result stage badge, dimension bars, and interactive canvas board"`

---

### Task 4: ResultView + results route + wire wizard

**Files:**
- Create: `components/result/ResultView.tsx`, `app/(participant)/w/[code]/result/[pid]/page.tsx`
- Modify: `components/participant/ParticipantWizard.tsx` (finish → navigate to the results route)
- Remove/replace: `app/(participant)/w/[code]/done/page.tsx` (superseded — keep as a fallback redirect or delete).
- Test: `app/(participant)/w/[code]/result/__tests__/result-guard.test.ts`

**Interfaces:**
- Consumes: `getWorkshopByJoinCode`, `getParticipant`, `getResponses`, `getOrCreateResult`; `ResultView`; `CANVAS_CELLS`.
- Produces:
  - Pure `resultAccessState(input: { participant?: { id: string; workshopId: string } ; workshopId?: string }): "ok" | "missing"` in a `result-guard.ts` next to the route — `ok` only when participant exists and belongs to the workshop; else `missing`.
  - Server page: `await params` → `{ code, pid }`; load workshop by code, participant by pid; guard; build `answers: Record<SectionKey,string>` from `getResponses`; `const result = await getOrCreateResult(pid)`; render `<ResultView stage=... result=... participant=... answers=... />`. Missing/mismatch → friendly "We couldn't find that snapshot" state.
  - `ResultView` (client): orchestrates the delightful reveal — `StageBadge` (in `StageReveal`), a brief tasteful celebration on mount (subtle, professional; honors reduced motion), staged fade-in of summary → strengths → assumptions → MVP experiment → 7-day plan → improved pitch → reflection question, a "View detailed breakdown" toggle revealing `DimensionBars` + numeric score, and the `CanvasBoard`.
  - Wizard finish: replace `router.push('/w/{code}/done')` with `router.push('/w/{code}/result/{participantId}')`.

- [ ] **Step 1: Write failing test** `app/(participant)/w/[code]/result/__tests__/result-guard.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { resultAccessState } from "../result-guard";

describe("resultAccessState", () => {
  it("ok only when participant belongs to workshop", () => {
    expect(resultAccessState({ participant: { id: "p1", workshopId: "w1" }, workshopId: "w1" })).toBe("ok");
    expect(resultAccessState({ participant: { id: "p1", workshopId: "w2" }, workshopId: "w1" })).toBe("missing");
    expect(resultAccessState({ participant: undefined, workshopId: "w1" })).toBe("missing");
  });
});
```

- [ ] **Step 2: Run to verify fail** — `npm run test -- result-guard` → FAIL.

- [ ] **Step 3: Create `result-guard.ts`**

```ts
export function resultAccessState(input: {
  participant?: { id: string; workshopId: string };
  workshopId?: string;
}): "ok" | "missing" {
  if (!input.participant || !input.workshopId) return "missing";
  return input.participant.workshopId === input.workshopId ? "ok" : "missing";
}
```

- [ ] **Step 4: Run to verify pass** — `npm run test -- result-guard` → PASS.

- [ ] **Step 5: Build `ResultView`, the results page, and update the wizard finish navigation.** Delete or neutralize `done/page.tsx`. Build the delightful reveal per the interface + spec.

- [ ] **Step 6: Full suite + build** — `npm run test` all pass; `npm run build` success.

- [ ] **Step 7: Commit** — `git add -A && git commit -m "feat: add results screen with interactive lean canvas and wire wizard finish"`

---

## Self-Review

**Spec coverage (spec §5):** stage-forward reveal with soft colors (Tasks 2–4) ✓; all result copy fields (Task 4) ✓; numeric score hidden behind breakdown toggle (Tasks 3–4) ✓; interactive tap-to-zoom Lean Canvas preview → expand (Tasks 1, 3, 4) ✓; celebration + reduced-motion (Tasks 2, 4) ✓; results wired from wizard finish (Task 4) ✓.

**Placeholder scan:** Component-building steps delegate exact JSX to the implementer (design-led) but pin interfaces, props, the shared-element `layoutId` mechanism, and the tested pure helpers (`stageColorClasses`, `cellFeedback`, `clampCount`, `resultAccessState`). No TBD/TODO.

**Type consistency:** `EvaluationResult["dimensionScores"]` used consistently in `DimensionBars`; `CANVAS_CELLS` section/dimension keys align with `DIMENSIONS`/`SectionKey`; `stageColorClasses`/`cellFeedback`/`clampCount`/`resultAccessState` signatures match their tests; results route consumes `getOrCreateResult` exactly as Plan 3 produced it.
