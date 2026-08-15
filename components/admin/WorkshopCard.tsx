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
  draft: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  live: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  closed: "border-white/15 bg-white/5 text-[#A9A9C9]",
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
      className="pulse-card flex flex-col gap-4 p-5 transition-shadow hover:shadow-[0_24px_70px_-30px_rgba(139,92,246,0.5)]"
    >
      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/workshops/${id}`}
          className="font-display font-semibold text-[#ECEAF6] transition-colors hover:text-gradient"
        >
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
          <p className="text-xs font-medium uppercase tracking-wide text-[#A9A9C9]">Participants</p>
          <AnimatedNumber
            value={participantCount}
            className="font-display text-gradient text-2xl font-bold"
          />
        </div>
        <div className="text-right">
          <p className="text-xs font-medium uppercase tracking-wide text-[#A9A9C9]">Join code</p>
          <p className="font-mono text-lg font-semibold tracking-widest text-[#ECEAF6]">{joinCode}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setShowQr((v) => !v)} className="pulse-btn-secondary flex-1 px-3 py-1.5 text-sm">
          {showQr ? "Hide QR" : "Show QR"}
        </button>
        <Link href={`/workshops/${id}`} className="pulse-btn flex-1 px-3 py-1.5 text-center text-sm">
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
