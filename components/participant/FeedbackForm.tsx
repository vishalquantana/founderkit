"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquareHeart, CheckCircle2, Send, Sparkles } from "lucide-react";
import { submitFeedbackAction } from "@/app/(participant)/w/[code]/feedback-actions";
import type { FeedbackSubmission } from "@/db/queries/feedback";

export interface FeedbackFormProps {
  code: string;
  pid: string;
  founderName: string;
  startupName: string;
  initialSubmission?: FeedbackSubmission | null;
}

const Q1_OPTIONS = [
  "Very useful",
  "Useful",
  "Somewhat useful",
  "Not very useful",
];

const Q2_OPTIONS = [
  "Founder stories / practical examples",
  "Lean Canvas activity",
  "AI Co-founder / MVP Readiness tool",
  "Distribution and growth planning",
  "ICP discussion Customer validation / Mom Test discussion",
  "Other",
];

const Q3_OPTIONS = [
  "Yes, clearly",
  "Somewhat",
  "Not really",
  "Not applicable",
];

const Q4_OPTIONS = [
  "Very useful",
  "Useful",
  "Needs improvement",
  "I did not use it",
];

const Q7_OPTIONS = [
  "Yes",
  "Maybe",
  "No",
];

export function FeedbackForm({
  code,
  pid,
  founderName,
  startupName,
  initialSubmission,
}: FeedbackFormProps) {
  const router = useRouter();
  const [submitted, setSubmitted] = useState<boolean>(Boolean(initialSubmission));
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [q1, setQ1] = useState(initialSubmission?.q1Usefulness ?? "");
  const [q2, setQ2] = useState(initialSubmission?.q2MostValuable ?? "");
  const [q2OtherText, setQ2OtherText] = useState("");
  const [q3, setQ3] = useState(initialSubmission?.q3IdentifiedAssumptions ?? "");
  const [q4, setQ4] = useState(initialSubmission?.q4AiToolUsefulness ?? "");
  const [q5, setQ5] = useState(initialSubmission?.q5Next7DaysAction ?? "");
  const [q6, setQ6] = useState(initialSubmission?.q6Suggestions ?? "");
  const [q7, setQ7] = useState(initialSubmission?.q7FollowupInterest ?? "");
  const [q7Contact, setQ7Contact] = useState(initialSubmission?.q7ContactInfo ?? "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const finalQ2 = q2 === "Other" ? `Other: ${q2OtherText}` : q2;

    if (!q1 || !finalQ2 || !q3 || !q4 || !q5.trim() || !q7) {
      setErrorMsg("Please answer all required questions before submitting.");
      return;
    }

    setLoading(true);

    try {
      await submitFeedbackAction({
        participantId: pid,
        q1Usefulness: q1,
        q2MostValuable: finalQ2,
        q3IdentifiedAssumptions: q3,
        q4AiToolUsefulness: q4,
        q5Next7DaysAction: q5.trim(),
        q6Suggestions: q6.trim() || undefined,
        q7FollowupInterest: q7,
        q7ContactInfo: q7Contact.trim() || undefined,
      });

      setSubmitted(true);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to submit feedback.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center justify-center py-16 px-4 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Thank You for Your Feedback!
        </h1>
        <p className="mt-2 text-sm text-muted">
          Your input helps us improve the workshop and AI Cofounder tool experience for future founders.
        </p>

        <button
          type="button"
          onClick={() => router.push(`/w/${code}/home/${pid}`)}
          className="pulse-btn mt-8 inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold"
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 rounded-2xl border border-[var(--pulse-border)] bg-card p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <MessageSquareHeart className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Workshop Feedback Form</h1>
            <p className="text-xs text-muted">Help us shape better sessions for early-stage founders</p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-600 dark:text-red-400 font-medium">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Q1 */}
        <div className="rounded-2xl border border-[var(--pulse-border)] bg-card p-5">
          <label className="block text-sm font-semibold text-foreground mb-3">
            1. How useful was today&apos;s session in helping you think about your startup&apos;s MVP? *
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            {Q1_OPTIONS.map((opt) => (
              <label
                key={opt}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-xs transition-colors ${
                  q1 === opt
                    ? "border-purple-500 bg-purple-500/10 font-semibold text-foreground"
                    : "border-[var(--pulse-border)] bg-background text-muted hover:border-purple-500/40"
                }`}
              >
                <input
                  type="radio"
                  name="q1"
                  value={opt}
                  checked={q1 === opt}
                  onChange={(e) => setQ1(e.target.value)}
                  className="text-purple-600 focus:ring-purple-500"
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Q2 */}
        <div className="rounded-2xl border border-[var(--pulse-border)] bg-card p-5">
          <label className="block text-sm font-semibold text-foreground mb-3">
            2. Which part of the session was most valuable for you? *
          </label>
          <div className="space-y-2">
            {Q2_OPTIONS.map((opt) => (
              <label
                key={opt}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-xs transition-colors ${
                  q2 === opt
                    ? "border-purple-500 bg-purple-500/10 font-semibold text-foreground"
                    : "border-[var(--pulse-border)] bg-background text-muted hover:border-purple-500/40"
                }`}
              >
                <input
                  type="radio"
                  name="q2"
                  value={opt}
                  checked={q2 === opt}
                  onChange={(e) => setQ2(e.target.value)}
                  className="text-purple-600 focus:ring-purple-500"
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
          {q2 === "Other" && (
            <input
              type="text"
              placeholder="Please specify..."
              value={q2OtherText}
              onChange={(e) => setQ2OtherText(e.target.value)}
              className="mt-3 w-full rounded-xl border border-[var(--pulse-border)] bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          )}
        </div>

        {/* Q3 */}
        <div className="rounded-2xl border border-[var(--pulse-border)] bg-card p-5">
          <label className="block text-sm font-semibold text-foreground mb-3">
            3. Did the session help you identify any assumptions or risks in your startup idea that you had not considered earlier? *
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            {Q3_OPTIONS.map((opt) => (
              <label
                key={opt}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-xs transition-colors ${
                  q3 === opt
                    ? "border-purple-500 bg-purple-500/10 font-semibold text-foreground"
                    : "border-[var(--pulse-border)] bg-background text-muted hover:border-purple-500/40"
                }`}
              >
                <input
                  type="radio"
                  name="q3"
                  value={opt}
                  checked={q3 === opt}
                  onChange={(e) => setQ3(e.target.value)}
                  className="text-purple-600 focus:ring-purple-500"
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Q4 */}
        <div className="rounded-2xl border border-[var(--pulse-border)] bg-card p-5">
          <label className="block text-sm font-semibold text-foreground mb-3">
            4. How useful was the AI Co-founder / MVP Readiness Snapshot tool? *
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            {Q4_OPTIONS.map((opt) => (
              <label
                key={opt}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-xs transition-colors ${
                  q4 === opt
                    ? "border-purple-500 bg-purple-500/10 font-semibold text-foreground"
                    : "border-[var(--pulse-border)] bg-background text-muted hover:border-purple-500/40"
                }`}
              >
                <input
                  type="radio"
                  name="q4"
                  value={opt}
                  checked={q4 === opt}
                  onChange={(e) => setQ4(e.target.value)}
                  className="text-purple-600 focus:ring-purple-500"
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Q5 */}
        <div className="rounded-2xl border border-[var(--pulse-border)] bg-card p-5">
          <label className="block text-sm font-semibold text-foreground mb-2">
            5. What is one action you plan to take in the next 7 days after this session? *
          </label>
          <textarea
            rows={3}
            placeholder="e.g. Conduct 3 user interviews, test our pricing model..."
            value={q5}
            onChange={(e) => setQ5(e.target.value)}
            className="w-full rounded-xl border border-[var(--pulse-border)] bg-background p-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Q6 */}
        <div className="rounded-2xl border border-[var(--pulse-border)] bg-card p-5">
          <label className="block text-sm font-semibold text-foreground mb-2">
            6. Any suggestions to improve this workshop or the AI tool?
          </label>
          <textarea
            rows={3}
            placeholder="Share your thoughts or ideas..."
            value={q6}
            onChange={(e) => setQ6(e.target.value)}
            className="w-full rounded-xl border border-[var(--pulse-border)] bg-background p-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Q7 */}
        <div className="rounded-2xl border border-[var(--pulse-border)] bg-card p-5">
          <label className="block text-sm font-semibold text-foreground mb-3">
            7. Would you like a follow-up session or deeper review of your startup&apos;s MVP / growth plan? *
          </label>
          <div className="grid gap-2 sm:grid-cols-3">
            {Q7_OPTIONS.map((opt) => (
              <label
                key={opt}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-xs transition-colors ${
                  q7 === opt
                    ? "border-purple-500 bg-purple-500/10 font-semibold text-foreground"
                    : "border-[var(--pulse-border)] bg-background text-muted hover:border-purple-500/40"
                }`}
              >
                <input
                  type="radio"
                  name="q7"
                  value={opt}
                  checked={q7 === opt}
                  onChange={(e) => setQ7(e.target.value)}
                  className="text-purple-600 focus:ring-purple-500"
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>

          {(q7 === "Yes" || q7 === "Maybe") && (
            <div className="mt-3">
              <label className="block text-xs text-muted mb-1">
                Preferred phone or email contact (optional):
              </label>
              <input
                type="text"
                placeholder="Phone or email address..."
                value={q7Contact}
                onChange={(e) => setQ7Contact(e.target.value)}
                className="w-full rounded-xl border border-[var(--pulse-border)] bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="pulse-btn flex w-full items-center justify-center gap-2 py-3 text-sm font-semibold shadow-lg disabled:opacity-60"
        >
          <Send className="h-4 w-4" />
          {loading ? "Submitting Feedback..." : "Submit Feedback"}
        </button>
      </form>
    </div>
  );
}
