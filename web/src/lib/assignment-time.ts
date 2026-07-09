import type { AssignmentStatus } from "@/lib/database.types";

// Ödevin zamana göre efektif durumu — status alanı veritabanında "active"
// kalsa bile ekranlar bu duruma göre davranır (cron gerektirmez).
export type AssignmentTimeState = "upcoming" | "open" | "expired";

export function assignmentTimeState(a: {
  starts_at: string | null;
  ends_at: string | null;
}): AssignmentTimeState {
  const now = Date.now();
  if (a.starts_at && new Date(a.starts_at).getTime() > now) return "upcoming";
  if (a.ends_at && new Date(a.ends_at).getTime() < now) return "expired";
  return "open";
}

// Ekranda gösterilecek nihai durum. "status" kolonu sadece taslak/kapalı gibi
// öğretmenin bilinçli olarak değiştirdiği durumları taşır; "scheduled"/"active"
// hiçbir arka plan işi (cron) olmadan tarihe göre yeniden yorumlanır — yoksa
// zamanlanmış bir ödev açılış saati geçse bile veritabanında "scheduled" yazılı
// kalır ve ekranda sonsuza kadar "Zamanlanmış" görünür.
export type AssignmentDisplayStatus =
  | "draft"
  | "scheduled"
  | "active"
  | "expired"
  | "closed";

export function assignmentDisplayStatus(a: {
  status: AssignmentStatus;
  starts_at: string | null;
  ends_at: string | null;
}): AssignmentDisplayStatus {
  if (a.status === "draft") return "draft";
  if (a.status === "closed") return "closed";
  const time = assignmentTimeState(a);
  if (time === "expired") return "expired";
  if (time === "upcoming") return "scheduled";
  return "active";
}

export const ASSIGNMENT_STATUS_LABEL: Record<AssignmentDisplayStatus, string> = {
  draft: "Taslak",
  scheduled: "Zamanlanmış",
  active: "Aktif",
  expired: "Süresi Doldu",
  closed: "Kapandı",
};

export const ASSIGNMENT_STATUS_BADGE: Record<AssignmentDisplayStatus, string> = {
  draft: "badge badge-muted",
  scheduled: "badge badge-future",
  active: "badge badge-go",
  expired: "badge badge-time",
  closed: "badge badge-muted",
};
