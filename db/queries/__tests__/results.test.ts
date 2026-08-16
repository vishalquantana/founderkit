import { describe, it, expect, beforeEach, vi } from "vitest";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import * as schema from "../../schema";
import type { EvaluationResult } from "../../../ai/schema";

const client = createClient({ url: ":memory:" });
const testDb = drizzle(client, { schema });

vi.mock("../../client", () => ({ get db() { return testDb; } }));

async function migrate() {
  const dir = join(process.cwd(), "db/migrations");
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".sql")).sort()) {
    const stmts = readFileSync(join(dir, f), "utf8").split("--> statement-breakpoint");
    for (const s of stmts) if (s.trim()) await client.execute(s);
  }
}

const RESULT: EvaluationResult = {
  backendScore: 62,
  dimensionScores: {
    problemClarity: 10,
    customerClarity: 9,
    valuePayment: 15,
    mvpQuality: 8,
    distribution: 7,
    validation: 6,
    teamStageFit: 4,
    cashflow: 3,
  },
  readinessStage: "mvp_candidate",
  summary: "Solid direction, needs an MVP experiment.",
  strengths: ["Clear first customer segment.", "MVP can be tested quickly."],
  assumptions: ["Whether customers will pay.", "Whether the channel repeats."],
  mvpExperiment: "Run a 7-day concierge MVP.",
  sevenDayPlan: [
    { day: "Day 1", text: "List first 10 users" },
    { day: "Day 2", text: "Send outreach" },
  ],
  improvedPitch: "We help X achieve Y without Z.",
  reflectionQuestion: "What can stay manual?",
  sectionFeedback: {
    problem: "Sharpen who exactly feels this pain most.",
    customer: "Clarify who pays versus who uses.",
    value: "Test whether customers will actually pay.",
    mvp: "Keep the MVP manual for now.",
    distribution: "Name your first repeatable channel.",
    proof: "Collect a few more concrete data points.",
  },
};

describe("results queries", () => {
  beforeEach(async () => {
    await client.execute("PRAGMA foreign_keys=OFF");
    for (const t of ["feedback_submissions", "growth_plans", "escalations", "chat_messages", "faqs", "poll_votes", "polls", "otp_codes", "results", "responses", "participants", "workshops", "users"]) {
      await client.execute(`DROP TABLE IF EXISTS ${t}`);
    }
    await migrate();
    await testDb.insert(schema.users).values({
      id: "u1", email: "a@b.com", passwordHash: "x", name: "Admin",
    });
    await testDb.insert(schema.workshops).values({
      id: "w1", ownerId: "u1", name: "Tripura", joinCode: "ABC234",
      status: "draft", consentText: "consent", settings: {},
    });
    await testDb.insert(schema.participants).values({
      id: "p1", workshopId: "w1", founderName: "Founder", startupName: "Startup",
      contact: "founder@example.com",
    });
  });

  it("returns undefined when no result exists", async () => {
    const { getResult } = await import("../results");
    expect(await getResult("p1")).toBeUndefined();
  });

  it("round-trips a full EvaluationResult, decoding JSON fields back to objects/arrays", async () => {
    const { saveResult, getResult } = await import("../results");
    await saveResult("p1", RESULT);
    const found = await getResult("p1");
    expect(found).toBeDefined();
    expect(found!.backendScore).toBe(RESULT.backendScore);
    expect(found!.readinessStage).toBe(RESULT.readinessStage);
    expect(found!.dimensionScores).toEqual(RESULT.dimensionScores);
    expect(Array.isArray(found!.strengths)).toBe(true);
    expect(found!.strengths).toEqual(RESULT.strengths);
    expect(Array.isArray(found!.assumptions)).toBe(true);
    expect(found!.assumptions).toEqual(RESULT.assumptions);
    expect(Array.isArray(found!.sevenDayPlan)).toBe(true);
    expect(found!.sevenDayPlan).toEqual(RESULT.sevenDayPlan);
    expect(typeof found!.sectionFeedback).toBe("object");
    expect(found!.sectionFeedback).toEqual(RESULT.sectionFeedback);
  });

  it("is idempotent: saving twice for the same participant replaces the row", async () => {
    const { saveResult, getResult } = await import("../results");
    await saveResult("p1", RESULT);
    const updated: EvaluationResult = { ...RESULT, backendScore: 80, summary: "Updated summary" };
    await saveResult("p1", updated);
    const found = await getResult("p1");
    expect(found!.backendScore).toBe(80);
    expect(found!.summary).toBe("Updated summary");

    const rows = await testDb.select().from(schema.results);
    expect(rows.length).toBe(1);
  });
});
