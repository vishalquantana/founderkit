"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { STAGE_META } from "@/lib/readiness";
import { deleteSubmissionAction } from "@/app/(admin)/workshops/[id]/actions";
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
 * the full founder result view and delete capabilities for presenters.
 */
export function SubmissionsTable({ submissions, workshopId, className }: SubmissionsTableProps) {
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [mounted, setMounted] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
  }, []);

  const orderedSubmissions = useMemo(
    () => (sortMode === "readiness" ? sortByReadiness(submissions) : submissions),
    [submissions, sortMode],
  );

  function handleDelete(e: React.MouseEvent, participant: Participant) {
    e.preventDefault();
    e.stopPropagation();

    const confirmed = window.confirm(
      `Are you sure you want to delete the submission for "${participant.founderName}" (${participant.startupName})? This will permanently remove their canvas responses, chat history, and evaluation.`,
    );
    if (!confirmed) return;

    setDeletingId(participant.id);
    startTransition(async () => {
      try {
        await deleteSubmissionAction(workshopId, participant.id);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to delete submission.");
      } finally {
        setDeletingId(null);
      }
    });
  }

  if (submissions.length === 0) {
    return (
      <div
        className={`pulse-card border-dashed p-8 text-center text-sm text-muted ${className ?? ""}`}
      >
        No submissions yet. Once founders begin submitting, their results will appear here in real
        time.
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-3 ${className ?? ""}`}>
      <div className="flex items-center justify-between gap-4 px-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">
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

      <div className="hidden grid-cols-[1.5fr_1.5fr_1fr_0.7fr_1fr_0.9fr_auto] gap-3 px-4 text-xs font-semibold uppercase tracking-wide text-muted sm:grid">
        <span>Founder</span>
        <span>Startup</span>
        <span>Sector</span>
        <span>Score</span>
        <span>Stage</span>
        <span>Completed</span>
        <span className="text-right">Actions</span>
      </div>

      {orderedSubmissions.map(({ participant, result }) => {
        const stageColor = result ? STAGE_COLOR_VAR[result.readinessStage] : null;
        const isDeleting = deletingId === participant.id;

        return (
          <div
            key={participant.id}
            className={`group relative overflow-hidden rounded-2xl border border-border bg-surface backdrop-blur-sm transition-all hover:border-border-strong hover:bg-surface-strong ${
              isDeleting ? "opacity-40 pointer-events-none" : ""
            }`}
          >
            <div className="grid w-full grid-cols-2 items-center gap-3 px-4 py-3 text-sm sm:grid-cols-[1.5fr_1.5fr_1fr_0.7fr_1fr_0.9fr_auto]">
              <Link
                href={`/workshops/${workshopId}/submissions/${participant.id}`}
                className="col-span-2 font-semibold text-foreground hover:underline sm:col-span-1"
              >
                {participant.founderName}
              </Link>
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
              <span suppressHydrationWarning className="tabular-nums text-muted text-xs">
                {mounted ? formatCompletedAt(participant.completedAt) : "—"}
              </span>

              {/* Row Actions */}
              <div className="flex items-center justify-end gap-2">
                <Link
                  href={`/workshops/${workshopId}/submissions/${participant.id}`}
                  className="rounded-lg border border-border bg-surface-strong px-2.5 py-1 text-xs font-semibold hover:border-border-strong"
                >
                  View →
                </Link>
                <button
                  type="button"
                  onClick={(e) => handleDelete(e, participant)}
                  disabled={isDeleting}
                  aria-label={`Delete ${participant.founderName}'s submission`}
                  title="Delete submission"
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 text-red-500 transition-colors hover:bg-red-500 hover:text-white disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default SubmissionsTable;
