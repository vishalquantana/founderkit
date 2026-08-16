import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockProbe } from "../probe";

describe("mockProbe", () => {
  it("returns a question for a vague answer", () => {
    const r = mockProbe({ section: "problem", mainAnswer: "we build an app for students" });
    expect(r.needsProbe).toBe(true);
    expect(typeof r.question).toBe("string");
    expect(r.question).toBeTruthy();
  });

  it("returns needsProbe:false for a rich, specific answer", () => {
    const r = mockProbe({
      section: "problem",
      mainAnswer:
        "College students in Bangalore paying Rs 500/month for private tutoring often skip sessions because the tutor cancels last minute; 40 students surveyed confirmed this.",
    });
    expect(r.needsProbe).toBe(false);
    expect(r.question).toBeNull();
  });

  it("gives section-specific questions", () => {
    const r = mockProbe({ section: "distribution", mainAnswer: "we will market it" });
    expect(r.needsProbe).toBe(true);
    expect(r.question).toMatch(/first 10 users/i);
  });
});

describe("probeSection", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("falls back to mock when openRouterProbe throws", async () => {
    vi.doMock("../openrouter", () => ({
      hasOpenRouterKey: () => true,
    }));
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      })
    );
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { probeSection } = await import("../probe");
    const r = await probeSection({ section: "problem", mainAnswer: "we build an app for students" });
    expect(r.needsProbe).toBe(true);
    expect(typeof r.question).toBe("string");
    expect(warnSpy).toHaveBeenCalled();
  });

  it("uses mock directly when no API key is present", async () => {
    vi.doMock("../openrouter", () => ({
      hasOpenRouterKey: () => false,
    }));
    const { probeSection } = await import("../probe");
    const r = await probeSection({
      section: "problem",
      mainAnswer:
        "College students in Bangalore paying Rs 500/month for private tutoring often skip sessions because the tutor cancels last minute; 40 students surveyed confirmed this.",
    });
    expect(r.needsProbe).toBe(false);
  });
});
