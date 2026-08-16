"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { hasVoted, recordChoice, getChoice, unmarkVoted, clearChoice } from "@/lib/voting";
import { optionColor } from "@/lib/poll-colors";

export interface FounderPollsProps {
  code: string;
  participantId: string;
}

interface PollListItem {
  id: string;
  question: string;
  options: string[];
  status: string;
  position: number;
  counts: number[];
  total: number;
}

interface FounderPollsResponse {
  polls: PollListItem[];
  activePollId: string | null;
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

function LockIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

interface OptimisticVote {
  index: number;
  counts: number[];
  total: number;
}

function ResultsView({
  poll,
  optimistic,
  captionOverride,
}: {
  poll: PollListItem;
  optimistic: OptimisticVote | null;
  captionOverride?: string;
}) {
  const counts = optimistic ? optimistic.counts : poll.counts;
  const total = optimistic ? optimistic.total : poll.total;
  const myChoice = optimistic ? optimistic.index : getChoice(poll.id);

  return (
    <div className="mt-4 flex flex-col gap-2.5">
      {poll.options.map((option, i) => {
        const count = counts[i] ?? 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        const isChosen = myChoice === i;
        const color = optionColor(i);
        return (
          <div
            key={i}
            className="flex flex-col gap-1.5 rounded-xl p-1.5"
            style={isChosen ? { boxShadow: `0 0 0 2px ${color}` } : undefined}
          >
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="flex items-center gap-2 font-semibold" style={{ color: "var(--pulse-text)" }}>
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                  style={{ background: color, color: "#0a0a14" }}
                >
                  {OPTION_LABELS[i] ?? i + 1}
                </span>
                {option}
                {isChosen ? (
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                    style={{ background: color, color: "#0a0a14" }}
                  >
                    ✓ You
                  </span>
                ) : null}
              </span>
              <span className="shrink-0 tabular-nums text-muted">
                {count} · {pct}%
              </span>
            </div>
            <div
              className="h-2.5 w-full overflow-hidden rounded-full"
              style={{ background: "var(--pulse-track)" }}
            >
              <div
                className="h-full rounded-full transition-[width] duration-300"
                style={{ width: `${pct}%`, background: color }}
              />
            </div>
          </div>
        );
      })}
      <p className="mt-1 text-xs font-semibold" style={{ color: "var(--pulse-violet)" }}>
        {captionOverride ?? `Your response is in · ${total} response${total === 1 ? "" : "s"}`}
      </p>
    </div>
  );
}

function LockedPollCard({ poll }: { poll: PollListItem }) {
  const isUpcoming = poll.status === "draft";
  const label = isUpcoming ? "Opens when the presenter starts this question" : "Closed";
  return (
    <div className="pulse-card p-4 opacity-60">
      <div className="flex items-start gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: "var(--pulse-surface-strong)", color: "var(--pulse-kicker)" }}
        >
          <LockIcon />
        </div>
        <div>
          {/* Blur locked questions so founders can't read them ahead of time or when locked. */}
          <h2
            className="font-display select-none text-base font-bold leading-snug blur-[7px]"
            style={{ color: "var(--pulse-text)" }}
          >
            {poll.question}
          </h2>
          <p className="mt-1 text-xs text-muted">{label}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * One poll's card. Its own local `optimistic` state (once set by a vote)
 * always wins over the "answered" flag derived from localStorage, so the
 * card never remounts/loses its optimistic result mid-flight even though
 * the parent's `votedIds` list also flips to include this poll right after
 * a tap (persisted via `markVoted`, then re-read into state).
 */
function PollCard({
  poll,
  isActive,
  initiallyAnswered,
  participantId,
  onVoted,
}: {
  poll: PollListItem;
  isActive: boolean;
  initiallyAnswered: boolean;
  participantId: string;
  onVoted: (pollId: string) => void;
}) {
  const [optimistic, setOptimistic] = useState<OptimisticVote | null>(null);
  const [error, setError] = useState(false);
  const [reAnswering, setReAnswering] = useState(false);

  const answered = initiallyAnswered || optimistic !== null;

  function handleVote(index: number) {
    if (optimistic && !reAnswering) return;

    // Optimistic: flip to results instantly, mark voted immediately, and
    // fire the network request in the background without awaiting it. On a
    // re-vote (reAnswering), this replaces the prior choice rather than
    // adding a new voter — the vote endpoint upserts by (pollId, voterId).
    const baseCounts = (optimistic ? optimistic.counts : poll.counts).slice();
    const baseTotal = optimistic ? optimistic.total : poll.total;
    const prevIndex = reAnswering ? optimistic?.index : undefined;

    if (prevIndex !== undefined && prevIndex !== index) {
      baseCounts[prevIndex] = Math.max(0, (baseCounts[prevIndex] ?? 0) - 1);
    }
    if (prevIndex !== index) {
      baseCounts[index] = (baseCounts[index] ?? 0) + 1;
    }
    const nextTotal = reAnswering ? baseTotal : baseTotal + 1;

    const snapshot: OptimisticVote = { index, counts: baseCounts, total: nextTotal };
    setOptimistic(snapshot);
    setReAnswering(false);
    setError(false);
    markVoted(poll.id);
    recordChoice(poll.id, index);
    onVoted(poll.id);

    fetch(`/api/polls/${poll.id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ choiceIndex: index, voterId: participantId }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("vote failed");
      })
      .catch(() => {
        setOptimistic(null);
        setError(true);
      });
  }

  if (!answered && !isActive) {
    return <LockedPollCard poll={poll} />;
  }

  return (
    <div className="pulse-card p-4">
      <h2 className="font-display text-base font-bold leading-snug" style={{ color: "var(--pulse-text)" }}>
        {poll.question}
      </h2>

      {answered && !reAnswering ? (
        <>
          <ResultsView poll={poll} optimistic={optimistic} />
          {isActive ? (
            <button
              type="button"
              onClick={() => setReAnswering(true)}
              className="mt-3 text-left text-xs font-semibold underline underline-offset-2"
              style={{ color: "var(--pulse-violet)" }}
            >
              Change my answer
            </button>
          ) : null}
        </>
      ) : (
        <div className="mt-4 flex flex-col gap-2.5">
          {poll.options.map((option, i) => {
            const color = optionColor(i);
            return (
              <button
                key={i}
                type="button"
                onClick={() => handleVote(i)}
                className="pulse-chip flex w-full items-center gap-3 border-l-4 px-4 py-3.5 text-left text-sm font-semibold tracking-tight"
                style={{ borderRadius: "1rem", borderLeftColor: color }}
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{ background: color, color: "#0a0a14" }}
                >
                  {OPTION_LABELS[i] ?? i + 1}
                </span>
                <span>{option}</span>
              </button>
            );
          })}
        </div>
      )}

      {error ? (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-red-400/40 bg-red-400/10 px-3 py-2">
          <p className="text-xs text-red-400">Couldn&apos;t save — tap to retry.</p>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Founder "Polls" tab — a full list of the workshop's questions, each in
 * the right state: draft/not-open shown locked, the active question
 * answerable (tap-to-vote, optimistic), and answered/closed questions shown
 * as a results distribution. Backed by a 5s-cached aggregates endpoint.
 */
export function FounderPolls({ code, participantId }: FounderPollsProps) {
  const { data, isLoading } = useSWR<FounderPollsResponse>(
    `/api/w/${code}/polls`,
    fetcher,
    { refreshInterval: 5000 },
  );

  const [votedIds, setVotedIds] = useState<string[]>([]);

  useEffect(() => {
    setVotedIds(readVotedIds());
  }, []);

  const polls = data?.polls ?? [];
  const activePollId = data?.activePollId ?? null;

  // Reconcile local vote state with the server. When a presenter resets a
  // question it flips back to `status: "draft"` and its votes are cleared,
  // but this device may still have it marked "voted" in localStorage. Clear
  // that stale mark so the card renders LOCKED/upcoming (not a stale
  // "answered · 0 responses"), and it becomes answerable fresh on re-activation.
  // Keyed on the fetched polls, so a reset reconciles within one 5s refresh.
  useEffect(() => {
    const draftIds = polls.filter((p) => p.status === "draft").map((p) => p.id);
    if (draftIds.length === 0) return;
    const stale = draftIds.filter((id) => votedIds.includes(id));
    if (stale.length === 0) return;
    for (const id of stale) {
      unmarkVoted(id);
      clearChoice(id);
    }
    setVotedIds(readVotedIds());
  }, [polls, votedIds]);

  function handleVoted(_pollId: string) {
    // markVoted() already persisted to localStorage synchronously; re-read
    // to pick up the change and flip this card into the answered/results state.
    setVotedIds(readVotedIds());
  }

  return (
    <div className="flex flex-1 flex-col gap-4 pb-28 pt-2">
      <div>
        <p className="pulse-kicker">Polls</p>
        <h1 className="font-display mt-1 text-xl font-bold" style={{ color: "var(--pulse-text)" }}>
          Workshop questions
        </h1>
        <p className="mt-1 text-sm text-muted">
          Answer the live question, or check back once the presenter opens the next one.
        </p>
      </div>

      {isLoading ? (
        <div className="pulse-card p-4">
          <p className="text-sm text-muted">Loading questions…</p>
        </div>
      ) : polls.length === 0 ? (
        <div className="pulse-card p-4">
          <p className="text-sm leading-relaxed text-foreground">No questions yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {[...polls]
            .sort((a, b) => a.position - b.position)
            .map((poll) => (
              <PollCard
                key={poll.id}
                poll={poll}
                isActive={poll.id === activePollId}
                initiallyAnswered={hasVoted(votedIds, poll.id)}
                participantId={participantId}
                onVoted={handleVoted}
              />
            ))}
        </div>
      )}
    </div>
  );
}

export default FounderPolls;
