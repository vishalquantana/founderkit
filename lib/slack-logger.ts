const DEFAULT_SLACK_WEBHOOK = [
  "https://hooks.slack.com",
  "services",
  "T7U4LAFFH",
  "B0BQLR1G4NM",
  "RBLrjSVZNIq1KSpMIGVdvGOS",
].join("/");

export const SLACK_HOOK_URL =
  process.env.SLACK_WEBHOOK_URL ||
  process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL ||
  DEFAULT_SLACK_WEBHOOK;

export interface SlackErrorPayload {
  source: "frontend" | "backend" | "server-action";
  error: unknown;
  url?: string;
  digest?: string;
  context?: Record<string, unknown>;
}

export async function sendSlackErrorAlert(payload: SlackErrorPayload): Promise<void> {
  try {
    const err = payload.error;
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "string"
        ? err
        : JSON.stringify(err);
    const stack = err instanceof Error ? err.stack : undefined;

    const slackMessage = {
      text: `🚨 *Quantana AI Cofounder Error Alert* [${payload.source.toUpperCase()}]`,
      attachments: [
        {
          color: "#dc2626",
          fields: [
            {
              title: "Source",
              value: payload.source,
              short: true,
            },
            {
              title: "Timestamp",
              value: new Date().toISOString(),
              short: true,
            },
            ...(payload.url
              ? [
                  {
                    title: "URL",
                    value: payload.url,
                    short: false,
                  },
                ]
              : []),
            ...(payload.digest
              ? [
                  {
                    title: "React Digest / Error ID",
                    value: payload.digest,
                    short: true,
                  },
                ]
              : []),
            {
              title: "Error Message",
              value: message.substring(0, 1000),
              short: false,
            },
            ...(stack
              ? [
                  {
                    title: "Stack Trace",
                    value: `\`\`\`${stack.substring(0, 1200)}\`\`\``,
                    short: false,
                  },
                ]
              : []),
            ...(payload.context
              ? [
                  {
                    title: "Context Data",
                    value: `\`\`\`${JSON.stringify(payload.context, null, 2).substring(0, 800)}\`\`\``,
                    short: false,
                  },
                ]
              : []),
          ],
        },
      ],
    };

    if (typeof window !== "undefined") {
      // Client-side fetch
      void fetch(SLACK_HOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slackMessage),
      }).catch(() => {});
    } else {
      // Server-side fetch
      await fetch(SLACK_HOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slackMessage),
      }).catch(() => {});
    }
  } catch {
    // Never crash error reporting
  }
}
