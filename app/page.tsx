import Link from "next/link";
import { HomeCodeEntry } from "@/components/HomeCodeEntry";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16 text-[#ECEAF6]">
      <div className="w-full max-w-md">
        <div className="mb-10 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/quantana-logo.png" alt="Quantana" className="h-7 w-auto" />
        </div>

        <div className="pulse-card p-8">
          <p className="pulse-kicker">AI founder diagnostic</p>
          <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight text-gradient">
            MVP Readiness Snapshot
          </h1>
          <p className="mt-2 text-[#A9A9C9]">
            Find your next best MVP move in 5 minutes. Answer 6 quick questions and get an
            AI-generated readiness view with a 7-day action plan.
          </p>

          <div className="mt-8">
            <label className="text-xs font-bold text-[#A9A9C9]">
              Have a workshop code?
            </label>
            <HomeCodeEntry />
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-[#A9A9C9]">
          Presenter?{" "}
          <Link href="/login" className="font-semibold text-[#f472b6] hover:underline">
            Sign in →
          </Link>
        </div>

        <p className="mt-10 text-center text-xs text-[#7a7a99]">
          by Quantana · a founder thinking tool, not a startup judging tool
        </p>
      </div>
    </main>
  );
}
