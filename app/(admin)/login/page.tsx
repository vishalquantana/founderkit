import { signIn } from "@/auth";

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
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">Presenter sign in</h1>
      <form action={login} className="flex flex-col gap-3">
        <input name="email" type="email" placeholder="Email" required
          className="rounded-lg border px-3 py-2" />
        <input name="password" type="password" placeholder="Password" required
          className="rounded-lg border px-3 py-2" />
        <button className="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white">
          Sign in
        </button>
      </form>
    </main>
  );
}
