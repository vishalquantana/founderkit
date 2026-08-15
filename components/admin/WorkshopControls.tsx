"use client";

import { useState, useTransition } from "react";
import { motion } from "motion/react";
import type { WorkshopStatus } from "@/db/schema";
import type { WorkshopSettings } from "@/db/queries/workshops";

export interface WorkshopControlsProps {
  workshopId: string;
  status: WorkshopStatus;
  settings: WorkshopSettings;
  onUpdateStatus: (id: string, status: WorkshopStatus) => Promise<void>;
  onUpdateSettings: (id: string, settings: WorkshopSettings) => Promise<void>;
  className?: string;
}

const STATUS_LABELS: Record<WorkshopStatus, string> = {
  draft: "Draft",
  live: "Live",
  closed: "Closed",
};

interface ToggleRowProps {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}

function ToggleRow({ label, checked, onChange, disabled }: ToggleRowProps) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm">
      <span className="font-medium text-slate-600">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          checked ? "bg-indigo-500" : "bg-slate-200"
        }`}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 32 }}
          className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow"
          style={{ x: checked ? 20 : 0 }}
        />
      </button>
    </label>
  );
}

/**
 * Presenter-facing workshop controls: open/close status and the toggles
 * that drive what participants and the presentation screen show live.
 * Soft, positive styling throughout — the only red is the destructive
 * "Close workshop" action.
 */
export function WorkshopControls({
  workshopId,
  status,
  settings,
  onUpdateStatus,
  onUpdateSettings,
  className,
}: WorkshopControlsProps) {
  const [currentStatus, setCurrentStatus] = useState(status);
  const [currentSettings, setCurrentSettings] = useState(settings);
  const [isPending, startTransition] = useTransition();

  function changeStatus(next: WorkshopStatus) {
    setCurrentStatus(next);
    startTransition(async () => {
      await onUpdateStatus(workshopId, next);
    });
  }

  function changeSettings(next: WorkshopSettings) {
    setCurrentSettings(next);
    startTransition(async () => {
      await onUpdateSettings(workshopId, next);
    });
  }

  return (
    <div className={`flex flex-col gap-5 ${className ?? ""}`}>
      <div>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Workshop status
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {currentStatus !== "live" ? (
            <button
              type="button"
              disabled={isPending}
              onClick={() => changeStatus("live")}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-600 disabled:opacity-50"
            >
              Open workshop
            </button>
          ) : (
            <button
              type="button"
              disabled={isPending}
              onClick={() => changeStatus("closed")}
              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-600 disabled:opacity-50"
            >
              Close workshop
            </button>
          )}
          <span className="text-sm text-slate-400">
            Current status: <span className="font-medium text-slate-600">{STATUS_LABELS[currentStatus]}</span>
          </span>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Live views
        </h2>
        <div className="flex flex-col gap-2">
          <ToggleRow
            label="Dashboard"
            checked={currentSettings.liveViews.dashboard}
            disabled={isPending}
            onChange={(next) =>
              changeSettings({
                ...currentSettings,
                liveViews: { ...currentSettings.liveViews, dashboard: next },
              })
            }
          />
          <ToggleRow
            label="Word cloud"
            checked={currentSettings.liveViews.wordCloud}
            disabled={isPending}
            onChange={(next) =>
              changeSettings({
                ...currentSettings,
                liveViews: { ...currentSettings.liveViews, wordCloud: next },
              })
            }
          />
          <ToggleRow
            label="Progression"
            checked={currentSettings.liveViews.progression}
            disabled={isPending}
            onChange={(next) =>
              changeSettings({
                ...currentSettings,
                liveViews: { ...currentSettings.liveViews, progression: next },
              })
            }
          />
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Other settings
        </h2>
        <div className="flex flex-col gap-2">
          <ToggleRow
            label="Leaderboard"
            checked={currentSettings.leaderboard}
            disabled={isPending}
            onChange={(next) => changeSettings({ ...currentSettings, leaderboard: next })}
          />
          <ToggleRow
            label="Probe questions"
            checked={currentSettings.probeEnabled}
            disabled={isPending}
            onChange={(next) => changeSettings({ ...currentSettings, probeEnabled: next })}
          />
        </div>
      </div>
    </div>
  );
}

export default WorkshopControls;
