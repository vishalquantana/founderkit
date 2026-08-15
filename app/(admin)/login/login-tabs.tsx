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
      <div className="flex gap-1 rounded-full border border-white/10 bg-white/5 p-1">
        <button
          type="button"
          onClick={() => setTab("password")}
          className={`flex-1 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
            tab === "password"
              ? "bg-[linear-gradient(135deg,#8b5cf6,#f472b6)] text-white shadow-[0_8px_24px_-8px_rgba(139,92,246,0.6)]"
              : "text-[#A9A9C9] hover:text-[#ECEAF6]"
          }`}
        >
          Password
        </button>
        <button
          type="button"
          onClick={() => setTab("otp")}
          className={`flex-1 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
            tab === "otp"
              ? "bg-[linear-gradient(135deg,#8b5cf6,#f472b6)] text-white shadow-[0_8px_24px_-8px_rgba(139,92,246,0.6)]"
              : "text-[#A9A9C9] hover:text-[#ECEAF6]"
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
        className="pulse-input px-3 py-2 outline-none"
      />
      <input
        name="password"
        type="password"
        placeholder="Password"
        required
        className="pulse-input px-3 py-2 outline-none"
      />
      <button className="pulse-btn px-4 py-2">Sign in</button>
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
        className="pulse-input px-3 py-2 outline-none"
      />

      {!sent ? (
        <button
          type="button"
          onClick={handleSendCode}
          disabled={!email || isPending}
          className="pulse-btn px-4 py-2"
        >
          {isPending ? "Sending..." : "Send code"}
        </button>
      ) : (
        <>
          <p className="text-sm text-[#A9A9C9]">
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
            className="pulse-input px-3 py-2 tracking-widest outline-none"
          />
          <button className="pulse-btn px-4 py-2">Sign in</button>
          <button
            type="button"
            onClick={handleSendCode}
            disabled={isPending}
            className="text-sm font-medium text-[#A9A9C9] underline decoration-white/20 underline-offset-2 transition-colors hover:text-[#ECEAF6] disabled:opacity-50"
          >
            {isPending ? "Sending..." : "Resend code"}
          </button>
        </>
      )}
    </form>
  );
}
