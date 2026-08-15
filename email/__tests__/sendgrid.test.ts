import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const ORIGINAL_ENV = { ...process.env };

describe("hasSendgrid", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("returns true when both env vars are set", async () => {
    process.env.SENDGRID_API_KEY = "key";
    process.env.SENDGRID_FROM_EMAIL = "noreply@quantana.top";
    const { hasSendgrid } = await import("../sendgrid");
    expect(hasSendgrid()).toBe(true);
  });

  it("returns false when a env var is missing", async () => {
    delete process.env.SENDGRID_API_KEY;
    process.env.SENDGRID_FROM_EMAIL = "noreply@quantana.top";
    const { hasSendgrid } = await import("../sendgrid");
    expect(hasSendgrid()).toBe(false);
  });
});

describe("sendEmail", () => {
  const input = {
    to: "vishal@quantana.com.au",
    subject: "Test subject",
    html: "<p>hi</p>",
    text: "hi",
  };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
    process.env.SENDGRID_API_KEY = "key";
    process.env.SENDGRID_FROM_EMAIL = "noreply@quantana.top";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = { ...ORIGINAL_ENV };
  });

  it("returns ok:true on a 202 response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 202 });
    vi.stubGlobal("fetch", fetchMock);

    const { sendEmail } = await import("../sendgrid");
    const result = await sendEmail(input);

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.sendgrid.com/v3/mail/send",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer key",
        }),
      })
    );

    const [, options] = fetchMock.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body).toEqual({
      personalizations: [{ to: [{ email: input.to }] }],
      from: { email: "noreply@quantana.top" },
      subject: input.subject,
      content: [
        { type: "text/plain", value: input.text },
        { type: "text/html", value: input.html },
      ],
    });
  });

  it("returns ok:false on a 500 response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    vi.stubGlobal("fetch", fetchMock);

    const { sendEmail } = await import("../sendgrid");
    const result = await sendEmail(input);

    expect(result).toEqual({ ok: false });
  });

  it("returns ok:false and does not throw on a network error", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network down"));
    vi.stubGlobal("fetch", fetchMock);

    const { sendEmail } = await import("../sendgrid");
    await expect(sendEmail(input)).resolves.toEqual({ ok: false });
  });
});
