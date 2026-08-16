// Pure regex-based guard helpers for the Vamshi.AI chatbot.
// No DB, no network, no async — string in, value out.

export const ABUSE_REPLY = "⚠️ This has been reported to the organizers.";
export const INJECTION_REPLY =
  "I can't do that. I'm here to help with your startup questions.";
export const IDENTITY_REPLY =
  "I'm Vamshi.AI, an assistant built for this event. Let's get back to your startup.";

const UNLOCK_RE = /^\s*quantana\s*unlock\s*$/i;

const INJECTION_RE =
  /(ignore|disregard).*(previous|prior|above).*(instruction|prompt)|reveal.*(system )?prompt|you are now|jailbreak/i;

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
