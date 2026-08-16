"use client";

import { useEffect, useState } from "react";

const KEY = "mrs-fontpx";
const DEFAULT = 16;
const MIN = 14;
const MAX = 24;
const STEP = 2;

function apply(px: number) {
  document.documentElement.style.fontSize = `${px}px`;
}

export function FontSizeControl() {
  const [px, setPx] = useState(DEFAULT);

  // Load saved preference on mount and apply it.
  useEffect(() => {
    const saved = Number(localStorage.getItem(KEY));
    const initial = Number.isFinite(saved) && saved >= MIN && saved <= MAX ? saved : DEFAULT;
    setPx(initial);
    apply(initial);
  }, []);

  function change(delta: number) {
    setPx((prev) => {
      const next = Math.min(MAX, Math.max(MIN, prev + delta));
      apply(next);
      localStorage.setItem(KEY, String(next));
      return next;
    });
  }

  return (
    <div
      className="flex items-center gap-1 rounded-full border px-1.5 py-1"
      style={{
        background: "var(--pulse-surface-strong)",
        borderColor: "var(--pulse-border-strong)",
        backdropFilter: "blur(8px)",
      }}
      role="group"
      aria-label="Text size"
    >
      <button
        type="button"
        onClick={() => change(-STEP)}
        disabled={px <= MIN}
        aria-label="Decrease text size"
        className="flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-bold transition active:scale-90 disabled:opacity-30"
        style={{ color: "var(--pulse-text)" }}
      >
        A−
      </button>
      <span
        className="w-8 text-center text-[10px] font-semibold"
        style={{ color: "var(--pulse-text-muted)" }}
      >
        {Math.round((px / DEFAULT) * 100)}%
      </span>
      <button
        type="button"
        onClick={() => change(STEP)}
        disabled={px >= MAX}
        aria-label="Increase text size"
        className="flex h-8 w-8 items-center justify-center rounded-full text-[17px] font-bold transition active:scale-90 disabled:opacity-30"
        style={{ color: "var(--pulse-text)" }}
      >
        A+
      </button>
    </div>
  );
}
