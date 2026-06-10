-- 0004_campaign_settings_and_rls.sql
-- Configurações por campanha (regras, IA, modo solo, diário, mapa).

create table campaign_settings (
  campaign_id uuid primary key references campaigns(id) on delete cascade,

  rule_system text default 'dnd_srd',
  starting_level int default 1,
  progression_type text default 'milestone',

  allow_physical_dice boolean default true,
  allow_virtual_dice boolean default true,
  require_roll_reason boolean default true,

  ai_default_mode text default 'assistant',
  ai_can_narrate boolean default true,
  ai_can_create_npc boolean default false,
  ai_can_create_location boolean default false,
  ai_can_suggest_map boolean default true,
  ai_can_start_combat boolean default false,
  ai_can_reveal_secret boolean default false,

  solo_enabled boolean default false,
  solo_requires_approval boolean default true,
  solo_weekly_limit int default 3,

  diary_enabled boolean default true,
  diary_as_item boolean default true,
  diary_loss_blocks_access boolean default true,

  map_notes_enabled boolean default true,
  map_notes_require_item boolean default true,
  secret_locations_invisible boolean default true,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS

alter table campaign_settings enable row level security;

create policy "Members can read campaign settings"
on campaign_settings for select
using (is_campaign_member(campaign_id));

create policy "Masters can update campaign settings"
on campaign_settings for update
using (is_campaign_master(campaign_id));

create policy "Masters can insert campaign settings"
on campaign_settings for insert
with check (is_campaign_master(campaign_id));

-- Trigger de updated_at

create trigger set_campaign_settings_updated_at
before update on campaign_settings
for each row execute function set_updated_at();

-- Ao criar uma campanha, gera automaticamente as configurações padrão.

create or replace function handle_new_campaign_settings()
returns trigger as $$
begin
  insert into public.campaign_settings (campaign_id)
  values (new.id);

  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_campaign_created_settings
after insert on campaigns
for each row execute function handle_new_campaign_settings();
