"use client";

import { useState } from "react";
import { motion } from "motion/react";
import type { WorkshopStatus } from "@/db/schema";
import type { WorkshopSettings } from "@/db/queries/workshops";
import { ActionButton } from "@/components/ui/ActionButton";
import { resetAllPollsAction } from "@/app/(admin)/workshops/[id]/poll-actions";

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
  onChange: (next: boolean) => Promise<unknown> | unknown;
  disabled?: boolean;
}

function ToggleRow({ label, checked, onChange, disabled }: ToggleRowProps) {
  // Disables itself the instant it's tapped (before the async settings
  // update resolves) so rapid toggling can't queue conflicting writes.
  const [pending, setPending] = useState(false);
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-busy={pending || undefined}
        disabled={disabled || pending}
        onClick={async () => {
          if (pending) return;
          setPending(true);
          try {
            await onChange(!checked);
          } finally {
            setPending(false);
          }
        }}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          checked ? "bg-[linear-gradient(135deg,#8b5cf6,#f472b6)]" : "bg-surface-strong"
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
  const [confirmResetAll, setConfirmResetAll] = useState(false);

  async function changeStatus(next: WorkshopStatus) {
    setCurrentStatus(next);
    await onUpdateStatus(workshopId, next);
  }

  async function changeSettings(next: WorkshopSettings) {
    setCurrentSettings(next);
    await onUpdateSettings(workshopId, next);
  }

  async function handleResetAllClick() {
    if (!confirmResetAll) {
      setConfirmResetAll(true);
      return;
    }
    await resetAllPollsAction(workshopId);
    setConfirmResetAll(false);
  }

  return (
    <div className={`flex flex-col gap-5 ${className ?? ""}`}>
      <div>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Workshop status
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {currentStatus !== "live" ? (
            <ActionButton
              type="button"
              onAction={() => changeStatus("live")}
              pendingChildren="Opening…"
              className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(16,185,129,0.6)] transition-colors hover:bg-emerald-400 disabled:opacity-50"
            >
              Open workshop
            </ActionButton>
          ) : (
            <ActionButton
              type="button"
              onAction={() => changeStatus("closed")}
              pendingChildren="Closing…"
              className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(239,68,68,0.6)] transition-colors hover:bg-red-400 disabled:opacity-50"
            >
              Close workshop
            </ActionButton>
          )}
          <span className="text-sm text-muted">
            Current status:{" "}
            <span className="font-medium text-foreground">{STATUS_LABELS[currentStatus]}</span>
          </span>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Lean Canvas
        </h2>
        <div className="flex flex-col gap-2">
          <ToggleRow
            label="Unlock Lean Canvas"
            checked={currentSettings.canvasUnlocked}
            onChange={(next) => changeSettings({ ...currentSettings, canvasUnlocked: next })}
          />
          <ToggleRow
            label="AI Follow-up Questions"
            checked={currentSettings.probeEnabled}
            onChange={(next) => changeSettings({ ...currentSettings, probeEnabled: next })}
          />
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Projected views
        </h2>
        <div className="flex flex-col gap-2">
          <ToggleRow
            label="Dashboard"
            checked={currentSettings.liveViews.dashboard}
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
            onChange={(next) =>
              changeSettings({
                ...currentSettings,
                liveViews: { ...currentSettings.liveViews, progression: next },
              })
            }
          />
          <ToggleRow
            label="Leaderboard"
            checked={currentSettings.leaderboard}
            onChange={(next) => changeSettings({ ...currentSettings, leaderboard: next })}
          />
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Polls</h2>
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface px-4 py-3">
          <ActionButton
            type="button"
            onAction={handleResetAllClick}
            pendingChildren="Resetting…"
            className={`self-start rounded-full px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              confirmResetAll
                ? "bg-amber-500 text-white hover:bg-amber-400"
                : "pulse-btn-secondary"
            }`}
          >
            {confirmResetAll ? "Confirm reset all?" : "Reset all poll responses"}
          </ActionButton>
          <p className="text-xs text-muted">
            Clears every vote across all questions so you can re-run them.
          </p>
        </div>
      </div>
    </div>
  );
}

export default WorkshopControls;
