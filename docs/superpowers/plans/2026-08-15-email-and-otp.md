# Email + OTP Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** (1) Presenters can sign in either with password (existing) OR with an emailed 6-digit OTP code. (2) On finishing, a founder who consented to follow-up is emailed their MVP Readiness Snapshot (summary + link), best-effort. Email is sent via SendGrid from `noreply@quantana.top`.

**Architecture:** A thin SendGrid client + pure email templates. An `otp_codes` table stores hashed codes with expiry. A server action requests a code (emails it); a second Auth.js Credentials provider (`otp`) authorizes by verifying the code. The login page gains a Password/Email-code tab switch. The results path sends the founder email best-effort and records `resultEmailedAt` so it fires once.

**Tech Stack:** SendGrid v3 REST API via `fetch`, Drizzle/Turso, Auth.js v5, vitest.

## Global Constraints

- Sender: `process.env.SENDGRID_FROM_EMAIL` (= `noreply@quantana.top`); API key `process.env.SENDGRID_API_KEY`. Both server-only — never `NEXT_PUBLIC_*`.
- If SendGrid isn't configured or a send fails: OTP request surfaces a friendly "couldn't send code, try password" (never crash); founder result email is best-effort (log + continue, never block the founder's result).
- OTP codes: 6 digits, hashed at rest (bcrypt), 10-minute expiry, single-use, only issued for an existing admin email (do not reveal whether an email exists — always show "if that email is registered, a code is on its way").
- Password login must keep working unchanged. Reuse `hashPassword`/`verifyPassword` patterns for code hashing, `getUserByEmail`, `newId`, `EvaluationResult`, `STAGE_META`, `getOrCreateResult`, `getParticipant`, the `NEXT_PUBLIC_APP_URL` base for links.
- Tone of the founder email is friendly/encouraging, matching the product; no harsh language.

---

### Task 1: SendGrid client + email templates

**Files:**
- Create: `email/sendgrid.ts`, `email/templates.ts`
- Test: `email/__tests__/sendgrid.test.ts`, `email/__tests__/templates.test.ts`

**Interfaces:**
- `email/sendgrid.ts`:
  - `hasSendgrid(): boolean` — both `SENDGRID_API_KEY` and `SENDGRID_FROM_EMAIL` set.
  - `sendEmail(input: { to: string; subject: string; html: string; text: string }): Promise<{ ok: boolean }>` — POST `https://api.sendgrid.com/v3/mail/send` with the from address; returns `{ ok:true }` on 2xx, `{ ok:false }` otherwise (never throws — catches network errors and returns `{ ok:false }`).
- `email/templates.ts` (pure):
  - `otpEmail(code: string): { subject: string; html: string; text: string }`.
  - `resultEmail(input: { founderName: string; startupName: string; stageLabel: string; summary: string; link: string }): { subject: string; html: string; text: string }` — friendly copy, includes the link.

- [ ] **Step 1: Write failing tests** — `templates.test.ts` asserts `otpEmail("123456").text` contains `123456` and subject is non-empty; `resultEmail({...}).html` contains the stage label + link. `sendgrid.test.ts`: mock `fetch`; assert `sendEmail` returns `{ok:true}` on a 202 response and `{ok:false}` on a 500 (and doesn't throw); assert `hasSendgrid()` reflects env presence.

- [ ] **Step 2: Run to verify fail** — `npm run test -- email/__tests__` → FAIL.

- [ ] **Step 3: Implement both files** per interface.

- [ ] **Step 4: Run to verify pass** — PASS.

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: add SendGrid client and email templates"`

---

### Task 2: OTP table, codes, and email-code login

**Files:**
- Modify: `db/schema.ts` (add `otpCodes` table), generate migration
- Create: `lib/otp.ts`, `db/queries/otp.ts`, `app/(admin)/login/otp-actions.ts`
- Modify: `auth.ts` (add second Credentials provider `otp`), `app/(admin)/login/page.tsx` (Password/Email-code tabs)
- Test: `lib/__tests__/otp.test.ts`, `db/queries/__tests__/otp.test.ts`

**Interfaces:**
- `db/schema.ts`: `otpCodes` = { id, email, codeHash, expiresAt (timestamp), consumedAt (nullable), createdAt }.
- `lib/otp.ts` (pure): `generateOtp(): string` (6 digits, may have leading zeros); `hashOtp`/`verifyOtp` (bcrypt wrappers).
- `db/queries/otp.ts`: `createOtp(email: string, codeHash: string, expiresAt: Date): Promise<void>`; `findActiveOtp(email: string): Promise<{ id: string; codeHash: string } | undefined>` (latest unconsumed, unexpired); `consumeOtp(id: string): Promise<void>`.
- `app/(admin)/login/otp-actions.ts`: `requestOtpAction(formData): Promise<{ sent: boolean }>` — read email; if `getUserByEmail` exists AND `hasSendgrid()`, `generateOtp`→hash→`createOtp` (10-min expiry)→`sendEmail(otpEmail(code))`. ALWAYS return `{ sent: true }` regardless (don't leak existence); if send fails, still return sent:true but log. (The actual auth happens via the provider.)
- `auth.ts`: add a second `Credentials` provider with `id: "otp"`, credentials `{ email, code }`, `authorize`: look up user by email; `findActiveOtp`; `verifyOtp(code, codeHash)`; if valid → `consumeOtp` + return `{id,email,name}`; else null. (Keep the existing password provider as-is.)
- `login/page.tsx`: a client tab switch — "Password" (existing form → `signIn('credentials',...)`) and "Email code" (email field + "Send code" calling `requestOtpAction`, then code field → `signIn('otp', { email, code, redirectTo:'/dashboard' })`).

- [ ] **Step 1: Write failing tests** — `lib/__tests__/otp.test.ts`: `generateOtp()` matches `/^\d{6}$/`; `verifyOtp` true/false round-trip. `db/queries/__tests__/otp.test.ts` (in-memory harness): create → `findActiveOtp` returns it → `consumeOtp` → `findActiveOtp` returns undefined; expired codes are not returned.

- [ ] **Step 2: Run to verify fail** — FAIL.

- [ ] **Step 3: Implement** schema + migration (`npm run db:generate`), `lib/otp.ts`, `db/queries/otp.ts`, the auth provider, `otp-actions.ts`, and the tabbed login page.

- [ ] **Step 4: Run to verify pass** — the two OTP tests PASS.

- [ ] **Step 5: Full suite + build** — `npm run test` all pass; `npm run build` succeeds.

- [ ] **Step 6: Commit** — `git add -A && git commit -m "feat: add email OTP login as a second sign-in option"`

---

### Task 3: Email founders their snapshot (consent-gated, best-effort)

**Files:**
- Modify: `db/schema.ts` (add `resultEmailedAt` to `participants`), generate migration
- Create: `email/send-result.ts`
- Modify: `app/(participant)/w/[code]/actions.ts` (`finishParticipant` triggers the email)
- Test: `email/__tests__/send-result.test.ts`

**Interfaces:**
- `participants.resultEmailedAt` (timestamp, nullable).
- `email/send-result.ts`: `maybeEmailResult(participantId: string): Promise<void>` — load participant; if `!consentFollowup` or `resultEmailedAt` already set or `!hasSendgrid()` → return; else `getOrCreateResult` → build `resultEmail({...})` with link `${base}/w/${joinCode}/result/${participantId}` → `sendEmail`; on success set `resultEmailedAt`. Never throws (wrap in try/catch + log).
- `finishParticipant(participantId)`: after `completeParticipant`, call `await maybeEmailResult(participantId).catch(()=>{})` (best-effort; must not block or fail the finish).

- [ ] **Step 1: Write failing test** `email/__tests__/send-result.test.ts` — mock participant query, `getOrCreateResult`, `hasSendgrid`, `sendEmail`, and the `resultEmailedAt` setter. Assert: no consent → no send; already emailed → no send; consent+not-emailed+sendgrid → sends and stamps `resultEmailedAt`; send failure → no stamp, no throw.

- [ ] **Step 2: Run to verify fail** — FAIL.

- [ ] **Step 3: Implement** schema change + migration, `email/send-result.ts`, and wire `finishParticipant`.

- [ ] **Step 4: Run to verify pass** — PASS.

- [ ] **Step 5: Full suite + build** — all pass; build succeeds.

- [ ] **Step 6: Commit** — `git add -A && git commit -m "feat: email founders their snapshot on completion (consent-gated)"`

---

## Self-Review

**Spec coverage:** OTP login as a second option without breaking password (Tasks 1–2) ✓; SendGrid from `noreply@quantana.top`, server-only secrets (Task 1) ✓; consent-gated best-effort founder emails, once only (Task 3) ✓; no email-existence leak, hashed+expiring single-use codes (Task 2) ✓; graceful degradation when SendGrid absent/failing (all tasks) ✓.

**Placeholder scan:** UI (login tabs) delegated but every server entry point, provider, template, and pure helper is pinned with tests. No TBD/TODO. Two new migrations (otp table, resultEmailedAt) generated in-task.

**Type consistency:** `sendEmail`/`hasSendgrid`/`otpEmail`/`resultEmail` shared across tasks; `generateOtp`/`verifyOtp`/`findActiveOtp`/`consumeOtp` match their tests; `maybeEmailResult` consumes `getOrCreateResult`/`getParticipant` as defined earlier; the `otp` provider returns the same `{id,email,name}` shape the session callback expects.
