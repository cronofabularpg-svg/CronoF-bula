-- 0005_characters_core.sql
-- Personagens (ficha principal + atributos), com regra de aprovação do mestre.

create table characters (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns(id) on delete cascade,
  owner_user_id uuid not null references profiles(id),
  name text not null,
  race text,
  class text,
  subclass text,
  level int default 1,
  background text,
  alignment text,
  portrait_media_id uuid,
  avatar_url text,
  theme_class text,
  theme_race text,
  theme_variant text,
  status text default 'draft',
  current_hp int,
  max_hp int,
  armor_class int,
  speed int,
  proficiency_bonus int,
  notes text,
  approved_by_master boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table character_stats (
  character_id uuid primary key references characters(id) on delete cascade,
  strength int default 10,
  dexterity int default 10,
  constitution int default 10,
  intelligence int default 10,
  wisdom int default 10,
  charisma int default 10,
  saving_throws jsonb default '{}'::jsonb,
  skills jsonb default '{}'::jsonb,
  -- Estado de ficha ainda não normalizado (inspiração, exaustão, xp, ouro,
  -- mana, condições). Será migrado para tabelas dedicadas em fases futuras.
  sheet_state jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index characters_campaign_id_idx on characters (campaign_id);
create index characters_owner_user_id_idx on characters (owner_user_id);

-- Helper de permissão

create or replace function owns_character(character uuid)
returns boolean as $$
  select exists (
    select 1
    from characters
    where id = character
      and owner_user_id = auth.uid()
  );
$$ language sql security definer;

-- RLS

alter table characters enable row level security;
alter table character_stats enable row level security;

create policy "Owners can read own characters"
on characters for select
using (owner_user_id = auth.uid());

create policy "Campaign members can read campaign characters"
on characters for select
using (campaign_id is not null and is_campaign_member(campaign_id));

create policy "Owners can insert own characters"
on characters for insert
with check (
  owner_user_id = auth.uid()
  and (campaign_id is null or is_campaign_member(campaign_id))
);

create policy "Owners can update own characters"
on characters for update
using (owner_user_id = auth.uid());

create policy "Masters can update campaign characters"
on characters for update
using (campaign_id is not null and is_campaign_master(campaign_id));

create policy "Owners can read own character stats"
on character_stats for select
using (owns_character(character_id));

create policy "Campaign members can read campaign character stats"
on character_stats for select
using (exists (
  select 1 from characters c
  where c.id = character_stats.character_id
    and c.campaign_id is not null
    and is_campaign_member(c.campaign_id)
));

create policy "Owners can manage own character stats"
on character_stats for all
using (owns_character(character_id))
with check (owns_character(character_id));

create policy "Masters can manage campaign character stats"
on character_stats for all
using (exists (
  select 1 from characters c
  where c.id = character_stats.character_id
    and c.campaign_id is not null
    and is_campaign_master(c.campaign_id)
));

-- Triggers de updated_at

create trigger set_characters_updated_at
before update on characters
for each row execute function set_updated_at();

create trigger set_character_stats_updated_at
before update on character_stats
for each row execute function set_updated_at();

-- Regra: personagem novo em campanha entra como pending_approval,
-- exceto quando criado pelo próprio mestre/owner da campanha (entra ativo e aprovado).

create or replace function set_character_initial_status()
returns trigger as $$
begin
  if new.campaign_id is not null then
    if is_campaign_master(new.campaign_id) then
      new.status := 'active';
      new.approved_by_master := true;
    else
      new.status := 'pending_approval';
      new.approved_by_master := false;
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger before_character_insert_status
before insert on characters
for each row execute function set_character_initial_status();

-- Apenas o mestre da campanha pode alterar status/aprovação de um personagem
-- que não seja o seu (impede auto-aprovação pelo jogador).

create or replace function prevent_character_self_approval()
returns trigger as $$
begin
  if (new.status is distinct from old.status or new.approved_by_master is distinct from old.approved_by_master)
     and old.campaign_id is not null
     and not is_campaign_master(old.campaign_id) then
    new.status := old.status;
    new.approved_by_master := old.approved_by_master;
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger before_character_update_guard
before update on characters
for each row execute function prevent_character_self_approval();

-- Cria a linha de atributos padrão ao criar um personagem.

create or replace function handle_new_character()
returns trigger as $$
begin
  insert into public.character_stats (character_id)
  values (new.id);

  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_character_created
after insert on characters
for each row execute function handle_new_character();
