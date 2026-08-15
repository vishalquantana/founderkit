import { describe, it, expect, vi, beforeEach } from "vitest";

const { createParticipant, saveResponse, completeParticipant } = vi.hoisted(() => ({
  createParticipant: vi.fn(),
  saveResponse: vi.fn(),
  completeParticipant: vi.fn(),
}));
vi.mock("@/db/queries/participants", () => ({ createParticipant, completeParticipant }));
vi.mock("@/db/queries/responses", () => ({ saveResponse }));

import { startParticipant, saveSectionAnswer, finishParticipant } from "../actions";

describe("participant actions", () => {
  beforeEach(() => { createParticipant.mockReset(); saveResponse.mockReset(); completeParticipant.mockReset(); });

  it("startParticipant returns new id", async () => {
    createParticipant.mockResolvedValue({ id: "p1" });
    expect(await startParticipant({ workshopId: "w1", founderName: "A", startupName: "S", contact: "c" }))
      .toEqual({ participantId: "p1" });
  });
  it("saveSectionAnswer forwards to saveResponse", async () => {
    await saveSectionAnswer({ participantId: "p1", section: "problem", mainAnswer: "x" });
    expect(saveResponse).toHaveBeenCalledWith({ participantId: "p1", section: "problem", mainAnswer: "x" });
  });
  it("finishParticipant completes", async () => {
    await finishParticipant("p1");
    expect(completeParticipant).toHaveBeenCalledWith("p1");
  });
});
