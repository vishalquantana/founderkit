"use client";

import { useState } from "react";
import Link from "next/link";
import { Send, CheckCircle2 } from "lucide-react";

export interface EscalationReplyProps {
  workshopId: string;
  escalationId: string;
  question: string;
  who: string;
  alreadyAnswered?: boolean;
  previousReply?: string | null;
}

/**
 * Standalone reply surface reached from the Slack "Reply & add to FAQ" button.
 * Submitting posts to the same answer endpoint the Chats tab uses, so the
 * reply is delivered to the founder and written to the workshop FAQ.
 */
export function EscalationReply({
  workshopId,
  escalationId,
  question,
  who,
  alreadyAnswered = false,
  previousReply,
}: EscalationReplyProps) {
  const [reply, setReply] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const presenterReply = reply.trim();
    if (!presenterReply || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/workshops/${workshopId}/escalations/${escalationId}/answer`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ presenterReply }),
        },
      );
      if (!res.ok) throw new Error("failed");
      setDone(true);
    } catch {
      setError("Couldn't send — try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done || alreadyAnswered) {
    return (
      <div className="pulse-card flex flex-col items-center gap-3 p-6 text-center">
        <CheckCircle2 className="h-10 w-10 text-green-500" />
        <h2 className="text-lg font-semibold text-foreground">
          {done ? "Sent — and added to the FAQ" : "Already answered"}
        </h2>
        <p className="text-sm text-muted">
          {done
            ? "Your reply reached the founder and now trains Vamshi.AI for the next founder."
            : "This question was already answered."}
        </p>
        {alreadyAnswered && previousReply ? (
          <p className="rounded-xl bg-surface-strong px-3 py-2 text-left text-sm text-foreground">
            {previousReply}
          </p>
        ) : null}
        <Link href={`/workshops/${workshopId}`} className="pulse-btn-secondary mt-1 px-4 py-2 text-sm">
          Back to workshop
        </Link>
      </div>
    );
  }

  return (
    <div className="pulse-card p-6">
      <p className="text-xs font-semibold text-muted">{who} asked Vamshi.AI</p>
      <p className="mt-1 text-lg font-semibold text-foreground">{question}</p>
      <div className="mt-4 flex flex-col gap-3">
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          rows={4}
          autoFocus
          placeholder="Reply as Vamshi — this reaches the founder and is added to the FAQ…"
          className="w-full rounded-xl border border-[var(--pulse-border)] bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        {error ? <p className="text-xs text-red-500">{error}</p> : null}
        <button
          type="button"
          onClick={submit}
          disabled={!reply.trim() || submitting}
          className="pulse-btn inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
        >
          <Send className="h-4 w-4" />
          {submitting ? "Sending…" : "Send answer & add to FAQ"}
        </button>
      </div>
    </div>
  );
}

export default EscalationReply;
