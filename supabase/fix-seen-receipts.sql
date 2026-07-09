-- MENTOR — "görüldü" bilgisi: öğrenci ödevi/geri bildirimi açtığında işaretlenir
alter table assignment_assignees add column if not exists seen_at timestamptz;
alter table evaluations add column if not exists seen_by_student_at timestamptz;

create policy "assignees_update_seen_by_student" on assignment_assignees
  for update
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

create policy "evaluations_update_seen_by_student" on evaluations
  for update
  using (
    exists (
      select 1 from submissions s
      where s.id = evaluations.submission_id
        and s.student_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from submissions s
      where s.id = evaluations.submission_id
        and s.student_id = auth.uid()
    )
  );
