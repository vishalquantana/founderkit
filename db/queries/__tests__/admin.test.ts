import { describe, it, expect, beforeEach, vi } from "vitest";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import * as schema from "../../schema";

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

describe("admin queries", () => {
  beforeEach(async () => {
    await client.execute("PRAGMA foreign_keys=OFF");
    for (const t of ["results", "responses", "participants", "workshops", "users"]) {
      await client.execute(`DROP TABLE IF EXISTS ${t}`);
    }
    await migrate();
    await testDb.insert(schema.users).values({
      id: "u1", email: "vishal@quantana.com.au", passwordHash: "x", name: "Admin",
    });
    await testDb.insert(schema.workshops).values({
      id: "w1", ownerId: "u1", name: "Tripura", joinCode: "ABC234",
      status: "draft", consentText: "consent",
      settings: { liveViews: { dashboard: true, wordCloud: true, progression: true }, leaderboard: true, probeEnabled: true },
    });

    await testDb.insert(schema.participants).values([
      {
        id: "p1", workshopId: "w1", founderName: "Founder One", startupName: "Startup One",
        contact: "one@example.com", sector: "Fintech", completedAt: new Date(),
      },
      {
        id: "p2", workshopId: "w1", founderName: "Founder Two", startupName: "Startup Two",
        contact: "two@example.com", sector: "Healthtech",
      },
    ]);

    await testDb.insert(schema.results).values({
      id: "r1",
      participantId: "p1",
      backendScore: 62,
      dimensionScores: JSON.stringify({
        problemClarity: 10, customerClarity: 9, valuePayment: 15, mvpQuality: 8,
        distribution: 7, validation: 6, teamStageFit: 4, cashflow: 3,
      }),
      readinessStage: "mvp_candidate",
      summary: "Solid direction, needs an MVP experiment.",
      strengths: JSON.stringify(["Clear first customer segment.", "MVP can be tested quickly."]),
      assumptions: JSON.stringify(["Whether customers will pay.", "Whether the channel repeats."]),
      mvpExperiment: "Run a 7-day concierge MVP.",
      sevenDayPlan: JSON.stringify([
        { day: "Day 1", text: "List first 10 users" },
        { day: "Day 2", text: "Send outreach" },
      ]),
      improvedPitch: "We help X achieve Y without Z.",
      reflectionQuestion: "What can stay manual?",
    });
  });

  it("aggregates stats and lists submissions", async () => {
    const { getWorkshopStats, listSubmissions, listWorkshopsByOwner, emptyStageDistribution } = await import("../admin");
    const stats = await getWorkshopStats("w1");
    expect(stats.total).toBeGreaterThan(0);
    expect(stats.completed).toBe(1);
    expect(stats.stageDistribution.mvp_candidate).toBe(1);
    expect(stats.sectorBreakdown.length).toBeGreaterThan(0);
    expect(Object.keys(emptyStageDistribution()).sort()).toEqual(
      ["discovery_ready", "idea_clarity", "mvp_candidate", "pilot_ready", "revenue_ready"],
    );

    const subs = await listSubmissions("w1");
    expect(subs[0].participant).toBeDefined();
    expect(subs.length).toBe(2);
    const withResult = subs.find((s) => s.participant.id === "p1");
    expect(withResult?.result?.readinessStage).toBe("mvp_candidate");
    const withoutResult = subs.find((s) => s.participant.id === "p2");
    expect(withoutResult?.result).toBeUndefined();

    const list = await listWorkshopsByOwner("u1");
    expect(list[0].participantCount).toBeGreaterThanOrEqual(0);
    expect(list[0].id).toBe("w1");
  });

  it("updates workshop status and settings", async () => {
    const { setWorkshopStatus, setWorkshopSettings } = await import("../admin");
    await setWorkshopStatus("w1", "live");
    await setWorkshopSettings("w1", {
      liveViews: { dashboard: false, wordCloud: false, progression: false },
      leaderboard: false,
      probeEnabled: false,
    });
    const row = await testDb.query.workshops.findFirst({ where: (w, { eq }) => eq(w.id, "w1") });
    expect(row?.status).toBe("live");
    expect(row?.settings).toEqual({
      liveViews: { dashboard: false, wordCloud: false, progression: false },
      leaderboard: false,
      probeEnabled: false,
    });
  });
});
