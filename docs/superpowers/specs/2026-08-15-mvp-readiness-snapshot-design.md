# MVP Readiness Snapshot — Design Spec

**Date:** 2026-08-15
**Status:** Approved design, ready for implementation planning
**Source of truth for product content:** `MVP Readiness Snapshot.pdf` (24-page product/AI/frontend definition). This spec adds the delivery layer the PDF does not cover: live event surfaces, presenter admin, hosting, data, and motion design.

---

## 1. Purpose & Context

A lightweight, AI-powered diagnostic used **live at an entrepreneur workshop** (the Tripura event). A founder scans a QR code, answers 6 guided sections about their startup on their phone, and receives a friendly, non-judgmental **MVP readiness view** plus a 7-day validation plan. The presenter drives shared projector views and manages the room from an admin dashboard.

**Core philosophy (from the PDF, non-negotiable):** *Build proof before product.* This is **a founder thinking tool, not a startup judging tool.** No harsh scores, no "bad idea" language. Positive, directional, encouraging.

**Scope for v1:** Workshop Mode only. Pitch-deck upload and Full Diagnostic Mode are explicitly deferred.

---

## 2. Success Criteria

- A founder can go from scanning the QR to a delightful result in **~5 minutes** on a phone.
- The presenter can create a workshop, show a QR, and watch the room fill in live on a projector.
- The experience feels **visually delightful and motion-rich**, never like an exam or investor grilling.
- Tone and copy match the PDF exactly (readiness stages, not scores; encouraging probes).
- Runs on Vercel + Turso with an OpenRouter-backed evaluator.

---

## 3. Architecture Overview

**Stack**
- **Framework:** Next.js (App Router, TypeScript), deployed on **Vercel**.
- **Database:** **Turso** (libSQL) via **Drizzle ORM**.
- **Auth:** **Auth.js (NextAuth)** credentials provider (email + password) for admins/presenters. Sessions as JWT cookies. Passwords hashed (bcrypt/argon2).
- **AI:** **OpenRouter** (OpenAI-compatible API). Cheap/fast model for per-section probes; stronger model for final structured scoring.
- **Styling:** Tailwind CSS.
- **Motion:** `motion/react` (Framer Motion) as the animation backbone across all surfaces; optional GSAP only if the word cloud needs it. `prefers-reduced-motion` respected globally.
- **Live updates:** SWR polling of aggregate endpoints (~4s). Documented upgrade path to SSE/Pusher for instant updates; not in v1.
- **QR:** a QR generation lib producing a downloadable PNG/SVG pointing at the workshop join URL.

**Three surfaces, one app**
1. **Participant flow** — public, mobile-first, `/w/[joinCode]`.
2. **Presenter admin** — authenticated dashboard, workshop management, data.
3. **Present mode** — full-screen projector views the presenter drives.

**Isolation / boundaries**
- `db/` — schema + query modules, one module per aggregate (workshops, participants, responses, results).
- `ai/` — evaluator: `probe.ts` (section probe), `score.ts` (final structured assessment), `prompts.ts` (system prompt + rubric from PDF §9–12), `openrouter.ts` (client). AI layer takes typed inputs and returns typed results; no UI knowledge.
- `app/(participant)/` — the founder flow.
- `app/(admin)/` — authenticated presenter surfaces.
- `app/present/` — projector views.
- `components/motion/` — reusable animated primitives (AnimatedNumber, StageReveal, ChipTap, ProgressBar, CanvasCell, WordCloud).

---

## 4. Participant Flow (mobile-first)

Screens follow the PDF §5 exactly. One question focus per screen, "Step X of 6" progress bar, cards/chips for options, autosave per section.

1. **Welcome / QR landing** (`/w/[joinCode]`) — title "MVP Readiness Snapshot", subtitle "Find your next best MVP move in 5 minutes.", helper "This is not an exam…", **consent checkbox + disclaimer** (PDF §18), CTA "Start Snapshot".
2. **Founder & Startup Basics** — founder name, startup name, phone/email, sector, current stage (dropdown), team size, product type, business model. Dropdowns/chips per PDF options. Consent-for-follow-up captured.
3. **Section 1 — Problem** (heading "What painful problem are you solving?") — main answer + prompt format + example. Optional AI probe.
4. **Section 2 — Customer Map** — user / payer / influencer / blocker. Optional AI probe.
5. **Section 3 — Value & Payment** — care, who pays, willingness tested, repeat/renew. Optional AI probe.
6. **Section 4 — MVP** — smallest test, assumption, manual, wait. MVP type chips. Optional AI probe.
7. **Section 5 — Distribution** — first 10 users, reach, trust, conversion. Optional AI probe.
8. **Section 6 — Proof So Far** — users spoken to, prototype shown, paid/repeat/refer, surprises. Optional AI probe.
9. **Results screen** — see §5.

**AI Coach probe card (per section, optional):** after the main answer, if the evaluator classifies the answer as vague/too-broad/missing-payer/etc. (PDF §10), show a friendly "Quick follow-up from AI Coach" card with **one** short question (max 2 only if very vague). Buttons: **Answer** / **Skip for now**. Skipping never blocks completion. Probe can be globally toggled off per workshop for speed.

**Input length:** short (1–2 lines) vs detailed (3–5 lines) text boxes with suggested length. Avoid long forms.

---

## 5. Results Screen — the Lean Canvas payoff

The results screen is the delightful centerpiece. Two parts:

**A. Readiness result (stage-forward, per PDF §6/§7/§13)**
- **Readiness stage** shown prominently with its soft color (Idea Clarity → grey/blue, Discovery Ready → blue, MVP Candidate → purple, Pilot Ready → green, Revenue Ready → gold). Animated stage reveal.
- Short friendly summary, **top 2 strengths**, **top 2 assumptions to validate**, **suggested MVP experiment**, **7-day plan**, **improved one-line pitch**, **founder reflection question**.
- Numeric score is **hidden behind "View detailed breakdown"** (never lead with 42/100). Breakdown shows the 8-dimension scores.

**B. Interactive Lean Canvas board (new)**
- A **visual canvas grid** maps the founder's inputs into cells (Problem, Customer/Segments, Value & Payment, MVP/Solution, Distribution/Channels, Proof/Traction, plus basics as context).
- Rendered first as a **preview thumbnail board** (compact, glanceable).
- **Tap any cell to zoom** — shared-element expand (Framer Motion `layoutId`) into a focused card showing that area's answer, the AI's feedback, its strengths and assumptions. Tap out / swipe to collapse back to the board.
- This is the workshop's "aha" artifact. It lives **only on results**, never during data entry (the PDF warns against a dense canvas in the linear mobile flow).
- Reduced-motion: zoom becomes a simple fade/instant expand.

**Celebration:** a tasteful, brief motion moment on results reveal (subtle, professional — not confetti-childish). Honors reduced-motion.

---

## 6. Presenter Admin (authenticated)

**Auth:** email + password (Auth.js credentials). Reusable across many future workshops. Admin self-serve sign-up gated behind an invite/seed for v1 (avoid open registration); first admin seeded.

**Screens**
- **Workshops list** — all workshops owned by the admin, status (draft / live / closed), participant counts.
- **Create / edit workshop** — name, consent text (defaults from PDF §18), **settings toggles**: which live views are enabled, leaderboard on/off, AI probe on/off. On create, auto-generates a **join code** and a **downloadable QR** (PNG/SVG) linking to `/w/[joinCode]`.
- **Workshop dashboard** — live participant count (count-up animation), **readiness-stage distribution** (animated bars), **sector breakdown**, full **submissions table** (drill into any founder's answers + generated result), **CSV export** (all fields per PDF §17), and open/close controls.

---

## 7. Present Mode (projector)

Full-screen views the presenter drives, each toggleable per workshop. Poll aggregate endpoints (~4s) for near-live updates.

1. **Aggregate dashboard** — live participant count, animated readiness-stage distribution, sector mix. Big, legible, motion-rich.
2. **Live feed / word cloud** — anonymized stream of problems/sectors; an animated word cloud as an energy-builder.
3. **Readiness progression board** (the framed "leaderboard") — **positive, stage-based**, aliased names, "stages reached" rather than ranked winners/losers. Off by default; presenter enables deliberately. This resolves the tension with the PDF's non-judgmental philosophy.

All present-mode views are anonymized/aliased and never show harsh scores.

---

## 8. AI Evaluator (OpenRouter)

**Client:** `ai/openrouter.ts` — OpenAI-compatible calls to OpenRouter. Model IDs configurable via env (fast model for probes, stronger model for final scoring).

**Two roles**
1. **Section probe** (`ai/probe.ts`) — given a section's main answer, classify per PDF §10 (clear/vague/too-broad/missing-payer/overbuilt/lacking-proof/contradictory…). If weak, return **one** short coaching question (rules per PDF §10 "Probing Question Rules"). Fast/cheap. Optional per workshop.
2. **Final scoring** (`ai/score.ts`) — after all sections, one **structured JSON** call using the PDF §11 system prompt + §12 scoring template + §9 rubric. Returns: 8-dimension scores (Problem 15, Customer/Stakeholder 15, Value & Payment 20, MVP 15, Distribution 15, Validation 10, Team/Stage 5, Cashflow 5 = 100), backend score, **readiness stage** via PDF §8 mapping (0–25 Idea Clarity, 26–45 Discovery Ready, 46–65 MVP Candidate, 66–80 Pilot Ready, 81–100 Revenue Ready), summary, top 2 strengths, top 2 assumptions, MVP experiment, 7-day plan, improved pitch, reflection question.

**Constraints:** friendly/practical/direct/encouraging tone; never "bad idea," "failure risk," "low chance"; never predict success/failure; directional only. Structured output validated (schema) with a retry on malformed JSON. On AI failure, degrade gracefully to a rule-based stage estimate from the rubric so the founder still gets a result.

---

## 9. Data Model (Turso / Drizzle)

- **users** — id, email (unique), passwordHash, name, createdAt.
- **workshops** — id, ownerId → users, name, joinCode (unique), status (draft/live/closed), consentText, settings (JSON: enabled live views, leaderboard bool, probeEnabled bool), createdAt.
- **participants** — id, workshopId → workshops, founderName, startupName, contact (phone/email), sector, stage, teamSize, productType, businessModel, consentFollowup (bool), createdAt, completedAt (nullable).
- **responses** — id, participantId → participants, section (enum), mainAnswer, probeQuestion (nullable), probeAnswer (nullable).
- **results** — id, participantId → participants (unique), backendScore, dimensionScores (JSON), readinessStage, summary, strengths (JSON), assumptions (JSON), mvpExperiment, sevenDayPlan (JSON), improvedPitch, reflectionQuestion, aiRaw (JSON), createdAt.

Everything scoped to a workshop. CSV export maps to PDF §17 capture fields.

---

## 10. Motion & Visual Design

Design-led build. Motion is a first-class requirement, not decoration.

- **Backbone:** `motion/react` for transitions, layout/shared-element (`layoutId`) zoom, gestures.
- **Micro-animations:** chip/card tap feedback (scale/spring), progress-bar fills, section enter/exit transitions, skeleton/loading shimmer while the AI thinks, animated count-up numbers and growing distribution bars on dashboards, staged reveal of result elements, animated word cloud.
- **Visual language (PDF §14):** warm but professional, mobile-first, clean/minimal, one question per screen, line icons not heavy text, soft colors for stages, avoid red warning-heavy UI (red only for a genuinely missing required field). Stage color coding per §14.
- **Accessibility:** honor `prefers-reduced-motion` (animations degrade to fades/instant); maintain contrast and tap-target sizes.

---

## 11. Out of Scope (v1)

- Full Diagnostic Mode, Lean Canvas *editing*, pitch-deck upload, PDF download of results.
- Open admin self-registration (admins are seeded/invited).
- Real-time via SSE/Pusher (polling in v1; upgrade path documented).
- Payments, multi-tenant org management, i18n.

---

## 12. Key Decisions & Rationale

- **Polling over websockets** — simplest reliable path on Vercel serverless for a room-sized audience; upgrade later if needed.
- **Leaderboard reframed as positive stage progression** — preserves the PDF's "not a judging tool" philosophy while giving the presenter the shared-energy moment requested.
- **Lean Canvas on results only** — delivers the interactive tap-to-zoom delight without violating the PDF's warning against dense canvases mid-flow.
- **Graceful AI degradation** — a live workshop cannot show a founder an error; rule-based fallback guarantees a result.
- **Seeded admins** — avoids open registration abuse for a small, known set of presenters.
