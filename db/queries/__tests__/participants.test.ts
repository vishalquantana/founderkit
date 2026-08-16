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

describe("participant queries", () => {
  beforeEach(async () => {
    await client.execute("PRAGMA foreign_keys=OFF");
    for (const t of ["poll_votes", "polls", "otp_codes", "results", "responses", "participants", "workshops", "users"]) {
      await client.execute(`DROP TABLE IF EXISTS ${t}`);
    }
    await migrate();
    await testDb.insert(schema.users).values({
      id: "u1", email: "a@b.com", passwordHash: "x", name: "Admin",
    });
    await testDb.insert(schema.workshops).values({
      id: "w1", ownerId: "u1", name: "Test Workshop", joinCode: "ABC123",
      consentText: "I consent", settings: {},
    });
  });

  it("creates, fetches, and completes a participant", async () => {
    const { createParticipant, getParticipant, completeParticipant, countByWorkshop } =
      await import("../participants");
    const p = await createParticipant({
      workshopId: "w1", founderName: "Asha", startupName: "KiranaConnect", contact: "a@x.com",
      stage: "idea", productType: "b2c",
    });
    expect(p.id).toHaveLength(21);
    expect(p.completedAt).toBeNull();
    expect((await getParticipant(p.id))?.founderName).toBe("Asha");
    await completeParticipant(p.id);
    expect((await getParticipant(p.id))?.completedAt).not.toBeNull();
    expect(await countByWorkshop("w1")).toBe(1);
  });
});
