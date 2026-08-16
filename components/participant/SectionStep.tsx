"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Chip } from "@/components/motion/Chip";
import type { Section } from "@/lib/sections";
import { saveSectionAnswer, probeSectionAction } from "@/app/(participant)/w/[code]/actions";
import { composeSectionAnswer } from "@/lib/section-answer";

const SUGGESTED_LENGTH = 40; // words — a gentle nudge, not a hard rule

export interface SectionStepProps {
  section: Section;
  initialValue?: string;
  isLast: boolean;
  participantId: string;
  probeEnabled: boolean;
  onAdvance: (value: string) => void;
  onAutosave: (value: string) => void;
}

/**
 * One question, one screen. Autosaves on textarea blur (debounced by the
 * parent's saveSectionAnswer call), and moves on with "Next" / "Finish".
 *
 * On "Next", the main answer is saved first, then (if the workshop has the
 * AI coach enabled) a probe request checks whether the answer is vague. If
 * so, the reserved slot below the textarea renders a follow-up question
 * with Answer / Skip actions — at most once per section — before advancing.
 */
export function SectionStep({
  section,
  initialValue,
  isLast,
  participantId,
  probeEnabled,
  onAdvance,
  onAutosave,
}: SectionStepProps) {
  const [value, setValue] = useState(initialValue ?? "");
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [probeQuestion, setProbeQuestion] = useState<string | null>(null);
  const [probeResolved, setProbeResolved] = useState(false);
  const [probeAnswerValue, setProbeAnswerValue] = useState("");
  const [probeSaving, setProbeSaving] = useState(false);
  const [selectedChip, setSelectedChip] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const composed = composeSectionAnswer(selectedChip, value);

  const isValid = selectedChip !== null || value.trim().length > 0;
  const wordCount = value.trim().length === 0 ? 0 : value.trim().split(/\s+/).length;

  function handleBlur() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (composed.trim().length > 0) onAutosave(composed);
    }, 400);
  }

  async function handleNext() {
    setTouched(true);
    if (!isValid || saving) return;

    setSaving(true);
    try {
      await saveSectionAnswer({ participantId, section: section.key, mainAnswer: composed });

      if (probeResolved || !probeEnabled) {
        onAdvance(composed);
        return;
      }

      const { question } = await probeSectionAction({
        section: section.key,
        mainAnswer: composed,
        probeEnabled,
      });

      if (question) {
        setProbeQuestion(question);
        return; // hold here for the AI Coach card; don't advance yet
      }

      setProbeResolved(true);
      onAdvance(composed);
    } finally {
      setSaving(false);
    }
  }

  async function handleProbeAnswer() {
    if (!probeQuestion || probeSaving) return;
    setProbeSaving(true);
    try {
      await saveSectionAnswer({
        participantId,
        section: section.key,
        mainAnswer: composed,
        probeQuestion,
        probeAnswer: probeAnswerValue.trim() || undefined,
      });
      setProbeResolved(true);
      onAdvance(composed);
    } finally {
      setProbeSaving(false);
    }
  }

  async function handleProbeSkip() {
    if (!probeQuestion || probeSaving) return;
    setProbeSaving(true);
    try {
      await saveSectionAnswer({
        participantId,
        section: section.key,
        mainAnswer: composed,
        probeQuestion,
      });
    } finally {
      // Skipping never blocks progress, even if the save is slow or fails.
      setProbeSaving(false);
      setProbeResolved(true);
      onAdvance(composed);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 240, damping: 26 }}
      className="flex flex-1 flex-col gap-5"
    >
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-xl font-extrabold tracking-tight text-foreground">{section.heading}</h1>
        <p className="text-sm leading-relaxed text-foreground">{section.mainQuestion}</p>
        {section.promptHelp && (
          <p className="text-xs leading-relaxed text-muted">{section.promptHelp}</p>
        )}
        {section.example && (
          <p className="rounded-xl bg-surface-strong p-3 text-xs italic leading-relaxed text-muted">
            e.g. {section.example}
          </p>
        )}
        {section.keyLine && (
          <p className="text-xs font-medium tracking-wide text-[#f472b6]">{section.keyLine}</p>
        )}
      </div>

      {section.chips && section.chips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {section.chips.map((chip) => (
            <Chip
              key={chip.value}
              selected={selectedChip === chip.label}
              onClick={() =>
                setSelectedChip((prev) => (prev === chip.label ? null : chip.label))
              }
            >
              {chip.label}
            </Chip>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleBlur}
          rows={6}
          disabled={probeQuestion !== null}
          placeholder={selectedChip ? "Add any detail (optional)…" : "Type your answer here…"}
          className="pulse-input w-full resize-none p-4 text-sm leading-relaxed outline-none disabled:opacity-60"
        />
        <div className="flex items-center justify-between text-xs text-muted">
          <span>Aim for around {SUGGESTED_LENGTH} words — a few honest sentences beat a polished paragraph.</span>
          <span className="tabular-nums">{wordCount}w</span>
        </div>
        {touched && !isValid && (
          <span className="text-xs text-rose-400">This field is required.</span>
        )}
      </div>

      {/* AI Coach probe card slot: a contextual follow-up question with
          Answer / Skip actions, shown at most once per section after the
          main answer is saved. */}
      <AnimatePresence>
        {probeQuestion && (
          <motion.div
            key="ai-coach-card"
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.98 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="pulse-card relative flex flex-col gap-3 overflow-hidden border-l-2 border-l-[#8b5cf6] p-4"
            style={{ boxShadow: "0 0 0 1px rgba(139,92,246,0.25), 0 20px 60px -20px rgba(139,92,246,0.55)" }}
          >
            <span className="pulse-kicker text-[#c4b5fd]">⚡ Quick follow-up from AI Coach</span>
            <p className="text-sm leading-relaxed text-foreground">{probeQuestion}</p>
            <textarea
              value={probeAnswerValue}
              onChange={(e) => setProbeAnswerValue(e.target.value)}
              rows={3}
              placeholder="Add a sentence or two (optional)…"
              className="pulse-input w-full resize-none p-3 text-sm leading-relaxed outline-none"
            />
            <div className="flex gap-2">
              <motion.button
                type="button"
                onClick={handleProbeAnswer}
                disabled={probeSaving}
                whileTap={{ scale: 0.97 }}
                className="pulse-btn flex-1 px-4 py-2.5 text-sm disabled:cursor-not-allowed"
              >
                Answer
              </motion.button>
              <motion.button
                type="button"
                onClick={handleProbeSkip}
                disabled={probeSaving}
                whileTap={{ scale: 0.97 }}
                className="pulse-btn-secondary flex-1 px-4 py-2.5 text-sm disabled:cursor-not-allowed"
              >
                Skip for now
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={handleNext}
        disabled={saving || probeQuestion !== null}
        whileTap={{ scale: 0.97 }}
        className="pulse-btn w-full px-5 py-3 disabled:cursor-not-allowed"
      >
        {isLast ? "Finish" : "Next"}
      </motion.button>
    </motion.div>
  );
}

export default SectionStep;
