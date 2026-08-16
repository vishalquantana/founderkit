/** Has this poll id already been answered or skipped by the current voter? */
export function hasVoted(votedIds: string[], pollId: string): boolean {
  return votedIds.includes(pollId);
}

const CHOICES_KEY = "mrs-vote-choices";

function readChoices(): Record<string, number> {
  try {
    const raw = localStorage.getItem(CHOICES_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const result: Record<string, number> = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === "number" && Number.isFinite(value)) {
        result[key] = value;
      }
    }
    return result;
  } catch {
    return {};
  }
}

/** Persist which option index the current voter picked for a poll. SSR-safe. */
export function recordChoice(pollId: string, choiceIndex: number): void {
  try {
    const choices = readChoices();
    choices[pollId] = choiceIndex;
    localStorage.setItem(CHOICES_KEY, JSON.stringify(choices));
  } catch {
    /* storage unavailable — non-fatal */
  }
}

/** Read back the option index the current voter picked for a poll, if any. SSR-safe. */
export function getChoice(pollId: string): number | null {
  try {
    const choices = readChoices();
    const value = choices[pollId];
    return typeof value === "number" ? value : null;
  } catch {
    return null;
  }
}
