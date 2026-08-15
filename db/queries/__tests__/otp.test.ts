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

describe("otp queries", () => {
  beforeEach(async () => {
    await client.execute("PRAGMA foreign_keys=OFF");
    for (const t of ["otp_codes", "results", "responses", "participants", "workshops", "users"]) {
      await client.execute(`DROP TABLE IF EXISTS ${t}`);
    }
    await migrate();
  });

  it("creates, finds active, then consumes an otp code", async () => {
    const { createOtp, findActiveOtp, consumeOtp } = await import("../otp");
    const future = new Date(Date.now() + 10 * 60 * 1000);
    await createOtp("a@b.com", "hashedcode", future);

    const active = await findActiveOtp("a@b.com");
    expect(active).toBeDefined();
    expect(active?.codeHash).toBe("hashedcode");

    await consumeOtp(active!.id);

    const after = await findActiveOtp("a@b.com");
    expect(after).toBeUndefined();
  });

  it("does not return expired codes", async () => {
    const { createOtp, findActiveOtp } = await import("../otp");
    const past = new Date(Date.now() - 60 * 1000);
    await createOtp("expired@b.com", "hashedcode", past);

    const active = await findActiveOtp("expired@b.com");
    expect(active).toBeUndefined();
  });
});
