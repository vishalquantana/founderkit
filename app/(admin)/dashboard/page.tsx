import { auth } from "@/auth";

export default async function DashboardPage() {
  const session = await auth();
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Welcome, {session?.user?.name ?? "Presenter"}</h1>
      <p className="text-slate-600">Workshops dashboard arrives in Plan 5.</p>
    </main>
  );
}
