"use server";

import { auth } from "@/auth";
import { getWorkshopById } from "@/db/queries/workshops";
import { assertOwnership } from "@/app/(admin)/workshops/[id]/ownership";
import { insertChatMessage, editChatMessage, deleteChatMessage } from "@/db/queries/chat";
import { sendSlackErrorAlert } from "@/lib/slack-logger";

export async function presenterSendChatMessageAction(input: {
  workshopId: string;
  participantId: string;
  content: string;
}) {
  try {
    const session = await auth();
    const workshop = await getWorkshopById(input.workshopId);

    if (!workshop) throw new Error("Workshop not found");
    if (!assertOwnership(session?.user?.id, workshop)) {
      throw new Error("Not authorized for this workshop");
    }

    const trimmed = input.content.trim();
    if (!trimmed) throw new Error("Message cannot be empty");

    const message = await insertChatMessage({
      participantId: input.participantId,
      role: "assistant",
      content: trimmed,
    });

    return { success: true, messageId: message.id };
  } catch (err) {
    await sendSlackErrorAlert({
      source: "server-action",
      error: err,
      context: { action: "presenterSendChatMessageAction", ...input },
    });
    throw err;
  }
}

export async function presenterEditChatMessageAction(input: {
  workshopId: string;
  messageId: string;
  content: string;
}) {
  try {
    const session = await auth();
    const workshop = await getWorkshopById(input.workshopId);

    if (!workshop) throw new Error("Workshop not found");
    if (!assertOwnership(session?.user?.id, workshop)) {
      throw new Error("Not authorized for this workshop");
    }

    const trimmed = input.content.trim();
    if (!trimmed) throw new Error("Message cannot be empty");

    await editChatMessage(input.messageId, trimmed);
    return { success: true };
  } catch (err) {
    await sendSlackErrorAlert({
      source: "server-action",
      error: err,
      context: { action: "presenterEditChatMessageAction", ...input },
    });
    throw err;
  }
}

export async function presenterDeleteChatMessageAction(input: {
  workshopId: string;
  messageId: string;
}) {
  try {
    const session = await auth();
    const workshop = await getWorkshopById(input.workshopId);

    if (!workshop) throw new Error("Workshop not found");
    if (!assertOwnership(session?.user?.id, workshop)) {
      throw new Error("Not authorized for this workshop");
    }

    await deleteChatMessage(input.messageId);
    return { success: true };
  } catch (err) {
    await sendSlackErrorAlert({
      source: "server-action",
      error: err,
      context: { action: "presenterDeleteChatMessageAction", ...input },
    });
    throw err;
  }
}
