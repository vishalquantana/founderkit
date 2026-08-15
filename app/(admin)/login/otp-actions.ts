"use server";

import { getUserByEmail } from "@/db/queries/users";
import { createOtp } from "@/db/queries/otp";
import { generateOtp, hashOtp } from "@/lib/otp";
import { hasSendgrid, sendEmail } from "@/email/sendgrid";
import { otpEmail } from "@/email/templates";
import { signIn } from "@/auth";

const OTP_TTL_MS = 10 * 60 * 1000;

export async function requestOtpAction(formData: FormData): Promise<{ sent: boolean }> {
  const email = formData.get("email");

  if (typeof email === "string" && email) {
    try {
      const user = await getUserByEmail(email);
      if (user && hasSendgrid()) {
        const code = generateOtp();
        const codeHash = await hashOtp(code);
        const expiresAt = new Date(Date.now() + OTP_TTL_MS);
        await createOtp(email, codeHash, expiresAt);

        const { subject, html, text } = otpEmail(code);
        const result = await sendEmail({ to: email, subject, html, text });
        if (!result.ok) {
          console.error(`Failed to send OTP email to ${email}`);
        }
      }
    } catch (err) {
      console.error("requestOtpAction error", err);
    }
  }

  // Always return sent: true so we never reveal whether the email exists.
  return { sent: true };
}

export async function signInWithOtpAction(formData: FormData): Promise<void> {
  await signIn("otp", {
    email: formData.get("email"),
    code: formData.get("code"),
    redirectTo: "/dashboard",
  });
}
