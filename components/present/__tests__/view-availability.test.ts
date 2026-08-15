import { describe, it, expect } from "vitest";
import { availableViews } from "../views";

describe("availableViews", () => {
  it("maps settings to enabled views", () => {
    expect(availableViews({ liveViews: { dashboard: true, wordCloud: true, progression: false }, leaderboard: false }))
      .toEqual(["dashboard", "wordcloud"]);
    expect(availableViews({ liveViews: { dashboard: true, wordCloud: false, progression: false }, leaderboard: true }))
      .toEqual(["dashboard", "progression"]);
    expect(availableViews({ liveViews: { dashboard: false, wordCloud: false, progression: false }, leaderboard: false }))
      .toEqual(["dashboard"]);
  });
});
