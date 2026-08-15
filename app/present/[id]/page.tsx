import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getWorkshopById } from "@/db/queries/workshops";
import type { WorkshopSettings } from "@/db/queries/workshops";
import { getPresentData } from "@/db/queries/present";
import { assertOwnership } from "@/app/(admin)/workshops/[id]/ownership";
import { PresentConsole } from "@/components/present/PresentConsole";

export default async function PresentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const workshop = await getWorkshopById(id);

  if (!assertOwnership(session?.user?.id, workshop)) {
    notFound();
  }

  const data = await getPresentData(id);
  const settings = workshop!.settings as WorkshopSettings;

  return (
    <PresentConsole
      workshopId={id}
      workshopName={workshop!.name}
      joinCode={workshop!.joinCode}
      initialData={data}
      settings={settings}
    />
  );
}
