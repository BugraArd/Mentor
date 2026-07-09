import Link from "next/link";
import { AlertCircleIcon } from "@/components/icons";
import type { SubmissionStatus } from "@/lib/database.types";

function getStatusBadge(status?: SubmissionStatus) {
  switch (status) {
    case "submitted":
      return { label: "Teslim Edildi", className: "badge badge-accent" };
    case "evaluated":
      return { label: "Değerlendirildi", className: "badge badge-go" };
    case "needs_revision":
      return { label: "Revizyon", className: "badge badge-time" };
    default:
      return { label: "Bekliyor", className: "badge badge-muted" };
  }
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function SubmissionRow({
  student,
  submission,
  assignmentId,
  isExpired,
  seenAt,
  feedbackSeenAt,
}: {
  student: { id: string; full_name: string };
  submission?: {
    id: string;
    status: SubmissionStatus;
    version: number;
    submitted_at: string | null;
  };
  assignmentId: string;
  isExpired?: boolean;
  seenAt?: string | null;
  feedbackSeenAt?: string | null;
}) {
  // Süre dolduysa ve öğrenci hiç teslim yapmadıysa "Bekliyor" yanıltıcı olur —
  // artık gönderim yapamayacağı için "Teslim Edilmedi" gösterilmeli.
  const isMissed = isExpired && !submission;
  const badge = isMissed
    ? { label: "Teslim Edilmedi", className: "badge badge-time" }
    : getStatusBadge(submission?.status);

  return (
    <tr className="border-b border-line-soft last:border-0 transition-colors hover:bg-surface-2/50">
      {/* Student */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
              isMissed ? "bg-time-wash text-time" : "bg-accent-wash text-accent"
            }`}
          >
            {isMissed ? (
              <AlertCircleIcon className="h-4 w-4" />
            ) : (
              getInitials(student.full_name)
            )}
          </div>
          <div className="min-w-0">
            <span className="block font-medium text-sm text-ink truncate">
              {student.full_name}
            </span>
            <span className="block text-[11px] text-ink-faint">
              {seenAt ? "Ödevi gördü" : "Henüz görmedi"}
            </span>
          </div>
        </div>
      </td>

      {/* Status */}
      <td className="py-3 px-4">
        <span className={badge.className}>{badge.label}</span>
        {submission?.status === "evaluated" && (
          <span className="mt-1 block text-[11px] text-ink-faint">
            {feedbackSeenAt ? "Geri bildirim görüldü" : "Geri bildirim henüz görülmedi"}
          </span>
        )}
      </td>

      {/* Version */}
      <td className="py-3 px-4 text-sm text-ink-soft tabular-nums">
        {submission ? `v${submission.version}` : "—"}
      </td>

      {/* Date */}
      <td className="py-3 px-4 text-sm text-ink-faint">
        {submission?.submitted_at
          ? new Date(submission.submitted_at).toLocaleDateString("tr-TR", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "—"}
      </td>

      {/* Action */}
      <td className="py-3 px-4 text-right">
        {submission && submission.status !== "pending" ? (
          <Link
            href={`/odev/${assignmentId}/degerlendirme/${submission.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent hover:text-white"
          >
            Değerlendir
          </Link>
        ) : (
          <span className="text-xs text-ink-faint">—</span>
        )}
      </td>
    </tr>
  );
}
