# Participant Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** A founder can scan a workshop QR, accept consent, fill in startup basics and the 6 assessment sections on their phone with autosave, and reach a completion state — all persisted to Turso. (AI evaluation is Plan 3; the rich results screen is Plan 4.)

**Architecture:** A public route `/w/[code]` resolves a workshop by join code (server component). A client-side wizard drives one screen per step with Framer Motion transitions; each section autosaves through server actions into `participants` and `responses`. On finishing the last section the participant is marked complete and routed to a lightweight "preparing your snapshot" placeholder (Plan 4 replaces it).

**Tech Stack:** Next.js App Router server components + server actions, Drizzle/Turso, `motion/react`, Tailwind v4, vitest.

## Global Constraints

- Product content is authoritative in `MVP Readiness Snapshot.pdf`; copy/tone must match — never "bad idea", "failure risk", "low chance", "bad score". Friendly, encouraging, founder-facing.
- Mobile-first. One question focus per screen. Progress bar "Step X of 6". Cards/chips for options. Autosave. Short forms.
- Motion everywhere via `motion/react`; honor `prefers-reduced-motion`.
- Readiness stages & colors and score→stage mapping as in the spec (used later).
- Reuse existing modules: `db` (`db/client.ts`), schema tables, `newId` (`lib/ids.ts`), the in-memory test harness pattern from `db/queries/__tests__/workshops.test.ts`.
- The 6 section keys are exactly: `problem`, `customer`, `value`, `mvp`, `distribution`, `proof`.

---

### Task 1: Participant query module

**Files:**
- Create: `db/queries/participants.ts`
- Test: `db/queries/__tests__/participants.test.ts`

**Interfaces:**
- Consumes: `db`, `participants` table, `newId`.
- Produces:
  - `Participant = typeof participants.$inferSelect`.
  - `createParticipant(input: { workshopId: string; founderName: string; startupName: string; contact: string; sector?: string; stage?: string; teamSize?: string; productType?: string; businessModel?: string; consentFollowup?: boolean }): Promise<Participant>` — assigns `newId()`.
  - `getParticipant(id: string): Promise<Participant | undefined>`.
  - `completeParticipant(id: string): Promise<void>` — sets `completedAt` to now.
  - `countByWorkshop(workshopId: string): Promise<number>`.

- [ ] **Step 1: Write the failing test** `db/queries/__tests__/participants.test.ts`

Model it on `db/queries/__tests__/workshops.test.ts` (same in-memory `:memory:` client, `vi.mock("../../client", ...)`, `migrate()` helper, `beforeEach` drop+migrate). Seed a user and a workshop first, then:

```ts
it("creates, fetches, and completes a participant", async () => {
  const { createParticipant, getParticipant, completeParticipant, countByWorkshop } =
    await import("../participants");
  const p = await createParticipant({
    workshopId: "w1", founderName: "Asha", startupName: "KiranaConnect", contact: "a@x.com",
    stage: "idea", productType: "b2c",
  });
  expect(p.id).toHaveLength(21);
  expect(p.completedAt).toBeNull();
  expect((await getParticipant(p.id))?.founderName).toBe("Asha");
  await completeParticipant(p.id);
  expect((await getParticipant(p.id))?.completedAt).not.toBeNull();
  expect(await countByWorkshop("w1")).toBe(1);
});
```

(In `beforeEach`, insert `users` row `u1` and a `workshops` row `w1` referencing it, mirroring the workshops test's seeding.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- participants`
Expected: FAIL (cannot find module `../participants`).

- [ ] **Step 3: Create `db/queries/participants.ts`**

```ts
import { eq, count } from "drizzle-orm";
import { db } from "../client";
import { participants } from "../schema";
import { newId } from "@/lib/ids";

export type Participant = typeof participants.$inferSelect;

export async function createParticipant(input: {
  workshopId: string; founderName: string; startupName: string; contact: string;
  sector?: string; stage?: string; teamSize?: string; productType?: string;
  businessModel?: string; consentFollowup?: boolean;
}): Promise<Participant> {
  const [created] = await db.insert(participants)
    .values({ id: newId(), ...input, consentFollowup: input.consentFollowup ?? false })
    .returning();
  return created;
}

export async function getParticipant(id: string): Promise<Participant | undefined> {
  return db.query.participants.findFirst({ where: eq(participants.id, id) });
}

export async function completeParticipant(id: string): Promise<void> {
  await db.update(participants).set({ completedAt: new Date() }).where(eq(participants.id, id));
}

export async function countByWorkshop(workshopId: string): Promise<number> {
  const [row] = await db.select({ n: count() }).from(participants)
    .where(eq(participants.workshopId, workshopId));
  return row?.n ?? 0;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- participants`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add participant query module"
```

---

### Task 2: Response query module

**Files:**
- Create: `db/queries/responses.ts`
- Test: `db/queries/__tests__/responses.test.ts`

**Interfaces:**
- Consumes: `db`, `responses` table, `newId`, `SectionKey`.
- Produces:
  - `Response = typeof responses.$inferSelect`.
  - `saveResponse(input: { participantId: string; section: SectionKey; mainAnswer: string; probeQuestion?: string | null; probeAnswer?: string | null }): Promise<void>` — **upsert by (participantId, section)**: if a row exists for that participant+section, update it; else insert with `newId()`.
  - `getResponses(participantId: string): Promise<Response[]>` ordered by section insertion.

- [ ] **Step 1: Write the failing test** `db/queries/__tests__/responses.test.ts`

Reuse the in-memory harness. Seed user `u1`, workshop `w1`, participant `p1`. Then:

```ts
it("upserts a response by participant+section", async () => {
  const { saveResponse, getResponses } = await import("../responses");
  await saveResponse({ participantId: "p1", section: "problem", mainAnswer: "first" });
  await saveResponse({ participantId: "p1", section: "problem", mainAnswer: "edited" });
  await saveResponse({ participantId: "p1", section: "mvp", mainAnswer: "landing page" });
  const rows = await getResponses("p1");
  expect(rows).toHaveLength(2);
  expect(rows.find((r) => r.section === "problem")?.mainAnswer).toBe("edited");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- responses`
Expected: FAIL.

- [ ] **Step 3: Create `db/queries/responses.ts`**

```ts
import { and, eq } from "drizzle-orm";
import { db } from "../client";
import { responses } from "../schema";
import { newId } from "@/lib/ids";
import type { SectionKey } from "../schema";

export type Response = typeof responses.$inferSelect;

export async function saveResponse(input: {
  participantId: string; section: SectionKey; mainAnswer: string;
  probeQuestion?: string | null; probeAnswer?: string | null;
}): Promise<void> {
  const existing = await db.query.responses.findFirst({
    where: and(eq(responses.participantId, input.participantId), eq(responses.section, input.section)),
  });
  if (existing) {
    await db.update(responses).set({
      mainAnswer: input.mainAnswer,
      probeQuestion: input.probeQuestion ?? existing.probeQuestion,
      probeAnswer: input.probeAnswer ?? existing.probeAnswer,
    }).where(eq(responses.id, existing.id));
  } else {
    await db.insert(responses).values({
      id: newId(), participantId: input.participantId, section: input.section,
      mainAnswer: input.mainAnswer,
      probeQuestion: input.probeQuestion ?? null, probeAnswer: input.probeAnswer ?? null,
    });
  }
}

export async function getResponses(participantId: string): Promise<Response[]> {
  return db.query.responses.findMany({ where: eq(responses.participantId, participantId) });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- responses`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add response upsert query module"
```

---

### Task 3: Section & options content module

**Files:**
- Create: `lib/sections.ts`, `lib/options.ts`
- Test: `lib/__tests__/sections.test.ts`

**Interfaces:**
- Produces:
  - `lib/options.ts`: exported `STAGE_OPTIONS`, `PRODUCT_TYPE_OPTIONS`, `TEAM_SIZE_OPTIONS`, `BUSINESS_MODEL_OPTIONS`, `MVP_TYPE_OPTIONS` — each `{ value: string; label: string }[]`.
  - `lib/sections.ts`: `SECTIONS: Section[]` where
    `Section = { key: SectionKey; step: number; heading: string; mainQuestion: string; promptHelp?: string; example?: string; keyLine?: string; fields?: string[]; chips?: { value: string; label: string }[] }`,
    and `getSection(key: SectionKey): Section`.

- [ ] **Step 1: Write the failing test** `lib/__tests__/sections.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { SECTIONS, getSection } from "../sections";

describe("sections", () => {
  it("has the 6 assessment sections in order", () => {
    expect(SECTIONS.map((s) => s.key)).toEqual([
      "problem", "customer", "value", "mvp", "distribution", "proof",
    ]);
    expect(SECTIONS.map((s) => s.step)).toEqual([1, 2, 3, 4, 5, 6]);
  });
  it("mvp section carries mvp-type chips", () => {
    expect(getSection("mvp").chips?.length).toBeGreaterThan(3);
  });
  it("value section carries its key line", () => {
    expect(getSection("value").keyLine).toMatch(/Renewal is proof/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- sections`
Expected: FAIL.

- [ ] **Step 3: Create `lib/options.ts`** (values from PDF §5 / §17)

```ts
export const STAGE_OPTIONS = [
  { value: "idea", label: "Idea stage" },
  { value: "problem_discovery", label: "Problem discovery" },
  { value: "prototype", label: "Prototype ready" },
  { value: "mvp_built", label: "MVP built" },
  { value: "mvp_launched", label: "MVP launched with early users" },
  { value: "paying", label: "Paying customers" },
  { value: "repeat", label: "Repeat customers / renewals" },
  { value: "scaling", label: "Scaling" },
];

export const PRODUCT_TYPE_OPTIONS = [
  { value: "b2c", label: "B2C" }, { value: "b2b", label: "B2B" },
  { value: "b2b2c", label: "B2B2C" }, { value: "marketplace", label: "Marketplace" },
  { value: "saas", label: "SaaS" }, { value: "hardware", label: "Hardware" },
  { value: "ai", label: "AI product" }, { value: "social_impact", label: "Social impact" },
  { value: "govt", label: "Government / public sector" }, { value: "other", label: "Other" },
];

export const TEAM_SIZE_OPTIONS = [
  { value: "solo", label: "Solo" }, { value: "2", label: "2" },
  { value: "3-5", label: "3–5" }, { value: "6-10", label: "6–10" }, { value: "10+", label: "10+" },
];

export const BUSINESS_MODEL_OPTIONS = [
  { value: "subscription", label: "Subscription" },
  { value: "one_time", label: "One-time purchase" },
  { value: "commission", label: "Marketplace / commission" },
  { value: "freemium", label: "Freemium" },
  { value: "usage", label: "Usage-based" },
  { value: "ads", label: "Ads" }, { value: "other", label: "Other" },
];

export const MVP_TYPE_OPTIONS = [
  { value: "landing", label: "Landing page MVP" },
  { value: "whatsapp", label: "WhatsApp MVP" },
  { value: "concierge", label: "Manual / concierge MVP" },
  { value: "figma", label: "Figma prototype" },
  { value: "nocode", label: "No-code MVP" },
  { value: "ai", label: "AI-assisted MVP" },
  { value: "pilot", label: "Pilot MVP" },
  { value: "hardware", label: "Hardware prototype" },
  { value: "other", label: "Other" },
];
```

- [ ] **Step 4: Create `lib/sections.ts`** (content verbatim from PDF §5, headings/questions/prompts/examples/key lines)

```ts
import type { SectionKey } from "@/db/schema";
import { MVP_TYPE_OPTIONS } from "./options";

export type Section = {
  key: SectionKey; step: number; heading: string; mainQuestion: string;
  promptHelp?: string; example?: string; keyLine?: string; chips?: { value: string; label: string }[];
};

export const SECTIONS: Section[] = [
  {
    key: "problem", step: 1, heading: "What painful problem are you solving?",
    mainQuestion: "Describe the exact problem your startup is solving.",
    promptHelp: "Try this format: For [specific user], [specific problem] causes [specific pain or loss].",
    example: "For small kirana stores, losing repeat customers to online apps reduces daily sales and weakens their relationship with neighbourhood buyers.",
  },
  {
    key: "customer", step: 2, heading: "Who uses, pays, influences, and blocks?",
    mainQuestion: "Who is the end user? Who pays? Who influences the decision? Who can block adoption?",
    promptHelp: "In many startups, these are different people. Getting this wrong means you may pitch to the wrong audience.",
    example: "In Batplus, the player used the product, the parent often paid, the coach influenced adoption, and the academy owner controlled access.",
  },
  {
    key: "value", step: 3, heading: "Will someone pay, repeat, renew, or refer?",
    mainQuestion: "Why will customers care enough to use this? Who will pay? Have you tested willingness to pay? What will make them come back or renew?",
    promptHelp: "A first sale may come from curiosity. Repeat usage or renewal shows real value.",
    keyLine: "Acquisition is applause. Renewal is proof.",
  },
  {
    key: "mvp", step: 4, heading: "What is the smallest thing you can test?",
    mainQuestion: "What MVP are you planning to build? What assumption does it test? What can be manual? What can wait?",
    promptHelp: "MVP is not a mini version of your dream product. MVP is an experiment to test the riskiest assumption.",
    chips: MVP_TYPE_OPTIONS,
  },
  {
    key: "distribution", step: 5, heading: "How will you reach your first 10 users?",
    mainQuestion: "Who are your first 10 users? How will you reach them? Why will they trust you? What is your first conversion action?",
    promptHelp: "Do not write “social media marketing” unless you know the exact audience, message, and channel.",
    keyLine: "AI makes building easier. It does not make distribution easier.",
  },
  {
    key: "proof", step: 6, heading: "What evidence do you already have?",
    mainQuestion: "How many real users or customers have you spoken to? Have you shown a prototype, demo, or offer? Has anyone paid, subscribed, repeated, referred, or committed? What surprised you from customer feedback?",
    promptHelp: "Compliments are not proof. Behaviour is proof.",
  },
];

const BY_KEY = Object.fromEntries(SECTIONS.map((s) => [s.key, s])) as Record<SectionKey, Section>;
export function getSection(key: SectionKey): Section {
  return BY_KEY[key];
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- sections`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: add section and option content from product doc"
```

---

### Task 4: Motion primitives

**Files:**
- Create: `components/motion/MotionConfig.tsx`, `components/motion/ProgressBar.tsx`, `components/motion/Chip.tsx`, `components/motion/StepTransition.tsx`
- Test: `components/motion/__tests__/progress.test.ts`

**Interfaces:**
- Produces (all `"use client"`):
  - `ProgressBar({ current, total }: { current: number; total: number })` — animated fill (`motion.div` width %), label "Step {current} of {total}".
  - `Chip({ selected, children, onClick })` — tappable pill; `whileTap={{ scale: 0.96 }}`, selected/unselected styles.
  - `StepTransition({ stepKey, children })` — wraps content in `AnimatePresence` + `motion.div` with fade/slide (x) enter/exit keyed by `stepKey`.
  - `MotionConfig` — re-export of `motion/react`'s `MotionConfig` set with `reducedMotion="user"` to honor `prefers-reduced-motion` app-wide.
  - Pure helper `progressPercent(current: number, total: number): number` (in `ProgressBar.tsx`, exported) → `Math.round((current/total)*100)`, clamped 0–100.

- [ ] **Step 1: Write the failing test** `components/motion/__tests__/progress.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { progressPercent } from "../ProgressBar";

describe("progressPercent", () => {
  it("computes clamped percentages", () => {
    expect(progressPercent(1, 6)).toBe(17);
    expect(progressPercent(6, 6)).toBe(100);
    expect(progressPercent(0, 6)).toBe(0);
    expect(progressPercent(9, 6)).toBe(100);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- progress`
Expected: FAIL.

- [ ] **Step 3: Implement the four components.**

`components/motion/ProgressBar.tsx` must export `progressPercent` (pure) and a default/named `ProgressBar` client component using `motion.div` for the animated fill. `Chip.tsx` uses `motion.button` with `whileTap`. `StepTransition.tsx` uses `AnimatePresence mode="wait"` with a keyed `motion.div` (opacity + small x offset). `MotionConfig.tsx` wraps children in `<MotionConfig reducedMotion="user">`. Keep styling Tailwind, warm/clean, soft colors (no red). Full component code is the implementer's to write per these interfaces and the spec's motion section; `progressPercent` must match the test exactly.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- progress`
Expected: PASS.

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: success.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: add reusable motion primitives (progress, chip, transition)"
```

---

### Task 5: Workshop landing + consent (server)

**Files:**
- Create: `app/(participant)/layout.tsx`, `app/(participant)/w/[code]/page.tsx`, `app/(participant)/w/[code]/not-live.tsx` (or inline), `components/participant/ConsentGate.tsx`
- Test: `app/(participant)/__tests__/landing-logic.test.ts`

**Interfaces:**
- Consumes: `getWorkshopByJoinCode` (`db/queries/workshops.ts`).
- Produces:
  - Server page that loads the workshop by `params.code`. If none, or `status !== "live"` and `status !== "draft"` → render a friendly "This workshop isn't open right now" state (no harsh copy). For v1 treat `draft` and `live` as joinable; `closed` shows closed message.
  - A pure helper `workshopJoinState(status: string | undefined): "open" | "closed" | "missing"` exported from `app/(participant)/w/[code]/join-state.ts` (missing when undefined, closed when "closed", open otherwise).
  - `ConsentGate` (client): shows title "MVP Readiness Snapshot", subtitle "Find your next best MVP move in 5 minutes.", helper "This is not an exam. The goal is to help you identify what to validate before building too much.", the workshop's `consentText` as the disclaimer, a required consent checkbox, and a "Start Snapshot" button that calls an `onStart` prop. Motion: gentle entrance.

- [ ] **Step 1: Write failing test** `app/(participant)/__tests__/landing-logic.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { workshopJoinState } from "../w/[code]/join-state";

describe("workshopJoinState", () => {
  it("maps status to join state", () => {
    expect(workshopJoinState(undefined)).toBe("missing");
    expect(workshopJoinState("closed")).toBe("closed");
    expect(workshopJoinState("live")).toBe("open");
    expect(workshopJoinState("draft")).toBe("open");
  });
});
```

- [ ] **Step 2: Run to verify fail**

Run: `npm run test -- landing-logic`
Expected: FAIL.

- [ ] **Step 3: Create `join-state.ts`**

```ts
export function workshopJoinState(status: string | undefined): "open" | "closed" | "missing" {
  if (status === undefined) return "missing";
  if (status === "closed") return "closed";
  return "open";
}
```

- [ ] **Step 4: Build the page, layout, and `ConsentGate`.**

The `(participant)` layout wraps children in the `MotionConfig` primitive and a mobile-first container (max-w-md, centered, warm background). The page is a server component: `const w = await getWorkshopByJoinCode(params.code)`, compute `workshopJoinState(w?.status)`, render closed/missing states or pass `w` into the client flow entry (the wizard from Task 6, which for this task can be stubbed to render `ConsentGate` and log start). Copy verbatim as in the interface. Full JSX is the implementer's per the spec's visual language (clean, warm, soft colors, line icons, no red).

- [ ] **Step 5: Run test + build**

Run: `npm run test -- landing-logic` → PASS.
Run: `npm run build` → success.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: add workshop landing page and consent gate"
```

---

### Task 6: Participant wizard + autosave persistence

**Files:**
- Create: `app/(participant)/w/[code]/actions.ts` (server actions), `components/participant/ParticipantWizard.tsx`, `components/participant/BasicsStep.tsx`, `components/participant/SectionStep.tsx`, `app/(participant)/w/[code]/done/page.tsx`
- Modify: `app/(participant)/w/[code]/page.tsx` (mount the wizard)
- Test: `app/(participant)/w/[code]/__tests__/actions.test.ts`

**Interfaces:**
- Consumes: `createParticipant`, `completeParticipant` (participants module); `saveResponse` (responses module); `SECTIONS`, options modules; motion primitives.
- Produces:
  - Server actions in `actions.ts`:
    - `startParticipant(input: { workshopId: string; founderName: string; startupName: string; contact: string; sector?: string; stage?: string; teamSize?: string; productType?: string; businessModel?: string; consentFollowup?: boolean }): Promise<{ participantId: string }>` — calls `createParticipant`.
    - `saveSectionAnswer(input: { participantId: string; section: SectionKey; mainAnswer: string }): Promise<void>` — calls `saveResponse`.
    - `finishParticipant(participantId: string): Promise<void>` — calls `completeParticipant`.
  - `ParticipantWizard({ workshop })` (client): step state (0 = basics, 1–6 = sections), `ProgressBar` for section steps, `StepTransition` between steps. Basics submit → `startParticipant` → store `participantId` in component state. Each section: on "Next", call `saveSectionAnswer` (also autosave on blur/debounce). Last section "Finish" → `finishParticipant` → `router.push("/w/{code}/done")`.
  - `BasicsStep` and `SectionStep` presentational components driven by `SECTIONS`/options; use `Chip` for option chips; textarea with suggested length hint.
  - `done/page.tsx`: friendly "Your MVP Readiness Snapshot is being prepared" placeholder (Plan 4 replaces with real results). Gentle motion.

- [ ] **Step 1: Write failing test** `app/(participant)/w/[code]/__tests__/actions.test.ts`

Reuse the in-memory harness (mock `../../../../../db/client` appropriately, or better: mock the query modules). Simpler and robust — mock the query layer:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const createParticipant = vi.fn();
const saveResponse = vi.fn();
const completeParticipant = vi.fn();
vi.mock("@/db/queries/participants", () => ({ createParticipant, completeParticipant }));
vi.mock("@/db/queries/responses", () => ({ saveResponse }));

import { startParticipant, saveSectionAnswer, finishParticipant } from "../actions";

describe("participant actions", () => {
  beforeEach(() => { createParticipant.mockReset(); saveResponse.mockReset(); completeParticipant.mockReset(); });

  it("startParticipant returns new id", async () => {
    createParticipant.mockResolvedValue({ id: "p1" });
    expect(await startParticipant({ workshopId: "w1", founderName: "A", startupName: "S", contact: "c" }))
      .toEqual({ participantId: "p1" });
  });
  it("saveSectionAnswer forwards to saveResponse", async () => {
    await saveSectionAnswer({ participantId: "p1", section: "problem", mainAnswer: "x" });
    expect(saveResponse).toHaveBeenCalledWith({ participantId: "p1", section: "problem", mainAnswer: "x" });
  });
  it("finishParticipant completes", async () => {
    await finishParticipant("p1");
    expect(completeParticipant).toHaveBeenCalledWith("p1");
  });
});
```

- [ ] **Step 2: Run to verify fail**

Run: `npm run test -- actions`
Expected: FAIL.

- [ ] **Step 3: Create `actions.ts`** (top line `"use server"`)

```ts
"use server";
import { createParticipant, completeParticipant } from "@/db/queries/participants";
import { saveResponse } from "@/db/queries/responses";
import type { SectionKey } from "@/db/schema";

export async function startParticipant(input: {
  workshopId: string; founderName: string; startupName: string; contact: string;
  sector?: string; stage?: string; teamSize?: string; productType?: string;
  businessModel?: string; consentFollowup?: boolean;
}): Promise<{ participantId: string }> {
  const p = await createParticipant(input);
  return { participantId: p.id };
}

export async function saveSectionAnswer(input: {
  participantId: string; section: SectionKey; mainAnswer: string;
}): Promise<void> {
  await saveResponse(input);
}

export async function finishParticipant(participantId: string): Promise<void> {
  await completeParticipant(participantId);
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm run test -- actions`
Expected: PASS.

- [ ] **Step 5: Build the wizard UI.**

Implement `ParticipantWizard`, `BasicsStep`, `SectionStep`, and the `done` page per the interfaces above and the spec's UX (one screen per step, progress bar, chips, autosave on blur with a debounce, AI-probe card space left for Plan 3, motion transitions, `prefers-reduced-motion` honored). Mount `ParticipantWizard` from the `[code]/page.tsx` open state. Full JSX is the implementer's per spec.

- [ ] **Step 6: Verify tests + build**

Run: `npm run test` → all pass.
Run: `npm run build` → success.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: add participant wizard with autosave and completion"
```

---

## Self-Review

**Spec coverage (spec §4, §10 motion):** join by code + consent (Task 5) ✓; basics + 6 sections with exact content (Tasks 3, 6) ✓; autosave + persistence (Tasks 1, 2, 6) ✓; progress bar / chips / transitions / reduced-motion (Task 4) ✓; completion placeholder deferring results to Plan 4 (Task 6) ✓. AI probe card space reserved for Plan 3; rich results for Plan 4 — correctly out of scope here.

**Placeholder scan:** UI-building steps (4 Step 3, 5 Step 4, 6 Step 5) intentionally delegate exact JSX to the implementer because this is design-led, delightful UI — but every such step pins the interfaces, props, copy, and the pure/tested helpers (`progressPercent`, `workshopJoinState`, the three server actions) with complete code. No TBD/TODO. Content values (sections, options) are complete in Task 3.

**Type consistency:** `SectionKey` used consistently (schema → queries → sections → actions). `saveResponse` signature matches between Task 2 definition and Task 6 usage/test. `createParticipant` input shape matches between Task 1 and `startParticipant`. `progressPercent` signature matches its test.
