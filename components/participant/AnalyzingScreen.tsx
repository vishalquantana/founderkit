"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

const STATUS_MESSAGES = [
  "Reading your answers…",
  "Analyzing your problem & customer…",
  "Evaluating your MVP…",
  "Weighing distribution & proof…",
  "Scoring your readiness…",
  "Building your Lean Canvas…",
  "Drafting your 7-day plan…",
] as const;

const MESSAGE_INTERVAL_MS = 3500;
// Eases 0 -> ~95% over ~30s, then holds — never claims completion until the
// caller actually redirects (the whole point: no dead-looking finish state).
const PROGRESS_DURATION_MS = 30_000;
const PROGRESS_TARGET = 95;

/**
 * Full-screen "analyzing your startup" experience shown while `Finish`
 * awaits the AI evaluation (~up to 30s). Cycles reassuring status copy and
 * eases a progress bar toward (but never to) completion so the wait feels
 * intentional instead of frozen. Theme-aware; static under reduced-motion.
 */
export function AnalyzingScreen() {
  const shouldReduceMotion = useReducedMotion();
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setMessageIndex((i) => Math.min(i + 1, STATUS_MESSAGES.length - 1));
    }, MESSAGE_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (shouldReduceMotion) {
      setProgress(PROGRESS_TARGET);
      return;
    }
    const start = Date.now();
    const id = setInterval(() => {
      const elapsed = Date.now() - start;
      // Ease-out toward the target so it feels like it's always "making
      // progress" without ever visually finishing.
      const t = Math.min(elapsed / PROGRESS_DURATION_MS, 1);
      const eased = 1 - Math.pow(1 - t, 2);
      setProgress(Math.min(eased * PROGRESS_TARGET, PROGRESS_TARGET));
    }, 100);
    return () => clearInterval(id);
  }, [shouldReduceMotion]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-background px-6 text-center"
    >
      <div className="relative flex h-24 w-24 items-center justify-center">
        {!shouldReduceMotion ? (
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 rounded-full"
            style={{ background: "var(--pulse-gradient)" }}
            animate={{ scale: [0.85, 1.05, 0.85], opacity: [0.55, 0.9, 0.55] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          />
        ) : (
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-full opacity-70"
            style={{ background: "var(--pulse-gradient)" }}
          />
        )}
        <div className="absolute inset-2 rounded-full bg-background" />
        {!shouldReduceMotion ? (
          <motion.div
            aria-hidden="true"
            className="absolute inset-3 rounded-full border-2 border-transparent"
            style={{ borderTopColor: "#8b5cf6", borderRightColor: "#f472b6" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
          />
        ) : null}
      </div>

      <div className="flex flex-col items-center gap-2">
        <p className="pulse-kicker">Quantana AI Cofounder</p>
        <h1 className="font-display text-gradient text-xl font-bold">Analyzing your startup</h1>
        <p key={messageIndex} className="min-h-[1.5rem] text-sm text-muted">
          {STATUS_MESSAGES[messageIndex]}
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-2">
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface">
          <div
            className="h-full rounded-full"
            style={{
              width: `${progress}%`,
              background: "var(--pulse-gradient)",
              transition: shouldReduceMotion ? undefined : "width 0.15s linear",
            }}
          />
        </div>
        <p className="text-xs text-muted">This usually takes under 30 seconds.</p>
      </div>
    </div>
  );
}

export default AnalyzingScreen;
