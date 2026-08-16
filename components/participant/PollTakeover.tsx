"use client";

import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { hasVoted } from "@/lib/voting";

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

const OPTION_LABELS = "ABCDEFGHIJ";
const VOTED_KEY = "mrs-voted";
const VOTER_KEY = "mrs-voter";

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

function resolveVoterId(code: string): string {
  try {
    const progressRaw = localStorage.getItem(`mrs-progress-${code}`);
    if (progressRaw) {
      const progress = JSON.parse(progressRaw) as { participantId?: string };
      if (progress.participantId) return progress.participantId;
    }
  } catch {
    /* ignore malformed storage, fall through */
  }

  try {
    const existing = localStorage.getItem(VOTER_KEY);
    if (existing) return existing;
    const generated = crypto.randomUUID();
    localStorage.setItem(VOTER_KEY, generated);
    return generated;
  } catch {
    return crypto.randomUUID();
  }
}

export function PollTakeover({ code }: PollTakeoverProps) {
  const shouldReduceMotion = useReducedMotion();
  const { data, mutate } = useSWR<ActivePollResponse>(`/api/w/${code}/active-poll`, fetcher, {
    refreshInterval: 3000,
    revalidateOnFocus: false,
  });

  const [votedIds, setVotedIds] = useState<string[]>([]);
  const [voterId, setVoterId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [thanks, setThanks] = useState(false);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setVotedIds(readVotedIds());
    setVoterId(resolveVoterId(code));
  }, [code]);

  useEffect(() => {
    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, []);

  const poll = data?.poll ?? null;
  const alreadyResponded = poll ? hasVoted(votedIds, poll.id) : true;
  const visible = Boolean(poll) && (!alreadyResponded || thanks);

  async function handleVote(choiceIndex: number) {
    if (!poll || !voterId || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/polls/${poll.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ choiceIndex, voterId }),
      });
      if (!res.ok) {
        setSubmitting(false);
        return;
      }
      markVoted(poll.id);
      setVotedIds(readVotedIds());
      setThanks(true);
      dismissTimer.current = setTimeout(() => {
        setThanks(false);
        setSubmitting(false);
        void mutate();
      }, 1200);
    } catch {
      setSubmitting(false);
    }
  }

  function handleSkip() {
    if (!poll) return;
    markVoted(poll.id);
    setVotedIds(readVotedIds());
    void mutate();
  }

  if (!visible || !poll) return null;

  return (
    <div
      data-theme="dark"
      role="dialog"
      aria-modal="true"
      aria-label={poll.question}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-8 bg-gradient-to-b from-[#0a0a14] via-[#0e0e1c] to-[#0a0a14] px-6 py-10 text-[var(--pulse-text)]"
    >
      <AnimatePresence mode="wait">
        {thanks ? (
          <motion.div
            key="thanks"
            initial={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0 }}
            className="text-center"
          >
            <p className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Thanks — answer recorded ✓
            </p>
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
              {poll.options.map((option, i) => (
                <button
                  key={i}
                  type="button"
                  disabled={submitting}
                  onClick={() => handleVote(i)}
                  className="pulse-btn-secondary flex w-full items-center gap-4 rounded-2xl border border-[var(--pulse-border)] px-6 py-5 text-left text-lg font-semibold tracking-tight transition-colors duration-150 disabled:opacity-60"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold">
                    {OPTION_LABELS[i] ?? i + 1}
                  </span>
                  <span>{option}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleSkip}
              disabled={submitting}
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
