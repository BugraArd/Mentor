-- MENTOR — bildirim gönderme fonksiyonu (zil/liste özelliği için)
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
