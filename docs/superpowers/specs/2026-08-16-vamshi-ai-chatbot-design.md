# Vamshi.AI — Self-Learning Advisor Chatbot Design

**Date:** 2026-08-16
**App:** Quantana AI Cofounder (`qfound`, prod `aicofounder.quantana.top`)
**Reference architecture:** [self-learning-faq-chatbot.md](https://github.com/vishalquantana/shipfactory/blob/main/features/self-learning-faq-chatbot.md)

## Goal

An in-app AI advisor — **Vamshi.AI** — modelled on speaker **Vamshi Panjala** (Cofounder & Chief Growth Officer, Quantana). Founders ask it growth/GTM/startup questions during the workshop; it answers in Vamshi's voice grounded in their own Lean Canvas + poll answers. Questions it can't confidently answer are **escalated to the presenter dashboard**, where the presenter's reply **flows back to the founder** and becomes a permanent FAQ — the self-learning flywheel from the reference doc.

## The persona

Vamshi Panjala — founder-operator, IIM-Bangalore MBA (Marketing & Strategy), ex-Jio/Aircel/Lynk; cofounder of **chotu** (local-shops-go-online, 10X Product Award) and **Batplus** (cricket IoT). Now CGO at Quantana driving AI/GTM/B2B growth. Voice: pragmatic, no-hype, "build proof before you build product", growth-and-distribution-first, Bharat/India market savvy, warm and direct. He answers a founder the way he would from the stage — a concrete next step, not a lecture.

## Architecture (mirrors the reference doc, adapted to this app)

**Turn pipeline** (server, `POST /api/w/[code]/chat`):

1. **Locked check** — if the participant is locked out, return the locked payload (no processing).
2. **Regex guards (free, first, security boundary):**
   - **Unlock keyword** typed by a locked user → clear the lock, resume.
   - **Abuse** (profanity/harassment/threats) → set `lockedAt`, persist an assistant message `⚠️ This has been reported to the organizers.`, return `{ locked: true }`. Locks the founder out of the **whole app**.
   - **Prompt injection / "reveal your prompt" / identity probes** → static safe refusal, no LLM.
3. **FAQ keyword match** — tokenize the question, word-overlap score against `faqs` (this workshop's rows + global seed rows); match ≥ 0.4 → return the stored answer at confidence 0.95, **no LLM**.
4. **LLM answer** — build a context block (persona + growth/GTM best-practice snippets + **this founder's** canvas answers, poll answers, readiness result), call OpenRouter, answer in Vamshi's voice.
5. **Confidence + flag** — `estimateConfidence()`: "I don't know / let me check / I'm not sure" → 0.3; very short → 0.5; else 0.9. FAQ miss + LLM error + missing founder context also flag. `< 0.5` ⇒ `flagged`.
6. **Escalate** — a flagged turn creates an `escalations` row (open) linked to the assistant message.
7. **Persist** user + assistant `chat_messages`; return `{ reply, flagged, locked }`.

**Learning loop:** presenter opens the new **Chats** section → sees each founder's conversation + a queue of **open (blocked) questions** → types a reply → the reply (a) is inserted as an assistant `chat_messages` row for that founder (delivered on next history poll) **and** (b) inserted into `faqs` as `source: 'human_resolved'` (workshop-scoped). The next founder who asks the same thing hits the keyword match instantly, no LLM, no presenter.

**Data scoping / leakage guard:** the founder-context builder only ever reads the **requesting participant's** rows (canvas, polls, result), matched to the pid cookie. FAQ reads are limited to the founder's workshop + global seed rows.

## Data model (migration 0008, additive/nullable — safe on live DB)

```
chat_messages    id, participant_id→participants, role('user'|'assistant'),
                 content, intent, confidence(real), flagged(bool default 0),
                 escalation_id(nullable), created_at
faqs             id, workshop_id(nullable = global seed), question, answer,
                 source('seed'|'manual'|'human_resolved'), topic(nullable), created_at
escalations      id, workshop_id→workshops, participant_id→participants,
                 question_message_id→chat_messages, question(text),
                 status('open'|'answered' default 'open'), presenter_reply(nullable),
                 answered_by(nullable→users), answered_at(nullable), created_at
participants     + locked_at(timestamp nullable)   -- app-wide lockout flag
```

Reply idempotency is inherent: an escalation is answered once (status flips `open`→`answered` in one transaction that also writes the message + FAQ); the presenter UI only shows `open` escalations in the queue.

## App-wide lockout enforcement

A locked participant (`locked_at` set) is blocked across the founder app, not just chat. Enforce in the shared server surface every founder page passes through:
- `w/[code]/layout.tsx` reads the pid cookie; if that participant is locked, render a full-screen **"Access paused — this has been reported"** panel (with a discreet unlock input) instead of `children` + poll takeover.
- The result route guard applies the same check.
- Unlock: typing the secret keyword (regex, e.g. `/^\s*quantana\s*unlock\s*$/i`) — in the chat OR the lock-screen input — clears `locked_at`.

## Components / files

**AI layer**
- `ai/persona.ts` — `VAMSHI_SYSTEM_PROMPT` (bio + voice + guardrail rules), best-practice snippets, `GROWTH_FAQ_SEED` (seed FAQ rows).
- `ai/guards.ts` — pure regex classifiers: `isAbuse`, `isInjection`, `isIdentityProbe`, `isUnlockKeyword`, static refusal text.
- `ai/faq-match.ts` — pure `tokenize`, `scoreOverlap`, `findBestFaqMatch(question, faqs)`.
- `ai/confidence.ts` — pure `estimateConfidence(answer)`.
- `ai/chat.ts` — `answerAsVamshi({ message, context })` → OpenRouter **text** completion (no `json_object`), model `OPENROUTER_CHAT_MODEL ?? OPENROUTER_SCORE_MODEL`; mock fallback when no key.
- `ai/chat-context.ts` — `buildFounderContext(participantId)` → persona-scoped text from the founder's canvas/polls/result.

**DB queries**
- `db/queries/chat.ts` — messages CRUD, faqs CRUD + `seedFaqs`, escalations CRUD, `lockParticipant`/`unlockParticipant`/`isLocked`.

**API**
- `POST /api/w/[code]/chat` — the turn pipeline (pid-cookie guarded).
- `GET  /api/w/[code]/chat/history?participantId=` — message list (SWR-polled for presenter replies).
- `GET  /api/workshops/[id]/chats` — presenter: conversations + open escalations (admin-guarded).
- `POST /api/workshops/[id]/escalations/[eid]/answer` — presenter reply → message + FAQ + status flip.

**Founder UI**
- `components/participant/VamshiChat.tsx` — floating bubble (bottom-right) + slide-up chat panel; optimistic send; SWR history; locked state. Mounted in `w/[code]/layout.tsx` (reads pid cookie).
- Lock screen panel (in the layout) for the app-wide lockout.

**Presenter UI**
- `components/admin/ChatsPanel.tsx` — new **Chats** nav item in `WorkshopWorkspace` (`submissions | polls | chats`): open-questions queue + per-founder transcripts + reply box.

## Testing (repo convention: pure-helper tests, `node` env)

Unit-test the pure modules — `ai/guards.ts` (abuse/injection/unlock/identity classification), `ai/faq-match.ts` (tokenize + overlap threshold + best match), `ai/confidence.ts` (band boundaries). Endpoints/components verified via `npm run test && npm run build` + manual reasoning, matching the existing suite.

## Seeding Vamshi's decks

`GROWTH_FAQ_SEED` ships a first-pass KB (Vamshi's bio + growth/GTM best-practice Q&As). His presentation content is added later as more `source:'seed'` FAQ rows / persona snippets when provided — no schema change needed.

## Out of scope (YAGNI for the workshop)

Vector/embedding search (keyword match is right for a small FAQ table), 👍/👎 feedback ratings, rate-limiting beyond the lockout, cross-workshop FAQ sharing beyond the global seed.
