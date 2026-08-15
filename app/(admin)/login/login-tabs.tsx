"use client";

import { useState, useTransition } from "react";
import { requestOtpAction, signInWithOtpAction } from "./otp-actions";

type Tab = "password" | "otp";

export function LoginTabs({
  passwordAction,
}: {
  passwordAction: (formData: FormData) => Promise<void>;
}) {
  const [tab, setTab] = useState<Tab>("password");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => setTab("password")}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === "password" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
          }`}
        >
          Password
        </button>
        <button
          type="button"
          onClick={() => setTab("otp")}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === "otp" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
          }`}
        >
          Email code
        </button>
      </div>

      {tab === "password" ? (
        <PasswordForm action={passwordAction} />
      ) : (
        <OtpForm />
      )}
    </div>
  );
}

function PasswordForm({ action }: { action: (formData: FormData) => Promise<void> }) {
  return (
    <form action={action} className="flex flex-col gap-3">
      <input
        name="email"
        type="email"
        placeholder="Email"
        required
        className="rounded-lg border px-3 py-2"
      />
      <input
        name="password"
        type="password"
        placeholder="Password"
        required
        className="rounded-lg border px-3 py-2"
      />
      <button className="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white">
        Sign in
      </button>
    </form>
  );
}

function OtpForm() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSendCode() {
    if (!email) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("email", email);
      await requestOtpAction(formData);
      setSent(true);
    });
  }

  return (
    <form action={signInWithOtpAction} className="flex flex-col gap-3">
      <input
        name="email"
        type="email"
        placeholder="Email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="rounded-lg border px-3 py-2"
      />

      {!sent ? (
        <button
          type="button"
          onClick={handleSendCode}
          disabled={!email || isPending}
          className="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          {isPending ? "Sending..." : "Send code"}
        </button>
      ) : (
        <>
          <p className="text-sm text-slate-500">
            We sent a 6-digit code to {email} if an account exists. Check your inbox.
          </p>
          <input
            name="code"
            type="text"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            placeholder="6-digit code"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="rounded-lg border px-3 py-2 tracking-widest"
          />
          <button className="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white">
            Sign in
          </button>
          <button
            type="button"
            onClick={handleSendCode}
            disabled={isPending}
            className="text-sm font-medium text-slate-500 underline disabled:opacity-50"
          >
            {isPending ? "Sending..." : "Resend code"}
          </button>
        </>
      )}
    </form>
  );
}
