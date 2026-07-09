"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/dal";
import type { RubricScore } from "@/lib/database.types";

export type EvaluationFormState = { error?: string; success?: boolean } | undefined;

export async function evaluateSubmission(
  _prev: EvaluationFormState,
  formData: FormData
): Promise<EvaluationFormState> {
  await requireRole("teacher");
  const supabase = await createClient();

  const submissionId = String(formData.get("submissionId") ?? "");
  const feedback = String(formData.get("feedback") ?? "").trim() || null;
  const voiceFeedbackUrl = String(formData.get("voiceFeedbackUrl") ?? "").trim() || null;
  const scoresJson = String(formData.get("rubricScores") ?? "[]");
  const requiresRevision = formData.get("requiresRevision") === "true";
  const assignmentId = String(formData.get("assignmentId") ?? "");
  const newDeadline = String(formData.get("newDeadline") ?? "").trim() || null;

  if (!submissionId) return { error: "Teslim bulunamadı." };

  const { data: assignmentRow } = await supabase
    .from("assignments")
    .select("ends_at, title")
    .eq("id", assignmentId)
    .single();
  const assignmentTitle = (assignmentRow as any)?.title ?? null;

  // Süresi dolmuş bir ödevde revizyon istemek, öğrencinin hiçbir zaman
  // gönderemeyeceği bir isteğe dönüşür (teslim süresi kilitli kalır) —
  // bu yüzden yeni bir açık kalma süresi zorunlu.
  let extendDeadlineIso: string | null = null;
  if (requiresRevision) {
    const currentEndsAt = (assignmentRow as any)?.ends_at ?? null;
    const isExpired =
      !!currentEndsAt && new Date(currentEndsAt).getTime() < Date.now();

    if (isExpired) {
      if (!newDeadline) {
        return {
          error:
            "Bu ödevin teslim süresi dolmuş. Revizyon isteyebilmek için önce öğrenciye yeni bir son teslim tarihi belirlemelisin.",
        };
      }
      const newDeadlineTime = new Date(newDeadline).getTime();
      if (isNaN(newDeadlineTime) || newDeadlineTime <= Date.now()) {
        return { error: "Yeni son teslim tarihi gelecekte bir zaman olmalı." };
      }
      extendDeadlineIso = new Date(newDeadline).toISOString();
    }
  }

  // Teslim başına en fazla 2 değerlendirme hakkı (ilk + 1 düzeltme).
  const { data: existingEvals } = await supabase
    .from("evaluations")
    .select("id")
    .eq("submission_id", submissionId);
  if ((existingEvals?.length ?? 0) >= 2) {
    return {
      error:
        "Bu teslim için değerlendirme hakların bitti (en fazla 2 kez değerlendirebilirsin). Öğrenci revizyon gönderirse yeni sürümü ayrıca değerlendirebilirsin.",
    };
  }

  let rubricScores: RubricScore[] | null = null;
  try {
    const parsed = JSON.parse(scoresJson);
    if (Array.isArray(parsed) && parsed.length > 0) rubricScores = parsed;
  } catch { /* ignore */ }

  const { error } = await supabase.from("evaluations").insert({
    submission_id: submissionId,
    rubric_scores: rubricScores,
    feedback,
    voice_feedback_url: voiceFeedbackUrl,
    requires_revision: requiresRevision,
  } as any);

  if (error) return { error: error.message };

  // Update submission status
  const { data: submissionRow, error: statusError } = await (supabase as any)
    .from("submissions")
    .update({ status: requiresRevision ? "needs_revision" : "evaluated" })
    .eq("id", submissionId)
    .select("student_id")
    .single();
  if (statusError) {
    return {
      error:
        "Değerlendirme kaydedildi ama teslim durumu güncellenemedi: " +
        statusError.message,
    };
  }

  // Süresi dolmuş ödevi öğrencinin tekrar teslim edebilmesi için yeniden aç.
  if (extendDeadlineIso) {
    const { error: extendError } = await (supabase as any)
      .from("assignments")
      .update({ ends_at: extendDeadlineIso })
      .eq("id", assignmentId);
    if (extendError) {
      return {
        error:
          "Değerlendirme kaydedildi ama yeni son teslim tarihi ayarlanamadı: " +
          extendError.message,
      };
    }
  }

  const studentId = (submissionRow as any)?.student_id;
  if (studentId) {
    await (supabase as any).rpc("notify", {
      p_user_id: studentId,
      p_type: requiresRevision ? "revision_requested" : "feedback",
      p_title: requiresRevision ? "Revizyon istendi" : "Ödevin değerlendirildi",
      p_body: assignmentTitle,
    });
  }

  redirect(`/odev/${assignmentId}`);
}

export async function savePrivateNote(
  _prev: EvaluationFormState,
  formData: FormData
): Promise<EvaluationFormState> {
  const profile: any = await requireRole("teacher");
  const supabase = await createClient();

  const studentId = String(formData.get("studentId") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  if (!studentId || !note) return { error: "Öğrenci ve not alanı gerekli." };

  const { data: relation } = await supabase
    .from("mentor_relations")
    .select("id")
    .eq("teacher_id", profile.id)
    .eq("student_id", studentId)
    .eq("status", "active")
    .limit(1);
  if (!relation || relation.length === 0) {
    return { error: "Bu öğrenci seninle eşleşmiş değil." };
  }

  const { error } = await supabase.from("private_notes").insert({
    teacher_id: profile.id,
    student_id: studentId,
    note,
  } as any);

  if (error) return { error: error.message };
  return { success: true };
}
