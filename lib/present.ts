import type { ReadinessStage } from "@/db/schema";

export const STAGE_ORDER: ReadinessStage[] = [
  "idea_clarity",
  "discovery_ready",
  "mvp_candidate",
  "pilot_ready",
  "revenue_ready",
];

const STOPWORDS = new Set([
  // small English stopword set
  "the", "and", "for", "are", "but", "not", "you", "your", "with", "that",
  "this", "have", "has", "had", "was", "were", "will", "would", "can",
  "could", "should", "from", "they", "them", "their", "what", "when",
  "where", "which", "who", "whom", "why", "how", "all", "any", "our",
  "out", "over", "into", "than", "then", "there", "here", "about", "also",
  "just", "only", "very", "such", "some", "more", "most", "other", "each",
  "own", "same", "too", "off", "does", "doing", "did", "get", "got", "one",
  "two", "way", "these", "those", "its", "it's", "being", "been", "still",
  // domain stopwords
  "startup", "startups", "founder", "founders", "solution", "business",
]);

export function buildWordFrequencies(
  texts: string[],
  opts?: { max?: number },
): { word: string; count: number }[] {
  const max = opts?.max ?? 40;
  const counts = new Map<string, number>();

  for (const text of texts) {
    const tokens = text.toLowerCase().split(/[^a-z0-9']+/);
    for (const token of tokens) {
      if (!token || token.length < 3) continue;
      if (STOPWORDS.has(token)) continue;
      counts.set(token, (counts.get(token) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, max);
}

export function aliasFor(input: {
  startupName?: string;
  index: number;
  useNames: boolean;
}): string {
  if (input.useNames && input.startupName) {
    return input.startupName;
  }
  return `Founder #${input.index + 1}`;
}
