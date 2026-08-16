import { describe, it, expect } from "vitest";
import { availableViews } from "../views";

describe("availableViews", () => {
  it("maps settings to enabled views", () => {
    expect(availableViews({ liveViews: { dashboard: true, wordCloud: true, progression: false, quiz: false }, leaderboard: false }))
      .toEqual(["welcome", "dashboard", "wordcloud"]);
    expect(availableViews({ liveViews: { dashboard: true, wordCloud: false, progression: false, quiz: false }, leaderboard: true }))
      .toEqual(["welcome", "dashboard", "progression"]);
    expect(availableViews({ liveViews: { dashboard: false, wordCloud: false, progression: false, quiz: false }, leaderboard: false }))
      .toEqual(["welcome", "dashboard"]);
    expect(availableViews({ liveViews: { dashboard: true, wordCloud: true, progression: true, quiz: true }, leaderboard: false }))
      .toEqual(["welcome", "dashboard", "wordcloud", "progression", "quiz"]);
  });
});
