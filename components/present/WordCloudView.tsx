"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Globe, Grid } from "lucide-react";
import { buildWordFrequencies } from "@/lib/present";
import type { PresentData } from "@/components/present/types";

const PALETTE = [
  "#8b5cf6", // violet
  "#f472b6", // pink
  "#f4c748", // gold
  "#7c3aed", // deep violet
  "#38bdf8", // sky
  "#34d399", // emerald
];

function fontSizeFor(count: number, maxCount: number): number {
  const min = 0.9;
  const max = 2.4;
  if (maxCount <= 0) return min;
  const ratio = count / maxCount;
  return min + ratio * (max - min);
}

export interface WordCloudViewProps {
  data: PresentData;
}

export function WordCloudView({ data }: WordCloudViewProps) {
  const shouldReduceMotion = useReducedMotion();
  const [mode, setMode] = useState<"globe" | "grid">("globe");
  const [sizeScale, setSizeScale] = useState(1.35); // Default expanded scale
  const words = useMemo(() => buildWordFrequencies(data.problems, { max: 32 }), [data.problems]);
  const maxCount = words.length > 0 ? words[0].count : 1;

  if (words.length === 0) {
    return (
      <div className="flex min-h-[18rem] items-center justify-center">
        <p className="text-xl font-medium text-[var(--pulse-text-muted)]">
          Words will appear here as founders submit problems.
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex w-full flex-col items-center justify-center gap-4 py-1">
      {/* Controls Bar: Mode Switcher + Live Size Slider */}
      <div className="z-20 flex flex-wrap items-center justify-center gap-4 rounded-full border border-[var(--pulse-border-strong)] bg-surface px-4 py-1.5 shadow-sm backdrop-blur-md">
        {/* Mode Toggle */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMode("globe")}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all ${
              mode === "globe"
                ? "bg-[linear-gradient(135deg,#8b5cf6,#f472b6)] text-white shadow"
                : "text-[var(--pulse-text-muted)] hover:text-foreground"
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>3D Globe</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("grid")}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all ${
              mode === "grid"
                ? "bg-[linear-gradient(135deg,#8b5cf6,#f472b6)] text-white shadow"
                : "text-[var(--pulse-text-muted)] hover:text-foreground"
            }`}
          >
            <Grid className="h-3.5 w-3.5" />
            <span>Text Grid</span>
          </button>
        </div>

        {/* Vertical Divider */}
        <span className="hidden sm:inline-block h-4 w-px bg-[var(--pulse-border-strong)]" />

        {/* Size Slider Control */}
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--pulse-text-muted)]">
          <span>Size</span>
          <input
            type="range"
            min="0.8"
            max="2.0"
            step="0.05"
            value={sizeScale}
            onChange={(e) => setSizeScale(parseFloat(e.target.value))}
            aria-label="Adjust word cloud size"
            className="h-1.5 w-24 cursor-pointer appearance-none rounded-lg bg-[var(--pulse-border-strong)] accent-purple-500"
          />
          <span className="tabular-nums text-[11px] font-bold text-foreground w-8 text-right">
            {Math.round(sizeScale * 100)}%
          </span>
        </div>
      </div>

      {mode === "globe" ? (
        <RotatingWordGlobe words={words} maxCount={maxCount} sizeScale={sizeScale} />
      ) : (
        <div
          className="flex max-h-[62vh] max-w-5xl flex-wrap items-center justify-center gap-x-6 gap-y-4 px-4 py-4 overflow-hidden transition-transform duration-150"
          style={{ transform: `scale(${sizeScale})`, transformOrigin: "center center" }}
        >
          {words.map((w, i) => (
            <motion.span
              key={w.word}
              initial={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.7, y: 8 }}
              animate={
                shouldReduceMotion
                  ? undefined
                  : {
                      opacity: 1,
                      scale: 1,
                      y: [0, -4, 0],
                    }
              }
              transition={{
                opacity: { delay: i * 0.02, duration: 0.3 },
                scale: { delay: i * 0.02, type: "spring", stiffness: 200, damping: 18 },
                y: { delay: i * 0.02 + 0.3, duration: 4 + (i % 5) * 0.4, repeat: Infinity, ease: "easeInOut" },
              }}
              className="font-display font-bold leading-tight tracking-tight"
              style={{
                fontSize: `clamp(0.9rem, ${fontSizeFor(w.count, maxCount)}vw + 0.6rem, 2.5rem)`,
                color: PALETTE[i % PALETTE.length],
              }}
            >
              {w.word}
            </motion.span>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Interactive 3D Sphere Word Cloud using trigonometric spherical coordinates
 * with smooth mathematical rotation and depth-based scale/opacity.
 */
function RotatingWordGlobe({
  words,
  maxCount,
  sizeScale,
}: {
  words: { word: string; count: number }[];
  maxCount: number;
  sizeScale: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0.2, y: 0 });

  // Calculate Fibonacci Sphere coordinates for uniform point distribution with dynamic scale
  const points = useMemo(() => {
    const total = words.length;
    const radius = 175 * sizeScale; // dynamically scaled sphere radius
    return words.map((item, i) => {
      // Golden spiral distribution on sphere
      const phi = Math.acos(1 - (2 * (i + 0.5)) / total);
      const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);

      return {
        word: item.word,
        count: item.count,
        baseX: x,
        baseY: y,
        baseZ: z,
        color: PALETTE[i % PALETTE.length],
      };
    });
  }, [words, sizeScale]);

  // Continuous smooth auto-rotation
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const frame = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      // Slow elegant rotation (approx 1 revolution per 24 seconds)
      setRotation((prev) => ({
        x: prev.x,
        y: prev.y + delta * 0.25,
      }));

      animId = requestAnimationFrame(frame);
    };

    animId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative flex h-[24rem] w-full max-w-3xl items-center justify-center overflow-hidden select-none"
      style={{ perspective: "1000px" }}
    >
      {/* Ambient background glow ring */}
      <div
        className="pointer-events-none absolute h-72 w-72 rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, #8b5cf6, #f472b6)" }}
      />

      {points.map((p) => {
        // Rotate in 3D around Y and X axis
        const cosY = Math.cos(rotation.y);
        const sinY = Math.sin(rotation.y);
        const cosX = Math.cos(rotation.x);
        const sinX = Math.sin(rotation.x);

        // Y-axis rotation
        const x1 = p.baseX * cosY + p.baseZ * sinY;
        const z1 = -p.baseX * sinY + p.baseZ * cosY;

        // X-axis tilt
        const y2 = p.baseY * cosX - z1 * sinX;
        const z2 = p.baseY * sinX + z1 * cosX;

        // Perspective scale factor
        const distance = 420;
        const scale = distance / (distance - z2);
        const opacity = Math.max(0.18, Math.min(1, (z2 + 250) / 450));
        const zIndex = Math.round((z2 + 300) * 10);
        const fontSize = (0.9 + (p.count / maxCount) * 1.5) * scale;

        return (
          <span
            key={p.word}
            className="font-display absolute whitespace-nowrap font-extrabold tracking-tight transition-transform duration-75"
            style={{
              transform: `translate3d(${x1}px, ${y2}px, 0) scale(${scale})`,
              fontSize: `${fontSize}rem`,
              color: p.color,
              opacity,
              zIndex,
              filter: z2 < -50 ? `blur(${Math.min(2.5, Math.abs(z2 + 50) / 70)}px)` : "none",
              textShadow: z2 > 50 ? "0 4px 18px rgba(0,0,0,0.3)" : "none",
            }}
          >
            {p.word}
          </span>
        );
      })}
    </div>
  );
}

export default WordCloudView;
