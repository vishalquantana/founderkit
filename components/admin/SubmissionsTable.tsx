"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { STAGE_META } from "@/lib/readiness";
import type { EvaluationResult } from "@/ai/schema";
import type { Participant } from "@/db/queries/participants";
import type { ReadinessStage, SectionKey } from "@/db/schema";

const STAGE_COLOR_VAR: Record<ReadinessStage, string> = {
  idea_clarity: "var(--stage-idea)",
  discovery_ready: "var(--stage-discovery)",
  mvp_candidate: "var(--stage-mvp)",
  pilot_ready: "var(--stage-pilot)",
  revenue_ready: "var(--stage-revenue)",
};

export interface SubmissionRow {
  participant: Participant;
  result?: EvaluationResult;
  answers: Partial<Record<SectionKey, string>>;
}

export interface SubmissionsTableProps {
  submissions: SubmissionRow[];
  workshopId: string;
  className?: string;
}

type SortMode = "recent" | "readiness";

function formatCompletedAt(date: Date | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function sortByReadiness(submissions: SubmissionRow[]): SubmissionRow[] {
  return [...submissions].sort(
    (a, b) => (b.result?.backendScore ?? -1) - (a.result?.backendScore ?? -1),
  );
}

/**
 * Live roster of submissions with an expandable drill-in per row showing
 * the founder's six answers alongside their result summary, plus a link to
 * the full founder result view.
 */
export function SubmissionsTable({ submissions, workshopId, className }: SubmissionsTableProps) {
  const [sortMode, setSortMode] = useState<SortMode>("recent");

  const orderedSubmissions = useMemo(
    () => (sortMode === "readiness" ? sortByReadiness(submissions) : submissions),
    [submissions, sortMode],
  );

  if (submissions.length === 0) {
    return (
      <div
        className={`pulse-card border-dashed p-8 text-center text-sm text-muted ${className ?? ""}`}
      >
        No submissions yet. They will appear here as participants complete the workshop.
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${className ?? ""}`}>
      <div className="flex items-center justify-end gap-1 px-1">
        <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-muted">
          Sort by
        </span>
        <div className="inline-flex overflow-hidden rounded-full border border-border">
          <button
            type="button"
            onClick={() => setSortMode("recent")}
            className={`px-3 py-1 text-xs font-medium transition-colors ${
              sortMode === "recent"
                ? "bg-foreground text-background"
                : "bg-surface text-muted hover:bg-surface-strong"
            }`}
          >
            Recent
          </button>
          <button
            type="button"
            onClick={() => setSortMode("readiness")}
            className={`px-3 py-1 text-xs font-medium transition-colors ${
              sortMode === "readiness"
                ? "bg-foreground text-background"
                : "bg-surface text-muted hover:bg-surface-strong"
            }`}
          >
            Readiness score
          </button>
        </div>
      </div>

      <div className="hidden grid-cols-[1.5fr_1.5fr_1fr_0.7fr_1fr_0.8fr] gap-3 px-4 text-xs font-semibold uppercase tracking-wide text-muted sm:grid">
        <span>Founder</span>
        <span>Startup</span>
        <span>Sector</span>
        <span>Score</span>
        <span>Stage</span>
        <span>Completed</span>
      </div>

      {orderedSubmissions.map(({ participant, result }) => {
        const stageColor = result ? STAGE_COLOR_VAR[result.readinessStage] : null;

        return (
          <Link
            key={participant.id}
            href={`/workshops/${workshopId}/submissions/${participant.id}`}
            className="block overflow-hidden rounded-2xl border border-border bg-surface backdrop-blur-sm transition-colors hover:border-border-strong hover:bg-surface-strong"
          >
            <div className="grid w-full grid-cols-2 items-center gap-3 px-4 py-3 text-sm sm:grid-cols-[1.5fr_1.5fr_1fr_0.7fr_1fr_0.8fr]">
              <span className="col-span-2 font-medium text-foreground sm:col-span-1">
                {participant.founderName}
              </span>
              <span className="col-span-2 text-muted sm:col-span-1">{participant.startupName}</span>
              <span className="text-muted">{participant.sector ?? "—"}</span>
              <span className="tabular-nums text-muted">
                {result ? `${result.backendScore}/100` : "—"}
              </span>
              <span>
                {result ? (
                  <span
                    className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium"
                    style={{
                      color: stageColor!,
                      borderColor: `color-mix(in srgb, ${stageColor} 45%, transparent)`,
                      backgroundColor: `color-mix(in srgb, ${stageColor} 14%, transparent)`,
                    }}
                  >
                    {STAGE_META[result.readinessStage].label}
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full border border-border-strong bg-surface-strong px-2.5 py-0.5 text-xs font-medium text-muted">
                    In progress
                  </span>
                )}
              </span>
              <span suppressHydrationWarning className="flex items-center justify-between gap-2 tabular-nums text-muted">
                {formatCompletedAt(participant.completedAt)}
                <span className="text-xs font-semibold text-accent">View →</span>
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default SubmissionsTable;
