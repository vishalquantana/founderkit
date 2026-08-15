# Foundation & Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Next.js + Turso project with the full database schema, typed query modules, and email/password admin auth so a seeded presenter can log in.

**Architecture:** Next.js App Router (TypeScript) on Vercel. Turso (libSQL) accessed through Drizzle ORM with query modules split one-per-aggregate. Auth.js (NextAuth) credentials provider with hashed passwords; admins are seeded, not self-registered.

**Tech Stack:** Next.js (App Router, TS), Tailwind CSS, Drizzle ORM + `@libsql/client`, Auth.js (`next-auth`), `bcryptjs`, `vitest` for unit tests, `motion` (installed now, used later).

## Global Constraints

- **Product content is authoritative in** `MVP Readiness Snapshot.pdf`; copy must match its tone — never "bad idea", "failure risk", "low chance", "bad score".
- **Workshop Mode only** for v1. No pitch-deck upload, no Full Diagnostic Mode.
- **Host:** Vercel. **DB:** Turso/libSQL. **AI:** OpenRouter (added in Plan 3).
- **Readiness stages & colors:** Idea Clarity (grey/blue), Discovery Ready (blue), MVP Candidate (purple), Pilot Ready (green), Revenue Ready (gold).
- **Score→stage mapping:** 0–25 Idea Clarity, 26–45 Discovery Ready, 46–65 MVP Candidate, 66–80 Pilot Ready, 81–100 Revenue Ready.
- **Scoring dimensions (total 100):** Problem 15, Customer/Stakeholder 15, Value & Payment 20, MVP 15, Distribution 15, Validation 10, Team/Stage 5, Cashflow 5.
- **Admins are seeded**, not open-registered.
- **Motion everywhere later**; honor `prefers-reduced-motion`.
- All new secrets via env vars; never commit `.env`.

---

### Task 1: Project scaffold & repo init

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `.gitignore`, `.env.example`, `vitest.config.ts`
- Test: `app/__tests__/smoke.test.ts`

**Interfaces:**
- Produces: a buildable Next.js app with Tailwind and a working `vitest` runner. Later tasks assume `npm run test`, `npm run build`, `npm run dev` exist.

- [ ] **Step 1: Initialize git and scaffold Next.js**

```bash
cd /Users/vishalkumar/Downloads/qfound
git init
npx create-next-app@latest . --typescript --tailwind --app --eslint --no-src-dir --import-alias "@/*" --use-npm --yes
```

- [ ] **Step 2: Add test tooling and core deps**

```bash
npm install drizzle-orm @libsql/client next-auth@beta bcryptjs motion
npm install -D vitest @vitejs/plugin-react drizzle-kit @types/bcryptjs
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: { environment: "node", globals: true },
});
```

- [ ] **Step 4: Add scripts to `package.json`**

Ensure the `scripts` block contains:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate"
  }
}
```

- [ ] **Step 5: Create `.env.example`**

```bash
# Turso
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token
# Auth
AUTH_SECRET=generate-with-openssl-rand-base64-32
# OpenRouter (Plan 3)
OPENROUTER_API_KEY=
OPENROUTER_PROBE_MODEL=anthropic/claude-3.5-haiku
OPENROUTER_SCORE_MODEL=anthropic/claude-opus-4
```

Confirm `.gitignore` includes `.env`, `.env.local`, `node_modules`, `.next`.

- [ ] **Step 6: Write smoke test** `app/__tests__/smoke.test.ts`

```ts
import { describe, it, expect } from "vitest";

describe("smoke", () => {
  it("runs the test suite", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 7: Run the smoke test**

Run: `npm run test`
Expected: PASS (1 test).

- [ ] **Step 8: Verify the app builds**

Run: `npm run build`
Expected: build completes with no errors.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with Tailwind, Drizzle, Auth.js, vitest"
```

---

### Task 2: Turso client & Drizzle schema

**Files:**
- Create: `db/client.ts`, `db/schema.ts`, `drizzle.config.ts`
- Test: `db/__tests__/schema.test.ts`

**Interfaces:**
- Produces:
  - `db` (Drizzle instance) from `db/client.ts`.
  - Tables from `db/schema.ts`: `users`, `workshops`, `participants`, `responses`, `results` with the columns below.
  - Enums (as TS string unions used in query modules): `WorkshopStatus = "draft"|"live"|"closed"`, `SectionKey = "problem"|"customer"|"value"|"mvp"|"distribution"|"proof"`, `ReadinessStage = "idea_clarity"|"discovery_ready"|"mvp_candidate"|"pilot_ready"|"revenue_ready"`.

- [ ] **Step 1: Write the failing schema test** `db/__tests__/schema.test.ts`

```ts
import { describe, it, expect } from "vitest";
import * as schema from "../schema";

describe("schema", () => {
  it("exposes all five tables", () => {
    expect(schema.users).toBeDefined();
    expect(schema.workshops).toBeDefined();
    expect(schema.participants).toBeDefined();
    expect(schema.responses).toBeDefined();
    expect(schema.results).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- schema`
Expected: FAIL (cannot find module `../schema`).

- [ ] **Step 3: Create `db/schema.ts`**

```ts
import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export type WorkshopStatus = "draft" | "live" | "closed";
export type SectionKey =
  | "problem" | "customer" | "value" | "mvp" | "distribution" | "proof";
export type ReadinessStage =
  | "idea_clarity" | "discovery_ready" | "mvp_candidate" | "pilot_ready" | "revenue_ready";

const id = () => text("id").primaryKey();
const createdAt = () =>
  integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`);

export const users = sqliteTable("users", {
  id: id(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  createdAt: createdAt(),
});

export const workshops = sqliteTable("workshops", {
  id: id(),
  ownerId: text("owner_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  joinCode: text("join_code").notNull().unique(),
  status: text("status").notNull().default("draft"),
  consentText: text("consent_text").notNull(),
  settings: text("settings", { mode: "json" }).notNull(),
  createdAt: createdAt(),
});

export const participants = sqliteTable("participants", {
  id: id(),
  workshopId: text("workshop_id").notNull().references(() => workshops.id),
  founderName: text("founder_name").notNull(),
  startupName: text("startup_name").notNull(),
  contact: text("contact").notNull(),
  sector: text("sector"),
  stage: text("stage"),
  teamSize: text("team_size"),
  productType: text("product_type"),
  businessModel: text("business_model"),
  consentFollowup: integer("consent_followup", { mode: "boolean" }).notNull().default(false),
  createdAt: createdAt(),
  completedAt: integer("completed_at", { mode: "timestamp" }),
});

export const responses = sqliteTable("responses", {
  id: id(),
  participantId: text("participant_id").notNull().references(() => participants.id),
  section: text("section").notNull(),
  mainAnswer: text("main_answer").notNull(),
  probeQuestion: text("probe_question"),
  probeAnswer: text("probe_answer"),
});

export const results = sqliteTable("results", {
  id: id(),
  participantId: text("participant_id").notNull().references(() => participants.id).unique(),
  backendScore: integer("backend_score").notNull(),
  dimensionScores: text("dimension_scores", { mode: "json" }).notNull(),
  readinessStage: text("readiness_stage").notNull(),
  summary: text("summary").notNull(),
  strengths: text("strengths", { mode: "json" }).notNull(),
  assumptions: text("assumptions", { mode: "json" }).notNull(),
  mvpExperiment: text("mvp_experiment").notNull(),
  sevenDayPlan: text("seven_day_plan", { mode: "json" }).notNull(),
  improvedPitch: text("improved_pitch").notNull(),
  reflectionQuestion: text("reflection_question").notNull(),
  aiRaw: text("ai_raw", { mode: "json" }),
  createdAt: createdAt(),
});
```

- [ ] **Step 4: Create `db/client.ts`**

```ts
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
```

- [ ] **Step 5: Create `drizzle.config.ts`**

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "turso",
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});
```

- [ ] **Step 6: Run the schema test**

Run: `npm run test -- schema`
Expected: PASS.

- [ ] **Step 7: Generate the migration**

Run: `npm run db:generate`
Expected: a SQL migration file appears under `db/migrations/`.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add Turso client and Drizzle schema for all tables"
```

---

### Task 3: ID + join-code helpers

**Files:**
- Create: `lib/ids.ts`
- Test: `lib/__tests__/ids.test.ts`

**Interfaces:**
- Produces:
  - `newId(): string` — a URL-safe unique id (crypto random, 21 chars).
  - `newJoinCode(): string` — a 6-char uppercase alphanumeric code excluding ambiguous chars (no O/0/I/1).

- [ ] **Step 1: Write the failing test** `lib/__tests__/ids.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { newId, newJoinCode } from "../ids";

describe("ids", () => {
  it("newId returns a 21-char unique string", () => {
    expect(newId()).toHaveLength(21);
    expect(newId()).not.toBe(newId());
  });
  it("newJoinCode is 6 uppercase chars without ambiguous characters", () => {
    const code = newJoinCode();
    expect(code).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- ids`
Expected: FAIL (cannot find module `../ids`).

- [ ] **Step 3: Create `lib/ids.ts`**

```ts
import { randomBytes } from "crypto";

const ID_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function pick(alphabet: string, len: number): string {
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

export function newId(): string {
  return pick(ID_ALPHABET, 21);
}

export function newJoinCode(): string {
  return pick(CODE_ALPHABET, 6);
}
```

- [ ] **Step 4: Run the test**

Run: `npm run test -- ids`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add id and join-code generators"
```

---

### Task 4: Workshop query module

**Files:**
- Create: `db/queries/workshops.ts`, `lib/workshop-defaults.ts`
- Test: `db/queries/__tests__/workshops.test.ts`

**Interfaces:**
- Consumes: `db` from `db/client.ts`, `workshops` from `db/schema.ts`, `newId`/`newJoinCode` from `lib/ids.ts`.
- Produces:
  - `WorkshopSettings = { liveViews: { dashboard: boolean; wordCloud: boolean; progression: boolean }; leaderboard: boolean; probeEnabled: boolean }`.
  - `DEFAULT_SETTINGS: WorkshopSettings` and `DEFAULT_CONSENT_TEXT: string` from `lib/workshop-defaults.ts`.
  - `createWorkshop(input: { ownerId: string; name: string }): Promise<Workshop>` — assigns `newId`, `newJoinCode`, status `"draft"`, default settings + consent.
  - `getWorkshopByJoinCode(code: string): Promise<Workshop | undefined>`.
  - `getWorkshopById(id: string): Promise<Workshop | undefined>`.
  - `Workshop` = inferred select type of the `workshops` table.

The test uses an in-memory libSQL database. Add this helper pattern (used by later query tests too).

- [ ] **Step 1: Write the failing test** `db/queries/__tests__/workshops.test.ts`

```ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import * as schema from "../../schema";

const client = createClient({ url: ":memory:" });
const testDb = drizzle(client, { schema });

vi.mock("../../client", () => ({ get db() { return testDb; } }));

async function migrate() {
  const dir = join(process.cwd(), "db/migrations");
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".sql")).sort()) {
    const stmts = readFileSync(join(dir, f), "utf8").split("--> statement-breakpoint");
    for (const s of stmts) if (s.trim()) await client.execute(s);
  }
}

describe("workshop queries", () => {
  beforeEach(async () => {
    await client.execute("PRAGMA foreign_keys=OFF");
    for (const t of ["results", "responses", "participants", "workshops", "users"]) {
      await client.execute(`DROP TABLE IF EXISTS ${t}`);
    }
    await migrate();
    await testDb.insert(schema.users).values({
      id: "u1", email: "a@b.com", passwordHash: "x", name: "Admin",
    });
  });

  it("creates a workshop with a join code and defaults", async () => {
    const { createWorkshop, getWorkshopByJoinCode } = await import("../workshops");
    const w = await createWorkshop({ ownerId: "u1", name: "Tripura" });
    expect(w.joinCode).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
    expect(w.status).toBe("draft");
    const found = await getWorkshopByJoinCode(w.joinCode);
    expect(found?.id).toBe(w.id);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- workshops`
Expected: FAIL (cannot find module `../workshops`).

- [ ] **Step 3: Create `lib/workshop-defaults.ts`**

```ts
import type { WorkshopSettings } from "@/db/queries/workshops";

export const DEFAULT_SETTINGS: WorkshopSettings = {
  liveViews: { dashboard: true, wordCloud: true, progression: false },
  leaderboard: false,
  probeEnabled: true,
};

export const DEFAULT_CONSENT_TEXT =
  "By continuing, you agree that your responses will be used to generate an AI-assisted MVP readiness snapshot. This is a directional learning tool, not investment, legal, financial, or business guarantee advice. Please avoid sharing confidential information.";
```

- [ ] **Step 4: Create `db/queries/workshops.ts`**

```ts
import { eq } from "drizzle-orm";
import { db } from "../client";
import { workshops } from "../schema";
import { newId, newJoinCode } from "@/lib/ids";
import { DEFAULT_SETTINGS, DEFAULT_CONSENT_TEXT } from "@/lib/workshop-defaults";

export type WorkshopSettings = {
  liveViews: { dashboard: boolean; wordCloud: boolean; progression: boolean };
  leaderboard: boolean;
  probeEnabled: boolean;
};

export type Workshop = typeof workshops.$inferSelect;

export async function createWorkshop(input: { ownerId: string; name: string }): Promise<Workshop> {
  const row = {
    id: newId(),
    ownerId: input.ownerId,
    name: input.name,
    joinCode: newJoinCode(),
    status: "draft" as const,
    consentText: DEFAULT_CONSENT_TEXT,
    settings: DEFAULT_SETTINGS,
  };
  const [created] = await db.insert(workshops).values(row).returning();
  return created;
}

export async function getWorkshopByJoinCode(code: string): Promise<Workshop | undefined> {
  return db.query.workshops.findFirst({ where: eq(workshops.joinCode, code) });
}

export async function getWorkshopById(id: string): Promise<Workshop | undefined> {
  return db.query.workshops.findFirst({ where: eq(workshops.id, id) });
}
```

- [ ] **Step 5: Run the test**

Run: `npm run test -- workshops`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add workshop query module with default settings"
```

---

### Task 5: Password hashing + admin seed

**Files:**
- Create: `lib/passwords.ts`, `db/queries/users.ts`, `scripts/seed-admin.ts`
- Test: `lib/__tests__/passwords.test.ts`

**Interfaces:**
- Consumes: `db`, `users`, `newId`.
- Produces:
  - `hashPassword(plain: string): Promise<string>`, `verifyPassword(plain: string, hash: string): Promise<boolean>`.
  - `getUserByEmail(email: string): Promise<User | undefined>`, `createUser(input: { email: string; name: string; passwordHash: string }): Promise<User>`.
  - `User` = inferred select type of `users`.
  - A runnable seed script that creates an admin from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` env (default email `vishal@quantana.com.au`).

- [ ] **Step 1: Write the failing test** `lib/__tests__/passwords.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../passwords";

describe("passwords", () => {
  it("hashes and verifies", async () => {
    const h = await hashPassword("secret123");
    expect(h).not.toBe("secret123");
    expect(await verifyPassword("secret123", h)).toBe(true);
    expect(await verifyPassword("wrong", h)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- passwords`
Expected: FAIL (cannot find module `../passwords`).

- [ ] **Step 3: Create `lib/passwords.ts`**

```ts
import bcrypt from "bcryptjs";

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
```

- [ ] **Step 4: Create `db/queries/users.ts`**

```ts
import { eq } from "drizzle-orm";
import { db } from "../client";
import { users } from "../schema";
import { newId } from "@/lib/ids";

export type User = typeof users.$inferSelect;

export async function getUserByEmail(email: string): Promise<User | undefined> {
  return db.query.users.findFirst({ where: eq(users.email, email) });
}

export async function createUser(input: {
  email: string; name: string; passwordHash: string;
}): Promise<User> {
  const [created] = await db.insert(users).values({ id: newId(), ...input }).returning();
  return created;
}
```

- [ ] **Step 5: Create `scripts/seed-admin.ts`**

```ts
import "dotenv/config";
import { getUserByEmail, createUser } from "@/db/queries/users";
import { hashPassword } from "@/lib/passwords";

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "vishal@quantana.com.au";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "changeme123";
  if (await getUserByEmail(email)) {
    console.log(`Admin ${email} already exists.`);
    return;
  }
  await createUser({ email, name: "Presenter", passwordHash: await hashPassword(password) });
  console.log(`Seeded admin ${email}.`);
}

main().then(() => process.exit(0));
```

Add dep + script:

```bash
npm install -D dotenv tsx
```

Add to `package.json` scripts: `"seed:admin": "tsx scripts/seed-admin.ts"`.

- [ ] **Step 6: Run the password test**

Run: `npm run test -- passwords`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add password hashing, user queries, and admin seed script"
```

---

### Task 6: Auth.js credentials + login page

**Files:**
- Create: `auth.ts`, `app/api/auth/[...nextauth]/route.ts`, `middleware.ts`, `app/(admin)/login/page.tsx`, `app/(admin)/layout.tsx`, `app/(admin)/dashboard/page.tsx`
- Test: `auth/__tests__/authorize.test.ts`

**Interfaces:**
- Consumes: `getUserByEmail`, `verifyPassword`.
- Produces:
  - `authorizeCredentials(email: string, password: string): Promise<{ id: string; email: string; name: string } | null>` — the pure auth check, unit-tested independently of NextAuth.
  - NextAuth `handlers`, `auth`, `signIn`, `signOut` exports from `auth.ts`.
  - `middleware.ts` protecting `/dashboard` and other `(admin)` routes, redirecting unauthenticated users to `/login`.

- [ ] **Step 1: Write the failing test** `auth/__tests__/authorize.test.ts`

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const getUserByEmail = vi.fn();
const verifyPassword = vi.fn();
vi.mock("@/db/queries/users", () => ({ getUserByEmail }));
vi.mock("@/lib/passwords", () => ({ verifyPassword }));

import { authorizeCredentials } from "../authorize";

describe("authorizeCredentials", () => {
  beforeEach(() => { getUserByEmail.mockReset(); verifyPassword.mockReset(); });

  it("returns user on valid credentials", async () => {
    getUserByEmail.mockResolvedValue({ id: "u1", email: "a@b.com", name: "Admin", passwordHash: "h" });
    verifyPassword.mockResolvedValue(true);
    expect(await authorizeCredentials("a@b.com", "pw")).toEqual({ id: "u1", email: "a@b.com", name: "Admin" });
  });

  it("returns null on wrong password", async () => {
    getUserByEmail.mockResolvedValue({ id: "u1", email: "a@b.com", name: "Admin", passwordHash: "h" });
    verifyPassword.mockResolvedValue(false);
    expect(await authorizeCredentials("a@b.com", "bad")).toBeNull();
  });

  it("returns null when user missing", async () => {
    getUserByEmail.mockResolvedValue(undefined);
    expect(await authorizeCredentials("x@y.com", "pw")).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- authorize`
Expected: FAIL (cannot find module `../authorize`).

- [ ] **Step 3: Create `auth/authorize.ts`**

```ts
import { getUserByEmail } from "@/db/queries/users";
import { verifyPassword } from "@/lib/passwords";

export async function authorizeCredentials(
  email: string,
  password: string,
): Promise<{ id: string; email: string; name: string } | null> {
  const user = await getUserByEmail(email);
  if (!user) return null;
  if (!(await verifyPassword(password, user.passwordHash))) return null;
  return { id: user.id, email: user.email, name: user.name };
}
```

- [ ] **Step 4: Run the test**

Run: `npm run test -- authorize`
Expected: PASS.

- [ ] **Step 5: Create `auth.ts`**

```ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authorizeCredentials } from "@/auth/authorize";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (creds) => {
        const email = creds?.email as string | undefined;
        const password = creds?.password as string | undefined;
        if (!email || !password) return null;
        return authorizeCredentials(email, password);
      },
    }),
  ],
});
```

- [ ] **Step 6: Create `app/api/auth/[...nextauth]/route.ts`**

```ts
import { handlers } from "@/auth";
export const { GET, POST } = handlers;
```

- [ ] **Step 7: Create `middleware.ts`**

```ts
import { auth } from "@/auth";

export default auth((req) => {
  const isLogin = req.nextUrl.pathname === "/login";
  if (!req.auth && !isLogin) {
    return Response.redirect(new URL("/login", req.nextUrl));
  }
});

export const config = {
  matcher: ["/dashboard/:path*", "/workshops/:path*"],
};
```

- [ ] **Step 8: Create `app/(admin)/layout.tsx`**

```tsx
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-slate-50 text-slate-900">{children}</div>;
}
```

- [ ] **Step 9: Create `app/(admin)/login/page.tsx`**

```tsx
import { signIn } from "@/auth";

export default function LoginPage() {
  async function login(formData: FormData) {
    "use server";
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/dashboard",
    });
  }
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">Presenter sign in</h1>
      <form action={login} className="flex flex-col gap-3">
        <input name="email" type="email" placeholder="Email" required
          className="rounded-lg border px-3 py-2" />
        <input name="password" type="password" placeholder="Password" required
          className="rounded-lg border px-3 py-2" />
        <button className="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white">
          Sign in
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 10: Create placeholder `app/(admin)/dashboard/page.tsx`**

```tsx
import { auth } from "@/auth";

export default async function DashboardPage() {
  const session = await auth();
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Welcome, {session?.user?.name ?? "Presenter"}</h1>
      <p className="text-slate-600">Workshops dashboard arrives in Plan 5.</p>
    </main>
  );
}
```

- [ ] **Step 11: Run the full test suite and build**

Run: `npm run test`
Expected: all tests PASS.
Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat: add Auth.js credentials login, middleware, and admin shell"
```

---

## Self-Review

**Spec coverage (this plan's slice — spec §3, §6-auth, §9):**
- Next.js + Vercel + Tailwind scaffold → Task 1. ✓
- Turso + Drizzle + full data model (users, workshops, participants, responses, results) → Task 2. ✓
- Workshop settings shape (live views, leaderboard, probe toggles) + default consent → Task 4. ✓
- Email/password auth, seeded admin, no open registration → Tasks 5–6. ✓
- Deferred to later plans (correctly not here): participant flow (Plan 2), AI (Plan 3), results/canvas + motion primitives (Plan 4), admin dashboard UI + QR + CSV (Plan 5), present mode (Plan 6).

**Placeholder scan:** The `dashboard/page.tsx` explicitly notes "arrives in Plan 5" — this is an intentional shell, not a plan placeholder; every step contains real code. No TBD/TODO in task steps. ✓

**Type consistency:** `WorkshopSettings` defined in `db/queries/workshops.ts` and imported by `lib/workshop-defaults.ts`; `authorizeCredentials` signature matches its test and its use in `auth.ts`; `newId`/`newJoinCode` signatures consistent across Tasks 3–5; table names consistent across schema, queries, and the migration-loading test. ✓

**Note for executor:** Tasks 4–5 unit tests need `db/migrations` to exist (generated in Task 2 Step 7). Run tasks in order.
