import { describe, it, expect, vi, beforeEach } from "vitest";

const { getParticipant, getWorkshopById, getOrCreateResult, hasSendgrid, sendEmail, resultEmail, markResultEmailed } =
  vi.hoisted(() => ({
    getParticipant: vi.fn(),
    getWorkshopById: vi.fn(),
    getOrCreateResult: vi.fn(),
    hasSendgrid: vi.fn(),
    sendEmail: vi.fn(),
    resultEmail: vi.fn(),
    markResultEmailed: vi.fn(),
  }));

vi.mock("@/db/queries/participants", () => ({ getParticipant, markResultEmailed }));
vi.mock("@/db/queries/workshops", () => ({ getWorkshopById }));
vi.mock("@/ai/evaluate", () => ({ getOrCreateResult }));
vi.mock("../sendgrid", () => ({ hasSendgrid, sendEmail }));
vi.mock("../templates", () => ({ resultEmail }));

import { maybeEmailResult } from "../send-result";

const PARTICIPANT = {
  id: "p1",
  workshopId: "w1",
  founderName: "Asha",
  startupName: "KiranaConnect",
  contact: "asha@example.com",
  consentFollowup: true,
  resultEmailedAt: null,
};

const RESULT = { readinessStage: "mvp_candidate", summary: "Great progress." };

beforeEach(() => {
  vi.clearAllMocks();
  getParticipant.mockResolvedValue(PARTICIPANT);
  getWorkshopById.mockResolvedValue({ id: "w1", joinCode: "ABC123" });
  getOrCreateResult.mockResolvedValue(RESULT);
  hasSendgrid.mockReturnValue(true);
  resultEmail.mockReturnValue({ subject: "s", html: "h", text: "t" });
  sendEmail.mockResolvedValue({ ok: true });
});

describe("maybeEmailResult", () => {
  it("does not send when consentFollowup is false", async () => {
    getParticipant.mockResolvedValue({ ...PARTICIPANT, consentFollowup: false });
    await maybeEmailResult("p1");
    expect(sendEmail).not.toHaveBeenCalled();
    expect(markResultEmailed).not.toHaveBeenCalled();
  });

  it("does not send when already emailed", async () => {
    getParticipant.mockResolvedValue({ ...PARTICIPANT, resultEmailedAt: new Date() });
    await maybeEmailResult("p1");
    expect(sendEmail).not.toHaveBeenCalled();
    expect(markResultEmailed).not.toHaveBeenCalled();
  });

  it("does not send when sendgrid is not configured", async () => {
    hasSendgrid.mockReturnValue(false);
    await maybeEmailResult("p1");
    expect(sendEmail).not.toHaveBeenCalled();
    expect(markResultEmailed).not.toHaveBeenCalled();
  });

  it("sends and marks emailed when consent + not emailed + sendgrid configured", async () => {
    await maybeEmailResult("p1");
    expect(getOrCreateResult).toHaveBeenCalledWith("p1");
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail.mock.calls[0][0]).toMatchObject({ to: "asha@example.com", subject: "s" });
    expect(resultEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        founderName: "Asha",
        startupName: "KiranaConnect",
        stageLabel: "MVP Candidate",
        summary: "Great progress.",
        link: expect.stringContaining("/w/ABC123/result/p1"),
      }),
    );
    expect(markResultEmailed).toHaveBeenCalledWith("p1");
  });

  it("does not mark emailed and does not throw when send fails", async () => {
    sendEmail.mockResolvedValue({ ok: false });
    await expect(maybeEmailResult("p1")).resolves.toBeUndefined();
    expect(markResultEmailed).not.toHaveBeenCalled();
  });

  it("never throws even if a dependency throws", async () => {
    getOrCreateResult.mockRejectedValue(new Error("boom"));
    await expect(maybeEmailResult("p1")).resolves.toBeUndefined();
  });
});
