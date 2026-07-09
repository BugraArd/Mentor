-- MENTOR — teslim başına tek değerlendirme
-- 1) Test sırasında oluşan çoklu değerlendirmeleri temizle (en yenisi kalır)
delete from evaluations e
using evaluations newer
where e.submission_id = newer.submission_id
  and e.created_at < newer.created_at;

-- 2) Aynı teslime ikinci değerlendirmeyi veritabanı seviyesinde engelle
create unique index if not exists evaluations_one_per_submission
  on evaluations (submission_id);
