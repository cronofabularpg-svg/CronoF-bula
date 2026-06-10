-- 0007_scene_messages_and_events.sql
-- Mensagens da Mesa Viva (fala, ação, narração, dados) e eventos de cena.

create table scene_messages (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  session_id uuid not null references sessions(id) on delete cascade,
  scene_id uuid not null references scenes(id) on delete cascade,
  sender_user_id uuid references profiles(id),
  character_id uuid references characters(id),
  message_type text not null,
  visibility text not null default 'scene',
  content text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table scene_events (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  session_id uuid not null references sessions(id) on delete cascade,
  scene_id uuid not null references scenes(id) on delete cascade,
  event_type text not null,
  content text,
  metadata jsonb default '{}'::jsonb,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

create index scene_messages_scene_id_idx on scene_messages (scene_id);
create index scene_messages_session_id_idx on scene_messages (session_id);
create index scene_messages_campaign_id_idx on scene_messages (campaign_id);
create index scene_events_scene_id_idx on scene_events (scene_id);
create index scene_events_campaign_id_idx on scene_events (campaign_id);

-- RLS

alter table scene_messages enable row level security;
alter table scene_events enable row level security;

create policy "Masters can read all campaign messages"
on scene_messages for select
using (is_campaign_master(campaign_id));

create policy "Participants can read scene messages"
on scene_messages for select
using (
  visibility = 'public'
  or (visibility = 'scene' and is_scene_participant(scene_id))
);

create policy "Players send messages as participant character"
on scene_messages for insert
with check (
  sender_user_id = auth.uid()
  and character_id is not null
  and owns_character(character_id)
  and exists (
    select 1 from scene_participants sp
    where sp.scene_id = scene_messages.scene_id
      and sp.character_id = scene_messages.character_id
      and sp.status = 'active'
  )
);

create policy "Masters send any message"
on scene_messages for insert
with check (
  sender_user_id = auth.uid()
  and is_campaign_master(campaign_id)
);

create policy "Masters manage scene events"
on scene_events for all
using (is_campaign_master(campaign_id))
with check (is_campaign_master(campaign_id));

create policy "Participants can read scene events"
on scene_events for select
using (is_scene_participant(scene_id));

-- Realtime: novas mensagens da Mesa Viva precisam propagar via Supabase Realtime.

alter publication supabase_realtime add table public.scene_messages;
