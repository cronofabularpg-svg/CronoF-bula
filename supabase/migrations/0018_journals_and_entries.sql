-- 0018_journals_and_entries.sql
-- Diário funcional: journals (um por personagem) e journal_entries (memórias reais).
-- O Diário continua sendo um item físico/diegético: a liberação de /diario depende
-- de character_items conter um item item_type='journal' (ver 0017). Esta migration
-- cuida apenas do armazenamento e da visibilidade das entradas.

create table journals (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  character_id uuid not null references characters(id) on delete cascade,
  owner_user_id uuid not null references profiles(id),
  title text default 'Diário',
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (campaign_id, character_id)
);

create table journal_entries (
  id uuid primary key default gen_random_uuid(),
  journal_id uuid not null references journals(id) on delete cascade,
  campaign_id uuid not null references campaigns(id) on delete cascade,
  character_id uuid not null references characters(id) on delete cascade,
  session_id uuid references sessions(id) on delete set null,
  scene_id uuid references scenes(id) on delete set null,
  title text,
  content text not null,
  mood text,
  tags jsonb default '[]'::jsonb,
  visibility text default 'private',
  entry_date timestamptz default now(),
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table journal_entries
  add constraint journal_entries_visibility_check
  check (visibility in ('private', 'master', 'party', 'public'));

create index journals_campaign_id_idx on journals (campaign_id);
create index journals_character_id_idx on journals (character_id);
create index journal_entries_journal_id_idx on journal_entries (journal_id);
create index journal_entries_campaign_id_idx on journal_entries (campaign_id);
create index journal_entries_character_id_idx on journal_entries (character_id);
create index journal_entries_campaign_visibility_idx on journal_entries (campaign_id, visibility);

alter table journals enable row level security;
alter table journal_entries enable row level security;

-- journals -------------------------------------------------------------------

create policy "Players read own journal"
on journals for select
using (owns_character(character_id));

create policy "Masters read campaign journals"
on journals for select
using (is_campaign_master(campaign_id));

create policy "Players create own journal"
on journals for insert
with check (
  owner_user_id = auth.uid()
  and owns_character(character_id)
  and is_campaign_member(campaign_id)
);

create policy "Masters create campaign journals"
on journals for insert
with check (
  is_campaign_master(campaign_id)
  and exists (
    select 1 from characters c
    where c.id = character_id and c.campaign_id = campaign_id
  )
);

-- journal_entries ---------------------------------------------------------------
-- Regra de visibilidade:
--   private: apenas o dono do personagem
--   master:  dono + mestre da campanha
--   party/public: membros da campanha (inclui mestre e dono)

create policy "Owners manage own journal entries"
on journal_entries for all
using (owns_character(character_id))
with check (
  owns_character(character_id)
  and is_campaign_member(campaign_id)
  and created_by = auth.uid()
);

create policy "Masters read entries shared with master"
on journal_entries for select
using (
  is_campaign_master(campaign_id)
  and visibility in ('master', 'party', 'public')
);

create policy "Members read shared journal entries"
on journal_entries for select
using (
  is_campaign_member(campaign_id)
  and visibility in ('party', 'public')
);

create trigger set_journals_updated_at
before update on journals
for each row execute function set_updated_at();

create trigger set_journal_entries_updated_at
before update on journal_entries
for each row execute function set_updated_at();
