// Pure answer-confidence estimation. No DB, no network, no async.

export const LOW_CONFIDENCE = 0.5;

const UNCERTAIN_PHRASES = [
  "i don't know",
  "i'm not sure",
  "let me check",
  "cannot answer",
];

export function estimateConfidence(answer: string): number {
  const lower = answer.toLowerCase();
  if (UNCERTAIN_PHRASES.some((p) => lower.includes(p))) {
    return 0.3;
  }
  const wordCount = lower.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount < 6) {
    return 0.5;
  }
  return 0.9;
}
