"use client";

import useSWR from "swr";
import { motion } from "motion/react";
import { Trophy, Zap, Clock, Medal, Award } from "lucide-react";
import { PERSONALITIES, type BadgeKey } from "@/lib/quiz";

interface LeaderboardEntry {
  id: string;
  participantId: string;
  score: number;
  badgeTitle: string;
  badgeKey: string;
  timeTakenSeconds: number;
  createdAt: string;
  founderName: string;
  startupName: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function QuizLeaderboardView({ workshopId }: { workshopId: string }) {
  const { data } = useSWR<{ leaderboard: LeaderboardEntry[] }>(
    `/api/workshops/${workshopId}/quiz-leaderboard`,
    fetcher,
    { refreshInterval: 3000 },
  );

  const leaderboard = data?.leaderboard ?? [];

  return (
    <div className="flex w-full max-w-5xl flex-col items-center gap-8 py-4">
      {/* Top Banner */}
      <div className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400">
          <Trophy className="h-6 w-6" />
        </div>
        <p className="pulse-kicker text-xs font-bold tracking-[0.3em] uppercase">Live Room Challenge</p>
        <h2 className="font-display text-3xl sm:text-5xl font-black text-foreground">
          AI Showdown Leaderboard
        </h2>
        <p className="mt-1 text-sm text-[var(--pulse-text-muted)]">
          {leaderboard.length} founders competed in the 60-second AI showdown
        </p>
      </div>

      {leaderboard.length === 0 ? (
        <div className="pulse-card w-full max-w-xl border-dashed p-10 text-center">
          <Zap className="mx-auto mb-2 h-8 w-8 text-purple-400 opacity-60 animate-pulse" />
          <p className="font-display text-lg font-bold text-foreground">Awaiting Challenge Submissions</p>
          <p className="mt-1 text-xs text-muted">
            Tell founders to tap &quot;Play 60s AI Challenge&quot; on their founder home screen to compete live!
          </p>
        </div>
      ) : (
        <div className="flex w-full flex-col gap-3">
          {/* Top 3 Podium Cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {leaderboard.slice(0, 3).map((entry, idx) => {
              const personality = PERSONALITIES[entry.badgeKey as BadgeKey] ?? PERSONALITIES.dcp;
              const ranks = [
                { label: "1st Place", border: "border-amber-400/50", bg: "bg-amber-400/10", text: "text-amber-400" },
                { label: "2nd Place", border: "border-slate-300/40", bg: "bg-slate-300/10", text: "text-slate-200" },
                { label: "3rd Place", border: "border-amber-700/40", bg: "bg-amber-700/10", text: "text-amber-600" },
              ];

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`pulse-card relative overflow-hidden p-5 text-center border ${ranks[idx].border} ${ranks[idx].bg}`}
                >
                  <span className={`text-[10px] font-black uppercase tracking-wider ${ranks[idx].text} block mb-1`}>
                    {ranks[idx].label}
                  </span>
                  <div className="text-3xl mb-1">{personality.emoji}</div>
                  <h3 className="font-display text-lg font-bold text-foreground truncate">
                    {entry.founderName}
                  </h3>
                  <p className="text-xs text-purple-400 font-medium truncate">{entry.startupName}</p>

                  <div className="mt-4 rounded-xl bg-surface-strong p-2">
                    <span className="font-display text-2xl font-black text-foreground block">
                      {entry.score} pts
                    </span>
                    <span className="text-[10px] text-muted flex items-center justify-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" /> {entry.timeTakenSeconds}s
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Full Roster List */}
          <div className="mt-4 rounded-2xl border border-[var(--pulse-border)] bg-surface p-4">
            <div className="grid grid-cols-[auto_1.5fr_1.5fr_1fr_1fr] gap-3 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-muted border-b border-[var(--pulse-border)]">
              <span>Rank</span>
              <span>Founder</span>
              <span>Startup</span>
              <span>Personality</span>
              <span className="text-right">Score</span>
            </div>

            <div className="divide-y divide-[var(--pulse-border)]">
              {leaderboard.map((item, index) => {
                const personality = PERSONALITIES[item.badgeKey as BadgeKey] ?? PERSONALITIES.dcp;
                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-[auto_1.5fr_1.5fr_1fr_1fr] items-center gap-3 px-3 py-3 text-sm"
                  >
                    <span className="font-display font-black text-muted w-6 text-center">
                      #{index + 1}
                    </span>
                    <span className="font-semibold text-foreground truncate">
                      {item.founderName}
                    </span>
                    <span className="text-xs text-muted truncate">{item.startupName}</span>
                    <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: personality.color }}>
                      <span>{personality.emoji}</span>
                      <span className="truncate">{personality.title}</span>
                    </span>
                    <span className="font-display font-black text-right text-foreground">
                      {item.score} <span className="text-xs font-normal text-muted">pts</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
