"use client";

import useSWR from "swr";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { StageDistribution } from "@/components/admin/StageDistribution";
import type { ReadinessStage } from "@/db/schema";

export interface WorkshopStats {
  total: number;
  completed: number;
  stageDistribution: Record<ReadinessStage, number>;
  sectorBreakdown: { sector: string; count: number }[];
}

export interface StatsPanelProps {
  workshopId: string;
  initialStats: WorkshopStats;
  className?: string;
}

const fetcher = async (url: string): Promise<WorkshopStats> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load stats");
  return res.json();
};

/**
 * Live-polling stats panel — seeded with server-rendered stats and then
 * refreshed every 5s via SWR so presenters watch counts climb in real
 * time while they run the workshop.
 */
export function StatsPanel({ workshopId, initialStats, className }: StatsPanelProps) {
  const { data } = useSWR<WorkshopStats>(`/api/workshops/${workshopId}/stats`, fetcher, {
    fallbackData: initialStats,
    refreshInterval: 5000,
  });

  const stats = data ?? initialStats;

  return (
    <div className={`flex flex-col gap-6 ${className ?? ""}`}>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Participants</p>
          <AnimatedNumber value={stats.total} className="text-3xl font-semibold text-slate-900" />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Completed</p>
          <AnimatedNumber value={stats.completed} className="text-3xl font-semibold text-slate-900" />
        </div>
      </div>

      <StageDistribution distribution={stats.stageDistribution} />

      {stats.sectorBreakdown.length > 0 ? (
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Sectors
          </h2>
          <div className="flex flex-wrap gap-2">
            {stats.sectorBreakdown.map(({ sector, count }) => (
              <span
                key={sector}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
              >
                {sector}
                <span className="tabular-nums text-slate-400">{count}</span>
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default StatsPanel;
