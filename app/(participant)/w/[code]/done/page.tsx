"use client";

import { motion } from "motion/react";

/**
 * Landing spot right after "Finish". Plan 4 replaces this with the real
 * MVP Readiness Snapshot results (score, dimensions, 7-day plan, etc.);
 * for now it's a warm placeholder so the flow feels complete, not stuck.
 */
export default function DonePage() {
  return (
    <motion.main
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 240, damping: 26 }}
      className="flex flex-1 flex-col items-center justify-center gap-4 text-center"
    >
      <motion.div
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-8 w-8 text-indigo-500"
          aria-hidden="true"
        >
          <path d="M12 3v3" />
          <path d="M12 18v3" />
          <path d="M3 12h3" />
          <path d="M18 12h3" />
          <circle cx="12" cy="12" r="5" />
        </svg>
      </motion.div>
      <h1 className="text-xl font-semibold text-slate-800">Nice work — you&apos;re done!</h1>
      <p className="max-w-xs text-sm leading-relaxed text-slate-500">
        Your MVP Readiness Snapshot is being prepared. Hang tight while we pull your
        answers together.
      </p>
    </motion.main>
  );
}
