-- MENTOR — RLS sonsuz döngü düzeltmesi (42P17)
-- Sorun: assignments ↔ assignment_assignees politikaları birbirinin tablosuna
-- subquery ile bakıyordu; RLS her subquery'de karşı tablonun politikasını da
-- çalıştırdığı için döngü oluşuyordu. Çözüm: kontrolleri security definer
-- yardımcı fonksiyonlara taşımak — bu fonksiyonlar RLS'e takılmadan çalışır.

create or replace function is_assigned_to_student(p_assignment_id uuid, p_student_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from assignment_assignees aa
    where aa.assignment_id = p_assignment_id
      and aa.student_id = p_student_id
  );
$$;

create or replace function is_assignment_teacher(p_assignment_id uuid, p_teacher_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from assignments a
    where a.id = p_assignment_id
      and a.teacher_id = p_teacher_id
  );
$$;

-- Döngüye giren iki politikayı fonksiyon kullanan sürümleriyle değiştir
drop policy "assignments_select_by_student" on assignments;
create policy "assignments_select_by_student" on assignments
  for select using (
    is_assigned_to_student(assignments.id, auth.uid())
    and (starts_at is null or starts_at <= now())
  );

drop policy "assignees_all_by_teacher" on assignment_assignees;
create policy "assignees_all_by_teacher" on assignment_assignees
  for all using (is_assignment_teacher(assignment_assignees.assignment_id, auth.uid()));

-- Aynı zinciri kullanan submissions/evaluations politikalarını da
-- fonksiyona geçir (hem döngü riskini sıfırlar hem daha hızlı)
drop policy "submissions_select_by_teacher" on submissions;
create policy "submissions_select_by_teacher" on submissions
  for select using (is_assignment_teacher(submissions.assignment_id, auth.uid()));

drop policy "evaluations_all_by_teacher" on evaluations;
create policy "evaluations_all_by_teacher" on evaluations
  for all using (
    exists (
      select 1 from submissions s
      where s.id = evaluations.submission_id
        and is_assignment_teacher(s.assignment_id, auth.uid())
    )
  );
