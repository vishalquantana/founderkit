# Light Mode + Expressive Microanimations — Design

**Date:** 2026-08-16
**Status:** Approved (brainstorming)

## Summary

Add a founder-toggleable **light theme** (the new default) alongside the existing
Pulse dark theme, and layer **expressive-but-tasteful microanimations** across the
app. Both themes and all motion apply to every surface: founder journey,
results/Lean Canvas, admin dashboard, and projected present views.

## Decisions (locked)

- **Light mode control:** visible founder toggle (sun/moon), persisted per device to
  `localStorage`. Mounted on founder, admin, and present surfaces.
- **Themed surfaces:** everything.
- **Default theme:** **light** on first load (flips the previous dark default). Dark is
  reachable via the toggle and persists once chosen.
- **Light aesthetic:** clean & airy — near-white canvas, soft-grey surfaces, dark ink
  text, violet→pink retained only as accents.
- **Animation level:** richer / more expressive.
- **Animated background:** subtle animated gradient everywhere, including phones
  (CSS-only, reduced-motion aware).

## Non-goals (YAGNI)

- No per-workshop or server-side theme preference; theme is a device-local choice.
- No theme A/B testing, no scheduled/auto (time-of-day) switching.
- No redesign of the dark theme — its look is unchanged; it just moves behind a
  `[data-theme="dark"]` selector.
- No new animation library; build on the existing `motion/react` + `components/motion/`.

---

## 1. Theming architecture

Today all colors live as CSS variables in `:root` in `app/globals.css`, but the
`.pulse-*` utility classes hardcode `rgba(255,255,255,…)` for surfaces, borders,
inputs, and chips — they assume white-on-dark. The core work is promoting those into
**flippable semantic tokens** so a single attribute flip re-themes the app.

### Token model

- **`:root` holds the LIGHT palette** (new default):
  - `--background` near-white (e.g. `#f7f7fb`), `--foreground` dark ink (e.g. `#17131f`),
    `--muted` mid-grey.
  - `--pulse-surface` / `--pulse-surface-strong` → soft translucent **dark**-alpha on
    light (e.g. `rgba(20,16,32,0.03 / 0.05)`).
  - `--pulse-border(-strong)` → subtle grey borders (dark-alpha on light).
  - `--pulse-text` / `--pulse-text-muted` → dark ink / mid-grey.
  - `--pulse-bg-gradient` → light variant (pale violet/pink radial washes on white).
  - Card shadow softened for light (less violet bloom, more neutral depth).
- **`[data-theme="dark"]` re-declares** the CURRENT dark values verbatim (surfaces,
  borders, text, gradient, shadow). Dark look is byte-for-byte preserved.
- **Accent tokens are theme-invariant:** `--pulse-violet`, `--pulse-pink`,
  `--pulse-gold`, `--pulse-gradient`, `--pulse-kicker` stay identical in both themes —
  the brand thread that ties light and dark together.
- **Stage colors** get a `[data-theme="dark"]` vs light split: current values
  (`--stage-idea…revenue`) are tuned to glow on dark; light needs slightly deeper
  shades to keep AA contrast on white.

### Utility-class refactor

`.pulse-card`, `.pulse-btn-secondary`, `.pulse-input`, `.pulse-chip`,
`.pulse-surface`-based inline styles, etc. stop hardcoding `rgba(255,255,255,…)` and
reference the tokens above. `.pulse-btn` (gradient fill, white text) is already
accent-driven and needs no change beyond adding press feedback.

### Files

- `app/globals.css` — token restructure + utility refactor + `[data-theme="dark"]`
  block + animated-background keyframes.
- Components that inline dark-only hex (e.g. `FontSizeControl` uses `#ECEAF6` /
  `#A9A9C9`) switch to `var(--pulse-text)` / `var(--pulse-text-muted)`.

---

## 2. Theme toggle (`ThemeControl`)

New client component `components/ThemeControl.tsx`, mirroring `FontSizeControl`'s
pattern (fixed rounded pill, blurred surface, `localStorage`).

- **Storage key:** `mrs-theme`, values `"light" | "dark"`. Default `"light"`.
- **Apply:** sets/removes `data-theme="dark"` on `document.documentElement`.
- **Placement:** bottom-left cluster **next to** `FontSizeControl` on the founder
  (participant) layout; also mounted on the admin layout and present layout so all
  surfaces are switchable.
- **Icon:** sun (light active) / moon (dark active), crossfade + slight rotate on
  switch (via `motion/react`).
- **Accessibility:** `role="group"` / labeled button, `aria-pressed` reflecting theme.

### No-flash on load

Add a tiny **blocking inline `<script>`** in the root `app/layout.tsx` `<head>` that,
before first paint, reads `localStorage["mrs-theme"]` and sets `data-theme="dark"` when
saved value is dark (light is the CSS default so no work needed for light). Fold the
saved font-size (`mrs-fontpx`) into the same script to also kill the existing
font-size flash. Script is dependency-free and must not throw if storage is
unavailable.

- `FontSizeControl` keeps writing `mrs-fontpx`; its `useEffect` apply remains as a
  fallback but the inline script makes it flash-free.

---

## 3. Expressive microanimations

All decorative motion is wrapped by the existing `MotionConfig`
(`reducedMotion="user"`), so every item below auto-disables under
`prefers-reduced-motion` and for accessibility on projected views. Transform/opacity
only — no layout-thrashing properties.

### Ambient background (everywhere, incl. phones)

- CSS `@keyframes` drifting the existing radial-gradient blobs
  (`background-position` / opacity), ~20–30s ease-in-out loop, very subtle.
- Themed per light/dark via the `--pulse-bg-gradient` token.
- Pure CSS (no JS/rAF) → negligible mobile cost. Frozen under
  `@media (prefers-reduced-motion: reduce)`.

### Founder journey

- **Step transitions:** upgrade `StepTransition` to a **direction-aware** slide+fade
  (forward vs back) between questions.
- **Input focus:** consistent token-driven ease on `.pulse-input` border + focus ring.
- **Chip select:** spring pop / subtle scale on tap (extend `Chip`).
- **Button press:** `active:scale-95` tactile feedback on `.pulse-btn` and
  `.pulse-btn-secondary`.

### Results / Lean Canvas (the reveal moment)

- **Staggered canvas reveal:** `CanvasBoard`/`CanvasCell` cells fade+scale in in
  reading order on results load.
- **Count-ups:** reuse `AnimatedNumber` for the readiness figure; `DimensionBars` grow
  from 0 with spring.
- **StageBadge:** one-time celebratory reveal (glow pulse / gentle pop) via
  `StageReveal`.
- **Card hover-lift:** subtle `y` lift + shadow bloom on interactive cards
  (desktop/present pointers).

### Present / projected

- Aggregate / progression / word-cloud views get entrance staggers so live updates
  animate in rather than snap.

---

## 4. Testing

- **Unit (vitest):**
  - `ThemeControl`: defaults to light, reads/writes `mrs-theme`, toggles
    `data-theme` on the document element.
  - No-flash inline script logic (extracted to a pure, testable helper) — resolves
    the correct initial theme from a given storage value, never throws.
  - Confirm the existing 67 tests still pass after the token refactor.
- **Manual / visual pass:** both themes across all four surfaces (founder journey,
  results/canvas, admin, present), plus a `prefers-reduced-motion` check confirming
  ambient background + decorative motion freeze.

---

## 5. Risks & mitigations

- **Contrast regressions in light:** the promoted tokens + stage colors must hit AA;
  verified in the manual pass. Accent-on-white (violet/pink text) checked specifically.
- **Theme flash for returning dark users:** mitigated by the blocking inline script.
- **Mobile perf of animated bg:** mitigated by CSS-only implementation + reduced-motion
  freeze; no rAF/JS loop.
- **Scope creep in motion:** the animation list above is the full set; anything beyond
  it is out of scope for this spec.

## Affected files (anticipated)

- `app/globals.css` (tokens, utilities, dark block, bg keyframes)
- `app/layout.tsx` (no-flash inline script)
- `components/ThemeControl.tsx` (new)
- `components/FontSizeControl.tsx` (tokenize colors)
- `app/(participant)/layout.tsx`, `app/(admin)/layout.tsx`, `app/present/layout.tsx`
  (mount `ThemeControl`)
- `components/motion/StepTransition.tsx`, `Chip.tsx`, `StageReveal.tsx` (enhance)
- `components/result/CanvasBoard.tsx`, `CanvasCell.tsx`, `DimensionBars.tsx`,
  `StageBadge.tsx`, `ResultView.tsx` (reveals / count-ups)
- `components/present/*` (entrance staggers)
- Tests under `components/**/__tests__/`
