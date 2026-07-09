"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/dal";

export type SubmissionFormState = { error?: string; success?: boolean } | undefined;

export async function submitAssignment(
  _prev: SubmissionFormState,
  formData: FormData
): Promise<SubmissionFormState> {
  const profile: any = await requireRole("student");
  const supabase = await createClient();

  const assignmentId = String(formData.get("assignmentId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const attachmentUrl = String(formData.get("attachmentUrl") ?? "").trim() || null;

  if (!assignmentId) return { error: "Ödev bulunamadı." };
  if (!body && !attachmentUrl) return { error: "Teslim içeriği veya dosya eki gerekli." };

  // Süre kontrolü: UI ne gösterirse göstersin, asıl kilit burada.
  const { data: assignment } = await supabase
    .from("assignments")
    .select("starts_at, ends_at, teacher_id, title")
    .eq("id", assignmentId)
    .single();

  if (!assignment) return { error: "Ödev bulunamadı." };

  const now = Date.now();
  const a = assignment as any;
  if (a.starts_at && new Date(a.starts_at).getTime() > now) {
    return { error: "Bu ödev henüz açılmadı." };
  }
  if (a.ends_at && new Date(a.ends_at).getTime() < now) {
    return { error: "Teslim süresi doldu — artık gönderim yapılamaz." };
  }

  // Check existing submissions to determine version
  const { data: existing } = await supabase
    .from("submissions")
    .select("version")
    .eq("assignment_id", assignmentId)
    .eq("student_id", profile.id)
    .order("version", { ascending: false })
    .limit(1);

  const nextVersion = (existing && existing.length > 0) ? (existing as any)[0].version + 1 : 1;

  const { error } = await supabase.from("submissions").insert({
    assignment_id: assignmentId,
    student_id: profile.id,
    version: nextVersion,
    body,
    attachment_url: attachmentUrl,
    status: "submitted",
    submitted_at: new Date().toISOString(),
  } as any);

  if (error) return { error: error.message };

  if (a.teacher_id) {
    await (supabase as any).rpc("notify", {
      p_user_id: a.teacher_id,
      p_type: "submitted",
      p_title: `${profile.full_name} bir ödev teslim etti`,
      p_body: a.title ?? null,
    });
  }

  redirect(`/odev/${assignmentId}`);
}
