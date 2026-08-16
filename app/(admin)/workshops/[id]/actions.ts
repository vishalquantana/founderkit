"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getWorkshopById } from "@/db/queries/workshops";
import { setWorkshopStatus, setWorkshopSettings } from "@/db/queries/admin";
import type { WorkshopStatus } from "@/db/schema";
import type { WorkshopSettings } from "@/db/queries/workshops";
import { assertOwnership } from "./ownership";

export async function updateStatus(id: string, status: WorkshopStatus): Promise<void> {
  const session = await auth();
  const workshop = await getWorkshopById(id);
  if (!assertOwnership(session?.user?.id, workshop)) {
    throw new Error("Not authorized to update this workshop.");
  }

  await setWorkshopStatus(id, status);
  revalidatePath(`/workshops/${id}`);
}

export async function updateSettings(id: string, settings: WorkshopSettings): Promise<void> {
  const session = await auth();
  const workshop = await getWorkshopById(id);
  if (!assertOwnership(session?.user?.id, workshop)) {
    throw new Error("Not authorized to update this workshop.");
  }

  await setWorkshopSettings(id, settings);
  revalidatePath(`/workshops/${id}`);
  revalidatePath(`/present/${id}`);
}

export async function updateWorkshopName(id: string, name: string): Promise<void> {
  const session = await auth();
  const workshop = await getWorkshopById(id);
  if (!assertOwnership(session?.user?.id, workshop)) {
    throw new Error("Not authorized to update this workshop.");
  }

  const trimmed = name.trim();
  if (!trimmed) throw new Error("Workshop name cannot be empty.");

  const { setWorkshopName } = await import("@/db/queries/admin");
  await setWorkshopName(id, trimmed);
  revalidatePath(`/workshops/${id}`);
  revalidatePath(`/present/${id}`);
}

export async function deleteSubmissionAction(workshopId: string, participantId: string): Promise<void> {
  const session = await auth();
  const workshop = await getWorkshopById(workshopId);
  if (!assertOwnership(session?.user?.id, workshop)) {
    throw new Error("Not authorized to modify this workshop.");
  }

  const { deleteParticipant } = await import("@/db/queries/participants");
  await deleteParticipant(participantId);
  revalidatePath(`/workshops/${workshopId}`);
  revalidatePath(`/present/${workshopId}`);
}
