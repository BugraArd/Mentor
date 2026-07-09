"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/database.types";

export type AuthFormState = { error?: string } | undefined;

function roleHome(role: UserRole) {
  return role === "teacher" ? "/ogretmen" : "/ogrenci";
}

export async function signIn(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "E-posta ve şifre gerekli." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { error: "E-posta veya şifre hatalı." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  redirect(roleHome((profile as any)?.role ?? "student"));
}

export async function signUp(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const role = formData.get("role") === "teacher" ? "teacher" : "student";
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const inviteCode = String(formData.get("inviteCode") ?? "").trim();

  if (fullName.length < 2) {
    return { error: "Ad soyad en az 2 karakter olmalı." };
  }
  if (!email) {
    return { error: "E-posta gerekli." };
  }
  if (password.length < 8) {
    return { error: "Şifre en az 8 karakter olmalı." };
  }
  if (role === "student" && !inviteCode) {
    return { error: "Öğrenci kaydı için mentörünün davet kodu gerekli." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error || !data.user) {
    return { error: error?.message ?? "Kayıt oluşturulamadı." };
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    id: data.user.id,
    role,
    full_name: fullName,
    email,
  } as any);
  if (profileError) {
    // Profil yazılamadıysa oturumu açık bırakma — yarım hesapla
    // panele düşüp döngüye girmesin.
    await supabase.auth.signOut();
    return { error: "Kayıt tamamlanamadı: " + profileError.message };
  }

  if (role === "student") {
    const { error: redeemError } = await (supabase as any).rpc("redeem_invite_code", {
      p_code: inviteCode,
    });
    if (redeemError) {
      return {
        error:
          "Hesabın oluşturuldu ama davet kodu geçersiz veya kullanılmış. Mentörünle kontrol et.",
      };
    }
  }

  redirect(roleHome(role));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/giris");
}
