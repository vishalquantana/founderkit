import { describe, it, expect } from "vitest";
import { toCsv } from "../csv";

describe("toCsv", () => {
  it("joins headers and rows with CRLF", () => {
    const csv = toCsv(["a", "b"], [["plain", "value"]]);
    expect(csv).toBe("a,b\r\nplain,value");
  });

  it("quotes a field containing a comma", () => {
    const csv = toCsv(["a", "b"], [["x,y", "z"]]);
    expect(csv).toBe('a,b\r\n"x,y",z');
  });

  it("quotes and escapes a field containing double quotes", () => {
    const csv = toCsv(["a", "b"], [['he said "hi"', "z"]]);
    expect(csv).toBe('a,b\r\n"he said ""hi""",z');
  });

  it("quotes a field containing a newline", () => {
    const csv = toCsv(["a"], [["line1\nline2"]]);
    expect(csv).toBe('a\r\n"line1\nline2"');
  });

  it("converts null and undefined to empty strings", () => {
    const csv = toCsv(["a", "b"], [[null, undefined as unknown as null]]);
    expect(csv).toBe("a,b\r\n,");
  });

  it("converts numbers to their string representation", () => {
    const csv = toCsv(["a"], [[42]]);
    expect(csv).toBe("a\r\n42");
  });

  it("handles multiple rows", () => {
    const csv = toCsv(["a", "b"], [["x,y", 'he said "hi"'], ["plain", null]]);
    expect(csv).toBe('a,b\r\n"x,y","he said ""hi"""\r\nplain,');
  });

  it("is pure and does not mutate inputs", () => {
    const headers = ["a", "b"];
    const rows = [["x", "y"]];
    toCsv(headers, rows);
    expect(headers).toEqual(["a", "b"]);
    expect(rows).toEqual([["x", "y"]]);
  });
});
