import { describe, it, expect, vi, beforeEach } from "vitest";
const getParticipant = vi.fn(); const getResponses = vi.fn();
const saveResult = vi.fn(); const getResult = vi.fn();
const mockEvaluate = vi.fn(); const openRouterEvaluate = vi.fn(); const hasOpenRouterKey = vi.fn();
vi.mock("@/db/queries/participants", () => ({ getParticipant }));
vi.mock("@/db/queries/responses", () => ({ getResponses }));
vi.mock("@/db/queries/results", () => ({ saveResult, getResult }));
vi.mock("../mock", () => ({ mockEvaluate }));
vi.mock("../openrouter", () => ({ openRouterEvaluate, hasOpenRouterKey }));

const RESULT = { backendScore: 10 } as any;
beforeEach(() => { vi.clearAllMocks(); getParticipant.mockResolvedValue({ id: "p1", founderName: "A", startupName: "S" }); getResponses.mockResolvedValue([]); mockEvaluate.mockReturnValue(RESULT); });

it("uses mock when no key and saves", async () => {
  hasOpenRouterKey.mockReturnValue(false);
  const { evaluateParticipant } = await import("../evaluate");
  const r = await evaluateParticipant("p1");
  expect(r).toBe(RESULT); expect(openRouterEvaluate).not.toHaveBeenCalled();
  expect(saveResult).toHaveBeenCalledWith("p1", RESULT);
});
it("falls back to mock when openrouter throws", async () => {
  hasOpenRouterKey.mockReturnValue(true); openRouterEvaluate.mockRejectedValue(new Error("boom"));
  const { evaluateParticipant } = await import("../evaluate");
  const r = await evaluateParticipant("p1");
  expect(r).toBe(RESULT); expect(saveResult).toHaveBeenCalledWith("p1", RESULT);
});
it("getOrCreateResult returns existing without evaluating", async () => {
  getResult.mockResolvedValue(RESULT);
  const { getOrCreateResult } = await import("../evaluate");
  expect(await getOrCreateResult("p1")).toBe(RESULT);
  expect(mockEvaluate).not.toHaveBeenCalled();
});
