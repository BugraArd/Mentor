-- MENTOR — Faz 1 (MVP) veritabanı şeması
-- Supabase (PostgreSQL) üzerinde çalıştırılmak üzere yazıldı.
-- Kapsam: kayıt/giriş, mentörlük eşleşmesi, ödev oluşturma (zamanlanmış + rubrik),
-- ödev atama, teslim + revizyon döngüsü, değerlendirme, mentöre özel gizli notlar,
-- bildirimler. Faz 2/3 tabloları (deneme analizi, mesajlaşma, veli paneli vb.)
-- o fazlara geçildiğinde ayrı bir migration olarak eklenecek.

create extension if not exists "pgcrypto";

create type user_role as enum ('teacher', 'student', 'admin');
create type assignment_status as enum ('draft', 'scheduled', 'active', 'closed');
create type submission_status as enum ('pending', 'submitted', 'needs_revision', 'evaluated');

-- ---------------------------------------------------------------------------
-- profiles: her auth.users kaydına karşılık gelen rol/profil bilgisi
-- ---------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role user_role not null,
  full_name text not null,
  phone text,
  email text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- mentor_relations: öğretmen-öğrenci eşleşmesi, davet koduyla kurulur
-- ---------------------------------------------------------------------------
create table mentor_relations (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references profiles (id) on delete cascade,
  student_id uuid references profiles (id) on delete cascade,
  invite_code text not null unique,
  status text not null default 'pending', -- pending | active
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

create index mentor_relations_teacher_idx on mentor_relations (teacher_id);
create index mentor_relations_student_idx on mentor_relations (student_id);

-- aynı öğretmen-öğrenci ikilisi yalnızca bir kez eşleşebilir
create unique index mentor_relations_unique_pair
  on mentor_relations (teacher_id, student_id)
  where student_id is not null;

-- ---------------------------------------------------------------------------
-- assignments: ödev/yönerge — zamanlanmış açılış/kapanış ve opsiyonel rubrik
-- ---------------------------------------------------------------------------
create table assignments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references profiles (id) on delete cascade,
  title text not null,
  instructions text,
  voice_note_url text,
  attachment_url text,
  rubric jsonb, -- [{ "label": "İçerik", "points": 40 }, ...]
  starts_at timestamptz, -- zamanlanmış ödev: açılış saati
  ends_at timestamptz,   -- zamanlanmış ödev: teslim bitiş saati
  status assignment_status not null default 'draft',
  created_at timestamptz not null default now()
);

create index assignments_teacher_idx on assignments (teacher_id);

-- kime atandı (tekil veya toplu atama aynı tabloyu kullanır)
create table assignment_assignees (
  assignment_id uuid not null references assignments (id) on delete cascade,
  student_id uuid not null references profiles (id) on delete cascade,
  seen_at timestamptz,
  primary key (assignment_id, student_id)
);

-- ---------------------------------------------------------------------------
-- submissions: öğrencinin teslimi — version alanı revizyon döngüsünü tutar
-- ---------------------------------------------------------------------------
create table submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references assignments (id) on delete cascade,
  student_id uuid not null references profiles (id) on delete cascade,
  version int not null default 1,
  body text,
  attachment_url text,
  status submission_status not null default 'pending',
  submitted_at timestamptz,
  created_at timestamptz not null default now()
);

create index submissions_assignment_idx on submissions (assignment_id);
create index submissions_student_idx on submissions (student_id);

-- ---------------------------------------------------------------------------
-- evaluations: öğretmenin bir teslime verdiği not + geri bildirim
-- requires_revision = true ise "düzelt, tekrar gönder" — yeni submission version'ı bekler
-- ---------------------------------------------------------------------------
create table evaluations (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions (id) on delete cascade,
  rubric_scores jsonb, -- [{ "label": "İçerik", "points": 40, "score": 36 }, ...]
  feedback text,
  voice_feedback_url text,
  requires_revision boolean not null default false,
  seen_by_student_at timestamptz,
  created_at timestamptz not null default now()
);

-- teslim başına en fazla 2 değerlendirme hakkı (ilk + 1 düzeltme) —
-- limit uygulama katmanında (evaluateSubmission action) kontrol edilir
create index evaluations_submission_idx on evaluations (submission_id);

-- ---------------------------------------------------------------------------
-- private_notes: mentöre özel notlar — öğrenciye hiçbir zaman gösterilmez
-- ---------------------------------------------------------------------------
create table private_notes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references profiles (id) on delete cascade,
  student_id uuid not null references profiles (id) on delete cascade,
  note text not null,
  created_at timestamptz not null default now()
);

create index private_notes_teacher_student_idx on private_notes (teacher_id, student_id);

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  type text not null, -- assignment_started | submitted | feedback | revision_requested | sos
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on notifications (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table profiles enable row level security;
alter table mentor_relations enable row level security;
alter table assignments enable row level security;
alter table assignment_assignees enable row level security;
alter table submissions enable row level security;
alter table evaluations enable row level security;
alter table private_notes enable row level security;
alter table notifications enable row level security;

-- profiles: herkes kendi profilini okur/günceller; öğretmen kendi öğrencilerinin profilini okur
create policy "profiles_select_own" on profiles
  for select using (id = auth.uid());

create policy "profiles_insert_own" on profiles
  for insert with check (id = auth.uid());

create policy "profiles_update_own" on profiles
  for update using (id = auth.uid());

create policy "profiles_select_by_teacher" on profiles
  for select using (
    exists (
      select 1 from mentor_relations mr
      where mr.student_id = profiles.id
        and mr.teacher_id = auth.uid()
        and mr.status = 'active'
    )
  );

-- öğrenci de kendi mentörünün profilini görebilir (ters yön)
create policy "profiles_select_by_student" on profiles
  for select using (
    exists (
      select 1 from mentor_relations mr
      where mr.teacher_id = profiles.id
        and mr.student_id = auth.uid()
        and mr.status = 'active'
    )
  );

-- mentor_relations: taraflardan biri olan herkes görebilir; sadece öğretmen oluşturabilir
create policy "mentor_relations_select" on mentor_relations
  for select using (teacher_id = auth.uid() or student_id = auth.uid());

create policy "mentor_relations_insert" on mentor_relations
  for insert with check (teacher_id = auth.uid());

create policy "mentor_relations_update" on mentor_relations
  for update using (teacher_id = auth.uid() or student_id = auth.uid());

-- Yardımcı fonksiyonlar: assignments ↔ assignment_assignees politikaları
-- birbirinin tablosuna doğrudan subquery ile bakarsa RLS sonsuz döngüye girer
-- (42P17). security definer fonksiyonlar RLS'e takılmadan kontrol yapar.
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

-- assignments: öğretmen kendi ödevini CRUD eder; öğrenci kendine atanmış
-- ödevleri okur (açılmamış ödev "Yakında" olarak görünür; içerik gizleme ve
-- teslim engeli uygulama tarafında)
create policy "assignments_all_by_teacher" on assignments
  for all using (teacher_id = auth.uid());

create policy "assignments_select_by_student" on assignments
  for select using (is_assigned_to_student(assignments.id, auth.uid()));

-- assignment_assignees: öğretmen yönetir; öğrenci kendi atamasını görür
create policy "assignees_all_by_teacher" on assignment_assignees
  for all using (is_assignment_teacher(assignment_assignees.assignment_id, auth.uid()));

create policy "assignees_select_by_student" on assignment_assignees
  for select using (student_id = auth.uid());

-- öğrenci ödevi açtığında "gördü" bilgisini kendisi işaretleyebilsin
create policy "assignees_update_seen_by_student" on assignment_assignees
  for update
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

-- submissions: öğrenci kendi teslimini CRUD eder; öğretmen kendi ödevine ait teslimleri okur
create policy "submissions_all_by_student" on submissions
  for all using (student_id = auth.uid());

create policy "submissions_select_by_teacher" on submissions
  for select using (is_assignment_teacher(submissions.assignment_id, auth.uid()));

-- öğretmen değerlendirme sonrası teslimin durumunu güncelleyebilmeli
create policy "submissions_update_by_teacher" on submissions
  for update
  using (is_assignment_teacher(submissions.assignment_id, auth.uid()))
  with check (is_assignment_teacher(submissions.assignment_id, auth.uid()));

-- evaluations: öğretmen kendi ödevine ait teslimleri değerlendirir; öğrenci kendi değerlendirmesini okur
create policy "evaluations_all_by_teacher" on evaluations
  for all using (
    exists (
      select 1 from submissions s
      where s.id = evaluations.submission_id
        and is_assignment_teacher(s.assignment_id, auth.uid())
    )
  );

create policy "evaluations_select_by_student" on evaluations
  for select using (
    exists (
      select 1 from submissions s
      where s.id = evaluations.submission_id
        and s.student_id = auth.uid()
    )
  );

-- öğrenci geri bildirimi açıp okuduğunda "gördü" bilgisini kendisi işaretleyebilsin
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

-- private_notes: SADECE yazan öğretmen görür — öğrenciye asla açılmaz
create policy "private_notes_owner_only" on private_notes
  for all using (teacher_id = auth.uid());

-- notifications: herkes sadece kendi bildirimini okur/günceller
create policy "notifications_owner_only" on notifications
  for all using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- redeem_invite_code: öğrenci, henüz kimseye bağlı olmayan bir davet kodunu
-- bu fonksiyon üzerinden "kullanır". security definer sayesinde öğrenci,
-- normalde RLS ile göremeyeceği (kendine ait olmayan) satırı güvenli şekilde
-- eşleştirebilir — açık bir "tüm bekleyen davetleri gör" politikası gerekmez.
-- ---------------------------------------------------------------------------
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

grant execute on function redeem_invite_code(text) to authenticated;

-- ---------------------------------------------------------------------------
-- notify: bir kullanıcıya bildirim satırı ekler. security definer, çünkü
-- notifications_owner_only politikası "insert" için de user_id = auth.uid()
-- şartı koşuyor — yani öğrenci öğretmene, öğretmen öğrenciye bildirim
-- ekleyemez. Bu fonksiyon o kısıtı bypass ederek "başkasına bildirim gönder"
-- işlemini güvenli, tek bir kapıdan geçirir.
-- ---------------------------------------------------------------------------
create or replace function notify(p_user_id uuid, p_type text, p_title text, p_body text default null)
returns void
language sql
security definer
set search_path = public
as $$
  insert into notifications (user_id, type, title, body)
  values (p_user_id, p_type, p_title, p_body);
$$;

grant execute on function notify(uuid, text, text, text) to authenticated;
