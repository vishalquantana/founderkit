"use client";

import { useEffect } from "react";
import { sendSlackErrorAlert } from "@/lib/slack-logger";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    sendSlackErrorAlert({
      source: "frontend",
      error,
      url: typeof window !== "undefined" ? window.location.href : undefined,
      digest: error.digest,
    });
  }, [error]);

  return (
    <html>
      <body className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-background text-foreground">
        <div className="mx-auto max-w-md rounded-2xl border border-red-500/20 bg-red-500/10 p-6">
          <h2 className="text-lg font-bold text-red-600 dark:text-red-400">Something went wrong</h2>
          <p className="mt-2 text-xs text-muted">
            An unexpected error occurred. An alert has been automatically logged.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="pulse-btn mt-6 px-4 py-2 text-xs font-semibold"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
