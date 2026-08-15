import { auth } from "@/auth";
import { listWorkshopsByOwner } from "@/db/queries/admin";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { CreateWorkshopForm } from "@/components/admin/CreateWorkshopForm";
import { WorkshopCard } from "@/components/admin/WorkshopCard";

export default async function DashboardPage() {
  const session = await auth();
  const ownerId = session?.user?.id;
  const workshops = ownerId ? await listWorkshopsByOwner(ownerId) : [];

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 p-6 sm:p-10">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Welcome, {session?.user?.name ?? "Presenter"}
          </h1>
          <p className="text-sm text-slate-500">Manage your workshops and share join codes.</p>
        </div>
        <SignOutButton />
      </header>

      <CreateWorkshopForm />

      {workshops.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          No workshops yet. Create your first one above to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {workshops.map((workshop, index) => (
            <WorkshopCard
              key={workshop.id}
              id={workshop.id}
              name={workshop.name}
              status={workshop.status as "draft" | "live" | "closed"}
              joinCode={workshop.joinCode}
              participantCount={workshop.participantCount}
              index={index}
            />
          ))}
        </div>
      )}
    </main>
  );
}
