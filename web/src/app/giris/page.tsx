import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AuthForm } from "./auth-form";

export default async function GirisPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const userRole = (profile as any)?.role;
    redirect(userRole === "teacher" ? "/ogretmen" : "/ogrenci");
  }

  return (
    <main className="flex min-h-full flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-accent to-future font-bold text-white shadow-sm">
            M
          </div>
          <span className="text-xl font-bold tracking-tight">MENTOR</span>
        </div>
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-balance">
          Mentörlük yolculuğuna başla
        </h1>
        <p className="mb-8 text-ink-soft">
          Öğretmen ya da öğrenci olarak giriş yap, ya da yeni bir hesap oluştur.
        </p>
        <AuthForm />
      </div>
    </main>
  );
}
