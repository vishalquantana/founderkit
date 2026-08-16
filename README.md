# Quantana AI Cofounder

Quantana AI Cofounder is an AI-powered founder diagnostic for live entrepreneur workshops. A founder scans a QR code, answers 6 guided questions about their startup on their phone, and gets a friendly, non-judgmental **MVP readiness view** plus a 7-day validation plan — with an interactive Lean Canvas they can tap to explore. The presenter runs the room from an admin dashboard and projects live views.

> Philosophy: *Build proof before product.* This is **a founder thinking tool, not a startup judging tool** — no harsh scores, no "bad idea" language.

## What's inside

- **Participant flow** (`/w/[code]`) — mobile-first: consent → basics → 6 sections (Problem, Customer Map, Value & Payment, MVP, Distribution, Proof) with autosave → an animated results screen with a tap-to-zoom Lean Canvas.
- **AI evaluator** — scores 8 dimensions (100 pts), maps to a readiness stage (Idea Clarity → Revenue Ready). Uses **OpenRouter** (Gemini 3.5 Flash) with a deterministic **mock fallback** so it never errors mid-workshop.
- **Presenter admin** (`/dashboard`, `/workshops/[id]`) — create workshops (QR + join code), live stats, submissions table, CSV export, settings toggles. Email/password auth (seeded admins).
- **Present mode** (`/present/[id]`) — full-screen projector views: aggregate dashboard, live word cloud, positive readiness-progression board.

## Stack

Next.js (App Router, TS) · Turso/libSQL + Drizzle ORM · Auth.js (credentials) · OpenRouter · `motion/react` (Framer Motion) · Tailwind v4 · deployed on Vercel. 67 unit tests (vitest).

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in Turso URL/token, AUTH_SECRET, OPENROUTER_API_KEY
npm run db:migrate           # apply schema to your Turso database
npm run seed:admin           # create the first presenter (SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD)
npm run dev
```

### Environment

| Var | Purpose |
|---|---|
| `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` | libSQL database |
| `AUTH_SECRET` | Auth.js session signing (`openssl rand -base64 32`) |
| `OPENROUTER_API_KEY` | AI evaluator; **omit to run on the deterministic mock** |
| `OPENROUTER_SCORE_MODEL`, `OPENROUTER_PROBE_MODEL` | model slugs (default Gemini 3.5 Flash / -lite) |
| `NEXT_PUBLIC_APP_URL` | base URL used in QR join links (production) |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | seeded presenter account |

## Scripts

```bash
npm run test          # vitest
npm run build         # production build
npm run db:generate   # generate a Drizzle migration from schema changes
npm run db:migrate    # apply migrations
npm run seed:admin    # seed a presenter account
npx tsx scripts/dev-create-workshop.ts "Workshop name"   # create a workshop + print join code
```

## Design notes

Design and implementation plans live in `docs/superpowers/specs/` and `docs/superpowers/plans/`. Built plan-by-plan with test-driven development: Foundation → Participant Flow → AI Evaluator → Results & Canvas → Presenter Admin → Present Mode.
