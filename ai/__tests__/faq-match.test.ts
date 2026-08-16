import { describe, it, expect } from "vitest";
import { tokenize, scoreOverlap, findBestFaqMatch, FAQ_MATCH_THRESHOLD } from "../faq-match";

describe("faq-match", () => {
  describe("tokenize", () => {
    it("lowercases, strips punctuation, and drops stopwords", () => {
      const tokens = tokenize("How do I price my SaaS?");
      expect(tokens).not.toContain("how");
      expect(tokens).not.toContain("do");
      expect(tokens).not.toContain("i");
      expect(tokens).not.toContain("my");
      expect(tokens.every((t) => t === t.toLowerCase())).toBe(true);
      expect(tokens.join(" ")).not.toMatch(/[?.,!]/);
      expect(tokens).toContain("price");
      expect(tokens).toContain("saas");
    });
  });

  describe("scoreOverlap", () => {
    it("returns ~1 for identical strings", () => {
      expect(scoreOverlap("price my SaaS", "price my SaaS")).toBeCloseTo(1, 5);
    });
    it("returns 0 for disjoint strings", () => {
      expect(scoreOverlap("price my SaaS", "zebra giraffe elephant")).toBe(0);
    });
  });

  describe("findBestFaqMatch", () => {
    const faqs = [
      { question: "How do I price my SaaS product?" },
      { question: "What is a good MVP experiment?" },
      { question: "How do I find early customers?" },
    ];

    it("returns the best matching row when overlap is above threshold", () => {
      const result = findBestFaqMatch("how should I price my SaaS", faqs);
      expect(result).not.toBeNull();
      expect(result?.faq.question).toBe("How do I price my SaaS product?");
      expect(result?.score).toBeGreaterThanOrEqual(FAQ_MATCH_THRESHOLD);
    });

    it("returns null when all scores are below threshold", () => {
      const result = findBestFaqMatch("what is the weather today", faqs);
      expect(result).toBeNull();
    });
  });
});
