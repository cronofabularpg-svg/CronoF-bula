-- 0038_create_profile_for_current_user.sql
-- RPC segura para criar o profile do próprio usuário autenticado,
-- usada como fallback no /auth/callback quando o profile ainda não existe
-- (ex.: trigger handle_new_user não chegou a rodar). Nunca cria profile
-- para outro usuário: usa apenas auth.uid(), não aceita user_id externo.

create or replace function public.create_profile_for_current_user()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_display_name text;
  v_avatar_url text;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  select email,
         coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name'),
         raw_user_meta_data->>'avatar_url'
    into v_email, v_display_name, v_avatar_url
  from auth.users
  where id = v_user_id;

  insert into public.profiles (id, display_name, avatar_url)
  values (
    v_user_id,
    coalesce(v_display_name, split_part(v_email, '@', 1), 'Aventureiro'),
    v_avatar_url
  )
  on conflict (id) do nothing;
end;
$$;

grant execute on function public.create_profile_for_current_user() to authenticated;
