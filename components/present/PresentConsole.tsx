"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import useSWR from "swr";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";
import type { WorkshopSettings } from "@/db/queries/workshops";
import { availableViews, VIEW_LABELS, type PresentView } from "@/components/present/views";
import type { PresentData } from "@/components/present/types";
import { WelcomeView } from "@/components/present/WelcomeView";
import { AggregateView } from "@/components/present/AggregateView";
import { WordCloudView } from "@/components/present/WordCloudView";
import { ProgressionView } from "@/components/present/ProgressionView";
import { PollResultsView } from "@/components/present/PollResultsView";
import { ThemeControl } from "@/components/ThemeControl";
import { ActionButton } from "@/components/ui/ActionButton";
import { activatePollAction, closePollAction } from "@/app/(admin)/workshops/[id]/poll-actions";
import { updateSettings } from "@/app/(admin)/workshops/[id]/actions";

interface PollOverviewItem {
  id: string;
  question: string;
  options: string[];
  status: string;
  position: number;
}

interface PollsOverviewResponse {
  polls: PollOverviewItem[];
  activePollId: string | null;
}

interface PollResultsResponse {
  poll: { id: string; question: string; options: string[] } | null;
  tally: { counts: number[]; total: number } | null;
}

type Selection = { kind: "view"; view: PresentView } | { kind: "poll"; pollId: string };

export interface PresentConsoleProps {
  workshopId: string;
  workshopName: string;
  joinCode: string;
  initialData: PresentData;
  settings: WorkshopSettings;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function getJoinUrl(joinCode: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/w/${joinCode}`;
}

export function PresentConsole({ workshopId, workshopName, joinCode, initialData, settings }: PresentConsoleProps) {
  const { data, mutate: mutatePresent } = useSWR<PresentData>(`/api/workshops/${workshopId}/present`, fetcher, {
    fallbackData: initialData,
    refreshInterval: 4000,
    revalidateOnFocus: false,
  });

  const { data: pollsOverview, mutate: mutatePollsOverview } = useSWR<PollsOverviewResponse>(
    `/api/workshops/${workshopId}/polls-overview`,
    fetcher,
    { refreshInterval: 4000, revalidateOnFocus: false },
  );

  // Still used by the canvas-unlock toggle below (already optimistic).
  const [, startPollActionTransition] = useTransition();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [joinOpen, setJoinOpen] = useState(true);
  // Optimistic canvas-unlock: flip the toggle instantly on tap, reconcile
  // when the present SWR catches up (see effect below).
  const [optimisticCanvas, setOptimisticCanvas] = useState<boolean | null>(null);

  const presentData = data ?? initialData;
  const effectiveSettings = presentData.settings ?? settings;
  const views = useMemo(() => availableViews(effectiveSettings), [effectiveSettings]);

  const [selection, setSelection] = useState<Selection>({ kind: "view", view: "welcome" });

  const polls = pollsOverview?.polls ?? [];
  const activePollId = pollsOverview?.activePollId ?? null;
  const previousActivePollId = useRef<string | null>(null);

  // Auto-select a poll ONLY on the activePollId transition (null -> id, or
  // id -> a different id) so the presenter isn't yanked back to it on every
  // 4s refresh once they've navigated away.
  useEffect(() => {
    if (activePollId && activePollId !== previousActivePollId.current) {
      setSelection({ kind: "poll", pollId: activePollId });
    }
    previousActivePollId.current = activePollId;
  }, [activePollId]);

  useEffect(() => {
    if (selection.kind === "view" && !views.includes(selection.view)) {
      setSelection({ kind: "view", view: "welcome" });
    }
  }, [views, selection]);

  // Drop the optimistic canvas state once the server-backed settings agree.
  useEffect(() => {
    if (optimisticCanvas !== null && effectiveSettings.canvasUnlocked === optimisticCanvas) {
      setOptimisticCanvas(null);
    }
  }, [optimisticCanvas, effectiveSettings.canvasUnlocked]);

  const canvasUnlockedDisplayed = optimisticCanvas ?? effectiveSettings.canvasUnlocked;

  const selectedPollId = selection.kind === "poll" ? selection.pollId : null;
  const { data: pollResults } = useSWR<PollResultsResponse>(
    selectedPollId ? `/api/polls/${selectedPollId}/results` : null,
    fetcher,
    { refreshInterval: 3000, revalidateOnFocus: false },
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (selection.kind !== "view") return;
      const i = views.indexOf(selection.view);
      if (i === -1) return;
      if (e.key === "ArrowLeft") {
        setSelection({ kind: "view", view: views[(i - 1 + views.length) % views.length] });
      }
      if (e.key === "ArrowRight") {
        setSelection({ kind: "view", view: views[(i + 1) % views.length] });
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selection, views]);

  const joinUrl = getJoinUrl(joinCode);

  async function handleGoLive(pollId: string) {
    await activatePollAction(workshopId, pollId);
    await mutatePollsOverview();
  }

  async function handleDisable(pollId: string) {
    await closePollAction(workshopId, pollId);
    await mutatePollsOverview();
  }

  return (
    <div
      className="relative flex min-h-screen flex-col overflow-x-hidden text-[var(--pulse-text)]"
      style={{ background: "var(--pulse-bg-gradient)" }}
    >
      <div className="present-aurora" aria-hidden>
        <span className="present-aurora-blob" />
      </div>

      <header className="relative z-10 flex flex-col items-center justify-center gap-3 px-4 pt-5 sm:px-8 sm:pt-6">
        <div className="flex w-full items-center justify-between">
          <Link
            href={`/workshops/${workshopId}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--pulse-border)] bg-surface px-3 py-1 text-xs font-semibold text-[var(--pulse-text-muted)] transition-colors hover:text-[var(--pulse-text)]"
          >
            ← Back to Dashboard
          </Link>
          {!sidebarOpen && (
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-expanded={sidebarOpen}
              aria-label="Show controls sidebar"
              className="flex items-center gap-1.5 rounded-full border border-[var(--pulse-border-strong)] bg-surface px-3 py-1 text-xs font-semibold text-[var(--pulse-text-muted)] transition-colors hover:text-[var(--pulse-text)]"
            >
              <Menu aria-hidden className="h-4 w-4" /> Show controls
            </button>
          )}
        </div>

        {/* Top Middle-Aligned Brand & Presenter Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-3">
            <Image
              src="/quantana-logo.svg"
              alt="Quantana"
              width={280}
              height={64}
              className="nav-logo h-12 w-auto sm:h-14"
              priority
            />
            <span
              className="pl-3.5 text-lg font-bold tracking-wide text-[var(--pulse-text-muted)] sm:text-xl"
              style={{ borderLeft: "2px solid var(--pulse-border-strong)" }}
            >
              AI Cofounder
            </span>
          </div>
          <div className="flex flex-col items-center">
            <p className="pulse-kicker text-xs tracking-[0.3em] uppercase">Present Mode</p>
            <h1 className="font-display text-2xl font-black leading-tight tracking-tight sm:text-3xl">{workshopName}</h1>
          </div>
        </div>
      </header>

      <div className="relative z-10 flex flex-1 flex-col gap-6 px-4 py-6 sm:px-10 sm:py-8 lg:flex-row">
        {sidebarOpen && (
        <aside className="flex w-full shrink-0 flex-col gap-6 overflow-y-auto rounded-2xl border border-[var(--pulse-border)] bg-surface p-4 lg:w-[260px]">
          <div>
            <div className="mb-2 flex items-center justify-between px-2">
              <p className="pulse-kicker text-xs">Lean Canvas</p>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                aria-expanded={sidebarOpen}
                aria-label="Hide controls sidebar"
                title="Hide sidebar"
                className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--pulse-border-strong)] text-[var(--pulse-text-muted)] transition-colors hover:bg-surface-strong hover:text-[var(--pulse-text)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <button
              type="button"
              disabled={optimisticCanvas !== null}
              role="switch"
              aria-checked={canvasUnlockedDisplayed}
              onClick={() => {
                const next = !canvasUnlockedDisplayed;
                setOptimisticCanvas(next); // instant flip + locks the button
                startPollActionTransition(async () => {
                  await updateSettings(workshopId, { ...effectiveSettings, canvasUnlocked: next });
                  await mutatePresent();
                });
              }}
              className="flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm font-semibold transition-colors duration-150 active:scale-95 disabled:opacity-70"
              style={{
                background: "var(--pulse-surface-strong)",
                borderColor: "var(--pulse-border-strong)",
                color: "var(--pulse-text)",
              }}
            >
              <span>{canvasUnlockedDisplayed ? "Canvas unlocked — tap to lock" : "Unlock Lean Canvas"}</span>
              <span
                aria-hidden
                className="flex h-5 w-9 shrink-0 items-center rounded-full border p-0.5 transition-colors"
                style={{
                  borderColor: "var(--pulse-border-strong)",
                  background: canvasUnlockedDisplayed ? "var(--pulse-text-muted)" : "transparent",
                }}
              >
                <span
                  className="h-3.5 w-3.5 rounded-full bg-white shadow-sm ring-1 ring-black/10 transition-transform"
                  style={{
                    transform: canvasUnlockedDisplayed ? "translateX(16px)" : "translateX(0)",
                  }}
                />
              </span>
            </button>
          </div>

          <div>
            <p className="pulse-kicker mb-2 px-2 text-xs">Views</p>
            <nav className="flex flex-col gap-1" aria-label="View switcher">
              {views.map((view) => {
                const isSelected = selection.kind === "view" && selection.view === view;
                return (
                  <button
                    key={view}
                    type="button"
                    onClick={() => setSelection({ kind: "view", view })}
                    aria-pressed={isSelected}
                    className={[
                      "rounded-lg px-3 py-2 text-left text-sm font-semibold tracking-tight transition-colors duration-150",
                      isSelected ? "pulse-btn" : "pulse-btn-secondary",
                    ].join(" ")}
                  >
                    {VIEW_LABELS[view]}
                  </button>
                );
              })}
            </nav>
          </div>

          <div>
            <p className="pulse-kicker mb-2 px-2 text-xs">Polls</p>
            {polls.length === 0 ? (
              <p className="px-2 text-xs text-[var(--pulse-text-muted)]">No polls yet</p>
            ) : (
              <nav className="flex flex-col gap-1" aria-label="Poll switcher">
                {polls.map((poll) => {
                  const isSelected = selection.kind === "poll" && selection.pollId === poll.id;
                  const isLive = poll.id === activePollId;
                  return (
                    <div
                      key={poll.id}
                      className={[
                        "flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold tracking-tight transition-colors duration-150",
                        isSelected ? "pulse-btn" : "pulse-btn-secondary",
                      ].join(" ")}
                    >
                      <button
                        type="button"
                        onClick={() => setSelection({ kind: "poll", pollId: poll.id })}
                        aria-pressed={isSelected}
                        className="flex min-w-0 flex-1 items-center gap-2 text-left"
                        title="Project this poll"
                      >
                        <span className="truncate">{poll.question}</span>
                        {isLive && (
                          <span className="shrink-0 rounded-full bg-[var(--pulse-gold)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black">
                            Live
                          </span>
                        )}
                      </button>
                      {isLive ? (
                        <ActionButton
                          type="button"
                          onAction={() => handleDisable(poll.id)}
                          pendingChildren="…"
                          className="shrink-0 rounded-full border border-[var(--pulse-border-strong)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--pulse-text)] transition-opacity disabled:opacity-50"
                          title="Stop founders from answering this poll"
                        >
                          Disable
                        </ActionButton>
                      ) : (
                        <ActionButton
                          type="button"
                          onAction={() => handleGoLive(poll.id)}
                          pendingChildren="…"
                          className="shrink-0 rounded-full bg-[var(--pulse-gold)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black transition-opacity disabled:opacity-50"
                          title="Let founders answer this poll"
                        >
                          Go live
                        </ActionButton>
                      )}
                    </div>
                  );
                })}
              </nav>
            )}
          </div>

          <div className="mt-auto flex items-center justify-between border-t border-[var(--pulse-border)] pt-3">
            <span className="text-xs text-[var(--pulse-text-muted)]">Theme</span>
            <ThemeControl />
          </div>
        </aside>
        )}

        <main className="flex min-w-0 flex-1 items-center justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            {selection.kind === "poll" ? (
              <motion.div
                key={`poll-${selection.pollId}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="w-full max-w-6xl"
              >
                {pollResults?.poll ? (
                  <PollResultsView
                    question={pollResults.poll.question}
                    options={pollResults.poll.options}
                    counts={pollResults.tally?.counts ?? []}
                    total={pollResults.tally?.total ?? 0}
                  />
                ) : (
                  <p className="text-center text-[var(--pulse-text-muted)]">Loading poll…</p>
                )}
              </motion.div>
            ) : (
              <motion.div
                key={selection.view}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="w-full max-w-6xl"
              >
                {selection.view === "welcome" && (
                  <WelcomeView workshopName={workshopName} joinCode={joinCode} joinUrl={joinUrl} />
                )}
                {selection.view === "dashboard" && <AggregateView data={presentData} />}
                {selection.view === "wordcloud" && <WordCloudView data={presentData} />}
                {selection.view === "progression" && <ProgressionView data={presentData} />}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {joinOpen ? (
          <aside className="flex w-full shrink-0 flex-col items-center gap-3 rounded-2xl border border-[var(--pulse-border)] bg-surface p-4 text-center lg:w-[300px]">
            <div className="flex w-full items-center justify-between gap-2">
              <span className="pulse-kicker">Join now</span>
              <button
                type="button"
                onClick={() => setJoinOpen(false)}
                aria-expanded={joinOpen}
                aria-label="Hide join code"
                className="rounded-full border border-[var(--pulse-border-strong)] px-2.5 py-1 text-xs font-medium text-[var(--pulse-text-muted)] transition-colors hover:text-[var(--pulse-text)]"
              >
                Hide
              </button>
            </div>
            <div className="rounded-xl bg-white p-3">
              <QRCodeSVG value={joinUrl} size={180} level="M" />
            </div>
            <span className="font-display text-gradient text-3xl font-bold tracking-[0.2em]">{joinCode}</span>
            <p className="break-all text-xs text-[var(--pulse-text-muted)]">{joinUrl}</p>
            <span className="flex items-center gap-2">
              <span
                aria-hidden
                className="h-2 w-2 shrink-0 animate-pulse rounded-full"
                style={{ background: "var(--pulse-gold)" }}
              />
              <span className="font-display text-sm font-bold tabular-nums text-[var(--pulse-text)]">
                {presentData.total} joined
              </span>
              <span className="text-xs text-[var(--pulse-text-muted)]">· {presentData.completed} completed</span>
            </span>
          </aside>
        ) : (
          <div className="shrink-0 lg:w-auto">
            <button
              type="button"
              onClick={() => setJoinOpen(true)}
              aria-expanded={joinOpen}
              aria-label="Show join code"
              className="flex w-full items-center justify-center gap-1 rounded-full border border-[var(--pulse-border-strong)] bg-surface px-3 py-1.5 text-xs font-medium text-[var(--pulse-text-muted)] transition-colors hover:text-[var(--pulse-text)] lg:w-auto"
            >
              Show join code
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default PresentConsole;
