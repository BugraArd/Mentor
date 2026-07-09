-- MENTOR — profiles tablosuna eksik INSERT politikası
-- Kayıt sırasında kullanıcı kendi profil satırını oluşturabilmeli.
create policy "profiles_insert_own" on profiles
  for insert with check (id = auth.uid());
