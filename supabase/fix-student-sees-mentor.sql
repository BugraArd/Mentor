-- MENTOR — öğrencinin kendi mentörünün profilini görebilmesi
-- Mevcut politika sadece öğretmen → öğrenci yönünü kapsıyordu;
-- öğrenci → öğretmen yönü eksikti.
create policy "profiles_select_by_student" on profiles
  for select using (
    exists (
      select 1 from mentor_relations mr
      where mr.teacher_id = profiles.id
        and mr.student_id = auth.uid()
        and mr.status = 'active'
    )
  );
