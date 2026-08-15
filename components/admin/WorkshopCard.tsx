"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { QrPoster } from "@/components/admin/QrPoster";
import type { WorkshopStatus } from "@/db/schema";

export interface WorkshopCardProps {
  id: string;
  name: string;
  status: WorkshopStatus;
  joinCode: string;
  participantCount: number;
  index?: number;
}

const STATUS_STYLES: Record<WorkshopStatus, string> = {
  draft: "border-amber-200 bg-amber-50 text-amber-700",
  live: "border-emerald-200 bg-emerald-50 text-emerald-700",
  closed: "border-slate-200 bg-slate-100 text-slate-600",
};

const STATUS_LABELS: Record<WorkshopStatus, string> = {
  draft: "Draft",
  live: "Live",
  closed: "Closed",
};

function getJoinUrl(joinCode: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/w/${joinCode}`;
}

export function WorkshopCard({ id, name, status, joinCode, participantCount, index = 0 }: WorkshopCardProps) {
  const [showQr, setShowQr] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 26, delay: index * 0.05 }}
      className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <Link href={`/workshops/${id}`} className="font-semibold text-slate-900 hover:text-indigo-600">
          {name}
        </Link>
        <span
          className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
        >
          {STATUS_LABELS[status]}
        </span>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Participants</p>
          <AnimatedNumber value={participantCount} className="text-2xl font-semibold text-slate-900" />
        </div>
        <div className="text-right">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Join code</p>
          <p className="font-mono text-lg font-semibold tracking-widest text-slate-700">{joinCode}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowQr((v) => !v)}
          className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:border-indigo-200 hover:bg-indigo-50/60"
        >
          {showQr ? "Hide QR" : "Show QR"}
        </button>
        <Link
          href={`/workshops/${id}`}
          className="flex-1 rounded-lg bg-slate-900 px-3 py-1.5 text-center text-sm font-medium text-white transition-colors hover:bg-slate-800"
        >
          Open
        </Link>
      </div>

      <AnimatePresence initial={false}>
        {showQr && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <QrPoster joinUrl={getJoinUrl(joinCode)} joinCode={joinCode} workshopName={name} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default WorkshopCard;
