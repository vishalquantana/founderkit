import { describe, it, expect } from "vitest";
import * as schema from "../schema";

describe("schema", () => {
  it("exposes all five tables", () => {
    expect(schema.users).toBeDefined();
    expect(schema.workshops).toBeDefined();
    expect(schema.participants).toBeDefined();
    expect(schema.responses).toBeDefined();
    expect(schema.results).toBeDefined();
  });
});
