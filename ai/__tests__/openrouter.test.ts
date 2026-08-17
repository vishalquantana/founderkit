import { describe, it, expect, vi, beforeEach } from "vitest";

const validJson = {
  backendScore: 52,
  dimensionScores: { problemClarity: 10, customerClarity: 8, valuePayment: 12, mvpQuality: 9, distribution: 7, validation: 4, teamStageFit: 2, cashflow: 0 },
  readinessStage: "mvp_candidate", summary: "s", strengths: ["a", "b"], assumptions: ["c", "d"],
  mvpExperiment: "m", sevenDayPlan: [{ day: "Day 1", text: "x" }], improvedPitch: "p", reflectionQuestion: "q",
  sectionFeedback: {
    problem: "Sharpen who exactly feels this pain most.",
    customer: "Clarify who pays versus who uses.",
    value: "Test whether customers will actually pay.",
    mvp: "Keep the MVP manual for now.",
    distribution: "Name your first repeatable channel.",
    proof: "Collect a few more concrete data points.",
  },
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

  it("passes an abort signal to fetch so requests can time out", async () => {
    const fetchMock = vi.fn(async (_url: string, _opts?: RequestInit) => new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify(validJson) } }],
    })));
    vi.stubGlobal("fetch", fetchMock);
    const { openRouterEvaluate } = await import("../openrouter");
    await openRouterEvaluate({ participant: { founderName: "A", startupName: "S" }, responses: [] });
    const opts = fetchMock.mock.calls[0][1];
    expect(opts?.signal).toBeInstanceOf(AbortSignal);
  });

  it("aborts a stalled request via timeout so the caller can fall back", async () => {
    // A hung fetch (no HTTP error, never resolves) must not hang forever — the
    // timeout aborts it, turning the stall into a throw the mock-fallback catches.
    process.env.OPENROUTER_TIMEOUT_MS = "40";
    vi.stubGlobal("fetch", vi.fn((_url: string, opts: RequestInit) =>
      new Promise((_resolve, reject) => {
        opts.signal?.addEventListener("abort", () =>
          reject(new DOMException("The operation was aborted", "AbortError")));
      }),
    ));
    const { openRouterEvaluate } = await import("../openrouter");
    await expect(
      openRouterEvaluate({ participant: { founderName: "A", startupName: "S" }, responses: [] }),
    ).rejects.toThrow();
    delete process.env.OPENROUTER_TIMEOUT_MS;
  });
});
