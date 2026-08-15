# Present Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** A logged-in presenter opens `/present/[id]` full-screen on the projector and switches between three live, anonymized views that update as founders submit: (1) an aggregate dashboard (count, readiness-stage distribution, sector mix), (2) a live problems/sectors word cloud, and (3) a positive readiness-progression board. Which views are available follows the workshop's settings; the "leaderboard" is framed as stage progression, never harsh ranking.

**Architecture:** An auth-protected `/present/[id]` client console polls a JSON endpoint (`GET /api/workshops/[id]/present`, ownership-checked) every ~4s and renders the active view with big, bold, motion-rich visuals. Pure helpers (word frequencies, aliasing, stage ordering) are unit-tested; the data query lives in a `present` query module.

**Tech Stack:** Next.js client components + one API route, Drizzle/Turso, `motion/react`, SWR polling, Tailwind v4, vitest.

## Global Constraints

- Anonymized only — no founder names/contacts on the projector. The progression board uses aliases (startup name is acceptable if the presenter enabled it, otherwise "Founder #n").
- Positive, non-judgmental: stages as progression, soft colors per `STAGE_META`, never harsh ranking or scores on screen. No red.
- Respect `workshop.settings.liveViews` (dashboard/wordCloud/progression) + `leaderboard` flag — only render enabled views; progression board only when `progression` (or `leaderboard`) is on.
- Auth-protected: add `/present` to the middleware matcher; enforce ownership on the page + API route via `assertOwnership`.
- Motion everywhere; honor `prefers-reduced-motion`. Big-screen legibility (large type, high contrast, generous spacing).
- Reuse: `getWorkshopById`, `assertOwnership`, `auth`, `getWorkshopStats` (`db/queries/admin.ts`), `STAGE_META` + ordering, motion primitives incl. `AnimatedNumber`.

---

### Task 1: Present helpers + data query + API route

**Files:**
- Create: `lib/present.ts`, `db/queries/present.ts`, `app/api/workshops/[id]/present/route.ts`
- Test: `lib/__tests__/present.test.ts`

**Interfaces:**
- Produces:
  - `lib/present.ts` (pure):
    - `STAGE_ORDER: ReadinessStage[]` = `["idea_clarity","discovery_ready","mvp_candidate","pilot_ready","revenue_ready"]`.
    - `buildWordFrequencies(texts: string[], opts?: { max?: number }): { word: string; count: number }[]` — lowercase, split on non-word chars, drop a small English + domain stopword set and tokens shorter than 3, count, sort desc, cap at `opts.max ?? 40`.
    - `aliasFor(input: { startupName?: string; index: number; useNames: boolean }): string` — `useNames && startupName` → startupName; else `Founder #${index + 1}`.
  - `db/queries/present.ts`:
    - `getPresentData(workshopId: string): Promise<{ total: number; completed: number; stageDistribution: Record<ReadinessStage, number>; sectorBreakdown: { sector: string; count: number }[]; problems: string[]; progression: { alias: string; stage: ReadinessStage }[] }>` — reuses `getWorkshopStats`; `problems` = the `problem`-section answers (anonymized text only); `progression` = completed participants mapped to `{ aliasFor(...), readinessStage }`.
  - GET `app/api/workshops/[id]/present/route.ts` — `await params`; `auth()`; load workshop; `assertOwnership` (403/404); return `getPresentData(id)` + the workshop's `settings` as JSON.

- [ ] **Step 1: Write failing test** `lib/__tests__/present.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { buildWordFrequencies, aliasFor, STAGE_ORDER } from "../present";

describe("present helpers", () => {
  it("counts words, drops stopwords/short tokens, sorts desc", () => {
    const f = buildWordFrequencies(["Kirana stores lose customers", "stores stores customers"]);
    const top = f[0];
    expect(top.word).toBe("stores");
    expect(top.count).toBe(3);
    expect(f.find((x) => x.word === "the")).toBeUndefined();
  });
  it("aliases respect the useNames flag", () => {
    expect(aliasFor({ startupName: "KiranaLoop", index: 0, useNames: true })).toBe("KiranaLoop");
    expect(aliasFor({ startupName: "KiranaLoop", index: 2, useNames: false })).toBe("Founder #3");
    expect(aliasFor({ index: 0, useNames: true })).toBe("Founder #1");
  });
  it("stage order is the positive progression", () => {
    expect(STAGE_ORDER[0]).toBe("idea_clarity");
    expect(STAGE_ORDER[4]).toBe("revenue_ready");
  });
});
```

- [ ] **Step 2: Run to verify fail** — `npm run test -- present` → FAIL.

- [ ] **Step 3: Implement `lib/present.ts`, `db/queries/present.ts`, and the API route** per interfaces.

- [ ] **Step 4: Run to verify pass** — `npm run test -- present` → PASS.

- [ ] **Step 5: Build** — `npm run build` → success.

- [ ] **Step 6: Commit** — `git add -A && git commit -m "feat: add present-mode helpers, data query, and API route"`

---

### Task 2: Present console + three views + middleware

**Files:**
- Create: `app/present/[id]/page.tsx`, `components/present/PresentConsole.tsx`, `components/present/AggregateView.tsx`, `components/present/WordCloudView.tsx`, `components/present/ProgressionView.tsx`
- Modify: `middleware.ts` (add `/present` to matcher)
- Test: `components/present/__tests__/view-availability.test.ts`

**Interfaces:**
- Consumes: `getWorkshopById`, `assertOwnership`, `auth`; `getPresentData`; `STAGE_META`, `STAGE_ORDER`, `buildWordFrequencies`, `aliasFor`; motion primitives incl. `AnimatedNumber`; SWR.
- Produces:
  - Pure `availableViews(settings: { liveViews: { dashboard: boolean; wordCloud: boolean; progression: boolean }; leaderboard: boolean }): ("dashboard"|"wordcloud"|"progression")[]` in `components/present/views.ts` — include `dashboard` if `liveViews.dashboard`, `wordcloud` if `liveViews.wordCloud`, `progression` if `liveViews.progression || leaderboard`. Always return at least `["dashboard"]` as a safe default if none enabled.
  - `middleware.ts`: matcher includes `/present/:path*`.
  - Server page `app/present/[id]/page.tsx`: `await params`; `auth()`; load workshop; `assertOwnership` (else `notFound()`); pass `workshopId`, initial `getPresentData`, and `settings` to `PresentConsole`.
  - `PresentConsole` (client, full-screen): SWR-polls `/api/workshops/[id]/present` every 4s (seeded with initial data); computes `availableViews(settings)`; a big view-switcher (buttons + Left/Right arrow keys) cycles enabled views; renders the active view; a persistent big footer showing the join code / URL so latecomers can still scan. Bold, high-contrast, projector-friendly.
  - `AggregateView`: huge `AnimatedNumber` participant count, animated stage-distribution bars (in `STAGE_META` colors, `STAGE_ORDER`), sector mix chips.
  - `WordCloudView`: animated tag cloud from `buildWordFrequencies(problems)` — font size scales with count, gentle entrance/scale motion, soft palette.
  - `ProgressionView`: participants grouped into `STAGE_ORDER` columns (positive progression), each shown by `aliasFor` (useNames = the workshop's leaderboard/name preference), soft stage colors — celebratory, not a ranking.

- [ ] **Step 1: Write failing test** `components/present/__tests__/view-availability.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { availableViews } from "../views";

describe("availableViews", () => {
  it("maps settings to enabled views", () => {
    expect(availableViews({ liveViews: { dashboard: true, wordCloud: true, progression: false }, leaderboard: false }))
      .toEqual(["dashboard", "wordcloud"]);
    expect(availableViews({ liveViews: { dashboard: true, wordCloud: false, progression: false }, leaderboard: true }))
      .toEqual(["dashboard", "progression"]);
    expect(availableViews({ liveViews: { dashboard: false, wordCloud: false, progression: false }, leaderboard: false }))
      .toEqual(["dashboard"]);
  });
});
```

- [ ] **Step 2: Run to verify fail** — `npm run test -- view-availability` → FAIL.

- [ ] **Step 3: Create `components/present/views.ts`** implementing `availableViews` exactly as tested.

- [ ] **Step 4: Run to verify pass** — `npm run test -- view-availability` → PASS.

- [ ] **Step 5: Implement the page, console, three views, and update `middleware.ts`.** Full-screen, bold, projector-legible, motion-rich per the spec.

- [ ] **Step 6: Full suite + build** — `npm run test` all pass; `npm run build` success.

- [ ] **Step 7: Commit** — `git add -A && git commit -m "feat: add present-mode console with aggregate, word cloud, and progression views"`

---

## Self-Review

**Spec coverage (spec §7):** aggregate dashboard (Task 2) ✓; live word cloud (Tasks 1–2) ✓; readiness progression board framed positively + aliased (Tasks 1–2) ✓; views gated by workshop settings (Task 2) ✓; auth-protected + ownership (both tasks) ✓; live polling (Task 2) ✓; anonymized only (Task 1 helpers) ✓.

**Placeholder scan:** View components delegate JSX but pin the pure helpers (`buildWordFrequencies`, `aliasFor`, `availableViews`), the data-query shape, the API contract, and the settings gating — all tested or fully specified. No TBD/TODO.

**Type consistency:** `ReadinessStage`/`STAGE_ORDER`/`STAGE_META` consistent; `getPresentData` shape consumed identically by the API route, page, and views; `availableViews` input matches `WorkshopSettings`'s `liveViews`/`leaderboard` shape; `assertOwnership` reused from Plan 5.
