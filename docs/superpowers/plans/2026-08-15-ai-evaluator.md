# AI Evaluator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Turn a participant's answers into a structured MVP Readiness result — score across 8 dimensions, readiness stage, and all founder-facing copy — persisted to `results`. Works today via a deterministic mock; swaps to real OpenRouter/Claude when `OPENROUTER_API_KEY` is set. Never throws to the user: real-call failures fall back to the mock.

**Architecture:** A pure `EvaluationResult` type + zod schema. `ai/mock.ts` produces a valid result deterministically. `ai/openrouter.ts` calls OpenRouter (OpenAI-compatible) with the PDF's system prompt + rubric, JSON-mode, zod-validated with one retry. `ai/evaluate.ts` orchestrates: load responses → pick real-or-mock → validate → fallback to mock on any error → persist. The results page (Plan 4) calls `getOrCreateResult`.

**Tech Stack:** TypeScript, `zod`, `fetch` to OpenRouter, Drizzle/Turso, vitest.

## Global Constraints

- Product content authoritative in `MVP Readiness Snapshot.pdf`. The **system prompt** (§11), **scoring rubric** (§9), **dimensions/points** (§8) and **result shape** (§12) are copied from it.
- **Dimensions & max points (total 100):** `problemClarity` 15, `customerClarity` 15, `valuePayment` 20, `mvpQuality` 15, `distribution` 15, `validation` 10, `teamStageFit` 5, `cashflow` 5.
- **Score→stage:** 0–25 `idea_clarity`, 26–45 `discovery_ready`, 46–65 `mvp_candidate`, 66–80 `pilot_ready`, 81–100 `revenue_ready`.
- Tone: friendly, practical, direct, encouraging. NEVER "bad idea", "failure risk", "low chance of success", "poor founder". Never predict success/failure. Directional only.
- `EvaluationResult` copy fields: `summary` (short), `strengths` (exactly 2), `assumptions` (exactly 2), `mvpExperiment`, `sevenDayPlan` (array of `{ day: string; text: string }`), `improvedPitch`, `reflectionQuestion`.
- When `OPENROUTER_API_KEY` is empty/undefined → use mock. On any real-call error or invalid output after one retry → fall back to mock. Log a one-line warning server-side; never surface an error to the founder.
- Reuse `getResponses` (`db/queries/responses.ts`), `getParticipant` (`db/queries/participants.ts`), section keys.

---

### Task 1: Readiness mapping + result schema

**Files:**
- Create: `lib/readiness.ts`, `ai/schema.ts`
- Test: `lib/__tests__/readiness.test.ts`, `ai/__tests__/schema.test.ts`
- Modify: add `zod` dependency.

**Interfaces:**
- Produces:
  - `lib/readiness.ts`:
    - `DIMENSIONS = ["problemClarity","customerClarity","valuePayment","mvpQuality","distribution","validation","teamStageFit","cashflow"] as const`; `Dimension = typeof DIMENSIONS[number]`.
    - `DIMENSION_MAX: Record<Dimension, number>` = the max points above.
    - `stageForScore(score: number): ReadinessStage` per the mapping.
    - `STAGE_META: Record<ReadinessStage, { label: string; color: string; blurb: string }>` — labels "Idea Clarity"…"Revenue Ready"; color tokens `slate-blue|blue|purple|green|gold`; blurb from PDF §7 "Meaning".
  - `ai/schema.ts`:
    - `EvaluationResultSchema` (zod) and `EvaluationResult` (inferred type) with fields: `backendScore` (int 0–100), `dimensionScores` (object with all 8 Dimension keys, each int ≥0 ≤ its max), `readinessStage` (enum of the 5), `summary` (string), `strengths` (array length 2), `assumptions` (array length 2), `mvpExperiment` (string), `sevenDayPlan` (array of `{ day, text }`), `improvedPitch` (string), `reflectionQuestion` (string).

- [ ] **Step 1: Install zod**

```bash
npm install zod
```

- [ ] **Step 2: Write failing test** `lib/__tests__/readiness.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { stageForScore, DIMENSION_MAX } from "../readiness";

describe("readiness", () => {
  it("maps scores to stages at boundaries", () => {
    expect(stageForScore(0)).toBe("idea_clarity");
    expect(stageForScore(25)).toBe("idea_clarity");
    expect(stageForScore(26)).toBe("discovery_ready");
    expect(stageForScore(45)).toBe("discovery_ready");
    expect(stageForScore(46)).toBe("mvp_candidate");
    expect(stageForScore(65)).toBe("mvp_candidate");
    expect(stageForScore(66)).toBe("pilot_ready");
    expect(stageForScore(80)).toBe("pilot_ready");
    expect(stageForScore(81)).toBe("revenue_ready");
    expect(stageForScore(100)).toBe("revenue_ready");
  });
  it("dimension maxima sum to 100", () => {
    expect(Object.values(DIMENSION_MAX).reduce((a, b) => a + b, 0)).toBe(100);
  });
});
```

- [ ] **Step 3: Run to verify fail** — `npm run test -- readiness` → FAIL.

- [ ] **Step 4: Create `lib/readiness.ts`**

```ts
import type { ReadinessStage } from "@/db/schema";

export const DIMENSIONS = [
  "problemClarity", "customerClarity", "valuePayment", "mvpQuality",
  "distribution", "validation", "teamStageFit", "cashflow",
] as const;
export type Dimension = (typeof DIMENSIONS)[number];

export const DIMENSION_MAX: Record<Dimension, number> = {
  problemClarity: 15, customerClarity: 15, valuePayment: 20, mvpQuality: 15,
  distribution: 15, validation: 10, teamStageFit: 5, cashflow: 5,
};

export function stageForScore(score: number): ReadinessStage {
  if (score <= 25) return "idea_clarity";
  if (score <= 45) return "discovery_ready";
  if (score <= 65) return "mvp_candidate";
  if (score <= 80) return "pilot_ready";
  return "revenue_ready";
}

export const STAGE_META: Record<ReadinessStage, { label: string; color: string; blurb: string }> = {
  idea_clarity: { label: "Idea Clarity", color: "slate-blue", blurb: "You are still sharpening the problem and customer." },
  discovery_ready: { label: "Discovery Ready", color: "blue", blurb: "You have a direction, but important assumptions need validation." },
  mvp_candidate: { label: "MVP Candidate", color: "purple", blurb: "You have enough clarity to test a small MVP." },
  pilot_ready: { label: "Pilot Ready", color: "green", blurb: "You have early clarity and can run a controlled pilot." },
  revenue_ready: { label: "Revenue Ready", color: "gold", blurb: "You have signs of payment, repeat use, or adoption." },
};
```

- [ ] **Step 5: Write failing test** `ai/__tests__/schema.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { EvaluationResultSchema } from "../schema";

const valid = {
  backendScore: 52,
  dimensionScores: { problemClarity: 10, customerClarity: 8, valuePayment: 12, mvpQuality: 9, distribution: 7, validation: 4, teamStageFit: 2, cashflow: 0 },
  readinessStage: "mvp_candidate",
  summary: "s", strengths: ["a", "b"], assumptions: ["c", "d"],
  mvpExperiment: "m", sevenDayPlan: [{ day: "Day 1", text: "x" }],
  improvedPitch: "p", reflectionQuestion: "q",
};

describe("EvaluationResultSchema", () => {
  it("accepts a valid result", () => {
    expect(EvaluationResultSchema.safeParse(valid).success).toBe(true);
  });
  it("rejects wrong strengths length", () => {
    expect(EvaluationResultSchema.safeParse({ ...valid, strengths: ["only one"] }).success).toBe(false);
  });
});
```

- [ ] **Step 6: Run to verify fail** — `npm run test -- schema` → the new schema test FAILS (module `../schema` under `ai/` missing). (Note: `db` schema test already exists; scope with the path.)

- [ ] **Step 7: Create `ai/schema.ts`**

```ts
import { z } from "zod";

export const EvaluationResultSchema = z.object({
  backendScore: z.number().int().min(0).max(100),
  dimensionScores: z.object({
    problemClarity: z.number().int().min(0).max(15),
    customerClarity: z.number().int().min(0).max(15),
    valuePayment: z.number().int().min(0).max(20),
    mvpQuality: z.number().int().min(0).max(15),
    distribution: z.number().int().min(0).max(15),
    validation: z.number().int().min(0).max(10),
    teamStageFit: z.number().int().min(0).max(5),
    cashflow: z.number().int().min(0).max(5),
  }),
  readinessStage: z.enum(["idea_clarity", "discovery_ready", "mvp_candidate", "pilot_ready", "revenue_ready"]),
  summary: z.string(),
  strengths: z.array(z.string()).length(2),
  assumptions: z.array(z.string()).length(2),
  mvpExperiment: z.string(),
  sevenDayPlan: z.array(z.object({ day: z.string(), text: z.string() })).min(1),
  improvedPitch: z.string(),
  reflectionQuestion: z.string(),
});

export type EvaluationResult = z.infer<typeof EvaluationResultSchema>;
```

- [ ] **Step 8: Run both tests** — `npm run test -- readiness` and `npm run test -- ai/__tests__/schema` → PASS.

- [ ] **Step 9: Commit** — `git add -A && git commit -m "feat: add readiness mapping and evaluation result schema"`

---

### Task 2: Deterministic mock evaluator

**Files:**
- Create: `ai/mock.ts`
- Test: `ai/__tests__/mock.test.ts`

**Interfaces:**
- Consumes: `DIMENSIONS`, `DIMENSION_MAX`, `stageForScore` (`lib/readiness.ts`); `EvaluationResult`, `EvaluationResultSchema` (`ai/schema.ts`); `SectionKey`.
- Produces:
  - `mockEvaluate(input: { responses: { section: SectionKey; mainAnswer: string }[] }): EvaluationResult` — deterministic. For each dimension, derive a sub-score from the relevant section answer's length/detail (map sections→dimensions; `valuePayment` and `validation`/`teamStageFit`/`cashflow` may draw from the `value`/`proof` answers), clamp to `DIMENSION_MAX`. Sum → `backendScore`; `readinessStage = stageForScore(backendScore)`. Fill copy from stage-appropriate templates (PDF §13) — encouraging tone, exactly 2 strengths, 2 assumptions, a 7-day plan, an improved pitch template, a reflection question. Result MUST pass `EvaluationResultSchema`.

- [ ] **Step 1: Write failing test** `ai/__tests__/mock.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { mockEvaluate } from "../mock";
import { EvaluationResultSchema } from "../schema";

const responses = [
  { section: "problem" as const, mainAnswer: "For small kirana stores, losing repeat customers to apps reduces daily sales." },
  { section: "customer" as const, mainAnswer: "User is the shopkeeper, payer is the owner, coach influences." },
  { section: "value" as const, mainAnswer: "They pay a monthly fee; two shops pre-committed." },
  { section: "mvp" as const, mainAnswer: "A WhatsApp concierge MVP to test reorders." },
  { section: "distribution" as const, mainAnswer: "First 10 from my local market visits." },
  { section: "proof" as const, mainAnswer: "Spoke to 12 shopkeepers, 2 paid pilots." },
];

describe("mockEvaluate", () => {
  it("returns a schema-valid, deterministic result", () => {
    const a = mockEvaluate({ responses });
    const b = mockEvaluate({ responses });
    expect(EvaluationResultSchema.safeParse(a).success).toBe(true);
    expect(a).toEqual(b);
    expect(a.strengths).toHaveLength(2);
    expect(a.backendScore).toBeGreaterThan(0);
  });
  it("empty answers score low → idea_clarity", () => {
    const r = mockEvaluate({ responses: [] });
    expect(r.readinessStage).toBe("idea_clarity");
  });
});
```

- [ ] **Step 2: Run to verify fail** — `npm run test -- ai/__tests__/mock` → FAIL.

- [ ] **Step 3: Implement `ai/mock.ts`** per the interface. Deterministic scoring from answer content (no randomness, no `Date`). Map each section to its dimension(s), score by a simple detail heuristic (e.g., points scale with answer length and presence of concrete markers), clamp to max. Copy templates chosen by `readinessStage`, drawn from PDF §13 examples, tone-compliant. Ensure the output validates against `EvaluationResultSchema` (exactly 2 strengths/assumptions).

- [ ] **Step 4: Run to verify pass** — `npm run test -- ai/__tests__/mock` → PASS.

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: add deterministic mock evaluator"`

---

### Task 3: OpenRouter client + prompts

**Files:**
- Create: `ai/prompts.ts`, `ai/openrouter.ts`
- Test: `ai/__tests__/openrouter.test.ts`

**Interfaces:**
- Consumes: `EvaluationResult`, `EvaluationResultSchema`; prompts.
- Produces:
  - `ai/prompts.ts`: `SYSTEM_PROMPT` (verbatim PDF §11), `buildScoringPrompt(input: { participant: {...}; responses: {section,mainAnswer}[] }): string` (PDF §12 template with the rubric + "return ONLY JSON matching this shape" instruction).
  - `ai/openrouter.ts`:
    - `hasOpenRouterKey(): boolean` — `!!process.env.OPENROUTER_API_KEY`.
    - `openRouterEvaluate(input: { participant: {...}; responses: {section,mainAnswer}[] }): Promise<EvaluationResult>` — POST to `https://openrouter.ai/api/v1/chat/completions` with `OPENROUTER_SCORE_MODEL`, `response_format: { type: "json_object" }`, messages `[system, user]`; parse JSON, validate with `EvaluationResultSchema`; on validation failure retry ONCE with an appended "your previous output was invalid" note; throw if still invalid. Uses global `fetch`.

- [ ] **Step 1: Write failing test** `ai/__tests__/openrouter.test.ts` (mock `fetch`)

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const validJson = {
  backendScore: 52,
  dimensionScores: { problemClarity: 10, customerClarity: 8, valuePayment: 12, mvpQuality: 9, distribution: 7, validation: 4, teamStageFit: 2, cashflow: 0 },
  readinessStage: "mvp_candidate", summary: "s", strengths: ["a", "b"], assumptions: ["c", "d"],
  mvpExperiment: "m", sevenDayPlan: [{ day: "Day 1", text: "x" }], improvedPitch: "p", reflectionQuestion: "q",
};

describe("openRouterEvaluate", () => {
  beforeEach(() => { vi.restoreAllMocks(); process.env.OPENROUTER_API_KEY = "k"; process.env.OPENROUTER_SCORE_MODEL = "m"; });

  it("returns a validated result", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify(validJson) } }],
    }))));
    const { openRouterEvaluate } = await import("../openrouter");
    const r = await openRouterEvaluate({ participant: { founderName: "A", startupName: "S" }, responses: [] });
    expect(r.readinessStage).toBe("mvp_candidate");
  });

  it("retries once then throws on persistently invalid output", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify({ bad: true }) } }],
    })));
    vi.stubGlobal("fetch", fetchMock);
    const { openRouterEvaluate } = await import("../openrouter");
    await expect(openRouterEvaluate({ participant: { founderName: "A", startupName: "S" }, responses: [] })).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 2: Run to verify fail** — `npm run test -- openrouter` → FAIL.

- [ ] **Step 3: Implement `ai/prompts.ts` and `ai/openrouter.ts`** per interfaces (SYSTEM_PROMPT verbatim from PDF §11; retry-once-then-throw; validate with zod). Use `import "server-only"` at the top of `openrouter.ts` is NOT required for tests — omit it so vitest can import; rely on it only being called from server code.

- [ ] **Step 4: Run to verify pass** — `npm run test -- openrouter` → PASS (both cases).

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: add OpenRouter client and scoring prompts"`

---

### Task 4: Results query module + evaluate orchestrator

**Files:**
- Create: `db/queries/results.ts`, `ai/evaluate.ts`
- Test: `db/queries/__tests__/results.test.ts`, `ai/__tests__/evaluate.test.ts`

**Interfaces:**
- Consumes: `results` table, `newId`; `getResponses`, `getParticipant`; `mockEvaluate`, `openRouterEvaluate`, `hasOpenRouterKey`; `EvaluationResult`.
- Produces:
  - `db/queries/results.ts`:
    - `saveResult(participantId: string, r: EvaluationResult): Promise<void>` — insert (or replace) the `results` row, JSON-encoding `dimensionScores`, `strengths`, `assumptions`, `sevenDayPlan`.
    - `getResult(participantId: string): Promise<EvaluationResult | undefined>` — read + decode, or undefined.
  - `ai/evaluate.ts`:
    - `evaluateParticipant(participantId: string): Promise<EvaluationResult>` — load participant + responses; if `hasOpenRouterKey()` try `openRouterEvaluate` (catch → mock); else `mockEvaluate`; persist via `saveResult`; return the result.
    - `getOrCreateResult(participantId: string): Promise<EvaluationResult>` — return existing `getResult` or run `evaluateParticipant`.

- [ ] **Step 1: Write failing test** `db/queries/__tests__/results.test.ts` (in-memory harness; seed user/workshop/participant; round-trip a result, assert JSON fields decode).

- [ ] **Step 2: Run to verify fail** — `npm run test -- results` → FAIL.

- [ ] **Step 3: Implement `db/queries/results.ts`.**

- [ ] **Step 4: Run to verify pass** — `npm run test -- results` → PASS.

- [ ] **Step 5: Write failing test** `ai/__tests__/evaluate.test.ts` — mock the query modules and both evaluators; assert: (a) no key → uses `mockEvaluate` and calls `saveResult`; (b) key present but `openRouterEvaluate` throws → falls back to `mockEvaluate` (no throw); (c) `getOrCreateResult` returns existing without re-evaluating when `getResult` is present.

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
const getParticipant = vi.fn(); const getResponses = vi.fn();
const saveResult = vi.fn(); const getResult = vi.fn();
const mockEvaluate = vi.fn(); const openRouterEvaluate = vi.fn(); const hasOpenRouterKey = vi.fn();
vi.mock("@/db/queries/participants", () => ({ getParticipant }));
vi.mock("@/db/queries/responses", () => ({ getResponses }));
vi.mock("@/db/queries/results", () => ({ saveResult, getResult }));
vi.mock("../mock", () => ({ mockEvaluate }));
vi.mock("../openrouter", () => ({ openRouterEvaluate, hasOpenRouterKey }));

const RESULT = { backendScore: 10 } as any;
beforeEach(() => { vi.clearAllMocks(); getParticipant.mockResolvedValue({ id: "p1", founderName: "A", startupName: "S" }); getResponses.mockResolvedValue([]); mockEvaluate.mockReturnValue(RESULT); });

it("uses mock when no key and saves", async () => {
  hasOpenRouterKey.mockReturnValue(false);
  const { evaluateParticipant } = await import("../evaluate");
  const r = await evaluateParticipant("p1");
  expect(r).toBe(RESULT); expect(openRouterEvaluate).not.toHaveBeenCalled();
  expect(saveResult).toHaveBeenCalledWith("p1", RESULT);
});
it("falls back to mock when openrouter throws", async () => {
  hasOpenRouterKey.mockReturnValue(true); openRouterEvaluate.mockRejectedValue(new Error("boom"));
  const { evaluateParticipant } = await import("../evaluate");
  const r = await evaluateParticipant("p1");
  expect(r).toBe(RESULT); expect(saveResult).toHaveBeenCalledWith("p1", RESULT);
});
it("getOrCreateResult returns existing without evaluating", async () => {
  getResult.mockResolvedValue(RESULT);
  const { getOrCreateResult } = await import("../evaluate");
  expect(await getOrCreateResult("p1")).toBe(RESULT);
  expect(mockEvaluate).not.toHaveBeenCalled();
});
```

- [ ] **Step 6: Run to verify fail** — `npm run test -- evaluate` → FAIL.

- [ ] **Step 7: Implement `ai/evaluate.ts`** per interface (try/catch fallback; one-line `console.warn` on fallback).

- [ ] **Step 8: Run to verify pass** — `npm run test -- evaluate` → PASS.

- [ ] **Step 9: Full suite + build** — `npm run test` all pass; `npm run build` succeeds.

- [ ] **Step 10: Commit** — `git add -A && git commit -m "feat: add results persistence and evaluate orchestrator with mock fallback"`

---

## Self-Review

**Spec coverage (spec §8):** dimensions/points + score→stage (Task 1) ✓; structured result schema (Task 1) ✓; mock evaluator = zero-cost path + fallback (Task 2) ✓; real OpenRouter path with system prompt/rubric, JSON mode, validate+retry (Task 3) ✓; persistence + orchestration with graceful fallback + `getOrCreateResult` for Plan 4 (Task 4) ✓. The per-section AI probe (PDF §10) is deferred to a Plan 3.5/Plan 4 integration where the wizard slot exists — noted, not built here (keeps the workshop-critical scoring path shippable first).

**Placeholder scan:** Tasks 2 and 3 Step 3 delegate copy-template and prompt wording to the implementer but pin the interfaces, the validation contract, the retry/fallback behavior, and complete tests. SYSTEM_PROMPT is "verbatim from PDF §11" — the implementer has that source. No TBD/TODO.

**Type consistency:** `EvaluationResult`/`EvaluationResultSchema` shared across mock, openrouter, results, evaluate. `Dimension`/`DIMENSION_MAX` consistent. `stageForScore` used in mock + readiness test. `getOrCreateResult`/`evaluateParticipant` signatures match Plan 4's consumption.
