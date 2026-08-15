"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { AnimatePresence, motion } from "motion/react";
import type { WorkshopSettings } from "@/db/queries/workshops";
import { availableViews, VIEW_LABELS, type PresentView } from "@/components/present/views";
import type { PresentData } from "@/components/present/types";
import { AggregateView } from "@/components/present/AggregateView";
import { WordCloudView } from "@/components/present/WordCloudView";
import { ProgressionView } from "@/components/present/ProgressionView";

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
    <div className="flex min-h-screen flex-col bg-slate-950 text-white">
      <header className="flex flex-wrap items-center justify-between gap-4 px-8 pt-8">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-400">Present Mode</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{workshopName}</h1>
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
                  ? "bg-white text-slate-900 shadow-lg shadow-white/10"
                  : "bg-white/5 text-slate-300 hover:bg-white/10",
              ].join(" ")}
            >
              {VIEW_LABELS[view]}
            </button>
          ))}
        </nav>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-8 sm:px-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="w-full max-w-6xl"
          >
            {activeView === "dashboard" && <AggregateView data={presentData} />}
            {activeView === "wordcloud" && <WordCloudView data={presentData} />}
            {activeView === "progression" && <ProgressionView data={presentData} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 bg-black/30 px-8 py-6">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium uppercase tracking-[0.25em] text-slate-400">Join now</span>
          <span className="font-mono text-3xl font-bold tracking-[0.35em] text-white sm:text-4xl">
            {joinCode}
          </span>
        </div>
        <p className="text-lg font-medium text-slate-300 sm:text-xl">{joinUrl}</p>
        <p className="text-xs text-slate-500">
          Use ← / → to switch views · {views.length} view{views.length === 1 ? "" : "s"} live
        </p>
      </footer>
    </div>
  );
}

export default PresentConsole;
