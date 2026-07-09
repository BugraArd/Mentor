-- MENTOR — öğretmene teslim başına 2 değerlendirme hakkı (1 asıl + 1 düzeltme)
-- Önceki kurulumda bu index UNIQUE'ti (teslim başına tek hak); artık en
-- fazla 2 hak uygulama katmanında (evaluateSubmission action) kontrol
-- ediliyor, bu yüzden veritabanı kısıtını gevşetmemiz gerekiyor.
drop index if exists evaluations_submission_idx;
create index if not exists evaluations_submission_idx on evaluations (submission_id);
