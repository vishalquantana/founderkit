"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Check, Download, Mail, Sparkles, TrendingUp, AlertCircle, ArrowRight } from "lucide-react";
import type { GrowthPlanRow } from "@/db/queries/growth";
import { generateGrowthPlanAction, toggleGrowthTaskAction, emailGrowthPlanAction } from "@/app/(participant)/w/[code]/growth-actions";

export interface GrowthPlanViewProps {
  code: string;
  pid: string;
  founderName: string;
  startupName: string;
  contactEmail: string;
  initialPlan: GrowthPlanRow | null;
}

export function GrowthPlanView({
  code,
  pid,
  founderName,
  startupName,
  contactEmail,
  initialPlan,
}: GrowthPlanViewProps) {
  const router = useRouter();
  const [plan, setPlan] = useState<GrowthPlanRow | null>(initialPlan);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState("");
  const [checkedTasks, setCheckedTasks] = useState<string[]>(initialPlan?.checkedTasks ?? []);
  const [isPending, startTransition] = useTransition();

  const [emailStatus, setEmailStatus] = useState<{ loading: boolean; msg: string | null; success: boolean | null }>({
    loading: false,
    msg: null,
    success: null,
  });

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerationProgress(10);
    setProgressStatus("Analyzing Lean Canvas & startup context...");

    const interval = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev >= 85) {
          clearInterval(interval);
          return 85;
        }
        if (prev === 30) setProgressStatus("Identifying best-fit distribution channels...");
        if (prev === 60) setProgressStatus("Formulating 30-60-90 day action items & outreach scripts...");
        return prev + 15;
      });
    }, 400);

    try {
      const newPlan = await generateGrowthPlanAction(pid);
      clearInterval(interval);
      setGenerationProgress(100);
      setProgressStatus("Growth Plan Ready!");
      setTimeout(() => {
        setPlan(newPlan);
        setCheckedTasks(newPlan.checkedTasks ?? []);
        setIsGenerating(false);
      }, 500);
    } catch (err) {
      clearInterval(interval);
      setIsGenerating(false);
      alert("Failed to generate growth plan. Please try again.");
    }
  };

  const handleToggleTask = (taskId: string) => {
    const nextChecked = checkedTasks.includes(taskId)
      ? checkedTasks.filter((t) => t !== taskId)
      : [...checkedTasks, taskId];
    setCheckedTasks(nextChecked);

    startTransition(async () => {
      try {
        await toggleGrowthTaskAction(pid, taskId);
      } catch {
        // revert on failure
        setCheckedTasks(checkedTasks);
      }
    });
  };

  const handleEmailPlan = async () => {
    setEmailStatus({ loading: true, msg: "Sending PDF email...", success: null });
    try {
      const res = await emailGrowthPlanAction(pid);
      setEmailStatus({ loading: false, msg: res.message, success: res.ok });
    } catch {
      setEmailStatus({ loading: false, msg: "Failed to send email. Try again.", success: false });
    }
  };

  if (!plan && !isGenerating) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center justify-center py-12 px-4 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
          <TrendingUp className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          90-Day Distribution & Growth Plan
        </h1>
        <p className="mt-2 text-sm text-muted max-w-md">
          Turn your Lean Canvas into a concrete, channel-focused 90-day growth engine with actionable checklists and founder-led outreach scripts.
        </p>

        <button
          type="button"
          onClick={handleGenerate}
          className="pulse-btn mt-8 inline-flex items-center gap-2 px-6 py-3 text-base font-semibold shadow-lg transition-transform active:scale-95"
        >
          <Sparkles className="h-5 w-5" />
          Generate Growth Plan
        </button>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center justify-center py-16 px-4 text-center">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
          <Sparkles className="h-7 w-7 animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Creating Your Custom Growth Plan</h2>
        <p className="mt-1 text-xs text-muted mb-6">{progressStatus}</p>

        <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-[var(--pulse-border)]">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-purple-600 to-indigo-600"
            initial={{ width: "0%" }}
            animate={{ width: `${generationProgress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <span className="mt-2 text-xs font-mono font-medium text-muted">{generationProgress}%</span>
      </div>
    );
  }

  const allTasks = [
    ...(plan?.plan30Day.map((text, i) => ({ id: `30d-${i}`, text, period: "30-Day" })) ?? []),
    ...(plan?.plan60Day.map((text, i) => ({ id: `60d-${i}`, text, period: "60-Day" })) ?? []),
    ...(plan?.plan90Day.map((text, i) => ({ id: `90d-${i}`, text, period: "90-Day" })) ?? []),
  ];

  const completedCount = allTasks.filter((t) => checkedTasks.includes(t.id)).length;
  const overallProgress = allTasks.length > 0 ? Math.round((completedCount / allTasks.length) * 100) : 0;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-24 px-4 sm:px-6 lg:px-8 pt-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[var(--pulse-border)] bg-card p-5 sm:p-6 shadow-sm">
        <div>
          <span className="pulse-kicker block mb-1 text-xs uppercase font-bold tracking-wider">
            Growth & Distribution Strategy
          </span>
          <h1 className="text-xl font-bold text-foreground sm:text-3xl font-display">
            90-Day Growth Focus · {startupName}
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Prepared for <span className="font-semibold text-foreground">{founderName}</span> ({contactEmail})
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <a
            href={`/w/${code}/growth/${pid}/pdf`}
            download
            className="pulse-btn-secondary inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold"
          >
            <Download className="h-4 w-4" />
            PDF Export
          </a>
          <button
            type="button"
            onClick={handleEmailPlan}
            disabled={emailStatus.loading}
            className="pulse-btn inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold disabled:opacity-50"
          >
            <Mail className="h-4 w-4" />
            {emailStatus.loading ? "Sending..." : "Email to Me"}
          </button>
        </div>
      </div>

      {emailStatus.msg && (
        <div
          className={`rounded-xl border px-4 py-3 text-xs font-semibold ${
            emailStatus.success
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-300"
              : "border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-300"
          }`}
        >
          {emailStatus.msg}
        </div>
      )}

      {/* Progress Bar Card */}
      <div className="rounded-2xl border border-[var(--pulse-border)] bg-card p-5 shadow-xs">
        <div className="flex items-center justify-between text-xs sm:text-sm font-semibold mb-2.5">
          <span className="text-foreground">Execution Checklist Progress</span>
          <span className="text-purple-600 dark:text-purple-400 font-mono font-bold">
            {completedCount} of {allTasks.length} completed ({overallProgress}%)
          </span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* Desktop Split Top: Highlights & Strategy Grid + Channels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Strategy Grid (2 cols on desktop) */}
        <div className="lg:col-span-2 rounded-2xl border border-purple-500/20 bg-purple-500/5 p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-4">
              Your Core Growth Strategy
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 text-xs">
              <div className="rounded-xl border border-purple-500/10 bg-background/80 p-3.5 shadow-xs">
                <span className="text-muted block text-[10px] uppercase font-bold tracking-wide">
                  Primary Channel
                </span>
                <p className="font-semibold text-foreground text-sm mt-0.5">{plan?.primaryChannel}</p>
              </div>
              <div className="rounded-xl border border-purple-500/10 bg-background/80 p-3.5 shadow-xs">
                <span className="text-muted block text-[10px] uppercase font-bold tracking-wide">
                  Target Segment
                </span>
                <p className="font-semibold text-foreground text-sm mt-0.5">{plan?.targetSegment}</p>
              </div>
              <div className="rounded-xl border border-purple-500/10 bg-background/80 p-3.5 shadow-xs">
                <span className="text-muted block text-[10px] uppercase font-bold tracking-wide">
                  First Conversion Goal
                </span>
                <p className="font-semibold text-foreground text-sm mt-0.5">{plan?.conversionGoal}</p>
              </div>
              <div className="rounded-xl border border-purple-500/10 bg-background/80 p-3.5 shadow-xs">
                <span className="text-muted block text-[10px] uppercase font-bold tracking-wide">
                  30-Day Metric
                </span>
                <p className="font-semibold text-foreground text-sm mt-0.5">{plan?.successMetric30Day}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <div
              className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs font-medium text-amber-950 dark:text-amber-200"
              style={{ color: "var(--testing-text, #78350f)" }}
            >
              <span className="font-bold block text-[10px] uppercase opacity-85">
                Biggest Distribution Risk:
              </span>
              {plan?.biggestRisk}
            </div>

            <div
              className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs font-medium text-emerald-950 dark:text-emerald-200"
              style={{ color: "var(--strength-text, #064e3b)" }}
            >
              <span className="font-bold block text-[10px] uppercase opacity-85">
                Low-Hanging Opportunity:
              </span>
              {plan?.lowHangingOpportunity}
            </div>
          </div>
        </div>

        {/* Top 3 Channels Card */}
        <div className="rounded-2xl border border-[var(--pulse-border)] bg-card p-5 sm:p-6 flex flex-col justify-between shadow-xs">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-4">
              Top 3 Channels to Test
            </h3>
            <ul className="space-y-3 text-xs sm:text-sm">
              {plan?.topChannels.map((c, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 rounded-xl border border-[var(--pulse-border)] bg-background/60 p-3 text-foreground font-medium"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-500/15 text-purple-600 font-black text-xs">
                    {i + 1}
                  </span>
                  <span className="mt-0.5 leading-snug">{c}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 rounded-xl border border-blue-500/20 bg-blue-500/5 p-3.5 text-xs text-blue-900 dark:text-blue-300">
            <span className="font-bold uppercase tracking-wider block text-[10px] mb-1">
              Distribution Rule of Thumb
            </span>
            <p className="leading-relaxed">{plan?.avoidOverbuildingRec}</p>
          </div>
        </div>
      </div>

      {/* 30-60-90 Day Checklists (3 Columns on Desktop) */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted">
            30 · 60 · 90 Day Step-by-Step Action Roadmap
          </h2>
          <span className="text-[11px] text-muted">Click items to mark complete</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 30 Day Plan */}
          <div className="rounded-2xl border border-[var(--pulse-border)] bg-card p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-[var(--pulse-border)] pb-3">
                <h3 className="text-sm font-bold text-foreground">30-Day Plan</h3>
                <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  Phase 1: Pilot & Discovery
                </span>
              </div>
              <div className="space-y-2.5">
                {plan?.plan30Day.map((task, i) => {
                  const taskId = `30d-${i}`;
                  const isChecked = checkedTasks.includes(taskId);
                  return (
                    <label
                      key={taskId}
                      onClick={() => handleToggleTask(taskId)}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-xs transition-all ${
                        isChecked
                          ? "border-emerald-500/30 bg-emerald-500/5 text-muted line-through"
                          : "border-[var(--pulse-border)] bg-background text-foreground hover:border-purple-500/40 hover:bg-surface-strong"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="leading-relaxed">{task}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 60 Day Plan */}
          <div className="rounded-2xl border border-[var(--pulse-border)] bg-card p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-[var(--pulse-border)] pb-3">
                <h3 className="text-sm font-bold text-foreground">60-Day Plan</h3>
                <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  Phase 2: Repeatability
                </span>
              </div>
              <div className="space-y-2.5">
                {plan?.plan60Day.map((task, i) => {
                  const taskId = `60d-${i}`;
                  const isChecked = checkedTasks.includes(taskId);
                  return (
                    <label
                      key={taskId}
                      onClick={() => handleToggleTask(taskId)}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-xs transition-all ${
                        isChecked
                          ? "border-emerald-500/30 bg-emerald-500/5 text-muted line-through"
                          : "border-[var(--pulse-border)] bg-background text-foreground hover:border-purple-500/40 hover:bg-surface-strong"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="leading-relaxed">{task}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 90 Day Plan */}
          <div className="rounded-2xl border border-[var(--pulse-border)] bg-card p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-[var(--pulse-border)] pb-3">
                <h3 className="text-sm font-bold text-foreground">90-Day Plan</h3>
                <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  Phase 3: Scale & Expansion
                </span>
              </div>
              <div className="space-y-2.5">
                {plan?.plan90Day.map((task, i) => {
                  const taskId = `90d-${i}`;
                  const isChecked = checkedTasks.includes(taskId);
                  return (
                    <label
                      key={taskId}
                      onClick={() => handleToggleTask(taskId)}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-xs transition-all ${
                        isChecked
                          ? "border-emerald-500/30 bg-emerald-500/5 text-muted line-through"
                          : "border-[var(--pulse-border)] bg-background text-foreground hover:border-purple-500/40 hover:bg-surface-strong"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="leading-relaxed">{task}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Metrics & Outreach Script (2 columns on desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recommended Stage Metrics */}
        <div className="rounded-2xl border border-[var(--pulse-border)] bg-card p-5 sm:p-6 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-3">
            Key Stage Metrics to Track
          </h3>
          <ul className="space-y-2.5 text-xs sm:text-sm">
            {plan?.metricsToTrack.map((metric, i) => (
              <li
                key={i}
                className="flex items-center gap-3 rounded-xl border border-[var(--pulse-border)] bg-background/60 p-3 text-foreground font-medium"
              >
                <span className="h-2 w-2 shrink-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                <span>{metric}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Founder-Led Outreach Script */}
        <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-5 sm:p-6 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-2">
            Founder-Led Outreach Script
          </h3>
          <p className="text-xs text-muted mb-3">
            Use this template for cold or warm outreach on LinkedIn, WhatsApp, or direct email:
          </p>
          <div className="rounded-xl border border-purple-500/20 bg-background/90 p-4 text-xs sm:text-sm italic text-foreground leading-relaxed shadow-inner">
            &ldquo;{plan?.outreachScript}&rdquo;
          </div>
        </div>
      </div>

      {/* Regenerate Action */}
      <div className="mt-4 flex justify-center">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="pulse-btn-secondary inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold"
        >
          <Sparkles className="h-4 w-4" />
          Re-generate Growth Plan
        </button>
      </div>
    </div>
  );
}
