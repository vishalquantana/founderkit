"use client";

import { signOutAction } from "@/app/(admin)/dashboard/actions";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
      >
        Sign out
      </button>
    </form>
  );
}

export default SignOutButton;
