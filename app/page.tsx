import Link from "next/link";
import { HomeCodeEntry } from "@/components/HomeCodeEntry";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#fbf7f2] px-6 py-16 text-slate-900">
      <div className="w-full max-w-md">
        <div className="mb-10 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/quantana-logo.png" alt="Quantana" className="h-7 w-auto" />
        </div>

        <div className="rounded-3xl border border-[#e9e2d8] bg-white p-8 shadow-[0_10px_30px_-12px_rgba(31,36,48,.18)]">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6b1f9c]">
            AI founder diagnostic
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
            MVP Readiness Snapshot
          </h1>
          <p className="mt-2 text-slate-500">
            Find your next best MVP move in 5 minutes. Answer 6 quick questions and get an
            AI-generated readiness view with a 7-day action plan.
          </p>

          <div className="mt-8">
            <label className="text-xs font-bold text-slate-500">
              Have a workshop code?
            </label>
            <HomeCodeEntry />
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-slate-500">
          Presenter?{" "}
          <Link href="/login" className="font-semibold text-[#6b1f9c] hover:underline">
            Sign in →
          </Link>
        </div>

        <p className="mt-10 text-center text-xs text-slate-400">
          by Quantana · a founder thinking tool, not a startup judging tool
        </p>
      </div>
    </main>
  );
}
