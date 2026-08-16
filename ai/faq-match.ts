// Pure FAQ keyword-matching helpers. No DB, no network, no async.

export const FAQ_MATCH_THRESHOLD = 0.4;

const STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "is",
  "are",
  "am",
  "do",
  "does",
  "did",
  "how",
  "what",
  "why",
  "when",
  "where",
  "who",
  "which",
  "i",
  "my",
  "me",
  "you",
  "your",
  "it",
  "its",
  "to",
  "of",
  "in",
  "on",
  "at",
  "for",
  "and",
  "or",
  "but",
  "with",
  "can",
  "should",
  "will",
  "be",
  "this",
  "that",
  "these",
  "those",
  "was",
  "were",
]);

export function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

export function scoreOverlap(a: string, b: string): number {
  const aTokens = new Set(tokenize(a));
  const bTokens = new Set(tokenize(b));
  if (aTokens.size === 0) return 0;
  let intersection = 0;
  for (const t of aTokens) {
    if (bTokens.has(t)) intersection += 1;
  }
  return intersection / aTokens.size;
}

export function findBestFaqMatch<T extends { question: string }>(
  query: string,
  faqs: T[]
): { faq: T; score: number } | null {
  let best: { faq: T; score: number } | null = null;
  for (const faq of faqs) {
    const score = scoreOverlap(query, faq.question);
    if (!best || score > best.score) {
      best = { faq, score };
    }
  }
  if (!best || best.score < FAQ_MATCH_THRESHOLD) return null;
  return best;
}
