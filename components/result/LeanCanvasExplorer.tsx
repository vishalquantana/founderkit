"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  LEAN_CANVAS_BLOCKS,
  canvasCellTone,
  CANVAS_TONE_LABEL,
  type CanvasTone,
} from "@/lib/result-view";
import { DIMENSION_MAX } from "@/lib/readiness";
import { CanvasMiniMap, CanvasMiniMapLegend } from "@/components/result/CanvasMiniMap";
import {
  saveSectionAnswer,
  saveCanvasBlock,
  reevaluateParticipant,
} from "@/app/(participant)/w/[code]/actions";
import type { EvaluationResult } from "@/ai/schema";
import type { SectionKey } from "@/db/schema";

export interface LeanCanvasExplorerProps {
  result: EvaluationResult;
  answers: Record<SectionKey, string>;
  canvasExtras?: Record<string, string>;
  className?: string;
  editable?: boolean;
  participantId?: string;
}

/** Debounce window before a burst of section-block edits triggers one AI re-eval. */
const RESCORE_DEBOUNCE_MS = 2500;

/** Card pill classes per tone, readable in both light and dark. */
const PILL_TONE_CLASSES: Record<Exclude<CanvasTone, "empty">, string> = {
  good: "bg-green-500/15 text-green-700 border border-green-500/30 dark:text-green-300",
  "needs-work": "bg-amber-500/15 text-amber-700 border border-amber-500/30 dark:text-amber-300",
  bad: "bg-red-500/15 text-red-700 border border-red-500/30 dark:text-red-300",
};

/** A single editable Lean Canvas field — either backed by a questionnaire
 *  section (`source`) or a free-text canvas extra (stored by `key`). */
interface EditableField {
  key: string;
  title: string;
  helper: string;
  source: SectionKey | undefined;
  value: string | null;
}

interface ResolvedBlock {
  key: string;
  title: string;
  gridArea: string;
  main: EditableField;
  sub: EditableField | null;
  score: number | undefined;
  max: number | undefined;
  tone: CanvasTone;
  recommendations: string[] | undefined;
  fallbackFeedback: string | undefined;
}

function resolveFieldValue(
  key: string,
  source: SectionKey | undefined,
  pitchSource: boolean,
  answers: Record<SectionKey, string>,
  canvasExtras: Record<string, string> | undefined,
  result: EvaluationResult,
  overrides: Record<string, string>,
): string | null {
  const override = overrides[key];
  if (override !== undefined) return override.trim() || null;
  if (source) return (answers[source] ?? "").trim() || null;
  const extra = canvasExtras?.[key];
  if (extra != null && extra.trim()) return extra.trim();
  if (pitchSource) return result.improvedPitch?.trim() || null;
  return null;
}

function resolveBlock(
  block: (typeof LEAN_CANVAS_BLOCKS)[number],
  answers: Record<SectionKey, string>,
  canvasExtras: Record<string, string> | undefined,
  result: EvaluationResult,
  overrides: Record<string, string>,
): ResolvedBlock {
  const mainValue = resolveFieldValue(
    block.key,
    block.source,
    Boolean(block.pitchSource),
    answers,
    canvasExtras,
    result,
    overrides,
  );
  const score = block.dimension ? result.dimensionScores[block.dimension] : undefined;
  const max = block.dimension ? DIMENSION_MAX[block.dimension] : undefined;
  const recommendations = block.source ? result.sectionRecommendations?.[block.source] : undefined;
  const fallbackFeedback =
    !recommendations && block.source ? result.sectionFeedback?.[block.source] : undefined;

  const sub: EditableField | null = block.sub
    ? {
        key: block.sub.key,
        title: block.sub.title,
        helper: block.sub.helper,
        source: block.sub.source,
        value: resolveFieldValue(
          block.sub.key,
          block.sub.source,
          Boolean(block.sub.pitchSource),
          answers,
          canvasExtras,
          result,
          overrides,
        ),
      }
    : null;

  return {
    key: block.key,
    title: block.title,
    gridArea: block.gridArea,
    main: {
      key: block.key,
      title: block.title,
      helper: block.helper,
      source: block.source,
      value: mainValue,
    },
    sub,
    score,
    max,
    tone: canvasCellTone(Boolean(mainValue), score, max),
    recommendations,
    fallbackFeedback,
  };
}

/**
 * "Option B" — a colour-coded, tappable mini-map of the 9 Lean Canvas
 * blocks paired with a swipeable card carousel. Every block (and its
 * sub-block) is editable: section-backed blocks save via
 * `saveSectionAnswer`, template-only blocks via `saveCanvasBlock`
 * (stored in `participant.canvasExtras`).
 */
export function LeanCanvasExplorer({
  result,
  answers,
  canvasExtras,
  className,
  editable = false,
  participantId,
}: LeanCanvasExplorerProps) {
  const shouldReduceMotion = useReducedMotion();
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();
  const [rescoring, setRescoring] = useState(false);

  // Debounced, single-flight auto re-score after a section-block save.
  const rescoreTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rescoreInFlight = useRef(false);
  const rescorePending = useRef(false);

  const runRescore = useCallback(async () => {
    if (!participantId) return;
    if (rescoreInFlight.current) {
      // A run is already going; make sure another pass follows it.
      rescorePending.current = true;
      return;
    }
    rescoreInFlight.current = true;
    setRescoring(true);
    try {
      await reevaluateParticipant(participantId);
      router.refresh();
    } catch {
      // Re-scoring is a background nicety; the manual button remains a fallback.
    } finally {
      rescoreInFlight.current = false;
      if (rescorePending.current) {
        rescorePending.current = false;
        void runRescore();
      } else {
        setRescoring(false);
      }
    }
  }, [participantId, router]);

  const scheduleRescore = useCallback(() => {
    if (rescoreTimer.current) clearTimeout(rescoreTimer.current);
    rescoreTimer.current = setTimeout(() => {
      rescoreTimer.current = null;
      void runRescore();
    }, RESCORE_DEBOUNCE_MS);
  }, [runRescore]);

  useEffect(() => {
    return () => {
      if (rescoreTimer.current) clearTimeout(rescoreTimer.current);
    };
  }, []);

  const blocks = LEAN_CANVAS_BLOCKS.map((block) =>
    resolveBlock(block, answers, canvasExtras, result, overrides),
  );
  const active = blocks[index];
  const ratio =
    active.max && active.score !== undefined ? Math.min(1, Math.max(0, active.score / active.max)) : 0;
  const canEdit = editable && Boolean(participantId);

  function goTo(next: number) {
    const clamped = (next + blocks.length) % blocks.length;
    setDirection(clamped > index ? 1 : -1);
    setIndex(clamped);
    setEditingKey(null);
    setSaveError(null);
  }

  function startEditing(field: EditableField) {
    setDraft(field.value ?? "");
    setSaveError(null);
    setEditingKey(field.key);
  }

  function cancelEditing() {
    setEditingKey(null);
    setSaveError(null);
  }

  function saveEditing(field: EditableField) {
    if (!participantId) return;
    const value = draft;
    startSaving(async () => {
      try {
        if (field.source) {
          await saveSectionAnswer({ participantId, section: field.source, mainAnswer: value });
        } else {
          await saveCanvasBlock({ participantId, blockKey: field.key, text: value });
        }
        setOverrides((prev) => ({ ...prev, [field.key]: value }));
        setEditingKey(null);
        setSaveError(null);
        // Only section-backed blocks are scoring inputs — schedule a debounced
        // AI re-score. Extra blocks just flip colour optimistically (no AI).
        if (field.source) scheduleRescore();
      } catch {
        setSaveError("Couldn't save that change. Please try again.");
      }
    });
  }

  function renderFieldEditor(field: EditableField) {
    return (
      <div className="flex flex-col gap-2">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={5}
          className="pulse-input w-full resize-none p-3 text-sm leading-relaxed outline-none"
          placeholder={field.helper}
          disabled={isSaving}
          autoFocus
        />
        {saveError ? <p className="text-xs text-red-500">{saveError}</p> : null}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => saveEditing(field)}
            disabled={isSaving}
            className="pulse-btn px-3 py-1.5 text-xs disabled:opacity-60"
          >
            {isSaving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={cancelEditing}
            disabled={isSaving}
            className="pulse-btn-secondary px-3 py-1.5 text-xs disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Subtle, non-blocking auto re-score indicator. */}
      <AnimatePresence>
        {rescoring ? (
          <motion.div
            key="rescoring-pill"
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="mb-2 flex items-center justify-center"
            role="status"
            aria-live="polite"
          >
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium"
              style={{
                background: "var(--pulse-surface-strong)",
                border: "1px solid var(--pulse-border)",
                color: "var(--pulse-text)",
              }}
            >
              <svg
                className={shouldReduceMotion ? "h-3 w-3" : "h-3 w-3 animate-spin"}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Re-scoring your startup…
            </span>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Mini-map */}
      <CanvasMiniMap
        cells={blocks.map((block) => ({
          key: block.key,
          title: block.title,
          gridArea: block.gridArea,
          tone: block.tone,
        }))}
        activeIndex={index}
        onSelect={goTo}
      />

      {/* Legend */}
      <CanvasMiniMapLegend className="mt-2" />

      {/* Card */}
      <div className="pulse-card relative mt-3 overflow-hidden p-4">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={active.key}
            custom={direction}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: direction >= 0 ? 24 : -24 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: direction >= 0 ? -24 : 24 }}
            transition={shouldReduceMotion ? { duration: 0.15 } : { type: "spring", stiffness: 300, damping: 30 }}
            className="flex flex-col gap-3"
          >
            <div className="flex items-start justify-between gap-3">
              <h3
                className="text-sm font-semibold uppercase tracking-tight"
                style={{ color: "var(--pulse-text)" }}
              >
                {active.title}
              </h3>
              <div className="flex shrink-0 items-center gap-2">
                {active.tone !== "empty" ? (
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${PILL_TONE_CLASSES[active.tone]}`}
                  >
                    {CANVAS_TONE_LABEL[active.tone]}
                  </span>
                ) : null}
                {canEdit && editingKey !== active.main.key ? (
                  <button
                    type="button"
                    onClick={() => startEditing(active.main)}
                    className="pulse-btn-secondary px-2.5 py-1 text-[11px]"
                  >
                    Edit
                  </button>
                ) : null}
              </div>
            </div>

            {canEdit && editingKey === active.main.key ? (
              renderFieldEditor(active.main)
            ) : active.main.value ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: "var(--pulse-text)" }}>
                {active.main.value}
              </p>
            ) : (
              <p className="text-sm italic leading-relaxed text-muted">{active.main.helper}</p>
            )}

            {active.max !== undefined && active.score !== undefined ? (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>Score</span>
                  <span className="tabular-nums">
                    {active.score}/{active.max}
                  </span>
                </div>
                <div
                  className="h-2 w-full overflow-hidden rounded-full"
                  style={{ background: "var(--pulse-track)" }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "var(--pulse-gradient)" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${ratio * 100}%` }}
                    transition={
                      shouldReduceMotion
                        ? { duration: 0.2 }
                        : { type: "spring", stiffness: 120, damping: 18, delay: 0.05 }
                    }
                  />
                </div>
              </div>
            ) : null}

            {/* Sub-block (e.g. Existing Alternatives, High-Level Concept) */}
            {active.sub ? (
              <div
                className="flex flex-col gap-2 rounded-xl p-3"
                style={{ background: "var(--pulse-surface-strong)", border: "1px solid var(--pulse-border)" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-wide text-muted">
                    {active.sub.title}
                  </h4>
                  {canEdit && editingKey !== active.sub.key ? (
                    <button
                      type="button"
                      onClick={() => active.sub && startEditing(active.sub)}
                      className="pulse-btn-secondary px-2 py-0.5 text-[10px]"
                    >
                      Edit
                    </button>
                  ) : null}
                </div>
                {canEdit && editingKey === active.sub.key ? (
                  renderFieldEditor(active.sub)
                ) : active.sub.value ? (
                  <p
                    className="whitespace-pre-wrap text-xs leading-relaxed"
                    style={{ color: "var(--pulse-text)" }}
                  >
                    {active.sub.value}
                  </p>
                ) : (
                  <p className="text-xs italic leading-relaxed text-muted">{active.sub.helper}</p>
                )}
              </div>
            ) : null}

            {active.recommendations && active.recommendations.length > 0 ? (
              <div
                className="rounded-xl p-3"
                style={{ background: "var(--pulse-surface-strong)", border: "1px solid var(--pulse-border)" }}
              >
                <h4 className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-muted">
                  Recommendations
                </h4>
                <ul className="list-disc space-y-1 pl-4 text-xs leading-relaxed" style={{ color: "var(--pulse-text)" }}>
                  {active.recommendations.map((rec) => (
                    <li key={rec}>{rec}</li>
                  ))}
                </ul>
              </div>
            ) : active.fallbackFeedback ? (
              <p
                className="rounded-xl p-3 text-xs leading-relaxed"
                style={{
                  background: "var(--pulse-surface-strong)",
                  border: "1px solid var(--pulse-border)",
                  color: "var(--pulse-text)",
                }}
              >
                <span className="font-semibold">How to sharpen this → </span>
                {active.fallbackFeedback}
              </p>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Carousel controls */}
      <div className="mt-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          aria-label="Previous block"
          className="pulse-btn-secondary px-3 py-1.5 text-xs"
        >
          Prev
        </button>

        <div className="flex items-center gap-1.5" aria-hidden="true">
          {blocks.map((block, i) => (
            <span
              key={block.key}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === index ? 18 : 6,
                background: i === index ? "var(--pulse-kicker)" : "var(--pulse-border-strong)",
              }}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => goTo(index + 1)}
          aria-label="Next block"
          className="pulse-btn-secondary px-3 py-1.5 text-xs"
        >
          Next
        </button>
      </div>

      <p className="mt-2 text-center text-[11px] text-muted">
        {index + 1} of {blocks.length} · {active.title}
      </p>
    </div>
  );
}

export default LeanCanvasExplorer;
