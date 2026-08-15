import { describe, it, expect } from "vitest";
import { buildWordFrequencies, aliasFor, STAGE_ORDER } from "../present";

describe("present helpers", () => {
  it("counts words, drops stopwords/short tokens, sorts desc", () => {
    const f = buildWordFrequencies(["Kirana stores lose customers", "stores stores customers"]);
    const top = f[0];
    expect(top.word).toBe("stores");
    expect(top.count).toBe(3);
    expect(f.find((x) => x.word === "the")).toBeUndefined();
  });
  it("aliases respect the useNames flag", () => {
    expect(aliasFor({ startupName: "KiranaLoop", index: 0, useNames: true })).toBe("KiranaLoop");
    expect(aliasFor({ startupName: "KiranaLoop", index: 2, useNames: false })).toBe("Founder #3");
    expect(aliasFor({ index: 0, useNames: true })).toBe("Founder #1");
  });
  it("stage order is the positive progression", () => {
    expect(STAGE_ORDER[0]).toBe("idea_clarity");
    expect(STAGE_ORDER[4]).toBe("revenue_ready");
  });
});
