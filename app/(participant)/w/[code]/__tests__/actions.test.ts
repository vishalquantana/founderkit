import { describe, it, expect, vi, beforeEach } from "vitest";

const { createParticipant, saveResponse, completeParticipant, getWorkshopById, maybeEmailResult, probeSection } = vi.hoisted(() => ({
  createParticipant: vi.fn(),
  saveResponse: vi.fn(),
  completeParticipant: vi.fn(),
  getWorkshopById: vi.fn(),
  maybeEmailResult: vi.fn(),
  probeSection: vi.fn(),
}));
vi.mock("@/db/queries/participants", () => ({ createParticipant, completeParticipant }));
vi.mock("@/db/queries/responses", () => ({ saveResponse }));
vi.mock("@/db/queries/workshops", () => ({ getWorkshopById }));
vi.mock("@/email/send-result", () => ({ maybeEmailResult }));
vi.mock("@/ai/probe", () => ({ probeSection }));

// Simple in-memory cookie store standing in for next/headers' cookies().
const cookieStore = new Map<string, string>();
const cookiesApi = {
  get: (name: string) => (cookieStore.has(name) ? { name, value: cookieStore.get(name)! } : undefined),
  set: (name: string, value: string) => { cookieStore.set(name, value); },
};
vi.mock("next/headers", () => ({ cookies: vi.fn(async () => cookiesApi) }));

import { startParticipant, saveSectionAnswer, finishParticipant, probeSectionAction } from "../actions";

describe("participant actions", () => {
  beforeEach(() => {
    createParticipant.mockReset();
    saveResponse.mockReset();
    completeParticipant.mockReset();
    getWorkshopById.mockReset();
    maybeEmailResult.mockReset();
    maybeEmailResult.mockResolvedValue(undefined);
    probeSection.mockReset();
    cookieStore.clear();
  });

  it("startParticipant returns new id and sets the mrs_pid cookie", async () => {
    getWorkshopById.mockResolvedValue({ id: "w1", status: "live" });
    createParticipant.mockResolvedValue({ id: "p1" });
    const result = await startParticipant({ workshopId: "w1", founderName: "A", startupName: "S", contact: "c" });
    expect(result).toEqual({ participantId: "p1" });
    expect(cookieStore.get("mrs_pid")).toBe("p1");
  });

  it("startParticipant works for a draft workshop", async () => {
    getWorkshopById.mockResolvedValue({ id: "w1", status: "draft" });
    createParticipant.mockResolvedValue({ id: "p1" });
    await expect(
      startParticipant({ workshopId: "w1", founderName: "A", startupName: "S", contact: "c" }),
    ).resolves.toEqual({ participantId: "p1" });
  });

  it("startParticipant throws when the workshop is closed", async () => {
    getWorkshopById.mockResolvedValue({ id: "w1", status: "closed" });
    await expect(
      startParticipant({ workshopId: "w1", founderName: "A", startupName: "S", contact: "c" }),
    ).rejects.toThrow();
    expect(createParticipant).not.toHaveBeenCalled();
  });

  it("startParticipant throws when the workshop is missing", async () => {
    getWorkshopById.mockResolvedValue(undefined);
    await expect(
      startParticipant({ workshopId: "missing", founderName: "A", startupName: "S", contact: "c" }),
    ).rejects.toThrow();
    expect(createParticipant).not.toHaveBeenCalled();
  });

  it("startParticipant throws for blank required fields", async () => {
    getWorkshopById.mockResolvedValue({ id: "w1", status: "live" });
    await expect(
      startParticipant({ workshopId: "w1", founderName: "  ", startupName: "S", contact: "c" }),
    ).rejects.toThrow();
    expect(createParticipant).not.toHaveBeenCalled();
  });

  it("saveSectionAnswer forwards to saveResponse when the cookie matches", async () => {
    cookieStore.set("mrs_pid", "p1");
    await saveSectionAnswer({ participantId: "p1", section: "problem", mainAnswer: "x" });
    expect(saveResponse).toHaveBeenCalledWith({ participantId: "p1", section: "problem", mainAnswer: "x" });
  });

  it("saveSectionAnswer throws when the cookie is missing", async () => {
    await expect(
      saveSectionAnswer({ participantId: "p1", section: "problem", mainAnswer: "x" }),
    ).rejects.toThrow();
    expect(saveResponse).not.toHaveBeenCalled();
  });

  it("saveSectionAnswer throws when the cookie mismatches", async () => {
    cookieStore.set("mrs_pid", "someone-else");
    await expect(
      saveSectionAnswer({ participantId: "p1", section: "problem", mainAnswer: "x" }),
    ).rejects.toThrow();
    expect(saveResponse).not.toHaveBeenCalled();
  });

  it("finishParticipant completes when the cookie matches", async () => {
    cookieStore.set("mrs_pid", "p1");
    await finishParticipant("p1");
    expect(completeParticipant).toHaveBeenCalledWith("p1");
    expect(maybeEmailResult).toHaveBeenCalledWith("p1");
  });

  it("finishParticipant still completes when maybeEmailResult rejects", async () => {
    cookieStore.set("mrs_pid", "p1");
    maybeEmailResult.mockRejectedValue(new Error("email boom"));
    await expect(finishParticipant("p1")).resolves.toBeUndefined();
    expect(completeParticipant).toHaveBeenCalledWith("p1");
  });

  it("finishParticipant throws when the cookie is missing", async () => {
    await expect(finishParticipant("p1")).rejects.toThrow();
    expect(completeParticipant).not.toHaveBeenCalled();
  });

  it("finishParticipant throws when the cookie mismatches", async () => {
    cookieStore.set("mrs_pid", "someone-else");
    await expect(finishParticipant("p1")).rejects.toThrow();
    expect(completeParticipant).not.toHaveBeenCalled();
  });

  it("saveSectionAnswer forwards probeQuestion/probeAnswer to saveResponse", async () => {
    cookieStore.set("mrs_pid", "p1");
    await saveSectionAnswer({
      participantId: "p1",
      section: "problem",
      mainAnswer: "x",
      probeQuestion: "Who exactly faces this?",
      probeAnswer: "Small kirana stores",
    });
    expect(saveResponse).toHaveBeenCalledWith({
      participantId: "p1",
      section: "problem",
      mainAnswer: "x",
      probeQuestion: "Who exactly faces this?",
      probeAnswer: "Small kirana stores",
    });
  });

  it("probeSectionAction returns null when probeEnabled is false", async () => {
    const result = await probeSectionAction({ section: "problem", mainAnswer: "x", probeEnabled: false });
    expect(result).toEqual({ question: null });
    expect(probeSection).not.toHaveBeenCalled();
  });

  it("probeSectionAction returns the mocked probe question when enabled and needed", async () => {
    probeSection.mockResolvedValue({ needsProbe: true, question: "Who exactly faces this?" });
    const result = await probeSectionAction({ section: "problem", mainAnswer: "x", probeEnabled: true });
    expect(result).toEqual({ question: "Who exactly faces this?" });
    expect(probeSection).toHaveBeenCalledWith({ section: "problem", mainAnswer: "x" });
  });

  it("probeSectionAction returns null when enabled but no probe is needed", async () => {
    probeSection.mockResolvedValue({ needsProbe: false, question: null });
    const result = await probeSectionAction({ section: "problem", mainAnswer: "x", probeEnabled: true });
    expect(result).toEqual({ question: null });
  });

  it("probeSectionAction never throws — returns null when probeSection rejects", async () => {
    probeSection.mockRejectedValue(new Error("boom"));
    await expect(
      probeSectionAction({ section: "problem", mainAnswer: "x", probeEnabled: true }),
    ).resolves.toEqual({ question: null });
  });
});
