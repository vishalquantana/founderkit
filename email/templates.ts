type EmailContent = {
  subject: string;
  html: string;
  text: string;
};

function wrapHtml(bodyHtml: string): string {
  return `
<div style="background-color:#f6f5f2;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background-color:#ffffff;border-radius:12px;padding:32px;border:1px solid #eae7e0;">
    <p style="margin:0 0 20px;font-size:14px;font-weight:600;letter-spacing:0.02em;color:#7c6f5c;text-transform:uppercase;">
      MVP Readiness Snapshot
    </p>
    ${bodyHtml}
    <p style="margin:28px 0 0;font-size:12px;color:#a39c8f;">
      Sent with care by the MVP Readiness Snapshot team.
    </p>
  </div>
</div>`.trim();
}

export function otpEmail(code: string): EmailContent {
  const subject = "Your MVP Readiness Snapshot sign-in code";

  const html = wrapHtml(`
    <h1 style="margin:0 0 12px;font-size:20px;color:#2b2620;">Here's your sign-in code</h1>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#4a453d;">
      Enter this code to continue. It's valid for a few minutes, so grab it while it's fresh.
    </p>
    <div style="margin:0 0 20px;padding:16px 20px;background-color:#f6f5f2;border-radius:10px;text-align:center;">
      <span style="font-size:32px;font-weight:700;letter-spacing:0.2em;color:#2b2620;">${code}</span>
    </div>
    <p style="margin:0;font-size:13px;line-height:1.6;color:#7c7568;">
      If you didn't request this code, you can safely ignore this email.
    </p>
  `);

  const text = [
    "Here's your sign-in code",
    "",
    `Your MVP Readiness Snapshot sign-in code is: ${code}`,
    "",
    "This code is valid for a few minutes.",
    "If you didn't request this code, you can safely ignore this email.",
  ].join("\n");

  return { subject, html, text };
}

export function resultEmail(input: {
  founderName: string;
  startupName: string;
  stageLabel: string;
  summary: string;
  link: string;
}): EmailContent {
  const { founderName, startupName, stageLabel, summary, link } = input;
  const subject = `${startupName}'s MVP Readiness Snapshot is ready`;

  const html = wrapHtml(`
    <h1 style="margin:0 0 12px;font-size:20px;color:#2b2620;">Nice work, ${founderName}!</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#4a453d;">
      Your MVP Readiness Snapshot for <strong>${startupName}</strong> is ready. Here's where things
      stand right now:
    </p>
    <div style="margin:0 0 16px;padding:14px 18px;background-color:#f0ede4;border-radius:10px;display:inline-block;">
      <span style="font-size:14px;font-weight:600;color:#5c6b4d;">${stageLabel}</span>
    </div>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4a453d;">
      ${summary}
    </p>
    <a href="${link}" style="display:inline-block;padding:12px 24px;background-color:#5c6b4d;color:#ffffff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;">
      View your full snapshot
    </a>
    <p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#7c7568;">
      Or copy this link: <a href="${link}" style="color:#5c6b4d;">${link}</a>
    </p>
  `);

  const text = [
    `Nice work, ${founderName}!`,
    "",
    `Your MVP Readiness Snapshot for ${startupName} is ready. Here's where things stand right now:`,
    "",
    `Stage: ${stageLabel}`,
    "",
    summary,
    "",
    `View your full snapshot: ${link}`,
  ].join("\n");

  return { subject, html, text };
}
