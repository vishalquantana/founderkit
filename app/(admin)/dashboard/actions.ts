"use server";

import { revalidatePath } from "next/cache";
import { auth, signOut } from "@/auth";
import { createWorkshop } from "@/db/queries/workshops";

export async function createWorkshopAction(formData: FormData): Promise<void> {
  const session = await auth();
  const ownerId = session?.user?.id;
  if (!ownerId) {
    throw new Error("You must be signed in to create a workshop.");
  }

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    throw new Error("Workshop name is required.");
  }

  await createWorkshop({ ownerId, name });
  revalidatePath("/dashboard");
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
