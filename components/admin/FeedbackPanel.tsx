"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  MessageSquareHeart,
  Star,
  Users,
  Sparkles,
  Search,
  CheckCircle2,
  Calendar,
  Mail,
  Lightbulb,
  ArrowRight,
  TrendingUp,
  HelpCircle,
} from "lucide-react";

export interface FeedbackPanelProps {
  workshopId: string;
}

export interface FeedbackItem {
  id: string;
  participantId: string;
  founderName: string;
  startupName: string;
  contact: string;
  mobile: string | null;
  q1Usefulness: string;
  q2MostValuable: string;
  q3IdentifiedAssumptions: string;
  q4AiToolUsefulness: string;
  q5Next7DaysAction: string;
  q6Suggestions: string | null;
  q7FollowupInterest: string;
  q7ContactInfo: string | null;
  createdAt: number;
}

interface FeedbackResponse {
  feedback: FeedbackItem[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function FeedbackPanel({ workshopId }: FeedbackPanelProps) {
  const { data, isLoading } = useSWR<FeedbackResponse>(
    `/api/workshops/${workshopId}/feedback`,
    fetcher,
    { refreshInterval: 5000, revalidateOnFocus: true },
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterUseful, setFilterUseful] = useState<string>("all");

  const list = data?.feedback ?? [];

  const filtered = list.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      item.founderName.toLowerCase().includes(q) ||
      item.startupName.toLowerCase().includes(q) ||
      (item.q5Next7DaysAction && item.q5Next7DaysAction.toLowerCase().includes(q)) ||
      (item.q6Suggestions && item.q6Suggestions.toLowerCase().includes(q)) ||
      (item.contact && item.contact.toLowerCase().includes(q));

    const matchesUseful =
      filterUseful === "all" || item.q1Usefulness.toLowerCase().includes(filterUseful.toLowerCase());

    return matchesSearch && matchesUseful;
  });

  const selectedItem = list.find((item) => item.id === selectedId) || filtered[0] || null;

  // Key stats
  const totalCount = list.length;
  const veryUsefulCount = list.filter(
    (f) => f.q1Usefulness.toLowerCase().includes("very useful") || f.q1Usefulness.toLowerCase() === "useful",
  ).length;
  const followupCount = list.filter((f) => f.q7FollowupInterest.toLowerCase() === "yes").length;

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header & Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="pulse-card flex items-center gap-3.5 p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/15 text-purple-500">
            <MessageSquareHeart className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Total Responses</p>
            <p className="font-display text-2xl font-black text-foreground">{totalCount}</p>
          </div>
        </div>

        <div className="pulse-card flex items-center gap-3.5 p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Positive Rating</p>
            <p className="font-display text-2xl font-black text-foreground">
              {totalCount > 0 ? `${Math.round((veryUsefulCount / totalCount) * 100)}%` : "—"}
            </p>
          </div>
        </div>

        <div className="pulse-card flex items-center gap-3.5 p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Wants Follow-up</p>
            <p className="font-display text-2xl font-black text-foreground">{followupCount}</p>
          </div>
        </div>
      </div>

      {/* Main Split Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        {/* Left Submissions List */}
        <div className="flex flex-col gap-3">
          {/* Filter / Search Bar */}
          <div className="flex flex-col gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-muted" />
              <input
                type="text"
                placeholder="Search founder, idea, answer…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-[var(--pulse-border)] bg-surface py-2 pr-3 pl-9 text-xs text-foreground placeholder:text-muted focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                type="button"
                onClick={() => setFilterUseful("all")}
                className={`shrink-0 rounded-lg px-2.5 py-1 font-semibold transition ${
                  filterUseful === "all"
                    ? "bg-surface-strong text-foreground shadow-xs"
                    : "text-muted hover:text-foreground"
                }`}
              >
                All ({list.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterUseful("very")}
                className={`shrink-0 rounded-lg px-2.5 py-1 font-semibold transition ${
                  filterUseful === "very"
                    ? "bg-emerald-500/20 text-emerald-400 font-bold"
                    : "text-muted hover:text-foreground"
                }`}
              >
                Very Useful
              </button>
              <button
                type="button"
                onClick={() => setFilterUseful("useful")}
                className={`shrink-0 rounded-lg px-2.5 py-1 font-semibold transition ${
                  filterUseful === "useful"
                    ? "bg-purple-500/20 text-purple-400 font-bold"
                    : "text-muted hover:text-foreground"
                }`}
              >
                Useful
              </button>
            </div>
          </div>

          {/* List items */}
          <div className="flex flex-col gap-2 overflow-y-auto max-h-[68vh] pr-1">
            {isLoading && list.length === 0 ? (
              <div className="pulse-card p-6 text-center text-xs text-muted">Loading feedback responses…</div>
            ) : filtered.length === 0 ? (
              <div className="pulse-card border-dashed p-6 text-center text-xs text-muted">
                {list.length === 0
                  ? "No session feedback submitted yet."
                  : "No responses match your search."}
              </div>
            ) : (
              filtered.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                const formattedDate = new Date(item.createdAt * 1000).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={`flex flex-col gap-1.5 rounded-xl border p-3 text-left transition ${
                      isSelected
                        ? "border-purple-500/60 bg-surface-strong ring-1 ring-purple-500/40 shadow-xs"
                        : "border-[var(--pulse-border)] bg-surface hover:bg-surface-strong"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs text-foreground truncate">{item.founderName}</span>
                      <span className="text-[10px] text-muted shrink-0">{formattedDate}</span>
                    </div>
                    <p className="text-[11px] font-medium text-muted truncate">{item.startupName}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
                      <span className="rounded-md bg-purple-500/15 px-1.5 py-0.5 font-semibold text-purple-300">
                        {item.q1Usefulness}
                      </span>
                      {item.q7FollowupInterest.toLowerCase() === "yes" && (
                        <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 font-bold text-emerald-400">
                          Follow-up requested
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Detail Card */}
        <div>
          {selectedItem ? (
            <div className="pulse-card flex flex-col gap-5 p-5 sm:p-7">
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--pulse-border)] pb-4">
                <div>
                  <h3 className="font-display text-xl font-bold text-foreground">
                    {selectedItem.founderName}
                  </h3>
                  <p className="text-sm font-semibold text-gradient mt-0.5">{selectedItem.startupName}</p>
                  {(selectedItem.contact || selectedItem.q7ContactInfo) && (
                    <div className="mt-1.5 flex items-center gap-2 text-xs text-muted">
                      <Mail className="h-3.5 w-3.5" />
                      <span>{selectedItem.q7ContactInfo || selectedItem.contact}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-300">
                    Rating: {selectedItem.q1Usefulness}
                  </span>
                  <span className="text-[11px] text-muted">
                    {new Date(selectedItem.createdAt * 1000).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Responses Breakdown */}
              <div className="flex flex-col gap-4 text-xs">
                {/* Most Valuable */}
                <div className="rounded-xl border border-[var(--pulse-border)] bg-surface p-3.5">
                  <p className="font-bold text-muted uppercase tracking-wider text-[10px]">
                    1. Most Valuable Part of Workshop
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{selectedItem.q2MostValuable}</p>
                </div>

                {/* Identified Riskiest Assumptions */}
                <div className="rounded-xl border border-[var(--pulse-border)] bg-surface p-3.5">
                  <p className="font-bold text-muted uppercase tracking-wider text-[10px]">
                    2. Clear on Riskiest Assumptions to Test?
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {selectedItem.q3IdentifiedAssumptions}
                  </p>
                </div>

                {/* AI Tool Usefulness */}
                <div className="rounded-xl border border-[var(--pulse-border)] bg-surface p-3.5">
                  <p className="font-bold text-muted uppercase tracking-wider text-[10px]">
                    3. AI Co-founder / Readiness Score Tool
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {selectedItem.q4AiToolUsefulness}
                  </p>
                </div>

                {/* 7-Day Action Plan */}
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5">
                  <p className="font-bold text-emerald-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    4. Founder Commitment (Next 7 Days Action)
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground leading-relaxed whitespace-pre-wrap">
                    &ldquo;{selectedItem.q5Next7DaysAction}&rdquo;
                  </p>
                </div>

                {/* Suggestions / Notes */}
                {selectedItem.q6Suggestions && (
                  <div className="rounded-xl border border-[var(--pulse-border)] bg-surface p-3.5">
                    <p className="font-bold text-muted uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                      <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                      5. Suggestions & Feedback
                    </p>
                    <p className="mt-1 text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                      {selectedItem.q6Suggestions}
                    </p>
                  </div>
                )}

                {/* Follow-up Preference */}
                <div className="rounded-xl border border-[var(--pulse-border)] bg-surface p-3.5">
                  <p className="font-bold text-muted uppercase tracking-wider text-[10px]">
                    6. Interested in 1:1 Follow-up / Advisory?
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {selectedItem.q7FollowupInterest}
                    {selectedItem.q7ContactInfo && (
                      <span className="ml-2 font-mono text-xs text-muted">
                        ({selectedItem.q7ContactInfo})
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="pulse-card flex min-h-[300px] items-center justify-center p-8 text-center text-sm text-muted">
              Select a founder feedback submission on the left to view complete responses.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FeedbackPanel;
