import { requireRole, getSubmissionDetail, getAssignmentDetail } from "@/lib/dal";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon, AlertCircleIcon } from "@/components/icons";
import { EvaluationForm } from "./evaluation-form";

// Teslim başına en fazla 2 değerlendirme hakkı (ilk + 1 düzeltme).
const MAX_EVALUATION_ATTEMPTS = 2;

export default async function DegerlendirmePage({
  params,
}: {
  params: Promise<{ id: string; submissionId: string }>;
}) {
  const { id, submissionId } = await params;
  await requireRole("teacher");

  const submission: any = await getSubmissionDetail(submissionId);
  if (!submission) redirect(`/odev/${id}`);

  const assignment: any = await getAssignmentDetail(id);
  if (!assignment) redirect("/ogretmen");

  const evaluations = (((submission as any).evaluations ?? []) as any[])
    .slice()
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  const evaluationCount = evaluations.length;
  const canEvaluateAgain = evaluationCount < MAX_EVALUATION_ATTEMPTS;
  const isExpired =
    !!assignment.ends_at && new Date(assignment.ends_at).getTime() < Date.now();

  return (
    <div className="animate-fade-in space-y-6">
      {/* Back link */}
      <Link
        href={`/odev/${id}`}
        className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink transition-colors"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Ödeve Dön
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-ink">Değerlendirme</h1>
        <p className="text-ink-soft mt-1">
          {(submission as any).student?.full_name} — {assignment.title} (v
          {submission.version})
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Submission content */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4 text-ink">
              Öğrenci Teslimi
            </h2>
            <div className="prose prose-sm max-w-none text-ink whitespace-pre-wrap">
              {submission.body || (
                <span className="text-ink-faint italic">
                  Metin teslimi yok
                </span>
              )}
            </div>
            {submission.attachment_url && (
              <div className="mt-4 pt-4 border-t border-line">
                <a
                  href={submission.attachment_url}
                  target="_blank"
                  rel="noopener"
                  className="text-accent hover:underline text-sm"
                >
                  📎 Dosya Eki
                </a>
              </div>
            )}
          </div>

          {/* Previous evaluations */}
          {evaluationCount > 0 && (
            <div className="glass-card p-6">
              <h3 className="font-semibold mb-3 text-ink">
                {evaluationCount > 1 ? "Değerlendirmeler" : "Yapılan Değerlendirme"}
              </h3>
              {evaluations.map((ev: any, i: number) => (
                <div
                  key={ev.id}
                  className="border-b border-line-soft pb-3 mb-3 last:border-0 last:mb-0 last:pb-0"
                >
                  {evaluationCount > 1 && (
                    <p className="text-xs font-semibold text-accent mb-1">
                      {i + 1}. Değerlendirme
                    </p>
                  )}
                  <p className="text-sm text-ink">{ev.feedback}</p>
                  {ev.rubric_scores && ev.rubric_scores.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {ev.rubric_scores.map((rs: any, i: number) => (
                        <span
                          key={i}
                          className="badge badge-muted text-xs"
                        >
                          {rs.label}: {rs.score}/{rs.points}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-ink-faint mt-1">
                    {new Date(ev.created_at).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Evaluation form (teslim başına en fazla 2 hak) */}
        <div className="lg:col-span-5 space-y-4">
          {!canEvaluateAgain ? (
            <div className="glass-card p-6 space-y-3">
              <h2 className="text-lg font-semibold text-ink">
                ✓ Değerlendirme Hakların Bitti
              </h2>
              <p className="text-sm text-ink-soft">
                Bu teslim için en fazla {MAX_EVALUATION_ATTEMPTS} kez
                değerlendirme yapabilirsin ve hakkını kullandın. Öğrenciden
                revizyon istersen, göndereceği yeni sürümü ayrıca
                değerlendirebilirsin.
              </p>
              <Link
                href={`/odev/${id}`}
                className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Ödeve Dön
              </Link>
            </div>
          ) : (
            <>
              {evaluationCount === 1 && (
                <div className="glass-card px-4 py-3 flex items-center gap-2 text-sm text-time">
                  <AlertCircleIcon className="h-4 w-4 flex-shrink-0" />
                  Bu teslim için son değerlendirme hakkın — bir daha
                  değiştiremeyeceksin.
                </div>
              )}
              <EvaluationForm
                submissionId={submissionId}
                assignmentId={id}
                studentId={
                  (submission as any).student?.id ?? submission.student_id
                }
                rubric={assignment.rubric}
                isAssignmentExpired={isExpired}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
