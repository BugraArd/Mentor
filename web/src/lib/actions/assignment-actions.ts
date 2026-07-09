"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/dal";
import type { RubricCriterion, AssignmentStatus } from "@/lib/database.types";

export type AssignmentFormState = { error?: string; success?: boolean } | undefined;

export async function createAssignment(
  _prev: AssignmentFormState,
  formData: FormData
): Promise<AssignmentFormState> {
  const profile: any = await requireRole("teacher");
  const supabase = await createClient();

  const title = String(formData.get("title") ?? "").trim();
  const instructions = String(formData.get("instructions") ?? "").trim() || null;
  const voiceNoteUrl = String(formData.get("voiceNoteUrl") ?? "").trim() || null;
  const attachmentUrl = String(formData.get("attachmentUrl") ?? "").trim() || null;
  const rubricJson = String(formData.get("rubric") ?? "[]");
  const startsAt = String(formData.get("startsAt") ?? "").trim() || null;
  const endsAt = String(formData.get("endsAt") ?? "").trim() || null;
  const studentIds = formData.getAll("studentIds").map(String).filter(Boolean);
  const publishNow = formData.get("publishNow") === "true";

  if (!title || title.length < 2) {
    return { error: "Başlık en az 2 karakter olmalı." };
  }

  if (!publishNow && !startsAt) {
    return { error: "Hemen yayınlamıyorsan bir başlangıç tarihi seçmelisin." };
  }
  if (studentIds.length === 0) {
    return { error: "En az bir öğrenci seçmelisin (Atama & Önizleme adımında)." };
  }
  if (startsAt && isNaN(new Date(startsAt).getTime())) {
    return { error: "Başlangıç tarihi geçersiz." };
  }
  if (endsAt) {
    const end = new Date(endsAt).getTime();
    if (isNaN(end)) {
      return { error: "Teslim son tarihi geçersiz." };
    }
    if (end < Date.now()) {
      return { error: "Teslim son tarihi geçmişte olamaz." };
    }
    if (startsAt && end <= new Date(startsAt).getTime()) {
      return { error: "Teslim son tarihi, başlangıç tarihinden sonra olmalı." };
    }
  }

  let rubric: RubricCriterion[] | null = null;
  try {
    const parsed = JSON.parse(rubricJson);
    if (Array.isArray(parsed) && parsed.length > 0) rubric = parsed;
  } catch { /* ignore */ }

  let status: AssignmentStatus = "draft";
  if (publishNow) status = "active";
  else if (startsAt) status = "scheduled";

  const { data: assignment, error } = await supabase
    .from("assignments")
    .insert({
      teacher_id: profile.id,
      title,
      instructions,
      voice_note_url: voiceNoteUrl,
      attachment_url: attachmentUrl,
      rubric,
      // "Hemen yayınla" seçiliyse formda kalmış eski başlangıç tarihi
      // gönderilmemeli — ileri tarihli starts_at ödevi öğrenciden gizler.
      starts_at: publishNow ? null : startsAt ? new Date(startsAt).toISOString() : null,
      ends_at: endsAt ? new Date(endsAt).toISOString() : null,
      status,
    } as any)
    .select("id")
    .single();

  if (error || !assignment) {
    return { error: error?.message ?? "Ödev oluşturulamadı." };
  }

  const rows = studentIds.map(sid => ({ assignment_id: (assignment as any).id, student_id: sid }));
  const { error: assignError } = await supabase
    .from("assignment_assignees")
    .insert(rows as any);
  if (assignError) {
    return {
      error: "Ödev oluşturuldu ama öğrenci ataması başarısız oldu: " + assignError.message,
    };
  }

  if (publishNow) {
    for (const sid of studentIds) {
      await (supabase as any).rpc("notify", {
        p_user_id: sid,
        p_type: "assignment_started",
        p_title: `Yeni ödev: ${title}`,
        p_body: `${profile.full_name} sana bir ödev atadı.`,
      });
    }
  }

  redirect("/ogretmen");
}

export async function deleteAssignment(assignmentId: string) {
  await requireRole("teacher");
  const supabase = await createClient();
  await supabase.from("assignments").delete().eq("id", assignmentId);
  redirect("/ogretmen");
}
