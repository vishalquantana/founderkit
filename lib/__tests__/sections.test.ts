import { describe, it, expect } from "vitest";
import { SECTIONS, getSection } from "../sections";

describe("sections", () => {
  it("has the 6 assessment sections in order", () => {
    expect(SECTIONS.map((s) => s.key)).toEqual([
      "problem", "customer", "value", "mvp", "distribution", "proof",
    ]);
    expect(SECTIONS.map((s) => s.step)).toEqual([1, 2, 3, 4, 5, 6]);
  });
  it("mvp section carries mvp-type chips", () => {
    expect(getSection("mvp").chips?.length).toBeGreaterThan(3);
  });
  it("value section carries its key line", () => {
    expect(getSection("value").keyLine).toMatch(/Renewal is proof/i);
  });
});
