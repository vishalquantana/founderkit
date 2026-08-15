import { describe, it, expect, vi, beforeEach } from "vitest";

const validJson = {
  backendScore: 52,
  dimensionScores: { problemClarity: 10, customerClarity: 8, valuePayment: 12, mvpQuality: 9, distribution: 7, validation: 4, teamStageFit: 2, cashflow: 0 },
  readinessStage: "mvp_candidate", summary: "s", strengths: ["a", "b"], assumptions: ["c", "d"],
  mvpExperiment: "m", sevenDayPlan: [{ day: "Day 1", text: "x" }], improvedPitch: "p", reflectionQuestion: "q",
};

describe("openRouterEvaluate", () => {
  beforeEach(() => { vi.restoreAllMocks(); process.env.OPENROUTER_API_KEY = "k"; process.env.OPENROUTER_SCORE_MODEL = "m"; });

  it("returns a validated result", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify(validJson) } }],
    }))));
    const { openRouterEvaluate } = await import("../openrouter");
    const r = await openRouterEvaluate({ participant: { founderName: "A", startupName: "S" }, responses: [] });
    expect(r.readinessStage).toBe("mvp_candidate");
  });

  it("overrides an inconsistent model-provided stage with the score-derived stage", async () => {
    const inconsistent = { ...validJson, backendScore: 5, readinessStage: "revenue_ready" };
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify(inconsistent) } }],
    }))));
    const { openRouterEvaluate } = await import("../openrouter");
    const r = await openRouterEvaluate({ participant: { founderName: "A", startupName: "S" }, responses: [] });
    expect(r.backendScore).toBe(5);
    expect(r.readinessStage).toBe("idea_clarity");
  });

  it("retries once then throws on persistently invalid output", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify({ bad: true }) } }],
    })));
    vi.stubGlobal("fetch", fetchMock);
    const { openRouterEvaluate } = await import("../openrouter");
    await expect(openRouterEvaluate({ participant: { founderName: "A", startupName: "S" }, responses: [] })).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
