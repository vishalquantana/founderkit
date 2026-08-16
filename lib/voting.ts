/** Has this poll id already been answered or skipped by the current voter? */
export function hasVoted(votedIds: string[], pollId: string): boolean {
  return votedIds.includes(pollId);
}

const VOTED_KEY = "mrs-voted";
const CHOICES_KEY = "mrs-vote-choices";

function readVotedIds(): string[] {
  try {
    const raw = localStorage.getItem(VOTED_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

/**
 * Remove a poll id from the persisted "voted" set so it can be answered
 * fresh again (used when a presenter resets a poll back to draft). SSR-safe.
 */
export function unmarkVoted(pollId: string): void {
  try {
    const ids = readVotedIds();
    if (!ids.includes(pollId)) return;
    localStorage.setItem(VOTED_KEY, JSON.stringify(ids.filter((id) => id !== pollId)));
  } catch {
    /* storage unavailable — non-fatal */
  }
}

/** Forget the option index the current voter picked for a poll. SSR-safe. */
export function clearChoice(pollId: string): void {
  try {
    const choices = readChoices();
    if (!(pollId in choices)) return;
    delete choices[pollId];
    localStorage.setItem(CHOICES_KEY, JSON.stringify(choices));
  } catch {
    /* storage unavailable — non-fatal */
  }
}

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
