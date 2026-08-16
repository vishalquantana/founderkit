"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { STAGE_META } from "@/lib/readiness";
import { LEAN_CANVAS_BLOCKS } from "@/lib/result-view";
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
  className?: string;
}

function formatCompletedAt(date: Date | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Live roster of submissions with an expandable drill-in per row showing
 * the founder's six answers alongside their result summary.
 */
export function SubmissionsTable({ submissions, className }: SubmissionsTableProps) {
  const [openId, setOpenId] = useState<string | null>(null);

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
      <div className="hidden grid-cols-[1.5fr_1.5fr_1fr_1fr_0.8fr] gap-3 px-4 text-xs font-semibold uppercase tracking-wide text-muted sm:grid">
        <span>Founder</span>
        <span>Startup</span>
        <span>Sector</span>
        <span>Stage</span>
        <span>Completed</span>
      </div>

      {submissions.map(({ participant, result, answers }) => {
        const isOpen = openId === participant.id;
        const stageColor = result ? STAGE_COLOR_VAR[result.readinessStage] : null;

        return (
          <div
            key={participant.id}
            className="overflow-hidden rounded-2xl border border-border bg-surface backdrop-blur-sm"
          >
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : participant.id)}
              aria-expanded={isOpen}
              className="grid w-full grid-cols-2 items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-surface-strong sm:grid-cols-[1.5fr_1.5fr_1fr_1fr_0.8fr]"
            >
              <span className="col-span-2 font-medium text-foreground sm:col-span-1">
                {participant.founderName}
              </span>
              <span className="col-span-2 text-muted sm:col-span-1">{participant.startupName}</span>
              <span className="text-muted">{participant.sector ?? "—"}</span>
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
              <span className="tabular-nums text-muted">
                {formatCompletedAt(participant.completedAt)}
              </span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen ? (
                <motion.div
                  key="drill-in"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden border-t border-border"
                >
                  <div className="flex flex-col gap-4 px-4 py-4">
                    {result ? (
                      <p className="text-sm leading-relaxed text-muted">{result.summary}</p>
                    ) : (
                      <p className="text-sm italic text-muted">
                        This participant has not completed the workshop yet.
                      </p>
                    )}

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {LEAN_CANVAS_BLOCKS.filter((block) => block.source).map((block) => {
                        const answer = answers[block.source!];
                        if (!answer) return null;
                        return (
                          <div
                            key={block.key}
                            className="rounded-xl border border-border bg-surface p-3"
                          >
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                              {block.title}
                            </p>
                            <p className="mt-1 text-sm leading-relaxed text-foreground">{answer}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

export default SubmissionsTable;
