"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/dal";

export type ProfileFormState = { error?: string; success?: boolean } | undefined;

export async function updateProfile(
  _prev: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const profile: any = await getProfile();
  const supabase = await createClient();

  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;

  if (fullName.length < 2) {
    return { error: "Ad soyad en az 2 karakter olmalı." };
  }

  const { error } = await (supabase as any)
    .from("profiles")
    .update({ full_name: fullName, phone })
    .eq("id", profile.id);

  if (error) return { error: error.message };

  revalidatePath("/ogretmen/profil");
  revalidatePath("/ogrenci/profil");
  return { success: true };
}

export async function updatePassword(
  _prev: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  await getProfile();
  const supabase = await createClient();

  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");

  if (password.length < 8) {
    return { error: "Yeni şifre en az 8 karakter olmalı." };
  }
  if (password !== passwordConfirm) {
    return { error: "Şifreler eşleşmiyor." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  return { success: true };
}
