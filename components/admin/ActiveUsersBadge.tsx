"use client";

import useSWR from "swr";

export interface ActiveUsersBadgeProps {
  workshopId: string;
  initial: number;
}

interface StatsResponse {
  total: number;
}

const fetcher = async (url: string): Promise<StatsResponse> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load stats");
  return res.json();
};

/**
 * Prominent live "N joined" pill for the presenter header — reuses the
 * stats endpoint on a 5s SWR poll so presenters always see an up-to-date
 * count of who's joined, without leaving the control page.
 */
export function ActiveUsersBadge({ workshopId, initial }: ActiveUsersBadgeProps) {
  const { data } = useSWR<StatsResponse>(`/api/workshops/${workshopId}/stats`, fetcher, {
    fallbackData: { total: initial },
    refreshInterval: 5000,
  });

  const total = data?.total ?? initial;

  return (
    <span className="pulse-chip inline-flex items-center gap-2 px-3.5 py-1.5 text-sm font-semibold text-foreground">
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
      </span>
      <span className="tabular-nums">{total}</span> joined
    </span>
  );
}

export default ActiveUsersBadge;
