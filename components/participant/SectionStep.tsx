"use client";

import { useRef, useState } from "react";
import { motion } from "motion/react";
import { Chip } from "@/components/motion/Chip";
import type { Section } from "@/lib/sections";

const SUGGESTED_LENGTH = 40; // words — a gentle nudge, not a hard rule

export interface SectionStepProps {
  section: Section;
  initialValue?: string;
  isLast: boolean;
  onNext: (value: string) => void;
  onAutosave: (value: string) => void;
}

/**
 * One question, one screen. Autosaves on textarea blur (debounced by the
 * parent's saveSectionAnswer call), and moves on with "Next" / "Finish".
 *
 * The bordered slot below the textarea is reserved for Plan 3's AI Coach
 * probe card (a contextual follow-up question with Answer / Skip). Not
 * built yet — left as visible breathing room so the layout doesn't shift
 * when it lands.
 */
export function SectionStep({ section, initialValue, isLast, onNext, onAutosave }: SectionStepProps) {
  const [value, setValue] = useState(initialValue ?? "");
  const [touched, setTouched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isValid = value.trim().length > 0;
  const wordCount = value.trim().length === 0 ? 0 : value.trim().split(/\s+/).length;

  function handleBlur() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (value.trim().length > 0) onAutosave(value);
    }, 400);
  }

  function handleNext() {
    setTouched(true);
    if (!isValid) return;
    onNext(value);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 240, damping: 26 }}
      className="flex flex-1 flex-col gap-5"
    >
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-xl font-extrabold tracking-tight text-[#ECEAF6]">{section.heading}</h1>
        <p className="text-sm leading-relaxed text-[#ECEAF6]">{section.mainQuestion}</p>
        {section.promptHelp && (
          <p className="text-xs leading-relaxed text-[#A9A9C9]">{section.promptHelp}</p>
        )}
        {section.example && (
          <p className="rounded-xl bg-white/5 p-3 text-xs italic leading-relaxed text-[#A9A9C9]">
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
            <Chip key={chip.value} className="pointer-events-none opacity-70">
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
          placeholder="Type your answer here…"
          className="pulse-input w-full resize-none p-4 text-sm leading-relaxed outline-none"
        />
        <div className="flex items-center justify-between text-xs text-[#A9A9C9]">
          <span>Aim for around {SUGGESTED_LENGTH} words — a few honest sentences beat a polished paragraph.</span>
          <span className="tabular-nums">{wordCount}w</span>
        </div>
        {touched && !isValid && (
          <span className="text-xs text-rose-400">This field is required.</span>
        )}
      </div>

      {/* AI Coach probe card slot (Plan 3): a contextual follow-up question
          with Answer / Skip actions will render here once the response is
          saved. Intentionally left empty for now. */}
      <div className="pulse-card border-l-2 border-l-[#8b5cf6] p-4 text-center text-xs text-[#A9A9C9]">
        AI Coach follow-up coming soon
      </div>

      <motion.button
        type="button"
        onClick={handleNext}
        whileTap={{ scale: 0.97 }}
        className="pulse-btn w-full px-5 py-3"
      >
        {isLast ? "Finish" : "Next"}
      </motion.button>
    </motion.div>
  );
}

export default SectionStep;
