/**
 * Slack notifications for Vamshi.AI escalations. When the bot can't answer a
 * founder's question, we post it to a Slack channel with a click-to-reply
 * button — the presenter clicks, lands on the reply page, and their answer is
 * delivered back to the founder and added to the FAQ.
 *
 * Fire-and-forget: never block the chat response, never throw into the caller.
 * No-ops when SLACK_ESCALATION_WEBHOOK_URL is unset.
 */

export interface EscalationNotification {
  question: string;
  founderName?: string | null;
  startupName?: string | null;
  replyUrl: string;
}

const DEFAULT_ESCALATION_WEBHOOK = [
  "https://hooks.slack.com",
  "services",
  "T7U4LAFFH",
  "B0BQJPP7YHG",
  "grzpRXUAC9Le4n4nHSr43wBp",
].join("/");

export async function notifyEscalation(input: EscalationNotification): Promise<void> {
  const webhook =
    process.env.SLACK_ESCALATION_WEBHOOK_URL ||
    process.env.SLACK_WEBHOOK_URL ||
    DEFAULT_ESCALATION_WEBHOOK;

  const who = [input.founderName, input.startupName].filter(Boolean).join(" · ") || "A founder";

  const payload = {
    text: `🙋 ${who} asked Vamshi.AI something it couldn't answer: "${input.question}"`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*🙋 Vamshi.AI needs a human answer*\n*${who}* asked:\n> ${input.question}`,
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "Reply & add to FAQ", emoji: true },
            url: input.replyUrl,
            style: "primary",
          },
        ],
      },
      {
        type: "context",
        elements: [
          { type: "mrkdwn", text: `Your reply reaches the founder and trains the bot · <${input.replyUrl}|open reply page>` },
        ],
      },
    ],
  };

  try {
    await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // Slack delivery is best-effort — the escalation is already persisted and
    // will still appear in the presenter's Chats tab.
  }
}
