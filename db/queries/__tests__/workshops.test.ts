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

describe("workshop queries", () => {
  beforeEach(async () => {
    await client.execute("PRAGMA foreign_keys=OFF");
    for (const t of ["results", "responses", "participants", "workshops", "users"]) {
      await client.execute(`DROP TABLE IF EXISTS ${t}`);
    }
    await migrate();
    await testDb.insert(schema.users).values({
      id: "u1", email: "a@b.com", passwordHash: "x", name: "Admin",
    });
  });

  it("creates a workshop with a join code and defaults", async () => {
    const { createWorkshop, getWorkshopByJoinCode } = await import("../workshops");
    const w = await createWorkshop({ ownerId: "u1", name: "Tripura" });
    expect(w.joinCode).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
    expect(w.status).toBe("draft");
    const found = await getWorkshopByJoinCode(w.joinCode);
    expect(found?.id).toBe(w.id);
  });
});
