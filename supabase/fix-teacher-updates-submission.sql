-- MENTOR — öğretmenin, değerlendirdiği teslimin durumunu güncelleyebilmesi
-- Sorun: değerlendirme kaydediliyor ama teslimi "evaluated"/"needs_revision"
-- yapan update, öğretmende UPDATE izni olmadığı için sessizce 0 satır
-- etkiliyordu; panel sayaçları da 0 kalıyordu.

-- 1) Eksik izin: öğretmen kendi ödevine ait teslimleri güncelleyebilir
create policy "submissions_update_by_teacher" on submissions
  for update
  using (is_assignment_teacher(submissions.assignment_id, auth.uid()))
  with check (is_assignment_teacher(submissions.assignment_id, auth.uid()));

-- 2) Mevcut veriyi onar: değerlendirmesi olan ama durumu hâlâ "submitted"
--    kalmış teslimleri doğru duruma çek
update submissions s
set status = (case when e.requires_revision then 'needs_revision' else 'evaluated' end)::submission_status
from evaluations e
where e.submission_id = s.id
  and s.status = 'submitted';
