import { signIn } from "@/auth";
import { LoginTabs } from "./login-tabs";

export default function LoginPage() {
  async function login(formData: FormData) {
    "use server";
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/dashboard",
    });
  }
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-6">
      <div>
        <p className="pulse-kicker mb-2">Founders Sprint</p>
        <h1 className="font-display text-gradient text-3xl font-bold">Presenter sign in</h1>
      </div>
      <div className="pulse-card p-6">
        <LoginTabs passwordAction={login} />
      </div>
    </main>
  );
}
