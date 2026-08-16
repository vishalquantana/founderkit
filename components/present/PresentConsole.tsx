"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import useSWR from "swr";
import { AnimatePresence, motion } from "motion/react";
import type { WorkshopSettings } from "@/db/queries/workshops";
import { availableViews, VIEW_LABELS, type PresentView } from "@/components/present/views";
import type { PresentData } from "@/components/present/types";
import { WelcomeView } from "@/components/present/WelcomeView";
import { AggregateView } from "@/components/present/AggregateView";
import { WordCloudView } from "@/components/present/WordCloudView";
import { ProgressionView } from "@/components/present/ProgressionView";
import { PollResultsView } from "@/components/present/PollResultsView";

interface PollResultsResponse {
  poll: { id: string; question: string; options: string[] } | null;
  tally: { counts: number[]; total: number } | null;
}

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
  const { data } = useSWR<PresentData>(`/api/workshops/${workshopId}/present`, fetcher, {
    fallbackData: initialData,
    refreshInterval: 4000,
    revalidateOnFocus: false,
  });

  const { data: pollData } = useSWR<PollResultsResponse>(
    `/api/workshops/${workshopId}/poll-results`,
    fetcher,
    { refreshInterval: 3000, revalidateOnFocus: false },
  );

  const presentData = data ?? initialData;
  const effectiveSettings = presentData.settings ?? settings;
  const views = useMemo(() => availableViews(effectiveSettings), [effectiveSettings]);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index >= views.length) setIndex(0);
  }, [views, index]);

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + views.length) % views.length);
  }, [views.length]);

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % views.length);
  }, [views.length]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goPrev, goNext]);

  const activeView: PresentView = views[index] ?? "dashboard";
  const joinUrl = getJoinUrl(joinCode);

  return (
    <div data-theme="dark" className="flex min-h-screen flex-col bg-[#0a0a14] text-[var(--pulse-text)]">
      <header className="flex flex-wrap items-center justify-between gap-4 px-8 pt-8">
        <div>
          <div className="mb-2 flex items-center gap-2.5">
            <Image
              src="/quantana-logo.svg"
              alt="Quantana"
              width={96}
              height={22}
              className="h-4 w-auto invert"
              priority
            />
            <span className="border-l border-white/20 pl-2.5 text-xs font-semibold tracking-wide text-[var(--pulse-text-muted)]">
              AI Cofounder
            </span>
          </div>
          <p className="pulse-kicker">Present Mode</p>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{workshopName}</h1>
        </div>
        <nav className="flex items-center gap-2" aria-label="View switcher">
          {views.map((view, i) => (
            <button
              key={view}
              type="button"
              onClick={() => setIndex(i)}
              aria-pressed={i === index}
              className={[
                "rounded-full px-5 py-2 text-sm font-semibold tracking-tight transition-colors duration-150",
                i === index
                  ? "pulse-btn"
                  : "pulse-btn-secondary",
              ].join(" ")}
            >
              {VIEW_LABELS[view]}
            </button>
          ))}
        </nav>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-8 sm:px-10">
        <AnimatePresence mode="wait">
          {pollData?.poll ? (
            <motion.div
              key="poll-results"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="w-full max-w-6xl"
            >
              <PollResultsView
                question={pollData.poll.question}
                options={pollData.poll.options}
                counts={pollData.tally?.counts ?? []}
                total={pollData.tally?.total ?? 0}
              />
            </motion.div>
          ) : (
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="w-full max-w-6xl"
            >
              {activeView === "welcome" && (
                <WelcomeView workshopName={workshopName} joinCode={joinCode} joinUrl={joinUrl} />
              )}
              {activeView === "dashboard" && <AggregateView data={presentData} />}
              {activeView === "wordcloud" && <WordCloudView data={presentData} />}
              {activeView === "progression" && <ProgressionView data={presentData} />}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--pulse-border)] bg-black/30 px-8 py-6">
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-white p-2">
            <QRCodeSVG value={joinUrl} size={96} level="M" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="pulse-kicker">Join now</span>
            <span className="font-display text-gradient text-3xl font-bold tracking-[0.35em] sm:text-4xl">
              {joinCode}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 text-right">
          <p className="text-lg font-medium text-[var(--pulse-text-muted)] sm:text-xl">{joinUrl}</p>
          <p className="text-xs text-[var(--pulse-text-muted)]">
            Use ← / → to switch views · {views.length} view{views.length === 1 ? "" : "s"} live
          </p>
        </div>
      </footer>
    </div>
  );
}

export default PresentConsole;
