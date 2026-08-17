"use client";

/**
 * Recovery for Next.js Server Action "version skew": after a new deployment,
 * a page loaded on an older bundle POSTs to a server-action context that no
 * longer matches (rotated encryption key / changed action id), and Next.js
 * rejects with "An unexpected response was received from the server" — which
 * surfaces as React error #441. Left uncaught it becomes an unhandledrejection
 * (log flood) and, on a user action like "Next", leaves the founder stuck.
 *
 * We detect that specific class of error and recover by reloading ONCE onto
 * the current bundle (guarded against reload loops). Any other error is passed
 * to the optional handler so real failures still surface.
 */

export function isDeploymentSkewError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? "");
  return (
    /unexpected response was received from the server/i.test(msg) ||
    /Minified React error #441/i.test(msg) ||
    /Failed to find Server Action/i.test(msg)
  );
}

const RELOAD_GUARD_KEY = "mrs-skew-reloaded-at";
const RELOAD_WINDOW_MS = 30_000;

/**
 * Handle a rejected server-action promise. Returns true if it recovered
 * (reloaded / swallowed a skew error), false if the caller should treat it as
 * a genuine failure.
 */
export function recoverFromActionError(err: unknown): boolean {
  if (typeof window === "undefined") return false;
  if (!isDeploymentSkewError(err)) return false;

  // Reload at most once per 30s so a persistently-failing action can't loop.
  try {
    const last = Number(sessionStorage.getItem(RELOAD_GUARD_KEY) || 0);
    const now = Date.now();
    if (now - last < RELOAD_WINDOW_MS) return true; // already recovering; swallow
    sessionStorage.setItem(RELOAD_GUARD_KEY, String(now));
  } catch {
    /* sessionStorage unavailable — fall through to reload */
  }
  window.location.reload();
  return true;
}
