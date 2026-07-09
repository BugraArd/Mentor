import Link from "next/link";
import {
  ClockIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  BookOpenIcon,
  ChevronRightIcon,
} from "@/components/icons";
import type { AssignmentStatus, SubmissionStatus } from "@/lib/database.types";

function getStatusConfig(submissionStatus?: SubmissionStatus) {
  switch (submissionStatus) {
    case "submitted":
      return {
        icon: <ClockIcon className="h-5 w-5" />,
        label: "Teslim Edildi",
        badgeClass: "badge badge-accent",
        iconColor: "text-accent",
      };
    case "evaluated":
      return {
        icon: <CheckCircleIcon className="h-5 w-5" />,
        label: "Değerlendirildi",
        badgeClass: "badge badge-go",
        iconColor: "text-go",
      };
    case "needs_revision":
      return {
        icon: <AlertCircleIcon className="h-5 w-5" />,
        label: "Revizyon Gerekli",
        badgeClass: "badge badge-time",
        iconColor: "text-time",
      };
    default:
      return {
        icon: <BookOpenIcon className="h-5 w-5" />,
        label: "Bekliyor",
        badgeClass: "badge badge-muted",
        iconColor: "text-ink-faint",
      };
  }
}

function getRemainingTime(endsAt: string | null): string | null {
  if (!endsAt) return null;
  const now = new Date();
  const end = new Date(endsAt);
  const diff = end.getTime() - now.getTime();
  if (diff <= 0) return "Süre doldu";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `${days} gün ${hours} saat kaldı`;
  if (hours > 0) return `${hours} saat kaldı`;
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${minutes} dakika kaldı`;
}

export function AssignmentCard({
  assignment,
  submissionStatus,
}: {
  assignment: {
    id: string;
    title: string;
    starts_at?: string | null;
    ends_at: string | null;
    status: AssignmentStatus;
  };
  submissionStatus?: SubmissionStatus;
}) {
  const isUpcoming =
    !!assignment.starts_at &&
    new Date(assignment.starts_at).getTime() > Date.now();

  const isExpired =
    !isUpcoming &&
    !!assignment.ends_at &&
    new Date(assignment.ends_at).getTime() < Date.now();

  // Süresi dolmuş ve öğrenci hiç teslim yapmamışsa "Bekliyor" yanıltıcı olur —
  // artık gönderim yapılamayacağı için "Teslim Edilmedi" gösterilmeli.
  const isMissed =
    isExpired && (!submissionStatus || submissionStatus === "pending");

  const config = isUpcoming
    ? {
        icon: <ClockIcon className="h-5 w-5" />,
        label: "Yakında",
        badgeClass: "badge badge-future",
        iconColor: "text-future",
      }
    : isMissed
    ? {
        icon: <AlertCircleIcon className="h-5 w-5" />,
        label: "Teslim Edilmedi",
        badgeClass: "badge badge-time",
        iconColor: "text-time",
      }
    : getStatusConfig(submissionStatus);

  const remaining = isUpcoming
    ? `${new Date(assignment.starts_at!).toLocaleString("tr-TR", {
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      })} tarihinde açılacak`
    : getRemainingTime(assignment.ends_at);
  const isUrgent =
    assignment.ends_at &&
    new Date(assignment.ends_at).getTime() - Date.now() < 24 * 60 * 60 * 1000 &&
    new Date(assignment.ends_at).getTime() > Date.now();

  return (
    <Link href={`/odev/${assignment.id}`} className="block group">
      <div className="glass-card p-4 sm:p-5 flex items-center gap-4 transition-all duration-200 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5">
        {/* Left: Status icon */}
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
            submissionStatus === "evaluated"
              ? "bg-go-wash"
              : submissionStatus === "submitted"
              ? "bg-accent-wash"
              : submissionStatus === "needs_revision"
              ? "bg-time-wash"
              : isMissed
              ? "bg-time-wash"
              : "bg-surface-2"
          } ${config.iconColor}`}
        >
          {config.icon}
        </div>

        {/* Center: Title + deadline */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-ink truncate group-hover:text-accent transition-colors">
            {assignment.title}
          </h3>
          {remaining && (
            <p
              className={`text-xs mt-0.5 ${
                remaining === "Süre doldu"
                  ? "text-red-500"
                  : isUrgent
                  ? "text-time font-medium"
                  : "text-ink-faint"
              }`}
            >
              <ClockIcon className="inline h-3 w-3 mr-1 -mt-px" />
              {remaining}
            </p>
          )}
        </div>

        {/* Right: Badge + chevron */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className={config.badgeClass}>{config.label}</span>
          <ChevronRightIcon className="h-4 w-4 text-ink-faint group-hover:text-accent transition-colors group-hover:translate-x-0.5 transform duration-200" />
        </div>
      </div>
    </Link>
  );
}
