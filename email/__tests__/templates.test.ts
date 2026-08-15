import { describe, it, expect } from "vitest";
import { otpEmail, resultEmail } from "../templates";

describe("otpEmail", () => {
  it("includes the code in the text body and has a non-empty subject", () => {
    const email = otpEmail("123456");
    expect(email.subject).toBeTruthy();
    expect(email.subject.length).toBeGreaterThan(0);
    expect(email.text).toContain("123456");
    expect(email.html).toContain("123456");
  });
});

describe("resultEmail", () => {
  it("includes the stage label and link in the html and text", () => {
    const email = resultEmail({
      founderName: "Ramesh",
      startupName: "Quantana",
      stageLabel: "Idea Stage",
      summary: "You're off to a great start!",
      link: "https://example.com/results/abc123",
    });

    expect(email.subject).toBeTruthy();
    expect(email.html).toContain("Idea Stage");
    expect(email.html).toContain("https://example.com/results/abc123");
    expect(email.text).toContain("Idea Stage");
    expect(email.text).toContain("https://example.com/results/abc123");
    expect(email.html).toContain("Ramesh");
    expect(email.html).toContain("Quantana");
  });
});
