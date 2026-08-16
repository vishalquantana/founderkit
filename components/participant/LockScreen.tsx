"use client";

import { useState } from "react";
import { ShieldAlert } from "lucide-react";

export interface LockScreenProps {
  code: string;
  participantId: string;
}

/**
 * Full-screen block shown to a locked-out participant on every founder
 * route. The only way out is entering the secret unlock keyword, which is
 * POSTed to the chat route (it already knows how to unlock a participant).
 */
export function LockScreen({ code, participantId }: LockScreenProps) {
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim() || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/w/${code}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId, message: value.trim() }),
      });

      if (res.ok) {
        const data = (await res.json()) as { locked?: boolean };
        if (data.locked === false) {
          location.reload();
          return;
        }
      }

      setError("That code didn't work. Try again.");
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <div className="pulse-card flex w-full max-w-sm flex-col items-center gap-4 p-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-500">
          <ShieldAlert className="h-7 w-7" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">Access paused</h1>
        <p className="text-sm leading-relaxed text-muted">
          ⚠️ This has been reported to the organizers.
        </p>

        <form onSubmit={handleSubmit} className="mt-2 flex w-full flex-col gap-3">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Enter unlock code"
            disabled={submitting}
            className="w-full rounded-xl border border-[var(--pulse-border)] bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          {error ? <p className="text-xs text-red-500">{error}</p> : null}
          <button
            type="submit"
            disabled={submitting || !value.trim()}
            className="pulse-btn w-full px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
          >
            {submitting ? "Checking…" : "Enter unlock code"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default LockScreen;
