-- 0008_dice_rolls.sql
-- Registro oficial de rolagens de dados (virtuais e físicas).

create table dice_rolls (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  session_id uuid references sessions(id) on delete set null,
  scene_id uuid references scenes(id) on delete set null,
  character_id uuid references characters(id) on delete set null,
  user_id uuid references profiles(id),
  roll_type text not null default 'virtual',
  formula text,
  die_type text,
  raw_result int,
  modifier int default 0,
  total int,
  reason text,
  visibility text not null default 'scene',
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index dice_rolls_campaign_id_idx on dice_rolls (campaign_id);
create index dice_rolls_session_id_idx on dice_rolls (session_id);
create index dice_rolls_scene_id_idx on dice_rolls (scene_id);

-- RLS

alter table dice_rolls enable row level security;

create policy "Masters can read all campaign rolls"
on dice_rolls for select
using (is_campaign_master(campaign_id));

create policy "Users can read own and accessible scene rolls"
on dice_rolls for select
using (
  user_id = auth.uid()
  or visibility = 'public'
  or (scene_id is not null and visibility = 'scene' and is_scene_participant(scene_id))
);

create policy "Users register rolls for own character"
on dice_rolls for insert
with check (
  user_id = auth.uid()
  and (character_id is null or owns_character(character_id))
);

create policy "Masters register any roll"
on dice_rolls for insert
with check (
  user_id = auth.uid()
  and is_campaign_master(campaign_id)
);
