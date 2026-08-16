// Pure regex-based guard helpers for the Vamshi.AI chatbot.
// No DB, no network, no async — string in, value out.

export const ABUSE_REPLY = "⚠️ This has been reported to the organizers.";
export const INJECTION_REPLY =
  "I can't do that. I'm here to help with your startup questions.";
export const IDENTITY_REPLY =
  "I'm Vamshi.AI, an assistant built for this event. Let's get back to your startup.";

const UNLOCK_RE = /^\s*quantana\s*unlock\s*$/i;

// Common prompt-injection / instruction-override phrasings. Kept deliberately
// targeted at override/exfiltration intent (not generic role-play like "act as
// an investor and critique my pitch", which is a legitimate founder request).
const INJECTION_PATTERNS = [
  /\b(ignore|disregard|forget|override)\b[^.]{0,40}\b(previous|prior|above|all|earlier|these|your)\b[^.]{0,25}\b(instruction|instructions|prompt|prompts|rules|guardrails|context|message)/i,
  /\b(reveal|show|print|repeat|output|display|expose|leak)\b[^.]{0,30}\b(system\s*prompt|your\s*(prompt|instructions|rules)|the\s*(above|prompt|instructions))/i,
  /\byou (are|will be) now\b|\byou must now\b|\bnew (system\s*)?(instruction|instructions|prompt|role|persona)\b/i,
  /\b(pretend|act as if) (you (are|have)|to be)\b[^.]{0,30}\b(no|not|without|unrestricted|dan|jailbroken|unfiltered)\b/i,
  /\bjailbreak\b|\bdeveloper mode\b|\bDAN\b|without any (restrictions|rules|filters|guardrails)/i,
  /\b(system|developer)\s*(prompt|message|role)\s*[:=]/i,
];

const INJECTION_RE = new RegExp(
  INJECTION_PATTERNS.map((r) => `(?:${r.source})`).join("|"),
  "i",
);

const IDENTITY_RE =
  /\b(are you (a )?(real|human|bot|ai)|what (model|llm|ai) are you|who made you|system prompt)\b/i;

// Small curated list of profanity/harassment/threat terms, matched on word
// boundaries so partial matches inside unrelated words don't trigger.
const ABUSE_WORDS = [
  "fuck",
  "fucking",
  "shit",
  "bitch",
  "asshole",
  "bastard",
  "cunt",
  "kill you",
  "kill yourself",
  "i will kill",
  "i'll kill",
  "idiot",
  "moron",
  "stupid",
  "retard",
  "whore",
  "slut",
];

const ABUSE_RE = new RegExp(
  `\\b(${ABUSE_WORDS.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`,
  "i"
);

export function isUnlockKeyword(s: string): boolean {
  return UNLOCK_RE.test(s);
}

export function isAbuse(s: string): boolean {
  return ABUSE_RE.test(s);
}

export function isInjection(s: string): boolean {
  return INJECTION_RE.test(s);
}

export function isIdentityProbe(s: string): boolean {
  return IDENTITY_RE.test(s);
}

export function classifyGuard(
  s: string
): "unlock" | "abuse" | "injection" | "identity" | null {
  if (isUnlockKeyword(s)) return "unlock";
  if (isAbuse(s)) return "abuse";
  if (isInjection(s)) return "injection";
  if (isIdentityProbe(s)) return "identity";
  return null;
}
