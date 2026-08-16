import Link from "next/link";
import { auth } from "@/auth";
import { HomeCodeEntry } from "@/components/HomeCodeEntry";

export default async function Home() {
  const session = await auth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16 text-foreground">
      <div className="w-full max-w-md">
        <div className="mb-10 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/quantana-logo-white.svg" alt="Quantana" className="h-6 w-auto" />
        </div>

        <div className="pulse-card p-8">
          <p className="pulse-kicker">AI founder diagnostic</p>
          <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight text-gradient">
            Quantana AI Cofounder
          </h1>
          <p className="mt-2 text-muted">
            Find your next best MVP move in 5 minutes. Answer 6 quick questions and get an
            AI-generated readiness view with a 7-day action plan.
          </p>

          <div className="mt-8">
            <label className="text-xs font-bold text-muted">
              Have a workshop code?
            </label>
            <HomeCodeEntry />
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-muted">
          {session?.user ? (
            <Link
              href="/dashboard"
              className="pulse-btn inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold"
            >
              <span>Go to Presenter Dashboard →</span>
            </Link>
          ) : (
            <>
              Presenter?{" "}
              <Link href="/login" className="font-semibold text-[#f472b6] hover:underline">
                Sign in →
              </Link>
            </>
          )}
        </div>

        <p className="mt-10 text-center text-xs text-[#7a7a99]">
          by Quantana · a founder thinking tool, not a startup judging tool
        </p>
      </div>
    </main>
  );
}
