"use client";

import { signOutAction } from "@/app/(admin)/dashboard/actions";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="pulse-btn-secondary px-3.5 py-1.5 text-sm"
      >
        Sign out
      </button>
    </form>
  );
}

export default SignOutButton;
