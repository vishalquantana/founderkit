"use client";

import { useState } from "react";
import { motion } from "motion/react";

export interface ConsentGateProps {
  consentText: string;
  onStart?: () => void;
}

/**
 * The founder's first screen after scanning the workshop QR code.
 * Shows the snapshot pitch, the workshop's consent disclaimer, and a
 * required checkbox that unlocks "Start Snapshot".
 *
 * The full multi-step wizard is wired up in a later task; for now,
 * starting just swaps in a lightweight "Starting…" placeholder.
 */
export function ConsentGate({ consentText, onStart }: ConsentGateProps) {
  const [consented, setConsented] = useState(false);
  const [started, setStarted] = useState(false);

  function handleStart() {
    if (!consented) return;
    setStarted(true);
    onStart?.();
  }

  if (started) {
    return (
      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        className="flex flex-1 flex-col items-center justify-center gap-3 text-center"
      >
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-300 border-t-amber-500" />
        <p className="text-sm font-medium text-slate-500">Starting your snapshot…</p>
      </motion.main>
    );
  }

  return (
    <motion.main
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 240, damping: 26 }}
      className="flex flex-1 flex-col justify-center gap-6"
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium tracking-wide text-amber-700">
          5-minute check-in
        </span>
        <h1 className="text-2xl font-semibold text-slate-800">MVP Readiness Snapshot</h1>
        <p className="text-base text-slate-600">
          Find your next best MVP move in 5 minutes.
        </p>
        <p className="text-sm leading-relaxed text-slate-400">
          This is not an exam. The goal is to help you identify what to validate before
          building too much.
        </p>
      </div>

      <div className="rounded-2xl border border-amber-100 bg-white/70 p-4 shadow-sm">
        <p className="text-xs leading-relaxed text-slate-500">{consentText}</p>
      </div>

      <label className="flex items-start gap-3 rounded-xl bg-white/60 p-3 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={consented}
          onChange={(e) => setConsented(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
        />
        <span>I understand and agree to continue.</span>
      </label>

      <motion.button
        type="button"
        onClick={handleStart}
        disabled={!consented}
        whileTap={consented ? { scale: 0.97 } : undefined}
        className="w-full rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-150 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
      >
        Start Snapshot
      </motion.button>
    </motion.main>
  );
}

export default ConsentGate;
