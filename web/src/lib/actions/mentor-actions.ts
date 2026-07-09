"use server";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/dal";
import { generateInviteCode } from "@/lib/invite-code";

export type MentorFormState = { error?: string; inviteCode?: string } | undefined;

export async function createInviteCode(): Promise<MentorFormState> {
  const profile: any = await requireRole("teacher");
  const supabase = await createClient();

  const code = generateInviteCode();

  const { error } = await supabase.from("mentor_relations").insert({
    teacher_id: profile.id,
    invite_code: code,
  } as any);

  if (error) {
    if (error.code === "23505") {
      // unique constraint — try once more with different code
      const retry = generateInviteCode();
      const { error: e2 } = await supabase.from("mentor_relations").insert({
        teacher_id: profile.id,
        invite_code: retry,
      } as any);
      if (e2) return { error: "Davet kodu oluşturulamadı. Tekrar deneyin." };
      return { inviteCode: retry };
    }
    return { error: error.message };
  }

  return { inviteCode: code };
}

export async function redeemInvite(
  _prev: MentorFormState,
  formData: FormData
): Promise<MentorFormState> {
  await requireRole("student");
  const supabase = await createClient();
  const code = String(formData.get("code") ?? "").trim();

  if (!code) return { error: "Davet kodu gerekli." };

  const { error } = await (supabase as any).rpc("redeem_invite_code", { p_code: code });
  if (error) {
    if (error.message?.includes("already_matched")) {
      return { error: "Bu mentörle zaten eşleşmişsin — tekrar kod kullanmana gerek yok." };
    }
    return { error: "Geçersiz veya kullanılmış davet kodu." };
  }

  return { inviteCode: code };
}
