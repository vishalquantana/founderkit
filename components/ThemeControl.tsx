"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { THEME_STORAGE_KEY, resolveInitialTheme, nextTheme, type Theme } from "@/lib/theme";

function apply(theme: Theme) {
  const el = document.documentElement;
  if (theme === "dark") el.setAttribute("data-theme", "dark");
  else el.removeAttribute("data-theme");
}

export function ThemeControl() {
  const [theme, setTheme] = useState<Theme>("light");
  const reduce = useReducedMotion();

  // Sync from storage on mount (the inline boot script already applied it pre-paint).
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(THEME_STORAGE_KEY);
    } catch {
      /* storage unavailable */
    }
    setTheme(resolveInitialTheme(stored));
  }, []);

  function toggle() {
    setTheme((prev) => {
      const next = nextTheme(prev);
      apply(next);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {
        /* non-fatal */
      }
      return next;
    });
  }

  const dark = theme === "dark";

  return (
    <div
      className="flex items-center rounded-full border px-1 py-1"
      style={{
        background: "var(--pulse-surface-strong)",
        borderColor: "var(--pulse-border-strong)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      <button
        type="button"
        role="switch"
        aria-checked={dark}
        aria-label="Toggle dark mode"
        onClick={toggle}
        className="flex h-8 w-8 items-center justify-center rounded-full text-[15px] transition active:scale-90"
        style={{ color: "var(--pulse-text)" }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={dark ? "moon" : "sun"}
            initial={reduce ? false : { rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { rotate: 90, opacity: 0 }}
            transition={{ duration: 0.18 }}
            aria-hidden
          >
            {dark ? "🌙" : "☀️"}
          </motion.span>
        </AnimatePresence>
      </button>
    </div>
  );
}

export default ThemeControl;
