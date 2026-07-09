-- MENTOR — zamanlanmış (henüz açılmamış) ödevler öğrencide "Yakında" görünsün
-- Eski politika starts_at gelmemiş ödevi tamamen gizliyordu; artık öğrenci
-- kendine atanmış her ödevi görebilir. Açılmamış ödevde içerik gizleme ve
-- teslim engeli uygulama tarafında (detay sayfası + sunucu kontrolü).
drop policy "assignments_select_by_student" on assignments;
create policy "assignments_select_by_student" on assignments
  for select using (is_assigned_to_student(assignments.id, auth.uid()));
