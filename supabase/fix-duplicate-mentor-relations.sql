-- MENTOR — aynı öğretmen-öğrenci ikilisinin birden fazla kez eşleşmesini düzelt
-- Sorun: öğrenci iki farklı davet kodu kullanınca aynı ikili için iki aktif
-- kayıt oluşuyordu; öğretmenin öğrenci listesinde aynı öğrenci iki kez çıkıyordu.

-- 1) Mevcut tekrarları temizle (her ikilinin en eski kaydı kalır)
delete from mentor_relations mr
using mentor_relations older
where mr.teacher_id = older.teacher_id
  and mr.student_id = older.student_id
  and mr.student_id is not null
  and mr.created_at > older.created_at;

-- 2) Aynı ikilinin tekrar eşleşmesini veritabanı seviyesinde engelle
create unique index if not exists mentor_relations_unique_pair
  on mentor_relations (teacher_id, student_id)
  where student_id is not null;

-- 3) Davet kodu fonksiyonuna koruma: zaten eşleşmiş öğrenci ikinci kodu kullanamaz
create or replace function redeem_invite_code(p_code text)
returns mentor_relations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_relation mentor_relations;
begin
  select * into v_relation
  from mentor_relations
  where invite_code = upper(p_code)
    and student_id is null
  for update;

  if not found then
    raise exception 'invalid_or_used_invite_code';
  end if;

  if exists (
    select 1 from mentor_relations
    where teacher_id = v_relation.teacher_id
      and student_id = auth.uid()
      and status = 'active'
  ) then
    raise exception 'already_matched_with_this_mentor';
  end if;

  update mentor_relations
  set student_id = auth.uid(), status = 'active', accepted_at = now()
  where id = v_relation.id
  returning * into v_relation;

  return v_relation;
end;
$$;
