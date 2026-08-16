# Light Mode + Expressive Microanimations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a founder-toggleable light theme (the new default) and expressive-but-tasteful microanimations across every surface of the app.

**Architecture:** Promote the hardcoded `rgba(255,255,255,…)` values in `app/globals.css`'s `.pulse-*` utilities into flippable semantic tokens; `:root` becomes the light palette and `[data-theme="dark"]` re-declares the current dark values verbatim. A `ThemeControl` client component (mirroring `FontSizeControl`) persists the choice to `localStorage` and flips `data-theme` on `<html>`; a blocking inline script in the root layout prevents a theme/font-size flash. Motion is layered on the existing `motion/react` + `components/motion/` infra, all gated by the existing `MotionConfig reducedMotion="user"`.

**Tech Stack:** Next.js 16 (App Router), Tailwind v4 (`@theme inline`), `motion/react` (Framer Motion), vitest.

## Global Constraints

- **Default theme is LIGHT** on first load; dark is opt-in via the toggle and persists once chosen.
- **Dark theme look is unchanged** — its values move behind `[data-theme="dark"]`, byte-for-byte.
- **Accent tokens are theme-invariant:** `--pulse-violet`, `--pulse-pink`, `--pulse-gold`, `--pulse-gradient`, `--pulse-kicker` are identical in both themes.
- **The Lean Canvas board stays a white "paper" artifact in BOTH themes** (`components/result/CanvasBoard.tsx` / `CanvasCell.tsx` are intentionally `bg-white`/`text-black` — do NOT theme them).
- **All decorative motion uses transform/opacity only** and must auto-disable under `prefers-reduced-motion` (via `MotionConfig` or a CSS media query for pure-CSS motion).
- **localStorage keys:** theme = `mrs-theme` (`"light"|"dark"`), font size = `mrs-fontpx` (already in use). Never throw if storage is unavailable.
- Run the full suite with `npm run test` (vitest); it must stay green (106 existing tests).
- **Test convention (binding):** vitest runs in the `node` environment; `@testing-library/react` and jsdom are NOT installed and must NOT be added. Do not write render-based `.test.tsx` tests. Follow the existing pattern (`components/motion/__tests__/animated-number.test.ts`): extract pure logic into a helper and unit-test the helper; verify components themselves via `npm run build` + manual check.

---

### Task 1: Theme token foundation + ambient background (CSS)

Restructure `app/globals.css` so `:root` is the light palette, add a `[data-theme="dark"]` block holding the current dark values, add the CSS-only ambient background, and add button-press + card-hover utilities.

**Files:**
- Modify: `app/globals.css`

**Interfaces:**
- Produces (CSS tokens/classes consumed by later tasks): tokens `--pulse-surface`, `--pulse-surface-strong`, `--pulse-border`, `--pulse-border-strong`, `--pulse-text`, `--pulse-text-muted`, `--pulse-track`, `--pulse-bg-gradient`; utility classes `.pulse-card`, `.pulse-hover-lift`; attribute selector `[data-theme="dark"]` on `<html>`.

- [ ] **Step 1: Replace the `:root` block with light-default tokens.** In `app/globals.css`, replace the entire `:root { … }` block (currently lines ~17–48, the Pulse dark tokens) with:

```css
:root {
  /* Pulse design system tokens — LIGHT is the default theme. */
  --background: #f7f7fb;
  --foreground: #17131f;
  --muted: #5b5570;

  --pulse-bg-gradient:
    radial-gradient(100% 70% at 80% 0%, #efe6ff 0%, transparent 60%),
    radial-gradient(90% 60% at 0% 100%, #ffe9f5 0%, transparent 60%),
    #f7f7fb;

  --pulse-surface: rgba(23, 19, 31, 0.03);
  --pulse-surface-strong: rgba(23, 19, 31, 0.05);
  --pulse-border: rgba(23, 19, 31, 0.10);
  --pulse-border-strong: rgba(23, 19, 31, 0.16);

  --pulse-violet: #8b5cf6;
  --pulse-pink: #f472b6;
  --pulse-gold: #f4c748;
  --pulse-gradient: linear-gradient(135deg, #8b5cf6, #f472b6);

  --pulse-text: #17131f;
  --pulse-text-muted: #5b5570;
  --pulse-kicker: #d1428a;

  /* neutral track for progress bars on light */
  --pulse-track: rgba(23, 19, 31, 0.08);

  /* stage colors — deepened for AA contrast on white */
  --stage-idea: #5b6472;
  --stage-discovery: #2563eb;
  --stage-mvp: #7c3aed;
  --stage-pilot: #16a34a;
  --stage-revenue: #b7860b;

  --pulse-card-shadow: 0 18px 50px -28px rgba(23, 19, 31, 0.28);
}
```

- [ ] **Step 2: Add the `[data-theme="dark"]` override block** immediately after the `:root` block, holding the ORIGINAL dark values verbatim:

```css
[data-theme="dark"] {
  --background: #0a0a14;
  --foreground: #eceaf6;
  --muted: #a9a9c9;

  --pulse-bg-gradient:
    radial-gradient(100% 70% at 80% 0%, #2a0f4d 0%, transparent 60%),
    radial-gradient(90% 60% at 0% 100%, #160a28 0%, transparent 60%),
    #0a0a14;

  --pulse-surface: rgba(255, 255, 255, 0.04);
  --pulse-surface-strong: rgba(255, 255, 255, 0.07);
  --pulse-border: rgba(255, 255, 255, 0.09);
  --pulse-border-strong: rgba(255, 255, 255, 0.14);

  --pulse-text: #eceaf6;
  --pulse-text-muted: #a9a9c9;
  --pulse-kicker: #f472b6;

  --pulse-track: rgba(255, 255, 255, 0.08);

  --stage-idea: #94a3b8;
  --stage-discovery: #60a5fa;
  --stage-mvp: #a78bfa;
  --stage-pilot: #4ade80;
  --stage-revenue: #f4c748;

  --pulse-card-shadow: 0 20px 60px -30px rgba(139, 92, 246, 0.35);
}
```

- [ ] **Step 3: Make the `body` background themable + add a smooth theme-crossfade + ambient animated background.** Replace the existing `body { … }` rule with:

```css
body {
  background: var(--pulse-bg-gradient);
  background-attachment: fixed;
  color: var(--foreground);
  font-family: var(--font-body), "Chakra Petch", sans-serif;
  transition: background-color 0.4s ease, color 0.4s ease;
}

/* Ambient animated gradient wash — pure CSS, GPU-cheap, sits behind content. */
body::before {
  content: "";
  position: fixed;
  inset: -20%;
  z-index: -1;
  pointer-events: none;
  background: var(--pulse-bg-gradient);
  background-attachment: fixed;
  opacity: 0.9;
  animation: pulse-aurora 26s ease-in-out infinite alternate;
}

@keyframes pulse-aurora {
  0%   { transform: translate3d(0, 0, 0) scale(1); }
  50%  { transform: translate3d(-2%, 1.5%, 0) scale(1.06); }
  100% { transform: translate3d(1.5%, -1%, 0) scale(1.03); }
}

@media (prefers-reduced-motion: reduce) {
  body::before { animation: none; }
}
```

- [ ] **Step 4: Point `.pulse-card` at the shadow token** so it softens in light. In the `@layer utilities` block, change the `.pulse-card` `box-shadow` line from `box-shadow: 0 20px 60px -30px rgba(139, 92, 246, 0.35);` to:

```css
  box-shadow: var(--pulse-card-shadow);
```

- [ ] **Step 5: Add button-press feedback and a card-hover-lift utility.** Inside `@layer utilities`, add the `:active` rule right after the existing `.pulse-btn:hover { … }` rule:

```css
  .pulse-btn:active:not(:disabled),
  .pulse-btn-secondary:active {
    transform: scale(0.96);
  }
```

Then append a new utility at the end of the `@layer utilities` block (before its closing `}`):

```css
  .pulse-hover-lift {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  @media (hover: hover) {
    .pulse-hover-lift:hover {
      transform: translateY(-3px);
      box-shadow: var(--pulse-card-shadow);
    }
  }
```

- [ ] **Step 6: Tokenize the interactive utilities** so they aren't invisible white-on-white in light mode. In `@layer utilities`, update the hardcoded `rgba(255,255,255,…)` backgrounds/borders to tokens:

`.pulse-btn-secondary` — change `background: rgba(255, 255, 255, 0.05);` to `background: var(--pulse-surface-strong);` and its `:hover` rule's `background: rgba(255, 255, 255, 0.09);` to `background: var(--pulse-border);` and `border-color: rgba(255, 255, 255, 0.24);` to `border-color: var(--pulse-border-strong);` (its base `border` already uses `var(--pulse-border-strong)`).

`.pulse-input` — change `background: rgba(255, 255, 255, 0.05);` to `background: var(--pulse-surface-strong);` and `border: 1px solid rgba(255, 255, 255, 0.14);` to `border: 1px solid var(--pulse-border-strong);` (its `:focus` violet ring stays).

`.pulse-chip` — change `background: rgba(255, 255, 255, 0.05);` to `background: var(--pulse-surface-strong);` and `border: 1px solid rgba(255, 255, 255, 0.14);` to `border: 1px solid var(--pulse-border-strong);` (its `color` already uses `var(--pulse-text-muted)`; the `[data-selected="true"]` gradient state stays).

- [ ] **Step 7: Verify the build compiles.**

Run: `npm run build`
Expected: build succeeds (no CSS/type errors). The app now renders in the light palette by default, with inputs/chips/secondary buttons visible.

- [ ] **Step 8: Commit.**

```bash
git add app/globals.css
git commit -m "feat: light-default theme tokens + dark override + ambient animated bg"
```

---

### Task 2: No-flash theme helper + inline boot script

Add a pure, tested helper for resolving the initial theme, and a blocking inline script in the root layout that applies the saved theme + font size before first paint (kills the flash for returning dark/large-text users).

**Files:**
- Create: `lib/theme.ts`
- Create: `lib/__tests__/theme.test.ts`
- Modify: `app/layout.tsx`

**Interfaces:**
- Produces: `THEME_STORAGE_KEY = "mrs-theme"`, `FONT_STORAGE_KEY = "mrs-fontpx"`, `type Theme = "light" | "dark"`, `resolveInitialTheme(stored: string | null): Theme` (returns `"dark"` only when `stored === "dark"`, else `"light"`), `nextTheme(prev: Theme): Theme` (flips light↔dark — consumed by `ThemeControl` in Task 3).

- [ ] **Step 1: Write the failing test** (pure logic, node env — matches `components/motion/__tests__/animated-number.test.ts`). Create `lib/__tests__/theme.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { resolveInitialTheme, nextTheme, THEME_STORAGE_KEY, FONT_STORAGE_KEY } from "@/lib/theme";

describe("resolveInitialTheme", () => {
  it("defaults to light when nothing is stored", () => {
    expect(resolveInitialTheme(null)).toBe("light");
  });

  it("returns dark only for the exact 'dark' string", () => {
    expect(resolveInitialTheme("dark")).toBe("dark");
  });

  it("falls back to light for any unexpected value", () => {
    expect(resolveInitialTheme("light")).toBe("light");
    expect(resolveInitialTheme("purple")).toBe("light");
    expect(resolveInitialTheme("")).toBe("light");
  });

  it("exposes the storage keys", () => {
    expect(THEME_STORAGE_KEY).toBe("mrs-theme");
    expect(FONT_STORAGE_KEY).toBe("mrs-fontpx");
  });
});

describe("nextTheme", () => {
  it("flips light to dark and back", () => {
    expect(nextTheme("light")).toBe("dark");
    expect(nextTheme("dark")).toBe("light");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails.**

Run: `npm run test -- lib/__tests__/theme.test.ts`
Expected: FAIL — cannot resolve `@/lib/theme`.

- [ ] **Step 3: Write the helper.** Create `lib/theme.ts`:

```ts
export const THEME_STORAGE_KEY = "mrs-theme";
export const FONT_STORAGE_KEY = "mrs-fontpx";

export type Theme = "light" | "dark";

/**
 * Resolve the initial theme from a stored value. Light is the default;
 * only the exact string "dark" opts into the dark theme.
 */
export function resolveInitialTheme(stored: string | null): Theme {
  return stored === "dark" ? "dark" : "light";
}

/** Flip to the other theme. */
export function nextTheme(prev: Theme): Theme {
  return prev === "dark" ? "light" : "dark";
}
```

- [ ] **Step 4: Run the test to verify it passes.**

Run: `npm run test -- lib/__tests__/theme.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Add the blocking inline boot script to the root layout.** In `app/layout.tsx`, add a `<head>` with the script inside the `<html>` element, before `<body>`. The script is self-contained (runs pre-hydration, cannot import modules), using the literal key names:

```tsx
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${orbitron.variable} ${chakraPetch.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("mrs-theme");if(t==="dark"){document.documentElement.setAttribute("data-theme","dark");}var f=Number(localStorage.getItem("mrs-fontpx"));if(f>=14&&f<=24){document.documentElement.style.fontSize=f+"px";}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
```

- [ ] **Step 6: Verify the full suite + build.**

Run: `npm run test && npm run build`
Expected: all tests PASS; build succeeds. Manually confirm (browser) that setting `localStorage["mrs-theme"]="dark"` and reloading shows dark immediately with no light flash.

- [ ] **Step 7: Commit.**

```bash
git add lib/theme.ts lib/__tests__/theme.test.ts app/layout.tsx
git commit -m "feat: no-flash theme/font-size boot script + tested theme helper"
```

---

### Task 3: `ThemeControl` toggle component

A client component mirroring `FontSizeControl`: a sun/moon pill that flips `data-theme` on `<html>` and persists to `localStorage`. Its flip logic uses the `nextTheme` helper already unit-tested in Task 2; per the test convention the component itself is verified by build + manual check (no render test).

**Files:**
- Create: `components/ThemeControl.tsx`

**Interfaces:**
- Consumes: `THEME_STORAGE_KEY`, `resolveInitialTheme`, `nextTheme`, `type Theme` from `lib/theme.ts` (Task 2).
- Produces: `ThemeControl` (default + named export), a fixed-position toggle rendering a `<button role="switch" aria-checked>` labeled "Toggle dark mode".

- [ ] **Step 1: Implement the component.** Create `components/ThemeControl.tsx`:

```tsx
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
      className="fixed bottom-4 left-[5.5rem] z-50 flex items-center rounded-full border px-1 py-1"
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
```

- [ ] **Step 2: Verify the build compiles** (the flip logic is already covered by Task 2's `nextTheme` tests).

Run: `npm run test && npm run build`
Expected: all tests PASS; build succeeds.

- [ ] **Step 3: Commit.**

```bash
git add components/ThemeControl.tsx
git commit -m "feat: add ThemeControl sun/moon toggle (persisted)"
```

---

### Task 4: Mount toggle globally + tokenize hardcoded dark colors

Mount `ThemeControl` once in the root layout so it appears on every surface (founder, admin, present, home), and replace hardcoded dark-only hex colors with tokens so text stays readable in light mode.

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/(participant)/layout.tsx`
- Modify: `app/(admin)/layout.tsx`
- Modify: `components/FontSizeControl.tsx`
- Modify: `components/result/DimensionBars.tsx`
- Modify: `components/result/StageBadge.tsx`

**Interfaces:**
- Consumes: `ThemeControl` (Task 3); tokens `--pulse-text`, `--pulse-text-muted`, `--pulse-track` (Task 1).

- [ ] **Step 1: Mount `ThemeControl` in the root layout body.** In `app/layout.tsx`, add the import and render it inside `<body>` so it's global:

```tsx
import { ThemeControl } from "@/components/ThemeControl";
```

Change the body to:

```tsx
      <body className="min-h-full flex flex-col">
        {children}
        <ThemeControl />
      </body>
```

- [ ] **Step 2: Tokenize the participant layout text color.** In `app/(participant)/layout.tsx`, change the inner wrapper `className` from `… py-10 text-[#ECEAF6]` to use the token via inline style. Replace:

```tsx
        <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-10 text-[#ECEAF6]">
```

with:

```tsx
        <div
          className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-10"
          style={{ color: "var(--pulse-text)" }}
        >
```

- [ ] **Step 3: Tokenize the admin layout text color.** In `app/(admin)/layout.tsx`, replace the whole component body:

```tsx
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ color: "var(--pulse-text)" }}>
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Tokenize `FontSizeControl` text colors.** In `components/FontSizeControl.tsx`, the two buttons use `text-[#ECEAF6]` and the label uses `text-[#A9A9C9]`. Replace `className="… text-[#ECEAF6] …"` on both buttons by removing the `text-[#ECEAF6]` utility and adding `style={{ color: "var(--pulse-text)" }}`; and on the `<span>` label remove `text-[#A9A9C9]` and add `style={{ color: "var(--pulse-text-muted)" }}`. Concretely, the decrease button becomes:

```tsx
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
```

the label span becomes:

```tsx
      <span
        className="w-8 text-center text-[10px] font-semibold"
        style={{ color: "var(--pulse-text-muted)" }}
      >
        {Math.round((px / DEFAULT) * 100)}%
      </span>
```

and the increase button mirrors the decrease button (keep `text-[17px]`, remove `text-[#ECEAF6]`, add the same `style`).

- [ ] **Step 5: Tokenize `DimensionBars` colors + track.** In `components/result/DimensionBars.tsx`:
  - The overall total `<p className="font-display text-2xl font-bold text-[#ECEAF6]">` → remove `text-[#ECEAF6]`, add `style={{ color: "var(--pulse-text)" }}`.
  - The `/ 100` span `text-[#A9A9C9]` → remove it, add `style={{ color: "var(--pulse-text-muted)" }}`.
  - The dimension label `<span className="font-medium text-[#ECEAF6]">` → remove `text-[#ECEAF6]`, add `style={{ color: "var(--pulse-text)" }}`.
  - The `{score}/{max}` span `text-[#A9A9C9]` → remove it, add `style={{ color: "var(--pulse-text-muted)" }}`.
  - The bar track `<div className="h-2.5 w-full overflow-hidden rounded-full bg-white/[0.08]">` → replace `bg-white/[0.08]` with an inline token: `className="h-2.5 w-full overflow-hidden rounded-full"` and `style={{ background: "var(--pulse-track)" }}`.

- [ ] **Step 6: Tokenize the `StageBadge` blurb.** In `components/result/StageBadge.tsx`, the blurb `<p className="max-w-sm text-sm leading-relaxed text-[#A9A9C9]">` → remove `text-[#A9A9C9]`, add `style={{ color: "var(--pulse-text-muted)" }}`. (The glowing stage pill uses `--stage-*` tokens already, which Task 1 deepened for light — leave it.)

- [ ] **Step 7: Verify tests + build.**

Run: `npm run test && npm run build`
Expected: all tests PASS; build succeeds. Manually confirm the toggle appears bottom-left on the founder, results, admin, and present screens, and flips the whole UI light↔dark with readable text in both.

- [ ] **Step 8: Commit.**

```bash
git add app/layout.tsx "app/(participant)/layout.tsx" "app/(admin)/layout.tsx" components/FontSizeControl.tsx components/result/DimensionBars.tsx components/result/StageBadge.tsx
git commit -m "feat: mount ThemeControl globally + tokenize hardcoded dark colors"
```

---

### Task 5: Expressive content motion (step direction, canvas reveal, hover-lift)

Add the remaining expressive touches: a direction-aware `StepTransition` (default forward), a staggered reveal of the Lean Canvas grid on results load, and hover-lift on interactive result cards.

**Files:**
- Modify: `components/motion/StepTransition.tsx`
- Create: `components/motion/__tests__/step-transition.test.ts`
- Modify: `components/participant/ParticipantWizard.tsx`
- Modify: `components/result/CanvasBoard.tsx`

**Interfaces:**
- Consumes: `.pulse-hover-lift` (Task 1).
- Produces: `StepTransition` now accepts optional `direction?: "forward" | "back"` (default `"forward"`); existing `stepKey`/`children`/`className` props unchanged. Exports pure helper `stepSlideOffset(direction: "forward" | "back"): number`.

- [ ] **Step 1: Write the failing test** for the pure slide-offset helper (node env, matches repo convention). Create `components/motion/__tests__/step-transition.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { stepSlideOffset } from "@/components/motion/StepTransition";

describe("stepSlideOffset", () => {
  it("slides in from the right for forward", () => {
    expect(stepSlideOffset("forward")).toBe(24);
  });

  it("slides in from the left for back", () => {
    expect(stepSlideOffset("back")).toBe(-24);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails.**

Run: `npm run test -- components/motion/__tests__/step-transition.test.ts`
Expected: FAIL — `stepSlideOffset` is not exported.

- [ ] **Step 3: Implement direction-aware transitions.** Replace `components/motion/StepTransition.tsx` with:

```tsx
"use client";

import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";

export type StepDirection = "forward" | "back";

/** Horizontal enter offset (px) for a step slide. Forward enters from the right. */
export function stepSlideOffset(direction: StepDirection): number {
  return direction === "back" ? -24 : 24;
}

export interface StepTransitionProps {
  stepKey: string | number;
  children: ReactNode;
  className?: string;
  /** Slide direction; "forward" (default) slides in from the right. */
  direction?: StepDirection;
}

export function StepTransition({
  stepKey,
  children,
  className,
  direction = "forward",
}: StepTransitionProps) {
  const dx = stepSlideOffset(direction);
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={stepKey}
        initial={{ opacity: 0, x: dx }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -dx }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export default StepTransition;
```

- [ ] **Step 4: Run the test to verify it passes.**

Run: `npm run test -- components/motion/__tests__/step-transition.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Pass `direction="forward"` from the wizard.** In `components/participant/ParticipantWizard.tsx`, the wizard only advances forward, so make the intent explicit. Change line ~145 from:

```tsx
      <StepTransition stepKey={section.key} className="flex flex-1 flex-col">
```

to:

```tsx
      <StepTransition stepKey={section.key} direction="forward" className="flex flex-1 flex-col">
```

- [ ] **Step 6: Add a staggered reveal to the Lean Canvas grid.** In `components/result/CanvasBoard.tsx`, the grid is the `<div className="grid h-full w-full border border-black bg-white" …>` that maps `LEAN_CANVAS_BLOCKS`. Convert that grid container and its direct block children to a motion stagger. Change the grid wrapper to a `motion.div` with variants, and wrap each mapped block in a `motion.div` item. Specifically, replace the grid opening tag and each block's outer `<div key={block.key} …>` as follows.

Grid container — change:

```tsx
            <div
              className="grid h-full w-full border border-black bg-white"
              style={{
                gridTemplateColumns: "repeat(10, minmax(0, 1fr))",
                gridTemplateRows: "repeat(3, minmax(0, 1fr))",
              }}
            >
```

to:

```tsx
            <motion.div
              className="grid h-full w-full border border-black bg-white"
              style={{
                gridTemplateColumns: "repeat(10, minmax(0, 1fr))",
                gridTemplateRows: "repeat(3, minmax(0, 1fr))",
              }}
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: shouldReduceMotion ? 0 : 0.05 } },
              }}
              initial="hidden"
              animate="show"
            >
```

Each block wrapper — change:

```tsx
                  <div
                    key={block.key}
                    style={{ gridArea: block.gridArea }}
                    className="flex flex-col divide-y divide-black border border-black overflow-hidden"
                  >
```

to:

```tsx
                  <motion.div
                    key={block.key}
                    style={{ gridArea: block.gridArea }}
                    className="flex flex-col divide-y divide-black border border-black overflow-hidden"
                    variants={{
                      hidden: shouldReduceMotion ? {} : { opacity: 0, scale: 0.94 },
                      show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 26 } },
                    }}
                  >
```

Then close that block wrapper with `</motion.div>` instead of `</div>` (the closing tag right after the `subPiece ? … : null` ternary), and close the grid container with `</motion.div>` instead of `</div>`. (`motion` and `shouldReduceMotion` are already imported/defined in this file.)

- [ ] **Step 7: Apply `.pulse-hover-lift` to interactive result cards.** Search for result cards using the shared card class:

Run: `grep -rn "pulse-card" components/result app`

For each `.pulse-card` element that is a self-contained panel (e.g. in `components/result/ResultView.tsx`), append `pulse-hover-lift` to its `className` (e.g. `className="pulse-card … "` → `className="pulse-card pulse-hover-lift … "`). Do NOT add it to the Lean Canvas white grid or to full-width text blocks — only discrete cards.

- [ ] **Step 8: Verify tests + build.**

Run: `npm run test && npm run build`
Expected: all tests PASS; build succeeds. Manually confirm: canvas cells stagger in on the results screen, cards lift on hover (desktop), step transitions slide, and everything freezes under OS "reduce motion".

- [ ] **Step 9: Commit.**

```bash
git add components/motion/StepTransition.tsx components/motion/__tests__/step-transition.test.ts components/participant/ParticipantWizard.tsx components/result/CanvasBoard.tsx components/result/ResultView.tsx
git commit -m "feat: direction-aware step transitions, staggered canvas reveal, card hover-lift"
```

---

## Manual verification checklist (run after Task 5)

- [ ] First load (cleared storage) shows the **light** theme.
- [ ] Toggle flips light↔dark on all four surfaces (founder journey, results/canvas, admin dashboard, projected present view); choice survives reload with **no flash**.
- [ ] Text is readable (AA) in both themes; violet/pink accents present in both.
- [ ] Lean Canvas board stays a white paper artifact in both themes.
- [ ] Ambient background drifts subtly; canvas cells stagger in; numbers count up; cards lift on hover; buttons depress on press.
- [ ] Enabling OS "Reduce Motion" freezes the ambient background and all decorative motion.
- [ ] `npm run test` green (existing 67 + new theme/ThemeControl/StepTransition tests).
