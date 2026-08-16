"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { StageReveal } from "@/components/motion/StageReveal";
import { StageBadge } from "@/components/result/StageBadge";
import { DimensionBars } from "@/components/result/DimensionBars";
import { LeanCanvasExplorer } from "@/components/result/LeanCanvasExplorer";
import { reevaluateParticipant } from "@/app/(participant)/w/[code]/actions";
import type { EvaluationResult } from "@/ai/schema";
import type { SectionKey, ReadinessStage } from "@/db/schema";

/** Same stage keys as `lib/result-view.ts`, re-expressed as Pulse glow vars. */
const STAGE_GLOW_VAR: Record<ReadinessStage, string> = {
  idea_clarity: "var(--stage-idea)",
  discovery_ready: "var(--stage-discovery)",
  mvp_candidate: "var(--stage-mvp)",
  pilot_ready: "var(--stage-pilot)",
  revenue_ready: "var(--stage-revenue)",
};

export interface ResultViewProps {
  result: EvaluationResult;
  answers: Record<SectionKey, string>;
  founderName: string;
  startupName: string;
  code: string;
  pid: string;
  editable?: boolean;
}

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14, delayChildren: 0.25 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 220, damping: 24 } },
};

function RevealSection({ children }: { children: React.ReactNode }) {
  return (
    <motion.section variants={itemVariants} className="flex flex-col gap-2">
      {children}
    </motion.section>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="pulse-kicker">{children}</h2>;
}

/**
 * The delightful results payoff: stage-forward reveal, a tasteful
 * celebration flourish, a staged fade-in of the narrative fields, a
 * always-visible detailed breakdown, and the interactive lean canvas
 * board. Warm, mobile-first, never leads with the number.
 */
export function ResultView({
  result,
  answers,
  founderName,
  startupName,
  code,
  pid,
  editable = false,
}: ResultViewProps) {
  const shouldReduceMotion = useReducedMotion();
  const router = useRouter();
  const glow = STAGE_GLOW_VAR[result.readinessStage];
  const [isRescoring, startRescoring] = useTransition();
  const [rescoreError, setRescoreError] = useState<string | null>(null);

  function handleRescore() {
    setRescoreError(null);
    startRescoring(async () => {
      try {
        await reevaluateParticipant(pid);
        router.refresh();
      } catch {
        setRescoreError("Couldn't re-score right now. Please try again.");
      }
    });
  }

  return (
    <div className="flex flex-1 flex-col gap-8 pb-10">
      <div className="relative flex flex-col items-center gap-4 pt-4">
        {!shouldReduceMotion ? (
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: [0, 0.5, 0], scale: [0.6, 1.4, 1.6] }}
            transition={{ duration: 1.4, ease: "easeOut" }}
            className="pointer-events-none absolute -top-6 h-40 w-40 rounded-full blur-2xl"
            style={{ background: glow }}
          />
        ) : null}

        <p className="relative text-sm font-medium text-muted">
          {founderName}, here&apos;s where {startupName} stands
        </p>

        <StageReveal className="relative">
          <StageBadge stage={result.readinessStage} />
        </StageReveal>

        <a
          href={`/w/${code}/result/${pid}/pdf`}
          className="pulse-btn-secondary relative inline-flex items-center gap-2 px-4 py-2 text-sm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="M12 3v12" />
            <path d="m7 10 5 5 5-5" />
            <path d="M5 21h14" />
          </svg>
          Download PDF
        </a>

        <Link
          href={`/w/${code}/home/${pid}`}
          className="pulse-btn-secondary relative inline-flex items-center gap-2 px-4 py-2 text-sm"
        >
          Go to your founder home
        </Link>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-7"
      >
        <RevealSection>
          <SectionLabel>Your snapshot</SectionLabel>
          <p className="text-sm leading-relaxed text-foreground">{result.summary}</p>
        </RevealSection>

        <RevealSection>
          <SectionLabel>What&apos;s working</SectionLabel>
          <ul className="flex flex-col gap-2">
            {result.strengths.map((strength) => (
              <li
                key={strength}
                className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm leading-relaxed text-emerald-300"
              >
                {strength}
              </li>
            ))}
          </ul>
        </RevealSection>

        <RevealSection>
          <SectionLabel>Worth testing</SectionLabel>
          <ul className="flex flex-col gap-2">
            {result.assumptions.map((assumption) => (
              <li
                key={assumption}
                className="rounded-2xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm leading-relaxed text-amber-300"
              >
                {assumption}
              </li>
            ))}
          </ul>
        </RevealSection>

        <RevealSection>
          <SectionLabel>Your next MVP experiment</SectionLabel>
          <p className="pulse-card px-4 py-3 text-sm leading-relaxed text-foreground">
            {result.mvpExperiment}
          </p>
        </RevealSection>

        <RevealSection>
          <SectionLabel>7-day plan</SectionLabel>
          <ol className="flex flex-col gap-2">
            {result.sevenDayPlan.map((day, index) => (
              <li
                key={`${day.day}-${index}`}
                className="pulse-card pulse-hover-lift flex gap-3 px-4 py-3 text-sm leading-relaxed text-foreground"
              >
                <span className="font-display shrink-0 font-semibold text-muted">{day.day}</span>
                <span>{day.text}</span>
              </li>
            ))}
          </ol>
        </RevealSection>

        <RevealSection>
          <SectionLabel>Your pitch, sharpened</SectionLabel>
          <p className="rounded-2xl border border-violet-400/25 bg-violet-500/10 px-4 py-3 text-sm leading-relaxed text-violet-200">
            {result.improvedPitch}
          </p>
        </RevealSection>

        <RevealSection>
          <SectionLabel>Something to sit with</SectionLabel>
          <p className="text-sm italic leading-relaxed text-muted">{result.reflectionQuestion}</p>
        </RevealSection>
      </motion.div>

      <div className="flex flex-col gap-3 border-t border-[var(--pulse-border)] pt-6">
        <h2 className="pulse-kicker">Detailed breakdown</h2>
        <DimensionBars
          scores={result.dimensionScores}
          total={result.backendScore}
          justifications={result.dimensionJustifications}
          className="pt-1"
        />
      </div>

      <div className="flex flex-col gap-3">
        <SectionLabel>Your lean canvas</SectionLabel>
        <p className="text-xs text-muted">
          {editable
            ? "Tap a block on the map, or swipe through each area. Edit any answer to sharpen it."
            : "Tap a block on the map, or swipe through each area."}
        </p>
        <LeanCanvasExplorer result={result} answers={answers} editable={editable} participantId={pid} />
      </div>

      {editable ? (
        <div className="flex flex-col items-start gap-2">
          <button
            type="button"
            onClick={handleRescore}
            disabled={isRescoring}
            className="pulse-btn px-4 py-2 text-sm disabled:opacity-60"
          >
            {isRescoring ? "Re-scoring…" : "Re-score my startup"}
          </button>
          <p className="text-xs text-muted">
            Edited a block? Re-score to update your readiness and AI feedback.
          </p>
          {rescoreError ? <p className="text-xs text-red-500">{rescoreError}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

export default ResultView;
