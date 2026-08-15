import { describe, it, expect, vi, beforeEach } from "vitest";

const { getUserByEmail, verifyPassword } = vi.hoisted(() => ({
  getUserByEmail: vi.fn(),
  verifyPassword: vi.fn(),
}));
vi.mock("@/db/queries/users", () => ({ getUserByEmail }));
vi.mock("@/lib/passwords", () => ({ verifyPassword }));

import { authorizeCredentials } from "../authorize";

describe("authorizeCredentials", () => {
  beforeEach(() => { getUserByEmail.mockReset(); verifyPassword.mockReset(); });

  it("returns user on valid credentials", async () => {
    getUserByEmail.mockResolvedValue({ id: "u1", email: "a@b.com", name: "Admin", passwordHash: "h" });
    verifyPassword.mockResolvedValue(true);
    expect(await authorizeCredentials("a@b.com", "pw")).toEqual({ id: "u1", email: "a@b.com", name: "Admin" });
  });

  it("returns null on wrong password", async () => {
    getUserByEmail.mockResolvedValue({ id: "u1", email: "a@b.com", name: "Admin", passwordHash: "h" });
    verifyPassword.mockResolvedValue(false);
    expect(await authorizeCredentials("a@b.com", "bad")).toBeNull();
  });

  it("returns null when user missing", async () => {
    getUserByEmail.mockResolvedValue(undefined);
    expect(await authorizeCredentials("x@y.com", "pw")).toBeNull();
  });
});
