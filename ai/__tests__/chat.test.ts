import { describe, it, expect, beforeEach } from "vitest";

describe("answerAsVamshi (mock mode)", () => {
  beforeEach(() => {
    delete process.env.OPENROUTER_API_KEY;
  });

  it("returns a non-empty deterministic reply when no OpenRouter key is set", async () => {
    const { answerAsVamshi } = await import("../chat");
    const reply = await answerAsVamshi({
      message: "How do I find my first customers?",
      context: "Founder: Asha · Startup: ChotuCart\nSector: retail",
      history: [],
    });
    expect(typeof reply).toBe("string");
    expect(reply.length).toBeGreaterThan(0);
    expect(reply).toContain("ChotuCart");
  });

  it("still returns a non-empty reply when context has no startup name", async () => {
    const { answerAsVamshi } = await import("../chat");
    const reply = await answerAsVamshi({ message: "Hi", context: "", history: [] });
    expect(reply.length).toBeGreaterThan(0);
  });
});
