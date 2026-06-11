-- 0022_complete_character_level_up.sql
-- Completa o fluxo de level up com RPCs estáveis e schema compatível.

create table if not exists character_resources (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  character_id uuid not null references characters(id) on delete cascade,
  resource_key text not null,
  label text not null,
  current_value integer default 0,
  max_value integer default 0,
  resource_type text default 'custom',
  recovery_rule text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (character_id, resource_key)
);

create table if not exists character_conditions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  character_id uuid not null references characters(id) on delete cascade,
  condition_key text not null,
  label text not null,
  description text,
  source text,
  status text default 'active',
  applied_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists character_level_ups (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  character_id uuid not null references characters(id) on delete cascade,
  requested_by uuid references profiles(id),
  from_level integer not null,
  to_level integer not null,
  status text not null default 'pending',
  proposed_changes jsonb not null default '{}'::jsonb,
  approved_by uuid references profiles(id),
  approved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

update character_level_ups clu
set requested_by = coalesce(clu.requested_by, clu.approved_by, c.owner_id)
from campaigns c
where clu.campaign_id = c.id
  and clu.requested_by is null;

alter table character_level_ups
  alter column requested_by set not null,
  alter column status set not null,
  alter column proposed_changes set not null;

alter table character_level_ups
  add column if not exists applied_at timestamptz,
  add column if not exists rejection_reason text;

alter table character_level_ups drop constraint if exists character_level_ups_status_check;
alter table character_level_ups
  add constraint character_level_ups_status_check
  check (status in ('pending', 'approved', 'rejected', 'applied'));

alter table character_level_ups drop constraint if exists character_level_ups_levels_check;
alter table character_level_ups
  add constraint character_level_ups_levels_check
  check (to_level > from_level);

create index if not exists character_resources_campaign_id_idx on character_resources (campaign_id);
create index if not exists character_resources_character_id_idx on character_resources (character_id);
create index if not exists character_conditions_campaign_id_idx on character_conditions (campaign_id);
create index if not exists character_conditions_character_id_idx on character_conditions (character_id);
create index if not exists character_level_ups_campaign_id_idx on character_level_ups (campaign_id);
create index if not exists character_level_ups_character_id_idx on character_level_ups (character_id);

create unique index if not exists character_level_ups_one_pending_idx
  on character_level_ups (character_id)
  where (status = 'pending');

alter table character_resources enable row level security;
alter table character_conditions enable row level security;
alter table character_level_ups enable row level security;

drop policy if exists "Owners read own resources" on character_resources;
create policy "Owners read own resources"
on character_resources for select
using (owns_character(character_id));

drop policy if exists "Masters read campaign resources" on character_resources;
create policy "Masters read campaign resources"
on character_resources for select
using (is_campaign_master(campaign_id));

drop policy if exists "Masters manage campaign resources" on character_resources;
create policy "Masters manage campaign resources"
on character_resources for all
using (is_campaign_master(campaign_id))
with check (is_campaign_master(campaign_id));

drop policy if exists "Owners update own resource current value" on character_resources;

drop policy if exists "Owners read own conditions" on character_conditions;
create policy "Owners read own conditions"
on character_conditions for select
using (owns_character(character_id));

drop policy if exists "Masters manage campaign conditions" on character_conditions;
create policy "Masters manage campaign conditions"
on character_conditions for all
using (is_campaign_master(campaign_id))
with check (is_campaign_master(campaign_id));

drop policy if exists "Owners read own level ups" on character_level_ups;
create policy "Owners read own level ups"
on character_level_ups for select
using (owns_character(character_id));

drop policy if exists "Masters read campaign level ups" on character_level_ups;
create policy "Masters read campaign level ups"
on character_level_ups for select
using (is_campaign_master(campaign_id));

drop policy if exists "Owners request level up for own character" on character_level_ups;

drop policy if exists "Masters manage campaign level ups" on character_level_ups;
create policy "Masters manage campaign level ups"
on character_level_ups for all
using (is_campaign_master(campaign_id))
with check (is_campaign_master(campaign_id));

create or replace function request_character_level_up(target_character_id uuid)
returns character_level_ups as $$
declare
  v_user_id uuid := auth.uid();
  v_campaign_id uuid;
  v_from_level integer;
  v_to_level integer;
  v_row character_level_ups;
begin
  if v_user_id is null then
    raise exception 'É preciso estar autenticado para solicitar level up.';
  end if;

  select c.campaign_id, c.level
  into v_campaign_id, v_from_level
  from characters c
  where c.id = target_character_id
    and c.owner_user_id = v_user_id;

  if v_campaign_id is null then
    raise exception 'Personagem não encontrado ou não pertence a você.';
  end if;

  if not exists (
    select 1
    from campaign_members cm
    where cm.campaign_id = v_campaign_id
      and cm.user_id = v_user_id
      and cm.status = 'active'
  ) then
    raise exception 'Você precisa estar ativo na campanha para solicitar level up.';
  end if;

  select *
  into v_row
  from character_level_ups
  where character_id = target_character_id
    and status = 'pending'
  limit 1;

  if found then
    return v_row;
  end if;

  v_to_level := coalesce(v_from_level, 1) + 1;

  insert into character_level_ups (
    campaign_id,
    character_id,
    requested_by,
    from_level,
    to_level,
    status,
    proposed_changes
  ) values (
    v_campaign_id,
    target_character_id,
    v_user_id,
    coalesce(v_from_level, 1),
    v_to_level,
    'pending',
    jsonb_build_object(
      'from_level', coalesce(v_from_level, 1),
      'to_level', v_to_level,
      'suggested_proficiency_bonus', floor(((v_to_level - 1)::numeric / 4))::int + 2
    )
  )
  returning * into v_row;

  return v_row;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function approve_character_level_up(target_request_id uuid, approved_changes jsonb default '{}'::jsonb)
returns character_level_ups as $$
declare
  v_row character_level_ups;
  v_changes jsonb;
begin
  select * into v_row
  from character_level_ups
  where id = target_request_id;

  if not found then
    raise exception 'Pedido de level up não encontrado.';
  end if;

  if not is_campaign_master(v_row.campaign_id) then
    raise exception 'Apenas o mestre pode aprovar level up.';
  end if;

  if v_row.status <> 'pending' then
    raise exception 'Este pedido já foi resolvido.';
  end if;

  v_changes := coalesce(v_row.proposed_changes, '{}'::jsonb) || coalesce(approved_changes, '{}'::jsonb);

  update characters
  set
    level = coalesce((v_changes->>'to_level')::int, v_row.to_level),
    proficiency_bonus = coalesce((v_changes->>'proficiency_bonus')::int, (v_changes->>'suggested_proficiency_bonus')::int, proficiency_bonus),
    max_hp = coalesce((v_changes->>'max_hp')::int, max_hp),
    current_hp = coalesce((v_changes->>'current_hp')::int, current_hp)
  where id = v_row.character_id;

  update character_level_ups
  set
    status = 'applied',
    proposed_changes = v_changes,
    approved_by = auth.uid(),
    approved_at = now(),
    applied_at = now()
  where id = target_request_id
  returning * into v_row;

  return v_row;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function reject_character_level_up(target_request_id uuid, reason text default null)
returns character_level_ups as $$
declare
  v_row character_level_ups;
begin
  select * into v_row
  from character_level_ups
  where id = target_request_id;

  if not found then
    raise exception 'Pedido de level up não encontrado.';
  end if;

  if not is_campaign_master(v_row.campaign_id) then
    raise exception 'Apenas o mestre pode rejeitar level up.';
  end if;

  if v_row.status <> 'pending' then
    raise exception 'Este pedido já foi resolvido.';
  end if;

  update character_level_ups
  set
    status = 'rejected',
    approved_by = auth.uid(),
    approved_at = now(),
    rejection_reason = reason
  where id = target_request_id
  returning * into v_row;

  return v_row;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function request_character_level_up(uuid) to authenticated;
grant execute on function approve_character_level_up(uuid, jsonb) to authenticated;
grant execute on function reject_character_level_up(uuid, text) to authenticated;
