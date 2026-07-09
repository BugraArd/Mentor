import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { UserRole, Database } from "@/lib/database.types";
import { assignmentTimeState } from "@/lib/assignment-time";

// Data Access Layer: her sayfa/action bu fonksiyonlar üzerinden
// oturum ve profil bilgisine erişir — yetki kontrolü tek yerde toplanır.

export const verifySession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/giris");
  }

  return user;
});

export const getProfile = cache(async () => {
  const user = await verifySession();
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    // Oturum var ama profil satırı yok (yarım kalmış kayıt) — oturumu
    // kapatmadan yönlendirirsek giriş sayfasıyla sonsuz döngüye girer.
    await supabase.auth.signOut();
    redirect("/giris");
  }

  return profile as any;
});

export async function requireRole(role: UserRole) {
  const profile: any = await getProfile();
  if (profile.role !== role) {
    redirect("/");
  }
  return profile;
}

// ─── Teacher Queries ───

export const getTeacherStudents = cache(async (teacherId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mentor_relations")
    .select("id, invite_code, status, created_at, accepted_at, student:profiles!mentor_relations_student_id_fkey(id, full_name, email)")
    .eq("teacher_id", teacherId)
    .eq("status", "active");

  // Aynı öğrenciyle birden fazla eşleşme kaydı kalmışsa listede tekilleştir
  // (asıl engel veritabanındaki unique index; bu, eski kayıtlara karşı sigorta).
  const seen = new Set<string>();
  return (data ?? []).filter((r: any) => {
    const sid = r.student?.id;
    if (!sid || seen.has(sid)) return false;
    seen.add(sid);
    return true;
  });
});

export const getTeacherAssignments = cache(async (teacherId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("assignments")
    .select("*")
    .eq("teacher_id", teacherId)
    .order("created_at", { ascending: false });
  return data ?? [];
});

export const getTeacherStats = cache(async (teacherId: string) => {
  const supabase = await createClient();

  const { count: studentCount } = await supabase
    .from("mentor_relations")
    .select("*", { count: "exact", head: true })
    .eq("teacher_id", teacherId)
    .eq("status", "active");

  // Aktif/açılmamış ayrımını ekranlarla aynı yardımcıdan (assignmentTimeState)
  // hesaplıyoruz — SQL filtresiyle ayrı ayrı yazılırsa ekranla sayaç
  // birbirinden sapabilir (zamanlanmış ödev açıldığında sayaç güncellenmez).
  const { data: assignmentRows } = await supabase
    .from("assignments")
    .select("id, status, starts_at, ends_at")
    .eq("teacher_id", teacherId);
  const assignments = (assignmentRows ?? []) as any[];
  const ids = assignments.map((a) => a.id);

  let activeAssignmentCount = 0;
  let notYetOpenCount = 0;
  for (const a of assignments) {
    if (a.status !== "active" && a.status !== "scheduled") continue;
    const time = assignmentTimeState(a);
    if (time === "upcoming") notYetOpenCount++;
    else if (time === "open") activeAssignmentCount++;
  }

  let pendingCount = 0;
  let evaluatedCount = 0;
  if (ids.length > 0) {
    const { count: pc } = await supabase
      .from("submissions")
      .select("*", { count: "exact", head: true })
      .in("assignment_id", ids)
      .eq("status", "submitted");
    pendingCount = pc ?? 0;

    const { count: ec } = await supabase
      .from("submissions")
      .select("*", { count: "exact", head: true })
      .in("assignment_id", ids)
      .eq("status", "evaluated");
    evaluatedCount = ec ?? 0;
  }

  return {
    studentCount: studentCount ?? 0,
    activeAssignmentCount,
    // Bekleyen Ödev: henüz açılmamış ödevler + değerlendirme bekleyen teslimler
    awaitingCount: notYetOpenCount + pendingCount,
    evaluatedCount,
  };
});

export const getAssignmentWithSubmissions = cache(async (assignmentId: string) => {
  const supabase = await createClient();
  
  const { data: assignment } = await supabase
    .from("assignments")
    .select("*")
    .eq("id", assignmentId)
    .single();

  if (!assignment) return null;

  const { data: assignees } = await supabase
    .from("assignment_assignees")
    .select("student_id, seen_at, student:profiles!assignment_assignees_student_id_fkey(id, full_name, email)")
    .eq("assignment_id", assignmentId);

  const { data: submissions } = await supabase
    .from("submissions")
    .select("*, evaluations(*)")
    .eq("assignment_id", assignmentId)
    .order("version", { ascending: false });

  return { assignment, assignees: assignees ?? [], submissions: submissions ?? [] };
});

export const getPrivateNotes = cache(async (teacherId: string, studentId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("private_notes")
    .select("*")
    .eq("teacher_id", teacherId)
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });
  return data ?? [];
});

export const getRecentSubmissions = cache(async (teacherId: string, limit = 5) => {
  const supabase = await createClient();
  const { data: teacherAssignmentRows } = await supabase
    .from("assignments")
    .select("id, ends_at")
    .eq("teacher_id", teacherId);
  const assignmentRows = (teacherAssignmentRows ?? []) as any[];
  const ids = assignmentRows.map((a) => a.id);
  if (ids.length === 0) return [];

  const endsAtByAssignment = new Map<string, string | null>(
    assignmentRows.map((a) => [a.id, a.ends_at])
  );

  // Durum filtresi olmadan TÜM sürümleri çekip version'a göre sıralıyoruz ki
  // her (ödev, öğrenci) ikilisi için gerçek en güncel sürümü bulabilelim —
  // yoksa öğrenci revizyon sonrası yeni sürüm gönderdiğinde eski
  // "needs_revision" satırı bu listede sonsuza kadar takılı kalıyordu.
  const { data } = await supabase
    .from("submissions")
    .select("*, student:profiles!submissions_student_id_fkey(id, full_name), assignment:assignments!submissions_assignment_id_fkey(id, title)")
    .in("assignment_id", ids)
    .order("version", { ascending: false });

  const seen = new Set<string>();
  const latestPerThread = ((data ?? []) as any[]).filter((s) => {
    const key = `${s.assignment_id}:${s.student_id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const now = Date.now();
  const actionable = latestPerThread.filter((s) => {
    if (s.status === "submitted") return true;
    if (s.status !== "needs_revision") return false;
    // Süresi dolmuş ödevde "revizyon bekliyor" artık anlamsız — öğrenci
    // zaten yeniden teslim yapamaz, listeden düşer.
    const endsAt = endsAtByAssignment.get(s.assignment_id);
    return !endsAt || new Date(endsAt).getTime() > now;
  });

  return actionable
    .sort(
      (a, b) =>
        new Date(b.submitted_at ?? 0).getTime() -
        new Date(a.submitted_at ?? 0).getTime()
    )
    .slice(0, limit);
});

// ─── Student Queries ───

export const getStudentMentor = cache(async (studentId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mentor_relations")
    .select("id, accepted_at, teacher:profiles!mentor_relations_teacher_id_fkey(id, full_name, email)")
    .eq("student_id", studentId)
    .eq("status", "active")
    .limit(1);
  return ((data as any)?.[0] ?? null) as
    | { id: string; accepted_at: string | null; teacher: { id: string; full_name: string; email: string | null } | null }
    | null;
});

export const getStudentAssignments = cache(async (studentId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("assignment_assignees")
    .select("assignment:assignments!assignment_assignees_assignment_id_fkey(*)")
    .eq("student_id", studentId);

  const assignments = (data ?? [])
    .map(d => (d as unknown as { assignment: Database["public"]["Tables"]["assignments"]["Row"] }).assignment)
    .filter(Boolean);
  return assignments;
});

export const getStudentStats = cache(async (studentId: string) => {
  const supabase = await createClient();

  const { data: assigneeRows } = await supabase
    .from("assignment_assignees")
    .select("assignment:assignments!assignment_assignees_assignment_id_fkey(starts_at, ends_at)")
    .eq("student_id", studentId);
  const assignedAssignments = ((assigneeRows ?? []) as any[])
    .map((r) => r.assignment)
    .filter(Boolean);

  const totalAssignments = assignedAssignments.length;
  const notYetOpenCount = assignedAssignments.filter(
    (a: any) => assignmentTimeState(a) === "upcoming"
  ).length;

  const { count: submittedCount } = await supabase
    .from("submissions")
    .select("*", { count: "exact", head: true })
    .eq("student_id", studentId)
    .in("status", ["submitted", "evaluated"]);

  const { count: revisionCount } = await supabase
    .from("submissions")
    .select("*", { count: "exact", head: true })
    .eq("student_id", studentId)
    .eq("status", "needs_revision");

  // değerlendirme bekleyen (öğrenci gönderdi, öğretmen henüz puanlamadı)
  const { count: awaitingEvalCount } = await supabase
    .from("submissions")
    .select("*", { count: "exact", head: true })
    .eq("student_id", studentId)
    .eq("status", "submitted");

  return {
    totalAssignments,
    submittedCount: submittedCount ?? 0,
    revisionCount: revisionCount ?? 0,
    // Bekleyen Ödev: henüz açılmamış ödevler + değerlendirme bekleyen teslimler
    awaitingCount: notYetOpenCount + (awaitingEvalCount ?? 0),
  };
});

export const getStudentSubmission = cache(async (assignmentId: string, studentId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("submissions")
    .select("*, evaluations(*)")
    .eq("assignment_id", assignmentId)
    .eq("student_id", studentId)
    .order("version", { ascending: false });
  return data ?? [];
});

// "Görüldü" bilgisi: öğrenci ödevi/geri bildirimi açtığında bir kere işaretlenir
// (is("...", null) sayesinde ilk görülme anı korunur, sonraki açılışlar üzerine yazmaz).

export async function markAssignmentSeen(assignmentId: string, studentId: string) {
  const supabase = await createClient();
  await (supabase as any)
    .from("assignment_assignees")
    .update({ seen_at: new Date().toISOString() })
    .eq("assignment_id", assignmentId)
    .eq("student_id", studentId)
    .is("seen_at", null);
}

export async function markEvaluationSeen(evaluationId: string) {
  const supabase = await createClient();
  await (supabase as any)
    .from("evaluations")
    .update({ seen_by_student_at: new Date().toISOString() })
    .eq("id", evaluationId)
    .is("seen_by_student_at", null);
}

// ─── Shared Queries ───

export const getAssignmentDetail = cache(async (assignmentId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("assignments")
    .select("*")
    .eq("id", assignmentId)
    .single();
  return data;
});

export const getSubmissionDetail = cache(async (submissionId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("submissions")
    .select("*, evaluations(*), student:profiles!submissions_student_id_fkey(id, full_name, email), assignment:assignments!submissions_assignment_id_fkey(*)")
    .eq("id", submissionId)
    .single();
  return data;
});
