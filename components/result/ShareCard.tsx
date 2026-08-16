"use client";

import { forwardRef } from "react";
import { STAGE_META } from "@/lib/readiness";
import type { ReadinessStage } from "@/db/schema";

/** Fixed portrait canvas size for the downloadable share image — big enough
 * to look crisp on any phone/social surface, small enough to render fast. */
export const SHARE_CARD_WIDTH = 1080;
export const SHARE_CARD_HEIGHT = 1350;

export interface ShareCardProps {
  startupName: string;
  stage: ReadinessStage;
  score: number;
  summary: string;
}

/**
 * The branded, screenshot/download-worthy artwork behind the "download
 * image" action on the result hero. Rendered off-screen at a fixed pixel
 * size (independent of the page theme/viewport) so `toPng()` always
 * produces the same crisp 1080x1350 portrait PNG regardless of where the
 * founder is viewing the result from. Colors are hard-coded (not CSS
 * variables) so the export always matches the brand gradient, never the
 * founder's light/dark preference.
 */
export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(function ShareCard(
  { startupName, stage, score, summary },
  ref,
) {
  const meta = STAGE_META[stage];
  const oneLineSummary = summary.trim().split(/(?<=[.!?])\s+/)[0] ?? summary.trim();

  return (
    <div
      ref={ref}
      style={{
        width: SHARE_CARD_WIDTH,
        height: SHARE_CARD_HEIGHT,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        boxSizing: "border-box",
        fontFamily: "'Chakra Petch', sans-serif",
        color: "#ffffff",
        background:
          "radial-gradient(120% 80% at 85% 0%, #3a1470 0%, transparent 55%), radial-gradient(100% 70% at 0% 100%, #6b0f45 0%, transparent 55%), linear-gradient(160deg, #150a28 0%, #0a0a14 60%)",
      }}
    >
      {/* Header / wordmark */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "linear-gradient(135deg, #8b5cf6, #f472b6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            fontWeight: 800,
          }}
        >
          Q
        </div>
        <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: "0.04em" }}>
          Quantana <span style={{ opacity: 0.65 }}>· AI Cofounder</span>
        </span>
      </div>

      {/* Body */}
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <p
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.18em",
            color: "#f9a8d4",
          }}
        >
          Startup readiness snapshot
        </p>

        <h1
          style={{
            margin: 0,
            fontSize: 64,
            fontWeight: 800,
            lineHeight: 1.08,
            fontFamily: "'Orbitron', sans-serif",
          }}
        >
          {startupName}
        </h1>

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "14px 28px",
              borderRadius: 9999,
              fontSize: 28,
              fontWeight: 700,
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.3)",
            }}
          >
            {meta.label}
          </span>
          <span style={{ fontSize: 56, fontWeight: 800, fontFamily: "'Orbitron', sans-serif" }}>
            {score}
            <span style={{ fontSize: 26, fontWeight: 600, opacity: 0.7 }}>/100</span>
          </span>
        </div>

        <p
          style={{
            margin: 0,
            maxWidth: 820,
            fontSize: 30,
            lineHeight: 1.45,
            color: "rgba(255,255,255,0.92)",
          }}
        >
          {oneLineSummary}
        </p>
      </div>

      {/* Footer */}
      <p style={{ margin: 0, fontSize: 20, opacity: 0.55 }}>Get your own readiness snapshot at quantana.com.au</p>
    </div>
  );
});

export default ShareCard;
