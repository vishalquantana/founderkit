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

describe("present queries", () => {
  beforeEach(async () => {
    await client.execute("PRAGMA foreign_keys=OFF");
    for (const t of ["results", "responses", "participants", "workshops", "users"]) {
      await client.execute(`DROP TABLE IF EXISTS ${t}`);
    }
    await migrate();
    await testDb.insert(schema.users).values({
      id: "u1", email: "a@b.com", passwordHash: "x", name: "Admin",
    });
    await testDb.insert(schema.workshops).values({
      id: "w1", ownerId: "u1", name: "Tripura", joinCode: "ABC234",
      status: "live", consentText: "consent", settings: {},
    });
  });

  it("only includes 'problem' answers from completed participants in the word cloud", async () => {
    const { getPresentData } = await import("../present");

    await testDb.insert(schema.participants).values({
      id: "p1", workshopId: "w1", founderName: "Founder1", startupName: "S1",
      contact: "f1@example.com", completedAt: new Date(),
    });
    await testDb.insert(schema.responses).values({
      id: "r1", participantId: "p1", section: "problem", mainAnswer: "completed problem answer",
    });

    await testDb.insert(schema.participants).values({
      id: "p2", workshopId: "w1", founderName: "Founder2", startupName: "S2",
      contact: "f2@example.com",
    });
    await testDb.insert(schema.responses).values({
      id: "r2", participantId: "p2", section: "problem", mainAnswer: "incomplete problem answer",
    });

    const data = await getPresentData("w1");
    expect(data.problems).toEqual(["completed problem answer"]);
    expect(data.problems).not.toContain("incomplete problem answer");
  });
});
