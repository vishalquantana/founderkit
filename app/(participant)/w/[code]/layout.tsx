import type { ReactNode } from "react";
import { PollTakeover } from "@/components/participant/PollTakeover";

export default async function WorkshopSessionLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return (
    <>
      {children}
      <PollTakeover code={code} />
    </>
  );
}
