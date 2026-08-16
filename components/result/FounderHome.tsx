"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { gaugePercent } from "@/lib/gauge";
import { DIMENSIONS, DIMENSION_MAX, STAGE_META, type Dimension } from "@/lib/readiness";
import {
  CanvasMiniMap,
  CanvasMiniMapLegend,
  resolveMiniMapCells,
} from "@/components/result/CanvasMiniMap";
import type { EvaluationResult } from "@/ai/schema";
import type { SectionKey } from "@/db/schema";

export interface FounderHomeParticipant {
  founderName: string;
  startupName: string;
  contact: string;
  sector?: string | null;
  stage?: string | null;
  teamSize?: string | null;
  productType?: string | null;
  businessModel?: string | null;
}

export interface FounderHomeProps {
  participant: FounderHomeParticipant;
  result: EvaluationResult;
  answers: Record<SectionKey, string>;
  code: string;
  pid: string;
}

const DIMENSION_LABELS: Record<Dimension, string> = {
  problemClarity: "Problem clarity",
  customerClarity: "Customer clarity",
  valuePayment: "Value & payment",
  mvpQuality: "MVP quality",
  distribution: "Distribution",
  validation: "Validation",
  teamStageFit: "Team & stage fit",
  cashflow: "Cashflow",
};

const SECTION_LABELS: Record<SectionKey, string> = {
  problem: "Problem",
  customer: "Customer clarity",
  value: "Value & payment",
  mvp: "MVP quality",
  distribution: "Distribution",
  proof: "Validation",
};

function CardLabel({ children }: { children: React.ReactNode }) {
  return <span className="pulse-kicker mb-2 block">{children}</span>;
}

/** Pick the 4 lowest-scoring dimensions (by ratio) to surface on the home mini-stats. */
function lowestScoringDimensions(scores: EvaluationResult["dimensionScores"]): Dimension[] {
  return [...DIMENSIONS]
    .sort((a, b) => {
      const ratioA = (scores[a] ?? 0) / DIMENSION_MAX[a];
      const ratioB = (scores[b] ?? 0) / DIMENSION_MAX[b];
      return ratioA - ratioB;
    })
    .slice(0, 4);
}

interface Recommendation {
  key: string;
  label: string;
  text: string;
}

/** Pull ~3 recommendations from sectionRecommendations, falling back to
 * dimensionJustifications, or omitting the card entirely if neither exists. */
function buildRecommendations(result: EvaluationResult): Recommendation[] {
  const recs: Recommendation[] = [];

  if (result.sectionRecommendations) {
    for (const section of Object.keys(result.sectionRecommendations) as SectionKey[]) {
      const tips = result.sectionRecommendations[section];
      if (tips && tips.length > 0) {
        recs.push({ key: section, label: SECTION_LABELS[section], text: tips[0] });
      }
      if (recs.length >= 3) break;
    }
  }

  if (recs.length === 0 && result.dimensionJustifications) {
    for (const dim of DIMENSIONS) {
      const text = result.dimensionJustifications[dim];
      if (text) {
        recs.push({ key: dim, label: DIMENSION_LABELS[dim], text });
      }
      if (recs.length >= 3) break;
    }
  }

  return recs;
}

const DOT_COLORS = ["var(--pulse-violet)", "#60a5fa", "var(--pulse-gold)"];

/**
 * The founder's app-like "home" dashboard — greeting, readiness gauge,
 * dimension mini-stats, profile, a Lean Canvas at-a-glance, the 7-day
 * plan, and an AI recommendations feed. Reuses the existing result data;
 * adds no new login/identity.
 */
export function FounderHome({ participant, result, answers, code, pid }: FounderHomeProps) {
  const shouldReduceMotion = useReducedMotion();
  const stageMeta = STAGE_META[result.readinessStage];
  const percent = gaugePercent(result.backendScore);
  const dims = lowestScoringDimensions(result.dimensionScores);
  const recommendations = buildRecommendations(result);
  const miniMapCells = resolveMiniMapCells(result, answers);
  const initial = participant.founderName.trim().charAt(0).toUpperCase() || "?";

  const tags = [
    participant.sector,
    participant.stage,
    participant.teamSize,
    participant.businessModel,
  ].filter((v): v is string => Boolean(v && v.trim()));

  const cardMotionProps = shouldReduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { type: "spring", stiffness: 220, damping: 24 } as const,
      };

  return (
    <div className="flex flex-1 flex-col gap-4 pb-16">
      {/* Greeting */}
      <div className="pt-2">
        <h1 className="font-display text-xl font-bold" style={{ color: "var(--pulse-text)" }}>
          Hey <span className="text-gradient">{participant.founderName}</span> 👋
        </h1>
        <p className="mt-1 text-sm text-muted">Here&apos;s where {participant.startupName} stands today.</p>
      </div>

      {/* Readiness widget */}
      <motion.div {...cardMotionProps} className="pulse-card p-4">
        <div className="flex items-center gap-4">
          <div className="relative h-[104px] w-[104px] shrink-0">
            <div
              className="h-full w-full rounded-full"
              style={{
                background: `conic-gradient(from 220deg, var(--pulse-violet) 0%, var(--pulse-pink) ${percent}%, var(--pulse-track) 0)`,
                mask: "radial-gradient(farthest-side, transparent 60%, #000 62%)",
                WebkitMask: "radial-gradient(farthest-side, transparent 60%, #000 62%)",
              }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-2xl font-extrabold" style={{ color: "var(--pulse-text)" }}>
                {percent}
              </span>
              <span className="text-[11px] text-muted">/ 100</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span
              className="inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold"
              style={{
                background: "color-mix(in srgb, var(--pulse-violet) 16%, transparent)",
                borderColor: "color-mix(in srgb, var(--pulse-violet) 45%, transparent)",
                color: "var(--pulse-violet)",
                boxShadow: "0 0 24px 1px color-mix(in srgb, var(--pulse-violet) 35%, transparent)",
              }}
            >
              {stageMeta.label}
            </span>
            <p className="text-xs leading-relaxed text-muted">{stageMeta.blurb}</p>
          </div>
        </div>

        <div className="mt-4">
          <CardLabel>Readiness by dimension</CardLabel>
          <div className="grid grid-cols-2 gap-2.5">
            {dims.map((dim) => {
              const max = DIMENSION_MAX[dim];
              const score = result.dimensionScores[dim] ?? 0;
              const ratio = max > 0 ? Math.min(1, Math.max(0, score / max)) : 0;
              return (
                <div
                  key={dim}
                  className="rounded-xl border p-2.5"
                  style={{ background: "var(--pulse-surface-strong)", borderColor: "var(--pulse-border)" }}
                >
                  <div className="flex items-center justify-between text-[10.5px] text-muted">
                    <span>{DIMENSION_LABELS[dim]}</span>
                    <span className="tabular-nums">
                      {score}/{max}
                    </span>
                  </div>
                  <div
                    className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full"
                    style={{ background: "var(--pulse-track)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${ratio * 100}%`, background: "var(--pulse-gradient)" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Profile card */}
      <motion.div {...cardMotionProps} className="pulse-card p-4">
        <div className="flex items-center gap-3">
          <div
            className="font-display flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-extrabold text-white"
            style={{ background: "var(--pulse-gradient)" }}
          >
            {initial}
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--pulse-text)" }}>
              {participant.founderName}
            </p>
            <p className="text-xs text-muted">{participant.startupName} · Founder</p>
          </div>
        </div>
        {tags.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border px-2.5 py-1 text-[11px] text-muted"
                style={{ borderColor: "var(--pulse-border-strong)" }}
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </motion.div>

      {/* Canvas at-a-glance */}
      <motion.div {...cardMotionProps} className="pulse-card p-4">
        <div className="flex items-center justify-between">
          <CardLabel>Your Lean Canvas</CardLabel>
          <span className="text-[11px] text-muted">tap the full canvas →</span>
        </div>
        <CanvasMiniMap cells={miniMapCells} />
        <CanvasMiniMapLegend className="mt-2.5" />
        <Link
          href={`/w/${code}/result/${pid}`}
          className="pulse-btn-secondary mt-3 flex w-full items-center justify-center px-4 py-2.5 text-xs"
        >
          Open your Lean Canvas
        </Link>
      </motion.div>

      {/* 7-day plan */}
      <motion.div {...cardMotionProps} className="pulse-card p-4">
        <CardLabel>Your 7-day plan</CardLabel>
        <ul className="flex flex-col">
          {result.sevenDayPlan.map((day, index) => (
            <li
              key={`${day.day}-${index}`}
              className="flex gap-2.5 border-b py-2.5 last:border-b-0 last:pb-0"
              style={{ borderColor: "var(--pulse-border)" }}
            >
              <span
                className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                style={{ background: DOT_COLORS[index % DOT_COLORS.length] }}
              />
              <div>
                <p className="text-sm leading-snug" style={{ color: "var(--pulse-text)" }}>
                  {day.text}
                </p>
                <p className="text-[11px] text-muted">{day.day}</p>
              </div>
            </li>
          ))}
        </ul>
      </motion.div>

      {/* AI recommendations feed */}
      {recommendations.length > 0 ? (
        <motion.div {...cardMotionProps} className="pulse-card p-4">
          <CardLabel>AI Cofounder · recommendations</CardLabel>
          <div className="flex flex-col gap-2">
            {recommendations.map((rec) => (
              <p
                key={rec.key}
                className="rounded-xl px-3 py-2.5 text-xs leading-relaxed"
                style={{
                  background: "color-mix(in srgb, var(--pulse-violet) 10%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--pulse-violet) 22%, transparent)",
                  color: "var(--pulse-text)",
                }}
              >
                <span className="font-semibold" style={{ color: "var(--pulse-violet)" }}>
                  {rec.label}:{" "}
                </span>
                {rec.text}
              </p>
            ))}
          </div>
        </motion.div>
      ) : null}

      {/* Bottom tab bar */}
      <nav
        className="sticky bottom-0 mt-2 flex items-center justify-around rounded-2xl border px-2 py-2.5 backdrop-blur-md"
        style={{
          background: "color-mix(in srgb, var(--background) 82%, transparent)",
          borderColor: "var(--pulse-border)",
        }}
      >
        <span className="flex flex-col items-center gap-1 text-[10px] font-semibold" style={{ color: "var(--pulse-kicker)" }}>
          <span aria-hidden="true">⌂</span>
          Home
        </span>
        <Link
          href={`/w/${code}/result/${pid}`}
          className="flex flex-col items-center gap-1 text-[10px] text-muted"
        >
          <span aria-hidden="true">◱</span>
          Canvas
        </Link>
        <Link
          href={`/w/${code}/result/${pid}`}
          className="flex flex-col items-center gap-1 text-[10px] text-muted"
        >
          <span aria-hidden="true">◉</span>
          Plan
        </Link>
      </nav>
    </div>
  );
}

export default FounderHome;
