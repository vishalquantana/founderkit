# Presenter Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** A logged-in presenter can create a workshop (getting a join code + downloadable QR), open/close it, toggle its live-view + probe settings, watch a live dashboard (participant count, readiness-stage distribution, sector breakdown), browse every submission with its result, and export everything to CSV.

**Architecture:** Authenticated `(admin)` routes (already protected by middleware). An `admin` query module aggregates per-workshop stats and lists. The dashboard home lists/creates workshops; a workshop detail page shows stats + submissions + controls, refreshing via SWR polling. A CSV export API route streams the capture fields. Auth is extended so `session.user.id` is available to scope ownership.

**Tech Stack:** Next.js server components + server actions + one API route, Drizzle/Turso, `motion/react`, `qrcode.react` for the QR, SWR for live refresh, vitest.

## Global Constraints

- Auth already exists (Auth.js credentials, `auth()` from `@/auth`). Extend callbacks so `session.user.id` is populated (needed to scope workshops to their owner).
- Reuse: `createWorkshop`, `getWorkshopById`, `getWorkshopByJoinCode`, `Workshop`, `WorkshopSettings` (`db/queries/workshops.ts`); `countByWorkshop` (`db/queries/participants.ts`); `getResult` (`db/queries/results.ts`); `STAGE_META`, `stageForScore` (`lib/readiness.ts`); motion primitives + `AnimatedNumber`.
- Tone in any founder-visible copy stays encouraging; admin UI can be more utilitarian but still clean/warm, soft colors, no red except destructive confirms.
- CSV capture fields (PDF §17): founder name, startup name, phone/email, sector, stage, team size, product type, business model, per-section responses, probe responses, backend score, readiness stage, timestamp, consent-for-follow-up.
- Live refresh via SWR polling (~5s) — no websockets in v1.
- The public join URL for QR is `${origin}/w/${joinCode}`; compute origin from `NEXT_PUBLIC_APP_URL` env (fallback to request origin / window.location.origin).

---

### Task 1: Expose session.user.id + admin query module

**Files:**
- Modify: `auth.config.ts` (jwt/session callbacks), add `types/next-auth.d.ts` (module augmentation)
- Create: `db/queries/admin.ts`
- Test: `db/queries/__tests__/admin.test.ts`

**Interfaces:**
- Produces:
  - Auth: `session.user.id` populated from the JWT (`jwt` callback copies `user.id`→`token.id`; `session` callback copies `token.id`→`session.user.id`). Module augmentation types `session.user.id: string`.
  - `db/queries/admin.ts`:
    - `listWorkshopsByOwner(ownerId: string): Promise<(Workshop & { participantCount: number })[]>` ordered newest first.
    - `getWorkshopStats(workshopId: string): Promise<{ total: number; completed: number; stageDistribution: Record<ReadinessStage, number>; sectorBreakdown: { sector: string; count: number }[] }>`.
    - `listSubmissions(workshopId: string): Promise<{ participant: Participant; result?: EvaluationResult }[]>` — participants (newest first) each with their result if present.
    - `setWorkshopStatus(workshopId: string, status: WorkshopStatus): Promise<void>`.
    - `setWorkshopSettings(workshopId: string, settings: WorkshopSettings): Promise<void>`.
    - Pure helper `emptyStageDistribution(): Record<ReadinessStage, number>` (all five stages → 0), exported for reuse/testing.

- [ ] **Step 1: Write failing test** `db/queries/__tests__/admin.test.ts`

Reuse the in-memory harness. Seed a user, two workshops, and a few participants+results across stages/sectors. Assert:
```ts
it("aggregates stats and lists submissions", async () => {
  const { getWorkshopStats, listSubmissions, listWorkshopsByOwner, emptyStageDistribution } = await import("../admin");
  const stats = await getWorkshopStats("w1");
  expect(stats.total).toBeGreaterThan(0);
  expect(Object.keys(emptyStageDistribution()).sort()).toEqual(
    ["discovery_ready","idea_clarity","mvp_candidate","pilot_ready","revenue_ready"],
  );
  const subs = await listSubmissions("w1");
  expect(subs[0].participant).toBeDefined();
  const list = await listWorkshopsByOwner("u1");
  expect(list[0].participantCount).toBeGreaterThanOrEqual(0);
});
```
(Seed at least one `results` row so `stageDistribution` has a nonzero bucket; encode JSON fields as the `results` schema expects.)

- [ ] **Step 2: Run to verify fail** — `npm run test -- admin` → FAIL.

- [ ] **Step 3: Implement `auth.config.ts` callbacks + `types/next-auth.d.ts` + `db/queries/admin.ts`.**

`emptyStageDistribution` returns `{ idea_clarity:0, discovery_ready:0, mvp_candidate:0, pilot_ready:0, revenue_ready:0 }`. `getWorkshopStats` reads participants (total/completed) and joins results for the stage distribution + groups participants by sector. Reuse `getResult` decoding for submissions.

- [ ] **Step 4: Run to verify pass** — `npm run test -- admin` → PASS.

- [ ] **Step 5: Build** — `npm run build` → success.

- [ ] **Step 6: Commit** — `git add -A && git commit -m "feat: expose session user id and add admin query aggregates"`

---

### Task 2: Dashboard home — workshops list + create + QR

**Files:**
- Modify: `app/(admin)/dashboard/page.tsx`
- Create: `app/(admin)/dashboard/actions.ts`, `components/admin/CreateWorkshopForm.tsx`, `components/admin/WorkshopCard.tsx`, `components/admin/QrPoster.tsx`, `components/admin/SignOutButton.tsx`
- Modify: add `qrcode.react` dependency.
- Test: `app/(admin)/dashboard/__tests__/actions.test.ts`

**Interfaces:**
- Consumes: `auth` (`@/auth`), `createWorkshop`, `listWorkshopsByOwner`.
- Produces:
  - Server action `createWorkshopAction(formData: FormData): Promise<void>` in `actions.ts` — reads the session (`await auth()`), requires `session.user.id`, calls `createWorkshop({ ownerId, name })`, `revalidatePath('/dashboard')`.
  - Server action `signOutAction(): Promise<void>` calling `signOut({ redirectTo: '/login' })`.
  - `app/(admin)/dashboard/page.tsx` (server): `await auth()`; `listWorkshopsByOwner(session.user.id)`; render greeting + `SignOutButton` + `CreateWorkshopForm` + a grid of `WorkshopCard`s (name, status pill, participant count, join code, link to `/workshops/{id}`).
  - `QrPoster({ joinUrl, joinCode, workshopName })` (client): renders a `QRCodeSVG` (from `qrcode.react`) of `joinUrl` plus the code in large type, and a "Download QR (PNG)" button that rasterizes the SVG to a canvas and triggers download. Good for projecting/printing.
  - `WorkshopCard` shows a compact QR (or a "Show QR" affordance) and the join code.

- [ ] **Step 1: Install qrcode.react** — `npm install qrcode.react`

- [ ] **Step 2: Write failing test** `app/(admin)/dashboard/__tests__/actions.test.ts` (mock `@/auth` and `createWorkshop`; assert `createWorkshopAction` requires a session and calls `createWorkshop` with the owner id + name; assert it throws/no-ops without a session).

- [ ] **Step 3: Run to verify fail** — `npm run test -- dashboard/__tests__/actions` → FAIL.

- [ ] **Step 4: Implement actions + components + page** per interfaces. Clean, warm admin styling; motion on card entrance; `AnimatedNumber` for counts.

- [ ] **Step 5: Run to verify pass + build** — `npm run test -- dashboard/__tests__/actions` PASS; `npm run build` success.

- [ ] **Step 6: Commit** — `git add -A && git commit -m "feat: add admin dashboard home with workshop creation and QR poster"`

---

### Task 3: Workshop detail dashboard + live refresh + controls

**Files:**
- Create: `app/(admin)/workshops/[id]/page.tsx`, `app/(admin)/workshops/[id]/actions.ts`, `app/api/workshops/[id]/stats/route.ts`, `components/admin/StatsPanel.tsx`, `components/admin/StageDistribution.tsx`, `components/admin/SubmissionsTable.tsx`, `components/admin/WorkshopControls.tsx`
- Test: `app/(admin)/workshops/__tests__/ownership.test.ts`

**Interfaces:**
- Consumes: `auth`, `getWorkshopById`, `getWorkshopStats`, `listSubmissions`, `setWorkshopStatus`, `setWorkshopSettings`; `STAGE_META`; motion primitives.
- Produces:
  - Pure `assertOwnership(ownerId: string | undefined, workshop?: { ownerId: string }): boolean` in `app/(admin)/workshops/[id]/ownership.ts` — true only when both defined and equal.
  - GET `app/api/workshops/[id]/stats/route.ts` — auth-checked; returns `getWorkshopStats(id)` as JSON (used by SWR polling). 403 if not owner, 404 if missing.
  - Server actions in `actions.ts`: `updateStatus(id, status)`, `updateSettings(id, settings)` — each re-checks ownership via `auth()` before mutating, then `revalidatePath`.
  - `app/(admin)/workshops/[id]/page.tsx` (server): `await auth()`; load workshop; `assertOwnership` (else notFound); initial `getWorkshopStats` + `listSubmissions`; render `StatsPanel` (SWR-polls the stats route every 5s, seeded with initial data), `StageDistribution` (animated bars per stage using `STAGE_META` colors), `SubmissionsTable` (each row: founder, startup, sector, stage badge, completed time; expandable/drill to answers+result), and `WorkshopControls` (open/close status buttons + the three live-view toggles + leaderboard + probe toggles calling the settings action) + a link to Present mode (Plan 6, `/present/{id}`).
- The submissions table drill-in can be an expandable row or a modal showing the participant's 6 answers and their result summary — reuse existing result copy where practical.

- [ ] **Step 1: Write failing test** `app/(admin)/workshops/__tests__/ownership.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { assertOwnership } from "../[id]/ownership";
describe("assertOwnership", () => {
  it("true only when owner matches", () => {
    expect(assertOwnership("u1", { ownerId: "u1" })).toBe(true);
    expect(assertOwnership("u1", { ownerId: "u2" })).toBe(false);
    expect(assertOwnership(undefined, { ownerId: "u1" })).toBe(false);
    expect(assertOwnership("u1", undefined)).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify fail** — `npm run test -- ownership` → FAIL.

- [ ] **Step 3: Create `ownership.ts`**

```ts
export function assertOwnership(
  ownerId: string | undefined,
  workshop?: { ownerId: string },
): boolean {
  return !!ownerId && !!workshop && ownerId === workshop.ownerId;
}
```

- [ ] **Step 4: Run to verify pass** — `npm run test -- ownership` → PASS.

- [ ] **Step 5: Implement the stats API route, server actions, page, and the four components** per interfaces (ownership enforced on every server entry point; SWR polling; animated stats).

- [ ] **Step 6: Full suite + build** — `npm run test` all pass; `npm run build` success.

- [ ] **Step 7: Commit** — `git add -A && git commit -m "feat: add workshop detail dashboard with live stats, submissions, and controls"`

---

### Task 4: CSV export

**Files:**
- Create: `lib/csv.ts`, `app/api/workshops/[id]/export/route.ts`
- Test: `lib/__tests__/csv.test.ts`

**Interfaces:**
- Produces:
  - `lib/csv.ts`: `toCsv(headers: string[], rows: (string | number | null)[][]): string` — RFC-4180-ish: quotes fields containing comma/quote/newline, doubles inner quotes, joins with `\r\n`. Pure.
  - GET `app/api/workshops/[id]/export/route.ts` — auth + ownership checked; loads submissions + responses; builds rows with the PDF §17 capture fields (one row per participant, per-section answers flattened into columns); returns `text/csv` with `Content-Disposition: attachment; filename="workshop-{code}.csv"`.

- [ ] **Step 1: Write failing test** `lib/__tests__/csv.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { toCsv } from "../csv";
describe("toCsv", () => {
  it("quotes fields needing escaping", () => {
    const csv = toCsv(["a", "b"], [["x,y", 'he said "hi"'], ["plain", null]]);
    expect(csv).toBe('a,b\r\n"x,y","he said ""hi"""\r\nplain,\r\n'.replace(/\r\n$/, "") /* no trailing */);
  });
});
```
(Adjust the expected string to your exact newline policy; the key assertions: comma-containing and quote-containing fields are quoted/escaped, null → empty.)

- [ ] **Step 2: Run to verify fail** — `npm run test -- csv` → FAIL.

- [ ] **Step 3: Implement `lib/csv.ts` and the export route.**

- [ ] **Step 4: Run to verify pass** — `npm run test -- csv` → PASS.

- [ ] **Step 5: Full suite + build** — `npm run test` all pass; `npm run build` success.

- [ ] **Step 6: Commit** — `git add -A && git commit -m "feat: add CSV export of workshop submissions"`

---

## Self-Review

**Spec coverage (spec §6):** email/password admin reused; `session.user.id` exposed (Task 1) ✓; workshops list + create + QR download (Task 2) ✓; live dashboard with counts/stage-distribution/sector + submissions table + drill-in + open/close + settings toggles (Task 3) ✓; CSV export of §17 fields (Task 4) ✓; link to Present mode reserved for Plan 6.

**Placeholder scan:** UI steps delegate JSX but pin every server action signature, the ownership/stat/CSV pure helpers with tests, the API contracts, and the data fields. No TBD/TODO.

**Type consistency:** `WorkshopSettings`/`WorkshopStatus`/`Workshop`/`Participant`/`EvaluationResult`/`ReadinessStage` reused from their defining modules; `assertOwnership`/`toCsv`/`emptyStageDistribution` match their tests; `getWorkshopStats` shape consumed identically by the page, the SWR route, and `StageDistribution`.
