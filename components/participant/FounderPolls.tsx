"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { hasVoted } from "@/lib/voting";

export interface FounderPollsProps {
  code: string;
  participantId: string;
}

interface ActivePoll {
  id: string;
  question: string;
  options: string[];
}

interface ActivePollResponse {
  poll: ActivePoll | null;
}

const OPTION_LABELS = "ABCDEFGHIJ";
const VOTED_KEY = "mrs-voted";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function readVotedIds(): string[] {
  try {
    const raw = localStorage.getItem(VOTED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function markVoted(pollId: string): void {
  try {
    const ids = readVotedIds();
    if (!hasVoted(ids, pollId)) {
      localStorage.setItem(VOTED_KEY, JSON.stringify([...ids, pollId]));
    }
  } catch {
    /* storage unavailable — non-fatal */
  }
}

/**
 * Founder "Polls" tab — a manual fallback to answer the current live poll if
 * the full-screen takeover overlay doesn't trigger. Reuses the same
 * active-poll / vote endpoints and voting helpers as PollTakeover, but as a
 * normal in-flow page rather than a modal.
 */
export function FounderPolls({ code, participantId }: FounderPollsProps) {
  const { data, isLoading } = useSWR<ActivePollResponse>(
    `/api/w/${code}/active-poll`,
    fetcher,
    { refreshInterval: 3000 },
  );

  const [votedIds, setVotedIds] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);

  const poll = data?.poll ?? null;

  useEffect(() => {
    setVotedIds(readVotedIds());
  }, []);

  // Reset per-poll UI state whenever the active poll changes.
  useEffect(() => {
    setSelectedIndex(null);
    setPendingIndex(null);
    setError(false);
  }, [poll?.id]);

  const alreadyVoted = poll ? hasVoted(votedIds, poll.id) : false;

  async function handleVote(index: number) {
    if (!poll || submitting) return;
    setSubmitting(true);
    setError(false);
    setPendingIndex(index);
    try {
      const res = await fetch(`/api/polls/${poll.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ choiceIndex: index, voterId: participantId }),
      });
      if (!res.ok) {
        setError(true);
        setSubmitting(false);
        return;
      }
      markVoted(poll.id);
      setVotedIds(readVotedIds());
      setSelectedIndex(index);
      setSubmitting(false);
    } catch {
      setError(true);
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 pb-20 pt-2">
      <div>
        <p className="pulse-kicker">Live poll</p>
        <h1 className="font-display mt-1 text-xl font-bold" style={{ color: "var(--pulse-text)" }}>
          Answer the live question
        </h1>
        <p className="mt-1 text-sm text-muted">
          A manual fallback in case the pop-up doesn&apos;t appear.
        </p>
      </div>

      {isLoading ? (
        <div className="pulse-card p-4">
          <p className="text-sm text-muted">Checking for a live poll…</p>
        </div>
      ) : !poll ? (
        <div className="pulse-card p-4">
          <p className="text-sm leading-relaxed text-foreground">
            No live question right now. When the presenter starts one, it&apos;ll appear here.
          </p>
        </div>
      ) : (
        <div className="pulse-card p-4">
          <h2 className="font-display text-lg font-bold leading-snug" style={{ color: "var(--pulse-text)" }}>
            {poll.question}
          </h2>

          <div className="mt-4 flex flex-col gap-2.5">
            {poll.options.map((option, i) => {
              const isSelected = selectedIndex === i;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={submitting}
                  onClick={() => handleVote(i)}
                  data-selected={isSelected}
                  className="pulse-chip flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm font-semibold tracking-tight disabled:opacity-60"
                  style={{ borderRadius: "1rem" }}
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                    style={{
                      background: isSelected
                        ? "rgba(255,255,255,0.25)"
                        : "var(--pulse-surface)",
                      color: isSelected ? "#fff" : "var(--pulse-text)",
                    }}
                  >
                    {OPTION_LABELS[i] ?? i + 1}
                  </span>
                  <span>{option}</span>
                  {isSelected ? <span className="ml-auto">✓</span> : null}
                </button>
              );
            })}
          </div>

          {selectedIndex !== null || alreadyVoted ? (
            <p className="mt-3 text-xs font-semibold" style={{ color: "var(--pulse-violet)" }}>
              Answer recorded ✓{" "}
              <span className="font-normal text-muted">— tap another option to change it.</span>
            </p>
          ) : null}

          {error ? (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-red-400/40 bg-red-400/10 px-3 py-2">
              <p className="text-xs text-red-400">Couldn&apos;t save your answer.</p>
              <button
                type="button"
                onClick={() => pendingIndex !== null && handleVote(pendingIndex)}
                className="text-xs font-semibold underline underline-offset-4"
                style={{ color: "var(--pulse-violet)" }}
              >
                Retry
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default FounderPolls;
