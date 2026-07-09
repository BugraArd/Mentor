import {
  requireRole,
  getStudentStats,
  getStudentAssignments,
  getStudentMentor,
} from "@/lib/dal";
import { StatCard } from "@/components/stat-card";
import { AssignmentCard } from "@/components/assignment-card";
import { EmptyState } from "@/components/empty-state";
import {
  BookOpenIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ClockIcon,
} from "@/components/icons";
import { RedeemSection } from "./redeem-section";
import { createClient } from "@/lib/supabase/server";
import { assignmentTimeState } from "@/lib/assignment-time";

export default async function OgrenciPage() {
  const profile: any = await requireRole("student");
  const stats = await getStudentStats(profile.id);
  const assignments = await getStudentAssignments(profile.id);

  const mentor = await getStudentMentor(profile.id);

  const supabase = await createClient();

  // Fetch submission statuses for each assignment
  const assignmentSubs = await Promise.all(
    assignments.map(async (a: any) => {
      const { data } = await supabase
        .from("submissions")
        .select("status")
        .eq("assignment_id", a.id)
        .eq("student_id", profile.id)
        .order("version", { ascending: false })
        .limit(1);
      return {
        assignment: a,
        submissionStatus: (data as any)?.[0]?.status as any,
      };
    })
  );

  // Zamana ve teslim durumuna göre böl: yakında / aktif / geçmiş
  const withTime = assignmentSubs.map((x) => ({
    ...x,
    timeState: assignmentTimeState(x.assignment),
  }));

  const upcoming = withTime.filter((x) => x.timeState === "upcoming");
  const active = withTime.filter(
    (x) =>
      x.timeState === "open" &&
      (!x.submissionStatus ||
        x.submissionStatus === "pending" ||
        x.submissionStatus === "needs_revision")
  );
  const past = withTime.filter(
    (x) =>
      x.submissionStatus === "submitted" ||
      x.submissionStatus === "evaluated" ||
      x.timeState === "expired"
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-ink">
          Merhaba, {profile.full_name.split(" ")[0]} 👋
        </h1>
        <p className="text-ink-soft mt-1">
          Ödevlerini ve teslimlerini buradan takip et.
        </p>
      </div>

      {/* Mentor card or connection prompt */}
      {mentor?.teacher ? (
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent font-bold text-lg">
            {mentor.teacher.full_name
              .split(" ")
              .map((s: string) => s[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm text-ink-soft">Mentörün</p>
            <p className="font-semibold text-ink truncate">
              {mentor.teacher.full_name}
            </p>
          </div>
          {mentor.accepted_at && (
            <span className="ml-auto hidden sm:block text-xs text-ink-soft">
              {new Date(mentor.accepted_at).toLocaleDateString("tr-TR")}{" "}
              tarihinden beri
            </span>
          )}
        </div>
      ) : (
        <RedeemSection />
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Toplam Ödev"
          value={stats.totalAssignments}
          icon={<BookOpenIcon />}
          accentClass="text-accent"
          description="Sana atanmış tüm ödevlerin sayısı."
        />
        <StatCard
          title="Teslim Edilen"
          value={stats.submittedCount}
          icon={<CheckCircleIcon />}
          accentClass="text-go"
          description="Gönderdiğin ödevler (değerlendirilenler dahil)."
        />
        <StatCard
          title="Bekleyen Ödev"
          value={stats.awaitingCount}
          icon={<ClockIcon />}
          accentClass="text-time"
          description="Henüz açılmamış ödevler + öğretmeninin değerlendirmesini beklediklerin."
        />
        <StatCard
          title="Revizyon Bekleyen"
          value={stats.revisionCount}
          icon={<AlertCircleIcon />}
          accentClass="text-time"
          description="Öğretmeninin düzeltme istediği, tekrar göndermen gereken ödevler."
        />
      </div>

      {/* Upcoming Assignments */}
      {upcoming.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 text-ink">
            Yakında Açılacak
          </h2>
          <div className="space-y-3">
            {upcoming.map((x) => (
              <AssignmentCard
                key={x.assignment.id}
                assignment={x.assignment}
                submissionStatus={x.submissionStatus}
              />
            ))}
          </div>
        </div>
      )}

      {/* Active Assignments */}
      <div>
        <h2 className="text-lg font-semibold mb-4 text-ink">
          Aktif Ödevler
        </h2>
        {active.length === 0 ? (
          <EmptyState
            icon={<ClockIcon className="h-10 w-10" />}
            title="Aktif ödev yok"
            description="Yeni ödev atandığında burada görünecek."
          />
        ) : (
          <div className="space-y-3">
            {active.map((x) => (
              <AssignmentCard
                key={x.assignment.id}
                assignment={x.assignment}
                submissionStatus={x.submissionStatus}
              />
            ))}
          </div>
        )}
      </div>

      {/* Past Assignments */}
      {past.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 text-ink">
            Geçmiş Ödevler
          </h2>
          <div className="space-y-3">
            {past.map((x) => (
              <AssignmentCard
                key={x.assignment.id}
                assignment={x.assignment}
                submissionStatus={x.submissionStatus}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
