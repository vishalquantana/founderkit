"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { StageReveal } from "@/components/motion/StageReveal";
import { StageBadge } from "@/components/result/StageBadge";
import { DimensionBars } from "@/components/result/DimensionBars";
import { LeanCanvasExplorer } from "@/components/result/LeanCanvasExplorer";
import { ShareCard } from "@/components/result/ShareCard";
import { ActionButton } from "@/components/ui/ActionButton";
import { reevaluateParticipant } from "@/app/(participant)/w/[code]/actions";
import type { EvaluationResult } from "@/ai/schema";
import type { SectionKey, ReadinessStage } from "@/db/schema";

/** Same stage keys as `lib/result-view.ts`, re-expressed as Pulse glow vars. */
const STAGE_GLOW_VAR: Record<ReadinessStage, string> = {
  idea_clarity: "var(--stage-idea)",
  discovery_ready: "var(--stage-discovery)",
  mvp_candidate: "var(--stage-mvp)",
  pilot_ready: "var(--stage-pilot)",
  revenue_ready: "var(--stage-revenue)",
};

export interface ResultViewProps {
  result: EvaluationResult;
  answers: Record<SectionKey, string>;
  founderName: string;
  startupName: string;
  code: string;
  pid: string;
  editable?: boolean;
  canvasExtras?: Record<string, string>;
}

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14, delayChildren: 0.25 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 220, damping: 24 } },
};

function RevealSection({ children }: { children: React.ReactNode }) {
  return (
    <motion.section variants={itemVariants} className="flex flex-col gap-2">
      {children}
    </motion.section>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="pulse-kicker">{children}</h2>;
}

function DownloadIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 10.5 6.8-3.9" />
      <path d="m8.6 13.5 6.8 3.9" />
    </svg>
  );
}

/**
 * The delightful results payoff: a share-worthy hero up top (stage, score,
 * one-line summary, share + download controls), the strengths, the lean
 * canvas with the 7-day plan folded straight in underneath it, "how to
 * sharpen" recommendations, and — lower down, for the founders who want the
 * numbers — the detailed breakdown, assumptions, and reflection prompt.
 * Warm, mobile-first, never leads with the number... except in the hero,
 * where the number IS the payoff.
 */
export function ResultView({
  result,
  answers,
  founderName,
  startupName,
  code,
  pid,
  editable = false,
  canvasExtras,
}: ResultViewProps) {
  const shouldReduceMotion = useReducedMotion();
  const router = useRouter();
  const glow = STAGE_GLOW_VAR[result.readinessStage];
  const [isRescoring, startRescoring] = useTransition();
  const [rescoreError, setRescoreError] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);

  function handleRescore() {
    setRescoreError(null);
    startRescoring(async () => {
      try {
        await reevaluateParticipant(pid);
        router.refresh();
      } catch {
        setRescoreError("Couldn't re-score right now. Please try again.");
      }
    });
  }

  async function handleShare() {
    setShareError(null);
    const url = typeof window !== "undefined" ? window.location.href : "";
    const shareData = {
      title: `${startupName} · Quantana AI Cofounder`,
      text: `${founderName}'s readiness snapshot for ${startupName}`,
      url,
    };
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share(shareData);
        return;
      }
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2500);
        return;
      }
      setShareError("Sharing isn't supported on this device.");
    } catch (error) {
      // AbortError happens when the user cancels the native share sheet — not a real error.
      if (error instanceof Error && error.name === "AbortError") return;
      setShareError("Couldn't share right now. Please try again.");
    }
  }

  async function handleDownloadImage() {
    setDownloadError(null);
    const node = shareCardRef.current;
    if (!node) {
      setDownloadError("Couldn't generate the image. Please try again.");
      return;
    }
    try {
      // Fonts must be ready or the first capture can come out blank.
      if (typeof document !== "undefined" && document.fonts?.ready) {
        await document.fonts.ready;
      }
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(node, { cacheBust: true, pixelRatio: 2 });

      const fileName = "my-startup-readiness.png";
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], fileName, { type: "image/png" });

      // iOS Safari ignores the <a download> attribute — use the native share
      // sheet (Save to Photos) when the device can share files. Desktop falls
      // back to a direct download.
      const nav = typeof navigator !== "undefined" ? navigator : undefined;
      if (nav?.canShare && nav.canShare({ files: [file] })) {
        try {
          await nav.share({ files: [file], title: `${startupName} · readiness` });
          return;
        } catch {
          // user cancelled the share sheet, or it failed — fall through to download
        }
      }

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      setDownloadError("Couldn't generate the image. Please try again.");
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-8 pb-10">
      {/* Off-screen artwork used only as the source for the downloaded PNG. */}
      <div style={{ position: "fixed", top: 0, left: -99999, pointerEvents: "none" }} aria-hidden="true">
        <ShareCard
          ref={shareCardRef}
          startupName={startupName}
          stage={result.readinessStage}
          score={result.backendScore}
          summary={result.summary}
        />
      </div>

      {/* Hero / share card */}
      <div className="relative flex flex-col items-center gap-4 pt-4">
        {!shouldReduceMotion ? (
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: [0, 0.5, 0], scale: [0.6, 1.4, 1.6] }}
            transition={{ duration: 1.4, ease: "easeOut" }}
            className="pointer-events-none absolute -top-6 h-40 w-40 rounded-full blur-2xl"
            style={{ background: glow }}
          />
        ) : null}

        <div className="pulse-card relative flex w-full max-w-md flex-col items-center gap-4 overflow-hidden px-6 py-8 text-center">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-90"
            style={{ background: "var(--pulse-bg-gradient)" }}
          />

          <p className="relative text-sm font-medium text-muted">
            {founderName}, here&apos;s where {startupName} stands
          </p>

          <h1 className="font-display text-gradient relative text-2xl font-bold tracking-tight">
            {startupName}
          </h1>

          <StageReveal className="relative">
            <StageBadge stage={result.readinessStage} />
          </StageReveal>

          <p className="relative font-display text-3xl font-bold" style={{ color: "var(--pulse-text)" }}>
            {result.backendScore}
            <span className="ml-1 text-sm font-medium" style={{ color: "var(--pulse-text-muted)" }}>
              / 100
            </span>
          </p>

          <p className="relative max-w-sm text-sm leading-relaxed text-foreground">{result.summary}</p>

          <div className="relative flex flex-wrap items-center justify-center gap-2 pt-1">
            <ActionButton
              type="button"
              onAction={handleShare}
              className="pulse-btn-secondary inline-flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-60"
              pendingChildren={<>Sharing…</>}
            >
              <ShareIcon />
              {linkCopied ? "Link copied!" : "Share"}
            </ActionButton>

            <ActionButton
              type="button"
              onAction={handleDownloadImage}
              aria-label="Download a shareable image of your result"
              className="pulse-btn-secondary inline-flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-60"
              pendingChildren={<>Generating…</>}
            >
              <DownloadIcon />
              Download image
            </ActionButton>
          </div>

          {shareError ? <p className="relative text-xs text-red-500">{shareError}</p> : null}
          {downloadError ? <p className="relative text-xs text-red-500">{downloadError}</p> : null}

          <Link
            href={`/w/${code}/home/${pid}`}
            className="relative text-xs font-medium underline"
            style={{ color: "var(--pulse-accent-text)" }}
          >
            Go to your founder home
          </Link>
        </div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-7"
      >
        <RevealSection>
          <SectionLabel>What&apos;s strong</SectionLabel>
          <ul className="flex flex-col gap-2">
            {result.strengths.map((strength) => (
              <li
                key={strength}
                className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm leading-relaxed text-emerald-700 dark:text-emerald-300"
              >
                {strength}
              </li>
            ))}
          </ul>
        </RevealSection>

        <RevealSection>
          <SectionLabel>Your lean canvas</SectionLabel>
          <p className="text-xs text-muted">
            {editable
              ? "Tap a block on the map, or swipe through each area. Edit any answer to sharpen it."
              : "Tap a block on the map, or swipe through each area."}
          </p>
          <LeanCanvasExplorer result={result} answers={answers} canvasExtras={canvasExtras} editable={editable} participantId={pid} />
        </RevealSection>

        <RevealSection>
          <SectionLabel>Your next 7 days</SectionLabel>
          <ol className="flex flex-col gap-2">
            {result.sevenDayPlan.map((day, index) => (
              <li
                key={`${day.day}-${index}`}
                className="pulse-card pulse-hover-lift flex gap-3 px-4 py-3 text-sm leading-relaxed text-foreground"
              >
                <span className="font-display shrink-0 font-semibold" style={{ color: "var(--pulse-accent-text)" }}>
                  {day.day}
                </span>
                <span>{day.text}</span>
              </li>
            ))}
          </ol>
        </RevealSection>

        <RevealSection>
          <SectionLabel>How to sharpen</SectionLabel>
          <p className="rounded-2xl border border-violet-400/25 bg-violet-500/10 px-4 py-3 text-sm leading-relaxed" style={{ color: "var(--pulse-accent-text)" }}>
            {result.improvedPitch}
          </p>
          <p className="pulse-card px-4 py-3 text-sm leading-relaxed text-foreground">
            <span className="font-semibold" style={{ color: "var(--pulse-accent-text-2)" }}>
              Next MVP experiment →{" "}
            </span>
            {result.mvpExperiment}
          </p>
        </RevealSection>
      </motion.div>

      <div className="flex flex-col gap-7 border-t border-[var(--pulse-border)] pt-6">
        <h2 className="pulse-kicker">Details</h2>

        <div className="flex flex-col gap-3">
          <DimensionBars
            scores={result.dimensionScores}
            total={result.backendScore}
            justifications={result.dimensionJustifications}
          />
        </div>

        <div className="flex flex-col gap-2">
          <SectionLabel>Worth testing</SectionLabel>
          <ul className="flex flex-col gap-2">
            {result.assumptions.map((assumption) => (
              <li
                key={assumption}
                className="rounded-2xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm leading-relaxed text-amber-700 dark:text-amber-300"
              >
                {assumption}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-2">
          <SectionLabel>Something to sit with</SectionLabel>
          <p className="text-sm italic leading-relaxed text-muted">{result.reflectionQuestion}</p>
        </div>
      </div>

      <div className="flex flex-col items-start gap-2 border-t border-[var(--pulse-border)] pt-6">
        {editable ? (
          <>
            <button
              type="button"
              onClick={handleRescore}
              disabled={isRescoring}
              aria-busy={isRescoring || undefined}
              className="pulse-btn inline-flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-60"
            >
              {isRescoring ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Re-scoring…
                </>
              ) : (
                "Re-score my startup"
              )}
            </button>
            <p className="text-xs text-muted">
              Edited a block? Re-score to update your readiness and AI feedback.
            </p>
            {rescoreError ? <p className="text-xs text-red-500">{rescoreError}</p> : null}
          </>
        ) : null}
        <Link
          href={`/w/${code}/growth/${pid}`}
          className="pulse-btn inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold shadow-md"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
            <polyline points="16 7 22 7 22 13" />
          </svg>
          Generate Growth Plan
        </Link>
        <a
          href={`/w/${code}/result/${pid}/pdf`}
          className="pulse-btn-secondary inline-flex items-center gap-2 px-4 py-2 text-sm"
        >
          <DownloadIcon />
          Download PDF
        </a>
      </div>
    </div>
  );
}

export default ResultView;
