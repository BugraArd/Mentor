import { redirect } from "next/navigation";
import Link from "next/link";
import { requireRole, getTeacherStudents, getPrivateNotes } from "@/lib/dal";
import { ArrowLeftIcon, LockIcon } from "@/components/icons";
import { PrivateNoteForm } from "./private-note-form";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const profile: any = await requireRole("teacher");

  const students = await getTeacherStudents(profile.id);
  const relation = students.find(
    (r: any) => (r.student?.id ?? r.student_id) === studentId
  ) as any;

  if (!relation || !relation.student) redirect("/ogretmen");

  const notes = await getPrivateNotes(profile.id, studentId);

  return (
    <div className="mx-auto max-w-2xl animate-fade-in space-y-6">
      <Link
        href="/ogretmen"
        className="inline-flex items-center gap-2 text-sm text-ink-soft transition-colors hover:text-ink"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Panele Dön
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-ink">
          {relation.student.full_name}
        </h1>
        <p className="text-sm text-ink-faint">{relation.student.email}</p>
      </div>

      <div className="glass-card space-y-4 p-6">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
            <LockIcon className="h-4 w-4 text-future" />
            Gizli Notlar
          </h2>
          <p className="mt-1 text-xs text-ink-faint">
            Bu notları sadece sen görebilirsin — öğrenciye asla gösterilmez.
          </p>
        </div>

        <PrivateNoteForm studentId={studentId} />

        {notes.length === 0 ? (
          <p className="py-4 text-center text-sm text-ink-faint">
            Henüz not eklenmemiş.
          </p>
        ) : (
          <div className="space-y-3 pt-2">
            {notes.map((n: any) => (
              <div key={n.id} className="rounded-lg bg-surface-2 p-4">
                <p className="whitespace-pre-wrap text-sm text-ink">
                  {n.note}
                </p>
                <p className="mt-2 text-xs text-ink-faint">
                  {new Date(n.created_at).toLocaleString("tr-TR", {
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
    </div>
  );
}
