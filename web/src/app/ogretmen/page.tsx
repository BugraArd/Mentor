import {
  requireRole,
  getTeacherStats,
  getTeacherStudents,
  getTeacherAssignments,
  getRecentSubmissions,
} from "@/lib/dal";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import {
  UsersIcon,
  BookOpenIcon,
  ClockIcon,
  CheckCircleIcon,
  PlusCircleIcon,
} from "@/components/icons";
import Link from "next/link";
import { InviteSection } from "./invite-section";
import {
  assignmentDisplayStatus,
  ASSIGNMENT_STATUS_LABEL,
  ASSIGNMENT_STATUS_BADGE,
} from "@/lib/assignment-time";

export default async function OgretmenPage() {
  const profile: any = await requireRole("teacher");
  const stats = await getTeacherStats(profile.id);
  const students = await getTeacherStudents(profile.id);
  const assignments = await getTeacherAssignments(profile.id);
  const recentSubs = await getRecentSubmissions(profile.id);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-ink">
          Hoş geldin, {profile.full_name.split(" ")[0]} 👋
        </h1>
        <p className="text-ink-soft mt-1">
          İşte panelin — öğrencilerini ve ödevlerini buradan yönet.
        </p>
      </div>

      {/* Stats Grid - 4 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Öğrenci"
          value={stats.studentCount}
          icon={<UsersIcon className="h-5 w-5" />}
          accentClass="text-accent"
          description="Seninle aktif olarak eşleşmiş öğrenci sayısı."
        />
        <StatCard
          title="Aktif Ödev"
          value={stats.activeAssignmentCount}
          icon={<BookOpenIcon className="h-5 w-5" />}
          accentClass="text-future"
          description="Şu anda açık, öğrencilerin teslim yapabildiği ödevler."
        />
        <StatCard
          title="Bekleyen Ödev"
          value={stats.awaitingCount}
          icon={<ClockIcon className="h-5 w-5" />}
          accentClass="text-time"
          description="Henüz açılmamış ödevler + senin değerlendirmeni bekleyen teslimler."
        />
        <StatCard
          title="Değerlendirilen"
          value={stats.evaluatedCount}
          icon={<CheckCircleIcon className="h-5 w-5" />}
          accentClass="text-go"
          description="Puanlayıp geri bildirim verdiğin teslimler."
        />
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Submissions - 2 cols */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-ink">Son Teslimler</h2>
          </div>
          {recentSubs.length === 0 ? (
            <EmptyState
              icon={<ClockIcon className="h-10 w-10" />}
              title="Henüz teslim yok"
              description="Öğrencilerin ödev teslim ettiğinde burada görünecek."
            />
          ) : (
            <div className="space-y-3">
              {recentSubs.map((sub: any) => (
                <Link
                  key={sub.id}
                  href={`/odev/${sub.assignment_id}`}
                  className="flex items-center justify-between rounded-xl bg-surface-2 px-4 py-3 transition-colors hover:bg-surface-2/80"
                >
                  <div>
                    <p className="font-medium text-sm text-ink">
                      {sub.student?.full_name}
                    </p>
                    <p className="text-xs text-ink-faint">
                      {sub.assignment?.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`badge ${
                        sub.status === "submitted"
                          ? "badge-accent"
                          : "badge-time"
                      }`}
                    >
                      {sub.status === "submitted"
                        ? "Teslim edildi"
                        : "Revizyon gerekli"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Students Panel - 1 col */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-ink">Öğrenciler</h2>
            <InviteSection />
          </div>
          {students.length === 0 ? (
            <EmptyState
              icon={<UsersIcon className="h-10 w-10" />}
              title="Henüz öğrenci yok"
              description="Davet kodu oluşturup öğrencini ekle."
            />
          ) : (
            <div className="space-y-2">
              {students.map((rel: any) => {
                const s = rel.student;
                if (!s) return null;
                const initials = s.full_name
                  .split(" ")
                  .map((p: string) => p[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();
                return (
                  <Link
                    key={rel.id}
                    href={`/ogretmen/ogrenciler/${s.id}`}
                    className="flex items-center gap-3 rounded-xl bg-surface-2 px-4 py-3 transition-colors hover:bg-surface-2/80"
                  >
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-accent-wash text-xs font-bold text-accent-ink">
                      {initials}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink">
                        {s.full_name}
                      </p>
                      <p className="text-xs text-ink-faint">{s.email}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Assignments List */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-ink">Ödevler</h2>
          <Link
            href="/ogretmen/odev-olustur"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <PlusCircleIcon className="h-4 w-4" />
            Yeni Ödev
          </Link>
        </div>
        {assignments.length === 0 ? (
          <EmptyState
            icon={<BookOpenIcon className="h-10 w-10" />}
            title="Henüz ödev yok"
            description="İlk ödevini oluşturmak için yukarıdaki butonu kullan."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-ink-faint">
                  <th className="pb-3 font-medium">Başlık</th>
                  <th className="pb-3 font-medium">Durum</th>
                  <th className="pb-3 font-medium">Tarih</th>
                  <th className="pb-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a: any) => {
                  const displayStatus = assignmentDisplayStatus(a);
                  return (
                  <tr key={a.id} className="border-b border-line-soft">
                    <td className="py-3 font-medium text-ink">{a.title}</td>
                    <td className="py-3">
                      <span className={ASSIGNMENT_STATUS_BADGE[displayStatus]}>
                        {ASSIGNMENT_STATUS_LABEL[displayStatus]}
                      </span>
                    </td>
                    <td className="py-3 text-ink-faint">
                      {new Date(a.created_at).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="py-3">
                      <Link
                        href={`/odev/${a.id}`}
                        className="text-accent-ink hover:underline text-sm font-medium"
                      >
                        Detay →
                      </Link>
                    </td>
                  </tr>
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
