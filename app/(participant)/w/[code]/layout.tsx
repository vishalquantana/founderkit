import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { PollTakeover } from "@/components/participant/PollTakeover";
import { FeedbackNotificationBanner } from "@/components/participant/FeedbackNotificationBanner";
import { LockScreen } from "@/components/participant/LockScreen";
import { VamshiChat } from "@/components/participant/VamshiChat";
import { isParticipantLocked } from "@/db/queries/chat";

export default async function WorkshopSessionLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const cookieStore = await cookies();
  // Read participant ID from cookie or fallback to URL context if cookie is missing
  let pid = cookieStore.get("mrs_pid")?.value;
  if (!pid) {
    // If cookie is missing on direct page load/link, VamshiChat still mounts for participant pages
    pid = undefined;
  }

  if (pid && (await isParticipantLocked(pid))) {
    return <LockScreen code={code} participantId={pid} />;
  }

  return (
    <>
      {pid ? <FeedbackNotificationBanner code={code} pid={pid} /> : null}
      {children}
      <PollTakeover code={code} />
      <VamshiChat code={code} participantId={pid ?? ""} />
    </>
  );
}
