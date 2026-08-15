"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "motion/react";
import { StageReveal } from "@/components/motion/StageReveal";
import { StageBadge } from "@/components/result/StageBadge";
import { DimensionBars } from "@/components/result/DimensionBars";
import { CanvasBoard } from "@/components/result/CanvasBoard";
import { stageColorClasses } from "@/lib/result-view";
import type { EvaluationResult } from "@/ai/schema";
import type { SectionKey } from "@/db/schema";

export interface ResultViewProps {
  result: EvaluationResult;
  answers: Record<SectionKey, string>;
  founderName: string;
  startupName: string;
  code: string;
  pid: string;
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
  return (
    <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">{children}</h2>
  );
}

/**
 * The delightful results payoff: stage-forward reveal, a tasteful
 * celebration flourish, a staged fade-in of the narrative fields, a
 * breakdown toggle (score hidden until requested), and the interactive
 * lean canvas board. Warm, mobile-first, never leads with the number.
 */
export function ResultView({ result, answers, founderName, startupName, code, pid }: ResultViewProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const colors = stageColorClasses(result.readinessStage);

  return (
    <div className="flex flex-1 flex-col gap-8 pb-10">
      <div className="relative flex flex-col items-center gap-4 pt-4">
        {!shouldReduceMotion ? (
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: [0, 0.5, 0], scale: [0.6, 1.4, 1.6] }}
            transition={{ duration: 1.4, ease: "easeOut" }}
            className={`pointer-events-none absolute -top-6 h-40 w-40 rounded-full blur-2xl ${colors.bar}`}
          />
        ) : null}

        <p className="relative text-sm font-medium text-slate-500">
          {founderName}, here&apos;s where {startupName} stands
        </p>

        <StageReveal className="relative">
          <StageBadge stage={result.readinessStage} />
        </StageReveal>

        <a
          href={`/w/${code}/result/${pid}/pdf`}
          className="relative inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white px-4 py-2 text-sm font-semibold text-purple-700 shadow-sm transition hover:bg-purple-50"
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
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-7"
      >
        <RevealSection>
          <SectionLabel>Your snapshot</SectionLabel>
          <p className="text-sm leading-relaxed text-slate-700">{result.summary}</p>
        </RevealSection>

        <RevealSection>
          <SectionLabel>What&apos;s working</SectionLabel>
          <ul className="flex flex-col gap-2">
            {result.strengths.map((strength) => (
              <li
                key={strength}
                className="rounded-2xl border border-green-200 bg-green-50/70 px-4 py-3 text-sm leading-relaxed text-green-800"
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
                className="rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm leading-relaxed text-amber-800"
              >
                {assumption}
              </li>
            ))}
          </ul>
        </RevealSection>

        <RevealSection>
          <SectionLabel>Your next MVP experiment</SectionLabel>
          <p className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-700 shadow-sm">
            {result.mvpExperiment}
          </p>
        </RevealSection>

        <RevealSection>
          <SectionLabel>7-day plan</SectionLabel>
          <ol className="flex flex-col gap-2">
            {result.sevenDayPlan.map((day, index) => (
              <li
                key={`${day.day}-${index}`}
                className="flex gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-700 shadow-sm"
              >
                <span className="shrink-0 font-semibold text-slate-400">{day.day}</span>
                <span>{day.text}</span>
              </li>
            ))}
          </ol>
        </RevealSection>

        <RevealSection>
          <SectionLabel>Your pitch, sharpened</SectionLabel>
          <p className="rounded-2xl border border-indigo-200 bg-indigo-50/70 px-4 py-3 text-sm leading-relaxed text-indigo-800">
            {result.improvedPitch}
          </p>
        </RevealSection>

        <RevealSection>
          <SectionLabel>Something to sit with</SectionLabel>
          <p className="text-sm italic leading-relaxed text-slate-500">{result.reflectionQuestion}</p>
        </RevealSection>
      </motion.div>

      <div className="flex flex-col gap-3 border-t border-slate-200 pt-6">
        <button
          type="button"
          onClick={() => setShowBreakdown((v) => !v)}
          className="self-start text-sm font-semibold text-slate-500 underline-offset-4 transition hover:text-slate-700 hover:underline"
          aria-expanded={showBreakdown}
        >
          {showBreakdown ? "Hide detailed breakdown" : "View detailed breakdown"}
        </button>

        <AnimatePresence initial={false}>
          {showBreakdown ? (
            <motion.div
              key="breakdown"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: shouldReduceMotion ? 0.15 : 0.3 }}
              className="overflow-hidden"
            >
              <DimensionBars scores={result.dimensionScores} total={result.backendScore} className="pt-2" />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="flex flex-col gap-3">
        <SectionLabel>Your lean canvas</SectionLabel>
        <p className="text-xs text-slate-400">Tap a tile to see the full answer and how it scored.</p>
        <CanvasBoard result={result} answers={answers} />
      </div>
    </div>
  );
}

export default ResultView;
