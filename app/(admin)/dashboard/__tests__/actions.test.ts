import { describe, it, expect, vi, beforeEach } from "vitest";

const { auth, signOut, createWorkshop, revalidatePath } = vi.hoisted(() => ({
  auth: vi.fn(),
  signOut: vi.fn(),
  createWorkshop: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth, signOut }));
vi.mock("@/db/queries/workshops", () => ({ createWorkshop }));
vi.mock("next/cache", () => ({ revalidatePath }));

import { createWorkshopAction, signOutAction } from "../actions";

describe("createWorkshopAction", () => {
  beforeEach(() => {
    auth.mockReset();
    signOut.mockReset();
    createWorkshop.mockReset();
    revalidatePath.mockReset();
  });

  it("requires a session and throws without one", async () => {
    auth.mockResolvedValue(null);
    const formData = new FormData();
    formData.set("name", "My Workshop");

    await expect(createWorkshopAction(formData)).rejects.toThrow();
    expect(createWorkshop).not.toHaveBeenCalled();
  });

  it("throws when session has no user id", async () => {
    auth.mockResolvedValue({ user: {} });
    const formData = new FormData();
    formData.set("name", "My Workshop");

    await expect(createWorkshopAction(formData)).rejects.toThrow();
    expect(createWorkshop).not.toHaveBeenCalled();
  });

  it("calls createWorkshop with owner id + name and revalidates the dashboard", async () => {
    auth.mockResolvedValue({ user: { id: "u1" } });
    createWorkshop.mockResolvedValue({ id: "w1" });
    const formData = new FormData();
    formData.set("name", "My Workshop");

    await createWorkshopAction(formData);

    expect(createWorkshop).toHaveBeenCalledWith({ ownerId: "u1", name: "My Workshop" });
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
  });
});

describe("signOutAction", () => {
  beforeEach(() => {
    signOut.mockReset();
  });

  it("calls signOut with a redirect to /login", async () => {
    signOut.mockResolvedValue(undefined);
    await signOutAction();
    expect(signOut).toHaveBeenCalledWith({ redirectTo: "/login" });
  });
});
