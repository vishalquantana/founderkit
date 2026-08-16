"use client";

import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { hasVoted, recordChoice, getChoice } from "@/lib/voting";
import { optionColor } from "@/lib/poll-colors";

export interface PollTakeoverProps {
  code: string;
}

interface ActivePoll {
  id: string;
  question: string;
  options: string[];
}

interface ActivePollResponse {
  poll: ActivePoll | null;
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

interface OptimisticVote {
  index: number;
  counts: number[];
  total: number;
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

/** Resolve a voter id. Prefer the signed-up participant id; otherwise fall
 * back to a persisted anonymous id so polls are answerable WITHOUT signup
 * (polls are the highest-priority interaction — a founder can answer the
 * live question even before / without filling out the basics form). */
function resolveVoterId(code: string): string {
  try {
    const progressRaw = localStorage.getItem(`mrs-progress-${code}`);
    if (progressRaw) {
      const progress = JSON.parse(progressRaw) as { participantId?: string };
      if (progress.participantId) return progress.participantId;
    }
    let anon = localStorage.getItem("mrs-voter");
    if (!anon) {
      anon = crypto.randomUUID();
      localStorage.setItem("mrs-voter", anon);
    }
    return anon;
  } catch {
    // Storage unavailable — still let them vote this session.
    return crypto.randomUUID();
  }
}

export function PollTakeover({ code }: PollTakeoverProps) {
  const shouldReduceMotion = useReducedMotion();
  const { data, mutate } = useSWR<ActivePollResponse>(`/api/w/${code}/active-poll`, fetcher, {
    refreshInterval: 3000,
    revalidateOnFocus: false,
  });
  const { data: pollsData } = useSWR<FounderPollsResponse>(`/api/w/${code}/polls`, fetcher, {
    refreshInterval: 5000,
  });

  const [votedIds, setVotedIds] = useState<string[]>([]);
  const [voterId, setVoterId] = useState<string | null>(null);
  const [phase, setPhase] = useState<"answering" | "results">("answering");
  const [choiceIndex, setChoiceIndex] = useState<number | null>(null);
  const [optimistic, setOptimistic] = useState<OptimisticVote | null>(null);
  const [voteError, setVoteError] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const activePollId = useRef<string | null>(null);

  useEffect(() => {
    setVotedIds(readVotedIds());
    setVoterId(resolveVoterId(code));
  }, [code]);

  const poll = data?.poll ?? null;
  const listPoll = poll ? (pollsData?.polls ?? []).find((p) => p.id === poll.id) ?? null : null;

  // Whenever the active poll changes, reset per-poll local state. If the
  // founder has already answered it (e.g. resumed mid-session), open
  // straight into the results phase instead of the answering phase.
  useEffect(() => {
    if (!poll) return;
    if (activePollId.current === poll.id) return;
    activePollId.current = poll.id;
    const answered = hasVoted(votedIds, poll.id);
    setPhase(answered ? "results" : "answering");
    setChoiceIndex(answered ? getChoice(poll.id) : null);
    setOptimistic(null);
    setVoteError(false);
    setDismissed(false);
  }, [poll, votedIds]);

  // Once the live tally catches up to (or passes) our optimistic bump,
  // drop the optimistic overlay in favour of the real server counts.
  useEffect(() => {
    if (optimistic && listPoll && listPoll.total >= optimistic.total) {
      setOptimistic(null);
    }
  }, [optimistic, listPoll]);

  const alreadyResponded = poll ? hasVoted(votedIds, poll.id) : true;
  const visible =
    Boolean(poll) &&
    Boolean(voterId) &&
    !dismissed &&
    (phase === "results" || !alreadyResponded);

  function handleVote(index: number) {
    if (!poll || !voterId || phase === "results") return;

    // Optimistic: flip to results instantly, mark voted immediately, and
    // fire the network request in the background without awaiting it.
    const baseCounts = listPoll?.counts ?? poll.options.map(() => 0);
    const baseTotal = listPoll?.total ?? 0;
    const nextCounts = baseCounts.slice();
    nextCounts[index] = (nextCounts[index] ?? 0) + 1;

    setChoiceIndex(index);
    setOptimistic({ index, counts: nextCounts, total: baseTotal + 1 });
    setPhase("results");
    setVoteError(false);
    markVoted(poll.id);
    recordChoice(poll.id, index);
    setVotedIds(readVotedIds());

    fetch(`/api/polls/${poll.id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ choiceIndex: index, voterId }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("vote failed");
      })
      .catch(() => {
        setVoteError(true);
      });
  }

  function handleSkip() {
    if (!poll) return;
    markVoted(poll.id);
    setVotedIds(readVotedIds());
    setDismissed(true);
    void mutate();
  }

  function handleDone() {
    setDismissed(true);
    void mutate();
  }

  if (!visible || !poll) return null;

  const counts = optimistic ? optimistic.counts : listPoll?.counts ?? poll.options.map(() => 0);
  const total = optimistic ? optimistic.total : listPoll?.total ?? 0;

  return (
    <div
      data-theme="dark"
      role="dialog"
      aria-modal="true"
      aria-label={poll.question}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-8 bg-gradient-to-b from-[#0a0a14] via-[#0e0e1c] to-[#0a0a14] px-6 py-10 text-[var(--pulse-text)]"
    >
      <AnimatePresence mode="wait">
        {phase === "results" ? (
          <motion.div
            key="results"
            initial={shouldReduceMotion ? undefined : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: -24 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex w-full max-w-2xl flex-col items-center gap-8 text-center"
          >
            <p className="pulse-kicker">Live results</p>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {poll.question}
            </h2>
            <div className="flex w-full flex-col gap-3 text-left">
              {poll.options.map((option, i) => {
                const count = counts[i] ?? 0;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                const isChosen = choiceIndex === i;
                return (
                  <div key={i} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span
                        className="flex items-center gap-2 font-semibold"
                        style={{ color: isChosen ? optionColor(i) : "var(--pulse-text)" }}
                      >
                        <span
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                          style={{
                            background: isChosen ? optionColor(i) : "rgba(255,255,255,0.1)",
                            color: isChosen ? "#0a0a14" : "var(--pulse-text)",
                            boxShadow: isChosen ? `0 0 0 2px ${optionColor(i)}` : undefined,
                          }}
                        >
                          {OPTION_LABELS[i] ?? i + 1}
                        </span>
                        {option}
                        {isChosen ? " ✓" : ""}
                      </span>
                      <span className="tabular-nums text-[var(--pulse-text-muted)]">
                        {count} · {pct}%
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full transition-[width] duration-300"
                        style={{ width: `${pct}%`, background: optionColor(i) }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-sm font-semibold" style={{ color: "var(--pulse-violet)" }}>
              You answered · {total} response{total === 1 ? "" : "s"}
            </p>
            {voteError ? (
              <p className="text-xs text-red-400">
                Couldn&apos;t save your answer — results shown may not include it yet.
              </p>
            ) : null}
            <button type="button" onClick={handleDone} className="pulse-btn-primary px-8 py-3 text-base font-semibold">
              Done
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="poll"
            initial={shouldReduceMotion ? undefined : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: -24 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex w-full max-w-2xl flex-col items-center gap-8 text-center"
          >
            <p className="pulse-kicker">Live poll</p>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {poll.question}
            </h2>
            <div className="flex w-full flex-col gap-3">
              {poll.options.map((option, i) => {
                const color = optionColor(i);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleVote(i)}
                    className="pulse-btn-secondary flex w-full items-center gap-4 rounded-2xl border-2 px-6 py-5 text-left text-lg font-semibold tracking-tight transition-colors duration-150"
                    style={{ borderColor: color }}
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                      style={{ background: color, color: "#0a0a14" }}
                    >
                      {OPTION_LABELS[i] ?? i + 1}
                    </span>
                    <span>{option}</span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={handleSkip}
              className="text-sm text-[var(--pulse-text-muted)] underline-offset-4 hover:underline"
            >
              Skip
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default PollTakeover;
