-- 0016_items_and_worldbuilding.sql
-- Preparação do mundo: itens, inventário controlado, facções e missões.

create table items (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  name text not null,
  item_type text,
  description text,
  rarity text default 'common',
  properties jsonb default '{}'::jsonb,
  image_url text,
  visibility text default 'master_only',
  status text default 'available',
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table character_items (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  character_id uuid references characters(id) on delete cascade,
  item_id uuid references items(id) on delete cascade,
  quantity integer default 1,
  equipped boolean default false,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table factions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  name text not null,
  description text,
  goals text,
  secrets text,
  relationship_status text,
  visibility text default 'master_only',
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table quests (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  title text not null,
  description text,
  status text default 'draft',
  visibility text default 'master_only',
  reward_notes text,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table items
  add constraint items_visibility_check
  check (visibility in ('public', 'party', 'master_only'));

alter table factions
  add constraint factions_visibility_check
  check (visibility in ('public', 'party', 'master_only'));

alter table quests
  add constraint quests_visibility_check
  check (visibility in ('public', 'party', 'master_only'));

create index items_campaign_id_idx on items (campaign_id);
create index items_campaign_visibility_idx on items (campaign_id, visibility);
create index character_items_campaign_id_idx on character_items (campaign_id);
create index character_items_character_id_idx on character_items (character_id);
create index factions_campaign_id_idx on factions (campaign_id);
create index factions_campaign_visibility_idx on factions (campaign_id, visibility);
create index quests_campaign_id_idx on quests (campaign_id);
create index quests_campaign_visibility_idx on quests (campaign_id, visibility);

alter table items enable row level security;
alter table character_items enable row level security;
alter table factions enable row level security;
alter table quests enable row level security;

create policy "Masters manage campaign items"
on items for all
using (is_campaign_master(campaign_id))
with check (is_campaign_master(campaign_id));

create policy "Members read visible campaign items"
on items for select
using (
  is_campaign_member(campaign_id)
  and visibility in ('public', 'party')
);

create policy "Masters manage character items"
on character_items for all
using (is_campaign_master(campaign_id))
with check (is_campaign_master(campaign_id));

create policy "Players read own character items"
on character_items for select
using (
  character_id is not null
  and owns_character(character_id)
);

create policy "Masters manage campaign factions"
on factions for all
using (is_campaign_master(campaign_id))
with check (is_campaign_master(campaign_id));

create policy "Members read visible campaign factions"
on factions for select
using (
  is_campaign_member(campaign_id)
  and visibility in ('public', 'party')
);

create policy "Masters manage campaign quests"
on quests for all
using (is_campaign_master(campaign_id))
with check (is_campaign_master(campaign_id));

create policy "Members read visible campaign quests"
on quests for select
using (
  is_campaign_member(campaign_id)
  and visibility in ('public', 'party')
);

create trigger set_items_updated_at
before update on items
for each row execute function set_updated_at();

create trigger set_character_items_updated_at
before update on character_items
for each row execute function set_updated_at();

create trigger set_factions_updated_at
before update on factions
for each row execute function set_updated_at();

create trigger set_quests_updated_at
before update on quests
for each row execute function set_updated_at();

-- A importação de mundo é uma tarefa de IA nova: ela propõe, mas não salva conteúdo oficial.

alter table ai_tasks drop constraint ai_tasks_mode_check;
alter table ai_tasks
  add constraint ai_tasks_mode_check
  check (mode in ('narrator', 'npc_dialogue', 'rules_helper', 'session_summary', 'world_import'));

alter table ai_context_snapshots drop constraint ai_context_snapshots_mode_check;
alter table ai_context_snapshots
  add constraint ai_context_snapshots_mode_check
  check (mode in ('narrator', 'npc_dialogue', 'rules_helper', 'session_summary', 'world_import'));

alter table ai_messages drop constraint ai_messages_mode_check;
alter table ai_messages
  add constraint ai_messages_mode_check
  check (mode in ('narrator', 'npc_dialogue', 'rules_helper', 'session_summary', 'world_import'));

alter table ai_generated_suggestions drop constraint ai_generated_suggestions_type_check;
alter table ai_generated_suggestions
  add constraint ai_generated_suggestions_type_check
  check (suggestion_type in ('narration', 'npc_dialogue', 'session_summary', 'world_import'));

insert into ai_tasks (key, name, description, mode, provider, model) values
  ('world_import', 'Importação de Mundo', 'Estrutura texto bruto de mundo em lore, NPCs, locais, facções, itens, missões e segredos para revisão do mestre.', 'world_import', 'groq', 'llama-3.3-70b-versatile')
on conflict (key) do nothing;
