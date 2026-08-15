"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { STAGE_META } from "@/lib/readiness";
import { stageColorClasses, CANVAS_CELLS } from "@/lib/result-view";
import type { EvaluationResult } from "@/ai/schema";
import type { Participant } from "@/db/queries/participants";
import type { SectionKey } from "@/db/schema";

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
      <div className={`rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 ${className ?? ""}`}>
        No submissions yet. They will appear here as participants complete the workshop.
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${className ?? ""}`}>
      <div className="hidden grid-cols-[1.5fr_1.5fr_1fr_1fr_0.8fr] gap-3 px-4 text-xs font-semibold uppercase tracking-wide text-slate-400 sm:grid">
        <span>Founder</span>
        <span>Startup</span>
        <span>Sector</span>
        <span>Stage</span>
        <span>Completed</span>
      </div>

      {submissions.map(({ participant, result, answers }) => {
        const isOpen = openId === participant.id;
        const colors = result ? stageColorClasses(result.readinessStage) : null;

        return (
          <div
            key={participant.id}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : participant.id)}
              aria-expanded={isOpen}
              className="grid w-full grid-cols-2 items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-slate-50 sm:grid-cols-[1.5fr_1.5fr_1fr_1fr_0.8fr]"
            >
              <span className="col-span-2 font-medium text-slate-800 sm:col-span-1">
                {participant.founderName}
              </span>
              <span className="col-span-2 text-slate-600 sm:col-span-1">{participant.startupName}</span>
              <span className="text-slate-500">{participant.sector ?? "—"}</span>
              <span>
                {result ? (
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors!.badge}`}
                  >
                    {STAGE_META[result.readinessStage].label}
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                    In progress
                  </span>
                )}
              </span>
              <span className="tabular-nums text-slate-400">
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
                  className="overflow-hidden border-t border-slate-100"
                >
                  <div className="flex flex-col gap-4 px-4 py-4">
                    {result ? (
                      <p className="text-sm leading-relaxed text-slate-600">{result.summary}</p>
                    ) : (
                      <p className="text-sm italic text-slate-400">
                        This participant has not completed the workshop yet.
                      </p>
                    )}

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {CANVAS_CELLS.map((cell) => {
                        const answer = answers[cell.section];
                        if (!answer) return null;
                        return (
                          <div
                            key={cell.section}
                            className="rounded-xl border border-slate-100 bg-slate-50/70 p-3"
                          >
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                              {cell.title}
                            </p>
                            <p className="mt-1 text-sm leading-relaxed text-slate-700">{answer}</p>
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
