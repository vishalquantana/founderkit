"use client";

import { useEffect } from "react";
import { sendSlackErrorAlert } from "@/lib/slack-logger";

/**
 * Global client-side error listener that captures:
 * 1. window.onerror (uncaught exceptions in any JS code)
 * 2. window.onunhandledrejection (unhandled async promise rejections / failed fetches)
 * 3. console.error overrides (captures React render error logs and library warnings)
 */
export function ClientErrorListener() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      // Ignore extension errors or cross-origin script errors with no details
      if (!event.error && !event.message) return;
      void sendSlackErrorAlert({
        source: "frontend",
        error: event.error || event.message,
        url: window.location.href,
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (!event.reason) return;
      void sendSlackErrorAlert({
        source: "frontend",
        error: event.reason,
        url: window.location.href,
        context: { type: "unhandledrejection" },
      });
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return null;
}
