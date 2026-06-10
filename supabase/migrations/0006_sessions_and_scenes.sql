-- 0006_sessions_and_scenes.sql
-- Sessões e cenas da Mesa Viva (fundação para Supabase Realtime).

create table sessions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  title text not null,
  status text not null default 'draft',
  started_at timestamptz,
  ended_at timestamptz,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table scenes (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  session_id uuid not null references sessions(id) on delete cascade,
  title text not null,
  location_name text,
  visibility text not null default 'participants',
  status text not null default 'active',
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table scene_participants (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  scene_id uuid not null references scenes(id) on delete cascade,
  character_id uuid not null references characters(id) on delete cascade,
  status text not null default 'active',
  created_at timestamptz default now(),
  unique (scene_id, character_id)
);

create index sessions_campaign_id_idx on sessions (campaign_id);
create index scenes_campaign_id_idx on scenes (campaign_id);
create index scenes_session_id_idx on scenes (session_id);
create index scene_participants_scene_id_idx on scene_participants (scene_id);
create index scene_participants_character_id_idx on scene_participants (character_id);

-- Helper: o personagem do usuário atual participa ativamente da cena.

create or replace function is_scene_participant(target_scene_id uuid)
returns boolean as $$
  select exists (
    select 1
    from scene_participants sp
    join characters c on c.id = sp.character_id
    where sp.scene_id = target_scene_id
      and c.owner_user_id = auth.uid()
      and sp.status = 'active'
  );
$$ language sql security definer;

-- RLS

alter table sessions enable row level security;
alter table scenes enable row level security;
alter table scene_participants enable row level security;

create policy "Members can read campaign sessions"
on sessions for select
using (is_campaign_member(campaign_id));

create policy "Masters manage sessions"
on sessions for all
using (is_campaign_master(campaign_id))
with check (is_campaign_master(campaign_id));

create policy "Masters can read all campaign scenes"
on scenes for select
using (is_campaign_master(campaign_id));

create policy "Participants can read scenes they are in"
on scenes for select
using (is_scene_participant(id));

create policy "Masters manage scenes"
on scenes for all
using (is_campaign_master(campaign_id))
with check (is_campaign_master(campaign_id));

create policy "Masters manage scene participants"
on scene_participants for all
using (is_campaign_master(campaign_id))
with check (is_campaign_master(campaign_id));

create policy "Participants can read scene participant list"
on scene_participants for select
using (is_scene_participant(scene_id));

-- Triggers de updated_at

create trigger set_sessions_updated_at
before update on sessions
for each row execute function set_updated_at();

create trigger set_scenes_updated_at
before update on scenes
for each row execute function set_updated_at();

-- Ao criar uma cena, todos os personagens ativos da campanha entram como participantes.

create or replace function handle_new_scene()
returns trigger as $$
begin
  insert into public.scene_participants (campaign_id, scene_id, character_id, status)
  select new.campaign_id, new.id, c.id, 'active'
  from public.characters c
  where c.campaign_id = new.campaign_id
    and c.status = 'active'
  on conflict (scene_id, character_id) do nothing;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_scene_created
after insert on scenes
for each row execute function handle_new_scene();
