-- 0002_profiles_and_preferences.sql
-- Perfis de usuário e preferências, com criação automática a partir de auth.users.

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  bio text,
  favorite_race text,
  favorite_class text,
  default_theme_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table player_preferences (
  user_id uuid primary key references profiles(id) on delete cascade,
  preferred_dice_mode text default 'ask',
  default_ui_theme text,
  reduce_motion boolean default false,
  font_size text default 'normal',
  notification_settings jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS

alter table profiles enable row level security;
alter table player_preferences enable row level security;

create policy "Users can read profiles"
on profiles for select
using (true);

create policy "Users can update own profile"
on profiles for update
using (id = auth.uid());

create policy "Users can read own preferences"
on player_preferences for select
using (user_id = auth.uid());

create policy "Users can update own preferences"
on player_preferences for update
using (user_id = auth.uid());

-- Triggers de updated_at

create trigger set_profiles_updated_at
before update on profiles
for each row execute function set_updated_at();

create trigger set_player_preferences_updated_at
before update on player_preferences
for each row execute function set_updated_at();

-- Cria automaticamente o profile (e preferências) ao registrar um novo usuário
-- em auth.users. O display_name vem de raw_user_meta_data.display_name,
-- preenchido pelo cliente em supabase.auth.signUp({ options: { data: {...} } }).

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );

  insert into public.player_preferences (user_id)
  values (new.id);

  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();
