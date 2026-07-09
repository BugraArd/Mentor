import {
  getProfile,
  getAssignmentDetail,
  getAssignmentWithSubmissions,
  getStudentSubmission,
  markAssignmentSeen,
  markEvaluationSeen,
} from "@/lib/dal";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftIcon,
  ClockIcon,
  FileTextIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  EditIcon,
  BookOpenIcon,
} from "@/components/icons";
import { CountdownTimer } from "@/components/countdown-timer";
import { SubmissionRow } from "@/components/submission-row";
import { SubmitForm } from "./submit-form";
import {
  assignmentDisplayStatus,
  ASSIGNMENT_STATUS_LABEL,
  ASSIGNMENT_STATUS_BADGE,
} from "@/lib/assignment-time";

export default async function OdevDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile: any = await getProfile();
  const assignment: any = await getAssignmentDetail(id);

  if (!assignment)
    redirect(profile.role === "teacher" ? "/ogretmen" : "/ogrenci");

  if (profile.role === "teacher") {
    return <TeacherView assignment={assignment} />;
  } else {
    const submissions = await getStudentSubmission(id, profile.id);

    const isUpcoming =
      !!assignment.starts_at &&
      new Date(assignment.starts_at).getTime() > Date.now();
    if (!isUpcoming) {
      await markAssignmentSeen(id, profile.id);
      const latestEvaluation = (submissions?.[0] as any)?.evaluations?.[0];
      if (latestEvaluation) await markEvaluationSeen(latestEvaluation.id);
    }

    return (
      <StudentView assignment={assignment} submissions={submissions} />
    );
  }
}

/* -------------------------------------------------------------------------- */
/*                              TEACHER VIEW                                  */
/* -------------------------------------------------------------------------- */

async function TeacherView({ assignment }: { assignment: any }) {
  const data = await getAssignmentWithSubmissions(assignment.id);
  const assignees: any[] = data?.assignees ?? [];

  // Her öğrencinin en güncel teslimini eşleştir (liste version'a göre azalan
  // sıralı geldiği için ilk görülen kayıt en günceli)
  const latestByStudent = new Map<string, any>();
  for (const s of (data?.submissions ?? []) as any[]) {
    if (!latestByStudent.has(s.student_id)) {
      latestByStudent.set(s.student_id, s);
    }
  }

  const displayStatus = assignmentDisplayStatus(assignment);
  const statusBadge = ASSIGNMENT_STATUS_BADGE[displayStatus];
  const statusLabel = ASSIGNMENT_STATUS_LABEL[displayStatus];

  return (
    <div className="animate-fade-in space-y-6">
      {/* Back link */}
      <Link
        href="/ogretmen"
        className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink transition-colors"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Panele Dön
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-ink">{assignment.title}</h1>
            <span className={statusBadge}>{statusLabel}</span>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-ink-faint mt-2">
            {assignment.starts_at && (
              <span>
                Başlangıç:{" "}
                {new Date(assignment.starts_at).toLocaleDateString("tr-TR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            )}
            {assignment.ends_at && (
              <span>
                Bitiş:{" "}
                {new Date(assignment.ends_at).toLocaleDateString("tr-TR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="glass-card p-6">
        <h2 className="text-base font-semibold mb-3 flex items-center gap-2 text-ink">
          <FileTextIcon className="h-4 w-4 text-accent" />
          Talimatlar
        </h2>
        <div className="prose prose-sm max-w-none text-ink-soft whitespace-pre-wrap">
          {assignment.instructions || (
            <span className="italic text-ink-faint">Talimat eklenmemiş.</span>
          )}
        </div>
        {assignment.attachment_url && (
          <div className="mt-4 pt-4 border-t border-line-soft">
            <a
              href={assignment.attachment_url}
              target="_blank"
              rel="noopener"
              className="text-accent hover:underline text-sm"
            >
              📎 Dosya Eki
            </a>
          </div>
        )}
      </div>

      {/* Rubric (read-only) */}
      {assignment.rubric && assignment.rubric.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-base font-semibold mb-3 text-ink">
            Rubrik Kriterleri
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="py-2 px-3 text-ink-soft font-medium">
                    Kriter
                  </th>
                  <th className="py-2 px-3 text-ink-soft font-medium text-right">
                    Puan
                  </th>
                </tr>
              </thead>
              <tbody>
                {assignment.rubric.map((c: any, i: number) => (
                  <tr
                    key={i}
                    className="border-b border-line-soft last:border-0"
                  >
                    <td className="py-2.5 px-3 text-ink">{c.label}</td>
                    <td className="py-2.5 px-3 text-right font-semibold tabular-nums text-accent">
                      {c.points}
                    </td>
                  </tr>
                ))}
                <tr className="bg-surface-2">
                  <td className="py-2.5 px-3 font-semibold text-ink">
                    Toplam
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold tabular-nums text-accent">
                    {assignment.rubric.reduce(
                      (s: number, c: any) => s + c.points,
                      0
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Submissions Table */}
      <div className="glass-card p-6">
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2 text-ink">
          <EditIcon className="h-4 w-4 text-future" />
          Öğrenci Teslimleri
          <span className="badge badge-muted ml-2">
            {assignees.length} öğrenci
          </span>
        </h2>

        {assignees.length === 0 ? (
          <p className="text-sm text-ink-faint text-center py-8">
            Henüz atanmış öğrenci yok.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="py-2 px-4 text-ink-soft font-medium">
                    Öğrenci
                  </th>
                  <th className="py-2 px-4 text-ink-soft font-medium">
                    Durum
                  </th>
                  <th className="py-2 px-4 text-ink-soft font-medium">
                    Versiyon
                  </th>
                  <th className="py-2 px-4 text-ink-soft font-medium">
                    Tarih
                  </th>
                  <th className="py-2 px-4 text-ink-soft font-medium text-right">
                    İşlem
                  </th>
                </tr>
              </thead>
              <tbody>
                {assignees.map((a: any) => {
                  const sub = latestByStudent.get(a.student?.id ?? a.student_id);
                  return (
                    <SubmissionRow
                      key={a.student?.id ?? a.student_id}
                      student={{
                        id: a.student?.id ?? a.student_id,
                        full_name:
                          a.student?.full_name ?? "Bilinmeyen Öğrenci",
                      }}
                      submission={sub}
                      assignmentId={assignment.id}
                      isExpired={displayStatus === "expired"}
                      seenAt={a.seen_at ?? null}
                      feedbackSeenAt={sub?.evaluations?.[0]?.seen_by_student_at ?? null}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              STUDENT VIEW                                  */
/* -------------------------------------------------------------------------- */

function StudentView({
  assignment,
  submissions,
}: {
  assignment: any;
  submissions: any[];
}) {
  // Henüz açılmamış ödev: içerik gizli, sadece başlık + açılış sayacı
  const isUpcoming =
    !!assignment.starts_at &&
    new Date(assignment.starts_at).getTime() > Date.now();

  if (isUpcoming) {
    return (
      <div className="animate-fade-in space-y-6">
        <Link
          href="/ogrenci"
          className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Panele Dön
        </Link>

        <h1 className="text-2xl font-bold text-ink">{assignment.title}</h1>

        <div className="glass-card p-8 text-center space-y-3">
          <ClockIcon className="h-10 w-10 text-future mx-auto" />
          <p className="font-semibold text-ink">Bu ödev henüz açılmadı</p>
          <p className="text-sm text-ink-soft">
            {new Date(assignment.starts_at).toLocaleString("tr-TR", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            tarihinde açılacak. Açıldığında yönergeleri görebilecek ve teslim
            yapabileceksin.
          </p>
          <div className="inline-flex items-center gap-2 rounded-lg bg-surface-2 px-4 py-2">
            <span className="text-xs text-ink-faint">Açılışa kalan:</span>
            <CountdownTimer targetDate={assignment.starts_at} />
          </div>
        </div>
      </div>
    );
  }

  const latest = submissions?.[0];
  // Sorgu değerlendirmeleri "evaluations" dizisi olarak döndürür;
  // teslim başına tek değerlendirme olduğundan ilkini alırız.
  const evaluation = (latest as any)?.evaluations?.[0] ?? null;
  const hasSubmitted =
    latest &&
    (latest.status === "submitted" || latest.status === "evaluated");
  const needsRevision = latest?.status === "needs_revision";
  const isExpired =
    !!assignment.ends_at &&
    new Date(assignment.ends_at).getTime() < Date.now();
  const canSubmit =
    !isExpired && (!latest || latest.status === "pending" || needsRevision);

  const statusBadge =
    latest?.status === "submitted"
      ? "badge badge-accent"
      : latest?.status === "evaluated"
      ? "badge badge-go"
      : latest?.status === "needs_revision"
      ? "badge badge-time"
      : "badge badge-muted";

  const statusLabel =
    latest?.status === "submitted"
      ? "Teslim Edildi"
      : latest?.status === "evaluated"
      ? "Değerlendirildi"
      : latest?.status === "needs_revision"
      ? "Revizyon Gerekli"
      : "Bekliyor";

  return (
    <div className="animate-fade-in space-y-6">
      {/* Back link */}
      <Link
        href="/ogrenci"
        className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink transition-colors"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Panele Dön
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">{assignment.title}</h1>
          {latest && (
            <div className="mt-2">
              <span className={statusBadge}>{statusLabel}</span>
            </div>
          )}
        </div>
        {assignment.ends_at && (
          <div className="glass-card px-4 py-3 flex items-center gap-2 flex-shrink-0">
            <ClockIcon className="h-4 w-4 text-time" />
            <CountdownTimer targetDate={assignment.ends_at} />
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="glass-card p-6">
        <h2 className="text-base font-semibold mb-3 flex items-center gap-2 text-ink">
          <FileTextIcon className="h-4 w-4 text-accent" />
          Talimatlar
        </h2>
        <div className="prose prose-sm max-w-none text-ink-soft whitespace-pre-wrap">
          {assignment.instructions || (
            <span className="italic text-ink-faint">Talimat eklenmemiş.</span>
          )}
        </div>
        {assignment.voice_note_url && (
          <div className="mt-4 pt-4 border-t border-line-soft">
            <audio controls className="w-full max-w-md">
              <source src={assignment.voice_note_url} />
            </audio>
          </div>
        )}
        {assignment.attachment_url && (
          <div className="mt-4 pt-4 border-t border-line-soft">
            <a
              href={assignment.attachment_url}
              target="_blank"
              rel="noopener"
              className="text-accent hover:underline text-sm"
            >
              📎 Dosya Eki
            </a>
          </div>
        )}
      </div>

      {/* Rubric (read-only) */}
      {assignment.rubric && assignment.rubric.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-base font-semibold mb-3 text-ink">
            Değerlendirme Kriterleri
          </h2>
          <div className="space-y-2">
            {assignment.rubric.map((c: any, i: number) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg bg-surface-2 px-4 py-2.5"
              >
                <span className="text-sm text-ink">{c.label}</span>
                <span className="text-sm font-semibold tabular-nums text-accent">
                  {c.points} puan
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between rounded-lg bg-accent-wash px-4 py-2.5 mt-1">
              <span className="text-sm font-semibold text-ink">
                Toplam
              </span>
              <span className="text-sm font-bold tabular-nums text-accent">
                {assignment.rubric.reduce(
                  (s: number, c: any) => s + c.points,
                  0
                )}{" "}
                puan
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Current Submission + Evaluation */}
      {hasSubmitted && latest && (
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-base font-semibold flex items-center gap-2 text-ink">
            <CheckCircleIcon className="h-4 w-4 text-go" />
            Teslimin (v{latest.version})
          </h2>
          <div className="prose prose-sm max-w-none text-ink whitespace-pre-wrap rounded-lg bg-surface-2 p-4">
            {latest.body || (
              <span className="text-ink-faint italic">Metin teslimi yok</span>
            )}
          </div>
          {latest.attachment_url && (
            <a
              href={latest.attachment_url}
              target="_blank"
              rel="noopener"
              className="text-accent hover:underline text-sm"
            >
              📎 Dosya Eki
            </a>
          )}

          {/* Evaluation */}
          {evaluation && (
            <div className="mt-4 pt-4 border-t border-line-soft space-y-3">
              <h3 className="font-semibold text-ink flex items-center gap-2">
                <BookOpenIcon className="h-4 w-4 text-future" />
                Değerlendirme
              </h3>

              {/* Rubric scores */}
              {evaluation.rubric_scores &&
                evaluation.rubric_scores.length > 0 && (
                  <div className="space-y-1.5">
                    {evaluation.rubric_scores.map(
                      (rs: any, i: number) => {
                        const pct =
                          rs.points > 0
                            ? (rs.score / rs.points) * 100
                            : 0;
                        return (
                          <div
                            key={i}
                            className="flex items-center justify-between rounded-lg bg-surface-2 px-4 py-2"
                          >
                            <span className="text-sm text-ink">
                              {rs.label}
                            </span>
                            <span
                              className={`text-sm font-bold tabular-nums ${
                                pct >= 80
                                  ? "text-go"
                                  : pct >= 50
                                  ? "text-time"
                                  : "text-ink-soft"
                              }`}
                            >
                              {rs.score}/{rs.points}
                            </span>
                          </div>
                        );
                      }
                    )}
                    <div className="flex items-center justify-between rounded-lg bg-accent-wash px-4 py-2.5">
                      <span className="text-sm font-semibold text-ink">
                        Toplam
                      </span>
                      <span className="stat-number bg-gradient-to-r from-accent to-future bg-clip-text text-transparent">
                        {evaluation.rubric_scores.reduce(
                          (s: number, rs: any) => s + (rs.score ?? 0),
                          0
                        )}
                        /
                        {evaluation.rubric_scores.reduce(
                          (s: number, rs: any) => s + rs.points,
                          0
                        )}
                      </span>
                    </div>
                  </div>
                )}

              {/* Written feedback */}
              {evaluation.feedback && (
                <div className="rounded-lg bg-surface-2 p-4">
                  <p className="text-sm font-medium text-ink-soft mb-1">
                    Geri Bildirim
                  </p>
                  <p className="text-sm text-ink whitespace-pre-wrap">
                    {evaluation.feedback}
                  </p>
                </div>
              )}

              {/* Voice feedback */}
              {evaluation.voice_feedback_url && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-ink-soft mb-1">
                    Sesli Geri Bildirim
                  </p>
                  <audio controls className="w-full max-w-md">
                    <source src={evaluation.voice_feedback_url} />
                  </audio>
                </div>
              )}

              {/* Revision required */}
              {evaluation.requires_revision && (
                <div className="flex items-center gap-2 rounded-lg bg-time-wash px-4 py-3">
                  <AlertCircleIcon className="h-4 w-4 text-time" />
                  <span className="text-sm font-semibold text-time">
                    Revizyon istendi — lütfen tekrar teslim et.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Needs revision notice */}
      {needsRevision && (
        <div className="flex items-center gap-3 rounded-xl bg-time-wash border border-time/20 px-5 py-4">
          <AlertCircleIcon className="h-5 w-5 text-time flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-time">
              Revizyon Gerekli
            </p>
            <p className="text-xs text-ink-soft mt-0.5">
              Öğretmenin geri bildirimlerini inceleyip tekrar teslim et.
            </p>
          </div>
        </div>
      )}

      {/* Submit Form */}
      {canSubmit && <SubmitForm assignmentId={assignment.id} />}

      {/* Expired notice */}
      {isExpired && !hasSubmitted && (
        <div className="flex items-center gap-3 rounded-xl bg-surface-2 border border-line px-5 py-4">
          <ClockIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-500">
              Teslim süresi doldu
            </p>
            <p className="text-xs text-ink-soft mt-0.5">
              Bu ödev için artık gönderim yapılamaz. Sorun olduğunu
              düşünüyorsan mentörünle iletişime geç.
            </p>
          </div>
        </div>
      )}

      {/* Revision History */}
      {submissions && submissions.length > 1 && (
        <div className="glass-card p-6">
          <h2 className="text-base font-semibold mb-4 text-ink">
            Teslim Geçmişi
          </h2>
          <div className="space-y-3">
            {submissions.map((sub: any, i: number) => (
              <div
                key={sub.id}
                className={`flex items-center justify-between rounded-lg px-4 py-3 ${
                  i === 0
                    ? "bg-accent-wash border border-accent/20"
                    : "bg-surface-2"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold tabular-nums text-ink-soft">
                    v{sub.version}
                  </span>
                  <span
                    className={
                      sub.status === "evaluated"
                        ? "badge badge-go"
                        : sub.status === "submitted"
                        ? "badge badge-accent"
                        : sub.status === "needs_revision"
                        ? "badge badge-time"
                        : "badge badge-muted"
                    }
                  >
                    {sub.status === "evaluated"
                      ? "Değerlendirildi"
                      : sub.status === "submitted"
                      ? "Teslim Edildi"
                      : sub.status === "needs_revision"
                      ? "Revizyon"
                      : "Bekliyor"}
                  </span>
                </div>
                <span className="text-xs text-ink-faint">
                  {sub.submitted_at
                    ? new Date(sub.submitted_at).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
